const express = require('express');
const cors = require('cors');
// Importamos o playwright com o modo stealth
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

// Ativamos o disfarce
chromium.use(stealth);

const app = express();
app.use(cors());
app.use(express.json());

app.post('/gerar-pix', async (req, res) => {
    const { cpf } = req.body;

    if (!cpf) {
        return res.status(400).json({ erro: 'CPF é obrigatório.' });
    }

    console.log(`[+] Iniciando robô (Stealth Mode) para o CPF: ${cpf}`);
    
    // Abrimos o navegador disfarçado. Deixei false para vermos o que acontece.
    const browser = await chromium.launch({ headless: false }); 
    const page = await browser.newPage();

    try {
        console.log("🌐 Acessando a página da prefeitura...");
        await page.goto('https://palhoca.atende.net/autoatendimento/servicos/guias-de-iptu/detalhar/1', { waitUntil: 'networkidle' });

        // --- LIDANDO COM OS OBSTÁCULOS (Pop-ups e Cookies) ---
        console.log("🛡️ Procurando pop-ups para fechar...");
        
        // Tenta fechar o banner de Cookies se ele aparecer
        try {
            await page.waitForSelector('button:has-text("Aceitar")', { timeout: 3000 });
            await page.click('button:has-text("Aceitar")');
            console.log("✔️ Cookies aceitos.");
        } catch (e) {
            console.log("➖ Banner de cookies não encontrado.");
        }

        // Tenta fechar a janela de "Aviso / Nota Nacional" (o botão X no canto)
        try {
            // O seletor '.ui-dialog-titlebar-close' costuma ser o 'X' desses popups jQuery/jQueryUI
            await page.waitForSelector('.ui-dialog-titlebar-close', { timeout: 3000 });
            await page.click('.ui-dialog-titlebar-close');
            console.log("✔️ Pop-up de aviso fechado.");
        } catch (e) {
            console.log("➖ Pop-up de aviso não encontrado.");
        }
        
        // Pequena pausa humana
        await page.waitForTimeout(1000);

        // --- PREENCHENDO O FORMULÁRIO ---
        console.log("⚙️ Selecionando o filtro CPF/CNPJ...");
        await page.selectOption('select[name="filtro"]', { label: 'CPF/CNPJ' });
        
        // Pausa humana
        await page.waitForTimeout(500);

        console.log(`⌨️ Digitando o CPF: ${cpf}...`);
        // O type simula digitação tecla por tecla, o que ajuda a evitar detecção
        await page.type('input[name="campo01"]', cpf, { delay: 100 }); 

        console.log("🔍 Clicando em Consultar...");
        await page.click('input[name="consultar"]');

        console.log("⏳ Aguardando resultado (10 segundos)...");
        await page.waitForTimeout(10000); 

        res.json({ sucesso: true, status: 'Busca realizada com Stealth Mode.' });

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