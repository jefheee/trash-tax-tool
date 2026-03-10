const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/gerar-pix', async (req, res) => {
    let { cpf } = req.body;

    if (!cpf) {
        return res.status(400).json({ erro: 'CPF é obrigatório.' });
    }

    // 1. Limpa qualquer formatação que o usuário colocar e aplica a máscara correta
    cpf = cpf.replace(/\D/g, ''); // Tira tudo que não é número
    if (cpf.length !== 11) {
        return res.status(400).json({ erro: 'CPF deve conter 11 dígitos.' });
    }
    const cpfFormatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    console.log(`\n[+] Iniciando consulta para o CPF: ${cpfFormatado}`);

    try {
        // --- PASSO 1: Bater na porta do site para pegar um Cookie Fresco (PHPSESSID) ---
        console.log("⏳ Gerando uma sessão nova no servidor...");
        const initialResponse = await fetch("https://palhoca.atende.net/autoatendimento/servicos/guias-de-iptu/detalhar/1");
        
        // Extrai o cookie enviado pelo servidor
        const setCookieHeader = initialResponse.headers.get('set-cookie') || '';
        const matchSessId = setCookieHeader.match(/PHPSESSID=([^;]+)/);
        const phpSessId = matchSessId ? matchSessId[1] : '';

        if (!phpSessId) {
            console.log("⚠️ Aviso: Não foi possível capturar o PHPSESSID, tentando continuar...");
        }

        // --- PASSO 2: Fazer a requisição com o CPF formatado e o Cookie novo ---
        console.log("🔍 Consultando faturas no banco de dados...");
        const urlBusca = "https://palhoca.atende.net/autoatendimento/servicos/embed/data/eyJpZCI6ImVsLWlhMmI0ZWZhMjA2IiwiY29kaWdvIjoiNDkiLCJ0aXBvIjoiMSIsInBhcmFtZXRybyI6e30sImNoYXZlIjp7fSwicHJveHkiOnRydWV9/servicos/guias-de-iptu/detalhar/atende.php?rot=61072&aca=101&ajax=t&processo=processaDados&ajaxPrevent=1773184378170&registros=17&pagina=0&selecionar=false&contaRegistros=true&totalizaRegistros=false&nivelArvore=null";

        // Aqui injetamos a variável cpfFormatado
        const payload = `chave=%7B%22sercodigo%22%3A%2249%22%2C%22sertipo%22%3A%221%22%2C%22servicos%22%3A%22guias-de-iptu%22%2C%22detalhar%22%3A%221%22%2C%22janelaAutoId%22%3A%221%22%2C%22selecionar%22%3Afalse%2C%22selecionar_multipla%22%3Afalse%2C%22permiteAcaoSelecionar%22%3Afalse%7D&caller=null&parametro=%7B%22chaveAutoatendimento%22%3Atrue%2C%22sercodigo%22%3A%2249%22%2C%22sertipo%22%3A%221%22%2C%22servicos%22%3A%22guias-de-iptu%22%2C%22detalhar%22%3A%221%22%2C%22janelaAutoId%22%3A%221%22%2C%22selecionar%22%3Afalse%2C%22selecionar_multipla%22%3Afalse%2C%22permiteAcaoSelecionar%22%3Afalse%2C%22__identificadores%22%3A%5B%5D%2C%22__filtros_consulta_padrao%22%3A%5B%7B%22filtroCampo%22%3A%22formaPagamentoAVista%22%2C%22filtroTipo%22%3A%22%3D%22%2C%22filtroValor%22%3A%22%22%2C%22filtroValor02%22%3A%22%22%2C%22filtroTipoCampo%22%3A%22booleano%22%2C%22filtroPodeSalvar%22%3A%22true%22%2C%22filtroEncoded%22%3Afalse%7D%2C%7B%22filtroCampo%22%3A%22formaPagamentoParcelado%22%2C%22filtroTipo%22%3A%22%3D%22%2C%22filtroValor%22%3A%22%22%2C%22filtroValor02%22%3A%22%22%2C%22filtroTipoCampo%22%3A%22booleano%22%2C%22filtroPodeSalvar%22%3A%22true%22%2C%22filtroEncoded%22%3Afalse%7D%2C%7B%22filtroCampo%22%3A%22lancamentoContribuinteCpfCnpj%22%2C%22filtroTipo%22%3A%22%3D%22%2C%22filtroValor%22%3A%22${cpfFormatado}%22%2C%22filtroValor02%22%3A%22%22%2C%22filtroTipoCampo%22%3A%22cpf_cnpj%22%7D%5D%2C%22__order_consulta_padrao%22%3A%5B%7B%22order%22%3A%22lancamentoAno%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%2C%7B%22order%22%3A%22lancamentoNumero%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%2C%7B%22order%22%3A%22formaPagamentoAno%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%2C%7B%22order%22%3A%22formaPagamentoCodigo%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%2C%7B%22order%22%3A%22formaPagamentoSequencia%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%2C%7B%22order%22%3A%22parcela%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%5D%2C%22nome_consulta%22%3A%22consulta_padrao%22%2C%22_proxy%22%3A%7B%22Rotina%22%3A35045%2C%22Acao%22%3A101%2C%22AutoId%22%3A1%2C%22exigeCaptcha%22%3A%221%22%2C%22caminho%22%3A%22%22%7D%2C%22campos_consulta%22%3A%5B%22lancamentoNumero%22%2C%22lancamentoAno%22%2C%22lancamentoNumeroAno%22%2C%22lancamentoSubReceitaCodigo%22%2C%22lancamentoSubReceitaDescricao%22%2C%22formaPagamentoCodigo%22%2C%22formaPagamentoAno%22%2C%22formaPagamentoSequencia%22%2C%22formaPagamentoSituacao%22%2C%22formaPagamentoOrdem%22%2C%22formapagamentoDescricao%22%2C%22lancamentoMoedaSigla%22%2C%22lancamentoContribuinteCpfCnpj%22%2C%22cpfCnpjValido%22%2C%22lancamentoCadbciCadastro%22%2C%22inscricaoImob%22%2C%22parcela%22%2C%22parcelaDataVencimentoOuProrrogacao%22%2C%22valorAtualizadoComDesconto%22%2C%22parcelaSituacao%22%2C%22bainome%22%2C%22lognome%22%2C%22bennumero%22%2C%22enderecoImovel%22%2C%22data_hora_emissao%22%2C%22lancamentoSubReceitaParmiteGuiaUnica%22%2C%22convenioParaEmissao%22%5D%2C%22dados_agrupador%22%3A%5B%7B%22nome%22%3A%5B%22lancamentoSubReceitaCodigo%22%5D%2C%22descritivo%22%3A%5B%7B%22nome%22%3A%22lancamentoSubReceitaDescricao%22%2C%22mostraTitulo%22%3Atrue%2C%22quebraLinha%22%3Afalse%2C%22visivel%22%3Atrue%7D%5D%2C%22tipo%22%3A3%2C%22descricaoAgrupamentoNulo%22%3A%22%22%2C%22icone%22%3Anull%2C%22iconesAgrupamento%22%3A%5B%5D%2C%22tipoIcone%22%3Anull%2C%22condicionais%22%3Anull%7D%2C%7B%22nome%22%3A%5B%22lancamentoCadbciCadastro%22%5D%2C%22descritivo%22%3A%5B%7B%22nome%22%3A%22lancamentoCadbciCadastro%22%2C%22mostraTitulo%22%3Atrue%2C%22quebraLinha%22%3Afalse%2C%22visivel%22%3Atrue%7D%2C%7B%22nome%22%3A%22enderecoImovel%22%2C%22mostraTitulo%22%3Atrue%2C%22quebraLinha%22%3Afalse%2C%22visivel%22%3Atrue%7D%5D%2C%22tipo%22%3A3%2C%22descricaoAgrupamentoNulo%22%3A%22%22%2C%22icone%22%3Anull%2C%22iconesAgrupamento%22%3A%5B%5D%2C%22tipoIcone%22%3Anull%2C%22condicionais%22%3Anull%7D%2C%7B%22nome%22%3A%5B%22formaPagamentoCodigo%22%2C%22formaPagamentoAno%22%2C%22formaPagamentoSequencia%22%5D%2C%22descritivo%22%3A%5B%7B%22nome%22%3A%22formapagamentoDescricao%22%2C%22mostraTitulo%22%3Atrue%2C%22quebraLinha%22%3Afalse%2C%22visivel%22%3Atrue%7D%5D%2C%22tipo%22%3A3%2C%22descricaoAgrupamentoNulo%22%3A%22%22%2C%22icone%22%3Anull%2C%22iconesAgrupamento%22%3A%5B%5D%2C%22tipoIcone%22%3Anull%2C%22condicionais%22%3Anull%7D%5D%7D&autoId=1&monitor=0&flush=0&ip=200.207.65.19&versaoSistema=v2&portalCidadao=true&portalAutoatendimento=true`;

        const response = await fetch(urlBusca, {
            method: "POST",
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "x-requested-with": "XMLHttpRequest",
                // Passamos o cookie fresco capturado e forçamos a flag do Captcha para 0
                "cookie": `cidade=padrao; PHPSESSID=${phpSessId}; solicitarCaptcha=0;`
            },
            body: payload
        });

        const data = await response.json();
        
        // Verifica se veio HTML ou dados dentro da resposta
        if (data.dados) {
            console.log(`✔️ Sucesso! O servidor retornou os dados. (Registros encontrados: ${data.total || '?'})`);
        } else if (data.dados_funcao && data.dados_funcao.msg) {
            console.log(`➖ Retorno do sistema: ${data.dados_funcao.msg}`);
        }
        
        res.json({ sucesso: true, dados_da_prefeitura: data });

    } catch (error) {
        console.error('\n❌ Erro na requisição:', error.message);
        res.status(500).json({ erro: 'Falha ao buscar os dados na prefeitura.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor API rodando na porta ${PORT}`);
});