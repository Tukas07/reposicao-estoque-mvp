async function consultarFornecedor(cnpj) {
  // Remove caracteres especiais, mantém apenas números
  const cnpjLimpo = cnpj.replace(/\D/g, '');

  try {
    const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          sucesso: false,
          motivo: 'CNPJ não encontrado na base de dados da Receita Federal'
        };
      }
      return {
        sucesso: false,
        motivo: `Erro ao consultar a API (HTTP ${response.status})`
      };
    }

    const dados = await response.json();

    return {
      sucesso: true,
      razaoSocial: dados.razao_social,
      situacaoCadastral: dados.descricao_situacao_cadastral,
      cnpj: dados.cnpj
    };
  } catch (erro) {
    return {
      sucesso: false,
      motivo: `Erro de conexão: ${erro.message}`
    };
  }
}

module.exports = { consultarFornecedor };
