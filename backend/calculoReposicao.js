function validarEntrada(dados) {
  const { nomeProduto, estoqueAtual, vendasDiarias, leadTime, cnpjFornecedor, estoqueSeguranca } = dados;

  // Validar nomeProduto
  if (!nomeProduto || typeof nomeProduto !== 'string' || nomeProduto.trim() === '') {
    throw new Error('Nome do produto não pode estar vazio');
  }

  // Validar estoqueAtual
  if (typeof estoqueAtual !== 'number' || estoqueAtual < 0 || isNaN(estoqueAtual)) {
    throw new Error('Estoque atual deve ser um número não negativo');
  }

  // Validar vendasDiarias
  if (typeof vendasDiarias !== 'number' || vendasDiarias < 0 || isNaN(vendasDiarias)) {
    throw new Error('Vendas diárias deve ser um número não negativo');
  }

  // Validar leadTime
  if (typeof leadTime !== 'number' || leadTime <= 0 || isNaN(leadTime)) {
    throw new Error('Lead time deve ser um número maior que 0');
  }

  // Validar cnpjFornecedor
  if (!cnpjFornecedor || typeof cnpjFornecedor !== 'string') {
    throw new Error('CNPJ do fornecedor deve ser uma string');
  }

  const cnpjLimpo = cnpjFornecedor.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14 || !/^\d{14}$/.test(cnpjLimpo)) {
    throw new Error('CNPJ deve conter exatamente 14 dígitos numéricos');
  }

  // Validar estoqueSeguranca (opcional, padrão 0)
  if (estoqueSeguranca !== undefined && (typeof estoqueSeguranca !== 'number' || estoqueSeguranca < 0 || isNaN(estoqueSeguranca))) {
    throw new Error('Estoque de segurança deve ser um número não negativo');
  }
}

function calcularReposicao(dados, fornecedor = null) {
  // Validar entrada
  validarEntrada(dados);

  const {
    nomeProduto,
    estoqueAtual,
    vendasDiarias,
    leadTime,
    cnpjFornecedor,
    estoqueSeguranca = 0
  } = dados;

  // Calcular ponto de pedido
  const pontoDePedido = (vendasDiarias * leadTime) + estoqueSeguranca;

  // Calcular quantidade sugerida (não pode ser negativa)
  const quantidadeSugerida = Math.max(0, pontoDePedido - estoqueAtual);

  // Determinar se precisa reposição
  const necessitaReposicao = estoqueAtual < pontoDePedido;

  // Gerar justificativa
  const justificativa = gerarJustificativa(
    nomeProduto,
    vendasDiarias,
    leadTime,
    pontoDePedido,
    estoqueAtual,
    quantidadeSugerida,
    estoqueSeguranca,
    necessitaReposicao,
    fornecedor
  );

  return {
    nomeProduto,
    pontoDePedido: Math.round(pontoDePedido * 100) / 100,
    quantidadeSugerida: Math.round(quantidadeSugerida * 100) / 100,
    necessitaReposicao,
    justificativa,
    fornecedor
  };
}

function gerarJustificativa(nomeProduto, vendasDiarias, leadTime, pontoDePedido, estoqueAtual, quantidadeSugerida, estoqueSeguranca, necessitaReposicao, fornecedor = null) {
  let justificativa = `Produto: ${nomeProduto}. `;
  justificativa += `Com base em ${vendasDiarias} unidades vendidas por dia e lead time de ${leadTime} dias`;

  if (estoqueSeguranca > 0) {
    justificativa += ` (+ ${estoqueSeguranca} unidades de segurança)`;
  }

  justificativa += `, o ponto de pedido é ${pontoDePedido} unidades. `;
  justificativa += `Estoque atual: ${estoqueAtual} unidades. `;

  if (necessitaReposicao) {
    justificativa += `Sugerimos repor ${quantidadeSugerida} unidades agora.`;
  } else {
    justificativa += `Não há necessidade de reposição no momento.`;
  }

  // Adicionar alertas sobre o fornecedor
  if (fornecedor) {
    if (!fornecedor.sucesso) {
      justificativa += ` ⚠️ Atenção: Não foi possível validar o fornecedor na base da Receita Federal (${fornecedor.motivo}). Recomenda-se confirmar o lead time informado diretamente com o fornecedor.`;
    } else if (fornecedor.situacaoCadastral !== 'Ativa') {
      justificativa += ` ⚠️ Atenção: A situação cadastral do fornecedor é "${fornecedor.situacaoCadastral}", o que reduz a confiabilidade do lead time informado. Recomenda-se confirmar os dados antes de prosseguir.`;
    }
  }

  return justificativa;
}

module.exports = {
  calcularReposicao,
  validarEntrada
};
