# AI Job Search Dashboard 🚀

Um painel completo (Full-stack) com Inteligência Artificial para automatizar o seu processo de busca e aplicação para vagas de emprego. Construído com React, Node.js e a API do Gemini.

> 📸 **[COLOQUE UM PRINT DO SEU DASHBOARD AQUI]**
> *Recomendação: Tire um print da tela inteira focando no "Meu Funil de Vagas", e depois um print mostrando o "Visualizador de PDF" aberto com um currículo.*

## 🌟 Funcionalidades

- **Busca de Vagas via LinkedIn:** Integrado com um agente de CLI customizado (`.agents/skills/linkedin-search`) que varre as vagas usando ferramentas autônomas. Filtros anti-duplicação inclusos.
- **Alfaiate de Currículos (CV Tailor):** O backend consome a API do Google Gemini (Flash/Pro) para reescrever o seu currículo em formato LaTeX, focando nas palavras-chave exatas da vaga.
- **Compilação Automática em PDF:** Utiliza o compilador `lualatex` em background para gerar o PDF pronto para uso.
- **Máquina do Tempo de CVs:** Histórico de versões automático (`v1`, `v2`). Não gostou? Mande a IA gerar de novo sem apagar o anterior.
- **Visualizador Embutido (Glassmorphism):** Leia e baixe seus PDFs diretamente do navegador, sem bagunçar suas pastas locais.
- **Cache Local:** Navegação fluída tipo SPA sem recarregamentos desnecessários graças ao React e LocalStorage.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React + Vite (HTML/CSS Vanilla)
- **Backend:** Node.js + Express
- **IA:** `@google/generative-ai` (Gemini API) com Padrão Adapter
- **Documentos:** LaTeX (`moderncv` template)
- **Database:** Arquivo de texto estruturado (`job_search_tracker.csv`)

## ⚙️ Como Instalar e Rodar

### Pré-requisitos
- Node.js (v18+) e NPM
- Bun (para rodar a CLI do LinkedIn)
- MiKTeX instalado e configurado no PATH local (para ter acesso ao `lualatex.exe`)
- Chave de API do [Google AI Studio](https://aistudio.google.com/)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/seu-repositorio.git
   cd ai-job-search
   ```

2. **Configure seu Perfil (O Cérebro da IA):**
   Abra o arquivo `CLAUDE.md` na raiz do projeto e preencha com seus dados pessoais, experiências e links do GitHub/LinkedIn. É daqui que o Gemini extrairá informações verdadeiras sobre você.

3. **Configure o Template LaTeX:**
   Abra `cv/main_example.tex` e coloque seu nome e informações de contato no cabeçalho.

4. **Instale as dependências e configure o ambiente:**
   Vá para o Backend:
   ```bash
   cd dashboard/backend
   npm install
   cp .env.example .env
   ```
   *Abra o `.env` gerado e cole a sua chave do Gemini.*

   Vá para o Frontend:
   ```bash
   cd ../frontend
   npm install
   ```

5. **Rode os Servidores:**
   No Backend: `node server.js`
   No Frontend: `npm run dev`

6. Acesse `http://localhost:5173` no seu navegador e comece a caçar vagas!

---
Desenvolvido em Pair Programming com a ajuda de um Agente de IA.
