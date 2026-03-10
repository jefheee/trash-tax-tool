const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/gerar-pix', async (req, res) => {
    const { cpf } = req.body;

    if (!cpf) {
        return res.status(400).json({ erro: 'CPF é obrigatório.' });
    }

    console.log(`[+] Iniciando robô para o CPF: ${cpf}`);
    // headless: false para vermos o navegador abrindo e debugar os cliques no seu PC
    const browser = await chromium.launch({ headless: false }); 
    const page = await browser.newPage();

    try {
        console.log("🌐 Acessando a página da prefeitura...");
        // networkidle garante que a página carregou completamente antes de agir
        await page.goto('https://palhoca.atende.net/autoatendimento/servicos/guias-de-iptu/detalhar/1', { waitUntil: 'networkidle' });

        console.log("⚙️ Selecionando o filtro CPF/CNPJ...");
        // Seleciona a opção pelo texto visível no dropdown
        await page.selectOption('select[name="filtro"]', { label: 'CPF/CNPJ' });

        console.log(`⌨️ Digitando o CPF: ${cpf}...`);
        await page.fill('input[name="campo01"]', cpf);

        console.log("🔍 Clicando em Consultar...");
        await page.click('input[name="consultar"]');

        console.log("⏳ Aguardando a resposta do servidor deles...");
        // Vamos dar um pause de 5 segundos aqui apenas para você conseguir VER o que aconteceu na tela
        // Na versão final, substituiremos isso por um gatilho que espera a tabela ou o botão do PIX aparecer
        await page.waitForTimeout(5000); 

        // Retorna sucesso por enquanto, já que ainda não mapeamos o clique no botão do PIX e a cópia do código
        res.json({ sucesso: true, status: 'Busca realizada. Verifique o navegador aberto.' });

    } catch (error) {
        console.error('Erro na automação:', error);
        res.status(500).json({ erro: 'Falha ao buscar os dados na prefeitura.' });
    } finally {
        await browser.close();
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`➡️  Aguardando requisições em http://localhost:${PORT}/gerar-pix`);
});