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
        await page.goto('https://palhoca.atende.net/autoatendimento/servicos/guias-de-iptu/detalhar/1');

        // TODO: Aqui entrarão os seletores exatos (IDs/Classes) do site da prefeitura
        // Exemplo do que faremos:
        // await page.selectOption('select#id-do-filtro', 'cpf_cnpj');
        // await page.fill('input#id-do-campo-cpf', cpf);
        // await page.click('button#id-do-botao-lupa');
        
        // ... (lógica de clicar em Gerar PIX e copiar o texto) ...

        // Resposta temporária para testar se o servidor está funcionando
        res.json({ sucesso: true, pix: '00020126580014br.gov.bcb.pix... (simulação)' });

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