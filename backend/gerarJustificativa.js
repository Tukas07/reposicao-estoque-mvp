async function gerarJustificativaIA(dados) {
  const {
    nomeProduto,
    estoqueAtual,
    vendasDiarias,
    leadTime,
    estoqueSeguranca,
    pontoDePedido,
    quantidadeSugerida,
    necessitaReposicao,
    fornecedor
  } = dados;

  const apiKey = process.env.GROQ_API_KEY;

  // Se não houver chave, usar fallback
  if (!apiKey || apiKey === 'sua_chave_aqui' || apiKey === 'coloque_sua_chave_aqui') {
    return gerarJustificativaTemplate(dados);
  }

  try {
    const prompt = montarPrompt(
      nomeProduto,
      estoqueAtual,
      vendasDiarias,
      leadTime,
      estoqueSeguranca,
      pontoDePedido,
      quantidadeSugerida,
      necessitaReposicao,
      fornecedor
    );

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente de gestão de estoque. Escreva justificativas claras e objetivas em português para decisões de reposição. Seja conciso e direto. Sempre cite os números exatos fornecidos.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.error(`Erro Groq: HTTP ${response.status}`);
      return gerarJustificativaTemplate(dados);
    }

    const resultado = await response.json();
    const justificativa = resultado.choices?.[0]?.message?.content?.trim();

    if (!justificativa) {
      return gerarJustificativaTemplate(dados);
    }

    return justificativa;
  } catch (erro) {
    console.error('Erro ao chamar Groq:', erro.message);
    return gerarJustificativaTemplate(dados);
  }
}

function montarPrompt(nomeProduto, estoqueAtual, vendasDiarias, leadTime, estoqueSeguranca, pontoDePedido, quantidadeSugerida, necessitaReposicao, fornecedor) {
  let infoFornecedor = '';

  if (fornecedor) {
    if (!fornecedor.sucesso) {
      infoFornecedor = ` ATENÇÃO: O fornecedor não pôde ser validado (${fornecedor.motivo}).`;
    } else if (fornecedor.situacaoCadastral !== 'Ativa') {
      infoFornecedor = ` ATENÇÃO: O fornecedor está com situação cadastral "${fornecedor.situacaoCadastral}".`;
    }
  }

  return `Escreva uma justificativa clara e objetiva (máximo 3-4 frases) para o seguinte cenário de reposição de estoque:

Produto: ${nomeProduto}
Estoque Atual: ${estoqueAtual} unidades
Vendas Médias Diárias: ${vendasDiarias} unidades/dia
Lead Time do Fornecedor: ${leadTime} dias
Estoque de Segurança: ${estoqueSeguranca} unidades
Ponto de Pedido Calculado: ${pontoDePedido} unidades
Quantidade a Repor: ${quantidadeSugerida} unidades
Necessita Reposição: ${necessitaReposicao ? 'SIM' : 'NÃO'}${infoFornecedor}

Escreva como se estivesse explicando a um gerente de loja. Cite os números exatos. Seja objetivo.`;
}

function gerarJustificativaTemplate(dados) {
  const {
    nomeProduto,
    estoqueAtual,
    vendasDiarias,
    leadTime,
    estoqueSeguranca,
    pontoDePedido,
    quantidadeSugerida,
    necessitaReposicao,
    fornecedor
  } = dados;

  let justificativa = `Produto: ${nomeProduto}. Com base em ${vendasDiarias} unidades vendidas por dia e lead time de ${leadTime} dias`;

  if (estoqueSeguranca > 0) {
    justificativa += ` (+ ${estoqueSeguranca} unidades de segurança)`;
  }

  justificativa += `, o ponto de pedido é ${pontoDePedido} unidades. Estoque atual: ${estoqueAtual} unidades. `;

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

module.exports = { gerarJustificativaIA };
