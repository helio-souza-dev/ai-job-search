import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Biblioteca de Agentes Desacoplada (Adapter Pattern).
 * Facilita trocar entre Gemini, OpenAI, Anthropic, ou outros no futuro.
 */
export class AgentBuilder {
    constructor(provider, apiKey, modelName) {
        this.provider = provider || 'gemini';
        this.apiKey = apiKey;
        this.modelName = modelName || 'gemini-3.6-flash'; // Atualizado para o modelo correto da API
        
        if (this.provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = genAI.getGenerativeModel({ model: this.modelName });
        }
    }

    async generateTailoredCV(jobDescription, userProfileStr, baseCvTemplate) {
        const prompt = `
        Você é um especialista em recrutamento e um mestre em LaTeX.
        Abaixo está o perfil profissional do candidato:
        ${userProfileStr}

        E aqui está a descrição da vaga:
        ${jobDescription}

        Seu objetivo é analisar as habilidades requeridas pela vaga e gerar um Currículo em formato LaTeX (usando a estrutura abaixo como base) que DESTAQUE as habilidades do candidato que mais se alinham com a vaga.
        - Não minta, não invente cargos profissionais que o candidato não teve. Se a experiência for acadêmica, intitule como "Projeto Acadêmico" ou "Desenvolvedor Estudante (Projeto Pessoal)". Nunca use cargos como "Desenvolvedor" ou "Tester".
        - Use sempre bullet points bem detalhados para descrever as experiências. Se a vaga exigir alguma tecnologia específica (ex: Python), crie bullet points mencionando explicitamente que o candidato possui projetos dessa linguagem em seu GitHub.
        - Retorne APENAS o código LaTeX puro. Não inclua markdown, nem explicações, nem blocos de código como \`\`\`latex.

        Template Base LaTeX:
        ${baseCvTemplate}
        `;

        try {
            if (this.provider === 'gemini') {
                const result = await this.model.generateContent(prompt);
                let responseText = result.response.text();
                // Limpar blocos de markdown se a IA colocar sem querer
                responseText = responseText.replace(/```latex/g, '').replace(/```/g, '').trim();
                return responseText;
            } else {
                throw new Error(`Provider ${this.provider} not implemented yet.`);
            }
        } catch (error) {
            console.error("Agent generation failed:", error);
            throw error;
        }
    }
}
