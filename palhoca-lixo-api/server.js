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
    
    const browser = await chromium.launch({ headless: false }); 
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();

    try {
        console.log("🌐 Acessando a página...");
        // Não esperamos a rede ficar ociosa, apenas o esqueleto do site carregar
        await page.goto('https://palhoca.atende.net/autoatendimento/servicos/guias-de-iptu/detalhar/1', { waitUntil: 'domcontentloaded', timeout: 60000 });

        console.log("💣 Injetando código para DESTRUIR pop-ups automaticamente...");
        // A OPÇÃO NUCLEAR: Um script rodando no fundo do site deletando qualquer modal a cada meio segundo
        await page.evaluate(() => {
            setInterval(() => {
                // Remove modais do jQuery UI, fundos escuros e banners
                document.querySelectorAll('.ui-dialog, .ui-widget-overlay, .modal-backdrop, [role="dialog"], #cookie-bar, .cookie-consent').forEach(el => el.remove());
                // Força a barra de rolagem voltar se o modal tiver travado a tela
                document.body.style.overflow = 'auto';
            }, 500);
        });

        console.log("⏳ Aguardando a tela liberar (se houver Captcha, você tem 90 segundos para resolver)...");
        
        // Agora esperamos o campo select aparecer e estar livre de bloqueios
        const selectFiltro = page.locator('select[name="filtro"]');
        await selectFiltro.waitFor({ state: 'attached', timeout: 90000 });

        console.log("⚙️ Selecionando o filtro CPF/CNPJ...");
        // Forçamos a seleção via JavaScript nativo para driblar qualquer bloqueio visual restante
        await page.evaluate(() => {
            const select = document.querySelector('select[name="filtro"]');
            if (select) {
                // Procura a opção CPF/CNPJ e seleciona
                for (let i = 0; i < select.options.length; i++) {
                    if (select.options[i].text.includes('CPF/CNPJ')) {
                        select.selectedIndex = i;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        break;
                    }
                }
            }
        });
        
        await page.waitForTimeout(1000); // Pausa para o site processar a mudança do filtro

        console.log(`⌨️ Digitando o CPF...`);
        // Preenchemos via injeção direta de valor
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
        // await browser.close(); 
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});