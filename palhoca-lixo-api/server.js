const express = require('express');
const cors = require('cors');
const path = require('path');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

const app = express();
app.use(cors());
app.use(express.json());

// Define onde o navegador vai salvar a memória (cookies, captchas resolvidos)
const userDataDir = path.join(__dirname, 'browser_data');

app.post('/gerar-pix', async (req, res) => {
    const { cpf } = req.body;

    if (!cpf) {
        return res.status(400).json({ erro: 'CPF é obrigatório.' });
    }

    console.log(`\n[+] Iniciando robô (Sessão Persistente) para o CPF: ${cpf}`);
    
    let context;
    try {
        // Inicia o Chromium usando a pasta local como "cérebro"
        context = await chromium.launchPersistentContext(userDataDir, {
            headless: false, // Mantenha false até passarmos do captcha a primeira vez
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        });

        // O launchPersistentContext já abre uma aba por padrão, vamos usá-la
        const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

        console.log("🌐 Acessando a página...");
        await page.goto('https://palhoca.atende.net/autoatendimento/servicos/guias-de-iptu/detalhar/1', { waitUntil: 'domcontentloaded', timeout: 60000 });

        console.log("💣 Destruindo pop-ups agressivamente...");
        await page.evaluate(() => {
            setInterval(() => {
                document.querySelectorAll('.ui-dialog, .ui-widget-overlay, .modal-backdrop, [role="dialog"], #cookie-bar, .cookie-consent').forEach(el => el.remove());
                document.body.style.overflow = 'auto';
            }, 500);
        });

        console.log("⏳ Aguardando liberação. Se o Captcha aparecer, resolva-o manualmente desta vez...");
        
        // Espera até 2 minutos para você resolver a primeira vez com calma
        const selectFiltro = page.locator('select[name="filtro"]');
        await selectFiltro.waitFor({ state: 'attached', timeout: 120000 });

        console.log("⚙️ Selecionando o filtro CPF/CNPJ...");
        await page.evaluate(() => {
            const select = document.querySelector('select[name="filtro"]');
            if (select) {
                for (let i = 0; i < select.options.length; i++) {
                    if (select.options[i].text.includes('CPF/CNPJ')) {
                        select.selectedIndex = i;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        break;
                    }
                }
            }
        });
        
        await page.waitForTimeout(1000); 

        console.log(`⌨️ Digitando o CPF...`);
        await page.evaluate((cpfDigitado) => {
            const input = document.querySelector('input[name="campo01"]');
            if (input) {
                input.value = cpfDigitado;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, cpf);

        await page.waitForTimeout(500);

        console.log("🔍 Clicando em Consultar...");
        await page.evaluate(() => {
            const btn = document.querySelector('input[name="consultar"]');
            if (btn) btn.click();
        });

        console.log("⏳ Aguardando resultado carregar (10 segundos)...");
        await page.waitForTimeout(10000); 

        res.json({ sucesso: true, status: 'Busca enviada com sucesso!' });

    } catch (error) {
        console.error('\n❌ Erro crítico:', error.message);
        res.status(500).json({ erro: 'Falha ao buscar os dados na prefeitura.' });
    } finally {
        // IMPORTANTE: Agora precisamos fechar o contexto no final para que ele salve os cookies no disco corretamente
        if (context) {
            await context.close();
        }
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});