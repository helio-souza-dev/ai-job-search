import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { AgentBuilder } from './lib/AgentBuilder.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const ROOT_DIR = path.resolve(__dirname, '../../');
app.use('/documents', express.static(path.join(ROOT_DIR, 'documents')));

const TRACKER_FILE = path.join(ROOT_DIR, 'job_search_tracker.csv');
const CLI_DIR = path.join(ROOT_DIR, '.agents/skills/linkedin-search/cli');

// 1. Endpoint to get all tracked jobs
app.get('/api/tracker', (req, res) => {
    const results = [];
    if (!fs.existsSync(TRACKER_FILE)) {
        return res.json([]);
    }
    
    fs.createReadStream(TRACKER_FILE)
        .pipe(csv())
        .on('data', (data) => {
            if (data.company && data.company.trim() !== '') {
                results.push(data);
            }
        })
        .on('end', () => {
            res.json(results);
        })
        .on('error', (err) => {
            res.status(500).json({ error: err.message });
        });
});

// 2. Endpoint to trigger a job search using the CLI agent
app.post('/api/search', (req, res) => {
    const { query, location, limit } = req.body;
    
    if (!query || !location) {
        return res.status(400).json({ error: "Missing 'query' or 'location' in request body." });
    }

    const maxResults = limit || 5;
    
    // Sanitize single quotes to prevent powershell injection
    const safeQuery = query.replace(/'/g, "");
    const safeLocation = location.replace(/'/g, "");
    
    const cmd = `& 'C:\\Users\\helio\\.bun\\bin\\bun.exe' run src/cli.ts search -q '${safeQuery}' -l '${safeLocation}' -n ${maxResults} --format json`;

    console.log(`Executing search: ${cmd}`);
    
    exec(cmd, { cwd: CLI_DIR, shell: 'powershell.exe' }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing CLI: ${error.message}`);
        }
        
        try {
            const data = JSON.parse(stdout);
            if (data.error) {
                return res.status(400).json(data);
            }
            
            let rawResults = data.results || data;
            const uniqueResults = [];
            const seenUrls = new Set();
            const trackerData = fs.existsSync(TRACKER_FILE) ? fs.readFileSync(TRACKER_FILE, 'utf8') : '';

            for (const job of rawResults) {
                const url = job.url || job.link;
                if (!url) continue;

                // Remover duplicadas da própria pesquisa
                if (seenUrls.has(url)) continue;
                
                // Remover vagas nas quais você já gerou currículo / estão no Tracker
                if (trackerData.includes(url)) continue;

                seenUrls.add(url);
                uniqueResults.push(job);
            }

            res.json(uniqueResults);
        } catch (parseError) {
            console.error(`Failed to parse JSON output: ${stdout}`);
            res.status(500).json({ error: 'Invalid JSON output from CLI.', stdout, stderr });
        }
    });
});

// 3. Endpoint to generate CV and track application via Agent
app.post('/api/apply', async (req, res) => {
    const { company, title, url } = req.body;
    if (!company || !title) return res.status(400).json({ error: 'Missing company or title.' });

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'COLE_SUA_CHAVE_AQUI') {
            return res.status(400).json({ error: 'API Key do Gemini não configurada no .env do backend.' });
        }

        const agent = new AgentBuilder(process.env.LLM_PROVIDER, apiKey, process.env.LLM_MODEL);
        
        // Ler perfil do usuário e template
        const profilePath = path.join(ROOT_DIR, 'CLAUDE.md');
        const templatePath = path.join(ROOT_DIR, 'cv', 'main_example.tex');
        const userProfile = fs.readFileSync(profilePath, 'utf8');
        const baseCvTemplate = fs.readFileSync(templatePath, 'utf8');

        // Em uma versão de produção, rasparíamos o texto do `url` da vaga.
        // Aqui usaremos o cargo e empresa como contexto principal pro currículo.
        const jobContext = `Vaga para ${title} na empresa ${company}. URL original: ${url}`;

        const generatedLatex = await agent.generateTailoredCV(jobContext, userProfile, baseCvTemplate);

        // Criar pasta de aplicação
        const folderName = `${company.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const appFolder = path.join(ROOT_DIR, 'documents', 'applications', folderName);
        if (!fs.existsSync(appFolder)) {
            fs.mkdirSync(appFolder, { recursive: true });
        }

        // Determine version number
        let version = 1;
        while (fs.existsSync(path.join(appFolder, `cv_tailored_v${version}.tex`))) {
            version++;
        }
        const texFile = `cv_tailored_v${version}.tex`;
        const pdfFile = `cv_tailored_v${version}.pdf`;

        const cvPath = path.join(appFolder, texFile);
        fs.writeFileSync(cvPath, generatedLatex);

        // Compilar para PDF automaticamente usando MiKTeX (em background)
        const lualatexPath = 'C:\\Users\\helio\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64\\lualatex.exe';
        exec(`"${lualatexPath}" ${texFile}`, { cwd: appFolder }, (err, stdout, stderr) => {
            if (err) {
                console.error('Erro ao compilar o PDF:', err.message);
            } else {
                console.log('PDF compilado com sucesso para a vaga:', folderName);
            }
        });

        // Atualizar CSV apenas se a vaga ainda não estiver no tracker
        const trackerData = fs.readFileSync(TRACKER_FILE, 'utf8');
        if (!trackerData.includes(url)) {
            // date,company,sector,role,role_type,channel,status,contact_person,fit_rating,notes,cv_file,cover_letter_file,source
            const dateStr = new Date().toISOString().split('T')[0];
            const newCsvLine = `\n${dateStr},${company},,${title},,LinkedIn,applied,,,,${pdfFile},,${url}`;
            fs.appendFileSync(TRACKER_FILE, newCsvLine);
        }

        res.json({ message: 'Curriculo gerado com sucesso!', folder: folderName, version: version, file: pdfFile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/cv-versions/:folderName', (req, res) => {
    const { folderName } = req.params;
    const appFolder = path.join(ROOT_DIR, 'documents', 'applications', folderName);
    if (!fs.existsSync(appFolder)) {
        return res.json([]);
    }
    const files = fs.readdirSync(appFolder);
    const pdfs = files.filter(f => f.endsWith('.pdf') && f.startsWith('cv_tailored')).sort().reverse();
    res.json(pdfs);
});

// 5. Endpoint to get User Profile (CLAUDE.md)
app.get('/api/profile', (req, res) => {
    try {
        const profilePath = path.join(ROOT_DIR, 'CLAUDE.md');
        if (fs.existsSync(profilePath)) {
            const content = fs.readFileSync(profilePath, 'utf8');
            res.json({ content });
        } else {
            res.json({ content: '' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Endpoint to update User Profile (CLAUDE.md)
app.post('/api/profile', (req, res) => {
    const { content } = req.body;
    if (content === undefined) return res.status(400).json({ error: 'Nenhum conteúdo fornecido' });
    
    try {
        const profilePath = path.join(ROOT_DIR, 'CLAUDE.md');
        fs.writeFileSync(profilePath, content, 'utf8');
        res.json({ message: 'Perfil salvo com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
