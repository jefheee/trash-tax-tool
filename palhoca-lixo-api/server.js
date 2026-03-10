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
        await page.goto('https://palhoca.atende.net/autoatendimento/servicos/guias-de-iptu/detalhar/1', { waitUntil: 'networkidle' });

        console.log("🛡️ Iniciando caça aos pop-ups...");
        
        // Loop rápido (tenta 5 vezes com 1 segundo de intervalo) para caçar pop-ups empilhados
        for (let i = 0; i < 5; i++) {
            // 1. Tenta fechar modais estilo "Aviso" (jQuery UI)
            try {
                const btnXModal = page.locator('.ui-dialog-titlebar-close');
                if (await btnXModal.isVisible({ timeout: 500 })) {
                    await btnXModal.click();
                    console.log(`✔️ Modal tipo 1 fechado na tentativa ${i+1}.`);
                }
            } catch (e) {}

            // 2. Tenta fechar o pop-up "Nota Nacional" ou similares (procura pelo ícone X específico)
            try {
                // Esse seletor tenta achar o 'X' genérico do painel deles
                const btnXGeneric = page.locator('button.close, .botao-fechar-modal, span:has-text("×"), [aria-label="Close"]');
                if (await btnXGeneric.isVisible({ timeout: 500 })) {
                    await btnXGeneric.click();
                    console.log(`✔️ Modal genérico fechado na tentativa ${i+1}.`);
                }
            } catch (e) {}

            // 3. Tenta aceitar os cookies
            try {
                const btnCookie = page.locator('button:has-text("Aceitar")');
                if (await btnCookie.isVisible({ timeout: 500 })) {
                    await btnCookie.click();
                    console.log("✔️ Cookies aceitos.");
                }
            } catch (e) {}

            await page.waitForTimeout(1000); // Pausa antes de tentar ver se abriu outro pop-up
        }

        console.log("⏳ Aguardando a liberação da interface...");
        const selectFiltro = page.locator('select[name="filtro"]');
        
        // Se ainda assim travar, tentamos forçar o clique via JavaScript ignorando o que estiver na frente
        await selectFiltro.waitFor({ state: 'attached', timeout: 30000 });
        
        console.log("⚙️ Selecionando o filtro CPF/CNPJ (Forçado)...");
        await selectFiltro.selectOption({ label: 'CPF/CNPJ' }, { force: true });
        
        await page.waitForTimeout(500);

        console.log(`⌨️ Digitando o CPF...`);
        // Force: true faz o Playwright digitar mesmo se o campo estiver visualmente coberto
        await page.locator('input[name="campo01"]').fill(cpf, { force: true });

        console.log("🔍 Clicando em Consultar...");
        await page.locator('input[name="consultar"]').click({ force: true });

        console.log("⏳ Aguardando resultado carregar (10 segundos)...");
        await page.waitForTimeout(10000); 

        res.json({ sucesso: true, status: 'Busca enviada.' });

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