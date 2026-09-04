require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { calcularReposicao } = require('./calculoReposicao');
const { consultarFornecedor } = require('./consultarFornecedor');
const { gerarJustificativaIA } = require('./gerarJustificativa');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/reposicao', async (req, res) => {
  try {
    // Consultar dados do fornecedor via CNPJ
    const fornecedor = await consultarFornecedor(req.body.cnpjFornecedor);

    // Calcular reposição com dados do fornecedor
    const resultado = calcularReposicao(req.body, fornecedor);

    // Gerar justificativa com IA (ou fallback para template)
    const justificativaIA = await gerarJustificativaIA({
      nomeProduto: resultado.nomeProduto,
      estoqueAtual: req.body.estoqueAtual,
      vendasDiarias: req.body.vendasDiarias,
      leadTime: req.body.leadTime,
      estoqueSeguranca: req.body.estoqueSeguranca || 0,
      pontoDePedido: resultado.pontoDePedido,
      quantidadeSugerida: resultado.quantidadeSugerida,
      necessitaReposicao: resultado.necessitaReposicao,
      fornecedor
    });

    // Substituir justificativa de template pela gerada por IA
    resultado.justificativa = justificativaIA;

    res.json(resultado);
  } catch (erro) {
    res.status(400).json({
      erro: erro.message,
      status: 'erro'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
