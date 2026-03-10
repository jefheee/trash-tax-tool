const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Cabeçalhos que simulam um navegador real para passar pelo Firewall
const headersNavegador = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Connection": "keep-alive"
};

app.post('/gerar-pix', async (req, res) => {
    let { cpf } = req.body;

    if (!cpf) {
        return res.status(400).json({ erro: 'CPF é obrigatório.' });
    }

    cpf = cpf.replace(/\D/g, ''); 
    if (cpf.length !== 11) {
        return res.status(400).json({ erro: 'CPF deve conter 11 dígitos.' });
    }
    const cpfFormatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    console.log(`\n-----------------------------------------`);
    console.log(`[+] Iniciando consulta para o CPF: ${cpfFormatado}`);

    try {
        console.log("⏳ Gerando uma sessão nova no servidor...");
        const initialResponse = await fetch("https://palhoca.atende.net/autoatendimento/servicos/guias-de-iptu/detalhar/1", {
            headers: headersNavegador
        });
        
        const setCookieHeader = initialResponse.headers.get('set-cookie') || '';
        const matchSessId = setCookieHeader.match(/PHPSESSID=([^;]+)/);
        const phpSessId = matchSessId ? matchSessId[1] : '';

        console.log(`✔️ Cookie PHPSESSID: ${phpSessId ? 'Capturado com sucesso' : 'FALHOU'}`);

        console.log("🔍 Consultando faturas no banco de dados...");
        const urlBusca = "https://palhoca.atende.net/autoatendimento/servicos/embed/data/eyJpZCI6ImVsLWlhMmI0ZWZhMjA2IiwiY29kaWdvIjoiNDkiLCJ0aXBvIjoiMSIsInBhcmFtZXRybyI6e30sImNoYXZlIjp7fSwicHJveHkiOnRydWV9/servicos/guias-de-iptu/detalhar/atende.php?rot=61072&aca=101&ajax=t&processo=processaDados&ajaxPrevent=1773184378170&registros=17&pagina=0&selecionar=false&contaRegistros=true&totalizaRegistros=false&nivelArvore=null";

        const payload = `chave=%7B%22sercodigo%22%3A%2249%22%2C%22sertipo%22%3A%221%22%2C%22servicos%22%3A%22guias-de-iptu%22%2C%22detalhar%22%3A%221%22%2C%22janelaAutoId%22%3A%221%22%2C%22selecionar%22%3Afalse%2C%22selecionar_multipla%22%3Afalse%2C%22permiteAcaoSelecionar%22%3Afalse%7D&caller=null&parametro=%7B%22chaveAutoatendimento%22%3Atrue%2C%22sercodigo%22%3A%2249%22%2C%22sertipo%22%3A%221%22%2C%22servicos%22%3A%22guias-de-iptu%22%2C%22detalhar%22%3A%221%22%2C%22janelaAutoId%22%3A%221%22%2C%22selecionar%22%3Afalse%2C%22selecionar_multipla%22%3Afalse%2C%22permiteAcaoSelecionar%22%3Afalse%2C%22__identificadores%22%3A%5B%5D%2C%22__filtros_consulta_padrao%22%3A%5B%7B%22filtroCampo%22%3A%22formaPagamentoAVista%22%2C%22filtroTipo%22%3A%22%3D%22%2C%22filtroValor%22%3A%22%22%2C%22filtroValor02%22%3A%22%22%2C%22filtroTipoCampo%22%3A%22booleano%22%2C%22filtroPodeSalvar%22%3A%22true%22%2C%22filtroEncoded%22%3Afalse%7D%2C%7B%22filtroCampo%22%3A%22formaPagamentoParcelado%22%2C%22filtroTipo%22%3A%22%3D%22%2C%22filtroValor%22%3A%22%22%2C%22filtroValor02%22%3A%22%22%2C%22filtroTipoCampo%22%3A%22booleano%22%2C%22filtroPodeSalvar%22%3A%22true%22%2C%22filtroEncoded%22%3Afalse%7D%2C%7B%22filtroCampo%22%3A%22lancamentoContribuinteCpfCnpj%22%2C%22filtroTipo%22%3A%22%3D%22%2C%22filtroValor%22%3A%22${cpfFormatado}%22%2C%22filtroValor02%22%3A%22%22%2C%22filtroTipoCampo%22%3A%22cpf_cnpj%22%7D%5D%2C%22__order_consulta_padrao%22%3A%5B%7B%22order%22%3A%22lancamentoAno%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%2C%7B%22order%22%3A%22lancamentoNumero%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%2C%7B%22order%22%3A%22formaPagamentoAno%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%2C%7B%22order%22%3A%22formaPagamentoCodigo%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%2C%7B%22order%22%3A%22formaPagamentoSequencia%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%2C%7B%22order%22%3A%22parcela%22%2C%22orderT%22%3A%22asc%22%2C%22tipo%22%3A1%7D%5D%2C%22nome_consulta%22%3A%22consulta_padrao%22%2C%22_proxy%22%3A%7B%22Rotina%22%3A35045%2C%22Acao%22%3A101%2C%22AutoId%22%3A1%2C%22exigeCaptcha%22%3A%221%22%2C%22caminho%22%3A%22%22%7D%2C%22campos_consulta%22%3A%5B%22lancamentoNumero%22%2C%22lancamentoAno%22%2C%22lancamentoNumeroAno%22%2C%22lancamentoSubReceitaCodigo%22%2C%22lancamentoSubReceitaDescricao%22%2C%22formaPagamentoCodigo%22%2C%22formaPagamentoAno%22%2C%22formaPagamentoSequencia%22%2C%22formaPagamentoSituacao%22%2C%22formaPagamentoOrdem%22%2C%22formapagamentoDescricao%22%2C%22lancamentoMoedaSigla%22%2C%22lancamentoContribuinteCpfCnpj%22%2C%22cpfCnpjValido%22%2C%22lancamentoCadbciCadastro%22%2C%22inscricaoImob%22%2C%22parcela%22%2C%22parcelaDataVencimentoOuProrrogacao%22%2C%22valorAtualizadoComDesconto%22%2C%22parcelaSituacao%22%2C%22bainome%22%2C%22lognome%22%2C%22bennumero%22%2C%22enderecoImovel%22%2C%22data_hora_emissao%22%2C%22lancamentoSubReceitaParmiteGuiaUnica%22%2C%22convenioParaEmissao%22%5D%2C%22dados_agrupador%22%3A%5B%7B%22nome%22%3A%5B%22lancamentoSubReceitaCodigo%22%5D%2C%22descritivo%22%3A%5B%7B%22nome%22%3A%22lancamentoSubReceitaDescricao%22%2C%22mostraTitulo%22%3Atrue%2C%22quebraLinha%22%3Afalse%2C%22visivel%22%3Atrue%7D%5D%2C%22tipo%22%3A3%2C%22descricaoAgrupamentoNulo%22%3A%22%22%2C%22icone%22%3Anull%2C%22iconesAgrupamento%22%3A%5B%5D%2C%22tipoIcone%22%3Anull%2C%22condicionais%22%3Anull%7D%2C%7B%22nome%22%3A%5B%22lancamentoCadbciCadastro%22%5D%2C%22descritivo%22%3A%5B%7B%22nome%22%3A%22lancamentoCadbciCadastro%22%2C%22mostraTitulo%22%3Atrue%2C%22quebraLinha%22%3Afalse%2C%22visivel%22%3Atrue%7D%2C%7B%22nome%22%3A%22enderecoImovel%22%2C%22mostraTitulo%22%3Atrue%2C%22quebraLinha%22%3Afalse%2C%22visivel%22%3Atrue%7D%5D%2C%22tipo%22%3A3%2C%22descricaoAgrupamentoNulo%22%3A%22%22%2C%22icone%22%3Anull%2C%22iconesAgrupamento%22%3A%5B%5D%2C%22tipoIcone%22%3Anull%2C%22condicionais%22%3Anull%7D%2C%7B%22nome%22%3A%5B%22formaPagamentoCodigo%22%2C%22formaPagamentoAno%22%2C%22formaPagamentoSequencia%22%5D%2C%22descritivo%22%3A%5B%7B%22nome%22%3A%22formapagamentoDescricao%22%2C%22mostraTitulo%22%3Atrue%2C%22quebraLinha%22%3Afalse%2C%22visivel%22%3Atrue%7D%5D%2C%22tipo%22%3A3%2C%22descricaoAgrupamentoNulo%22%3A%22%22%2C%22icone%22%3Anull%2C%22iconesAgrupamento%22%3A%5B%5D%2C%22tipoIcone%22%3Anull%2C%22condicionais%22%3Anull%7D%5D%7D&autoId=1&monitor=0&flush=0&ip=200.207.65.19&versaoSistema=v2&portalCidadao=true&portalAutoatendimento=true`;

        const response = await fetch(urlBusca, {
            method: "POST",
            headers: {
                ...headersNavegador, 
                "accept": "application/json, text/javascript, */*; q=0.01",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "x-requested-with": "XMLHttpRequest",
                "cookie": `cidade=padrao; PHPSESSID=${phpSessId}; solicitarCaptcha=0;`
            },
            body: payload
        });

        // Pegamos tudo como texto cru primeiro, para evitar o crash do .json()
        const textoBruto = await response.text();
        
        try {
            const data = JSON.parse(textoBruto);
            if (data.dados) {
                console.log(`✔️ Sucesso! O servidor retornou os dados. (Registros encontrados: ${data.total || '?'})`);
            } else if (data.dados_funcao && data.dados_funcao.msg) {
                console.log(`➖ Retorno do sistema: ${data.dados_funcao.msg}`);
            }
            res.json({ sucesso: true, dados_da_prefeitura: data });
        } catch (parseError) {
            console.error("❌ ERRO: O servidor não retornou JSON. Isso significa que fomos bloqueados pelo Firewall ou houve erro no PHP deles. Resposta bruta:");
            console.error(textoBruto.substring(0, 500));
            res.status(500).json({ erro: 'O site da prefeitura bloqueou a requisição ou retornou HTML inválido.' });
        }

    } catch (error) {
        console.error('\n❌ Erro de conexão:', error.message);
        res.status(500).json({ erro: 'Falha grave na comunicação com a prefeitura.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor API rodando na porta ${PORT}`);
});