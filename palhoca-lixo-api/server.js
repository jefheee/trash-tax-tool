const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

const app = express();
app.use(cors());
app.use(express.json());

app.post('/gerar-pix', async (req, res) => {
    const { cpf } = req.body;

    if (!cpf) {
        return res.status(400).json({ erro: 'CPF é obrigatório.' });
    }

    console.log(`\n[+] Iniciando robô para o CPF: ${cpf}`);
    
    // Deixando o navegador vísivel para testes
    const browser = await chromium.launch({ headless: false }); 
    const context = await browser.newContext({
        // Adicionando um User-Agent real do Windows para ajudar no disfarce do Captcha
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();

    try {
        console.log("🌐 Acessando a página da prefeitura...");
        await page.goto('https://palhoca.atende.net/autoatendimento/servicos/guias-de-iptu/detalhar/1', { waitUntil: 'domcontentloaded' });

        // Tenta fechar o banner de cookies rapidamente
        try {
            const btnCookie = page.locator('button:has-text("Aceitar")');
            if (await btnCookie.isVisible({ timeout: 2000 })) {
                await btnCookie.click();
                console.log("✔️ Cookies aceitos.");
            }
        } catch (e) { }

        // Estratégia agressiva para fechar modais (Aviso, Nota Nacional, etc)
        console.log("🛡️ Pressionando 'Escape' para limpar pop-ups na tela...");
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');

        // Se o pop-up tiver um botão escrito "Fechar", tenta clicar nele
        try {
            const btnFechar = page.locator('button:has-text("Fechar")');
            if (await btnFechar.isVisible({ timeout: 1000 })) {
                await btnFechar.click();
            }
        } catch (e) { }

        console.log("⏳ Aguardando a liberação da interface (Até 60s se houver Captcha)...");
        // O script vai pausar AQUI até que o select do filtro esteja realmente clicável na tela.
        // Se o Captcha aparecer, resolva-o manualmente. O script vai esperar você terminar.
        const selectFiltro = page.locator('select[name="filtro"]');
        await selectFiltro.waitFor({ state: 'visible', timeout: 60000 });

        console.log("⚙️ Selecionando o filtro CPF/CNPJ...");
        // Usa a seleção por valor da option (1 = CPF/CNPJ na estrutura deles, ou tenta pelo label)
        await selectFiltro.selectOption({ label: 'CPF/CNPJ' });
        
        await page.waitForTimeout(500);

        console.log(`⌨️ Digitando o CPF...`);
        await page.locator('input[name="campo01"]').fill(cpf);

        console.log("🔍 Clicando em Consultar...");
        await page.locator('input[name="consultar"]').click();

        console.log("⏳ Aguardando resultado carregar (10 segundos)...");
        await page.waitForTimeout(10000); 

        res.json({ sucesso: true, status: 'Busca realizada.' });

    } catch (error) {
        console.error('\n❌ Erro crítico:', error.message);
        res.status(500).json({ erro: 'Falha ao buscar os dados na prefeitura.' });
    } finally {
        // Comentado temporariamente para o navegador NÃO fechar e você poder ver onde o robô parou
        // await browser.close(); 
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});