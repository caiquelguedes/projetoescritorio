const express = require('express')

const store = require('../store')
const { autenticar, exigirPerfil } = require('../middlewares')
const {
  PERFIS_GESTORES,
  STATUS_PROJETO,
  STATUS_INSCRICAO,
} = require('../constants')

const router = express.Router()

router.use(autenticar, exigirPerfil(...PERFIS_GESTORES))

function enriquecer(inscricao) {
  if (inscricao.contatoLiberado && inscricao.projeto?.coordenador) {
    inscricao.contatoCoordenador = {
      nome: inscricao.projeto.coordenador.nome,
      email: inscricao.projeto.coordenador.email,
    }
  }
  return inscricao
}

router.get('/inscricoes', (req, res) => {
  const filtros = {}
  if (req.query.status) filtros.status = String(req.query.status)
  res.json(store.listarInscricoes(filtros).map(enriquecer))
})

router.get('/projetos', (req, res) => {
  res.json(store.listarProjetos())
})

router.get('/notificacoes', (req, res) => {
  res.json(store.listarNotificacoes())
})

router.patch('/notificacoes/:id/lida', (req, res) => {
  const notificacao = store.marcarNotificacaoComoLida(req.params.id)
  if (!notificacao) return res.status(404).json({ erro: 'Notificação não encontrada.' })
  return res.json(notificacao)
})

router.get('/emails', (req, res) => {
  res.json(store.listarEmails())
})

// CAEX libera o contato do coordenador e a inscrição passa a andamento.
router.patch('/inscricoes/:id/liberar-contato', (req, res) => {
  const inscricao = store.buscarInscricao(req.params.id)
  if (!inscricao) return res.status(404).json({ erro: 'Inscrição não encontrada.' })

  if (inscricao.status !== STATUS_INSCRICAO.EM_CONTATO) {
    return res.status(409).json({ erro: 'Esta inscrição já saiu da etapa inicial.' })
  }

  const coordenador = store.usuarioPorId(inscricao.projeto?.coordenadorId)
  const atualizada = store.atualizarInscricao(inscricao.id, {
    contatoLiberado: true,
    status: STATUS_INSCRICAO.EM_ANDAMENTO,
    descricao: `${req.usuario.nome} liberou o contato da coordenação para ${inscricao.discente?.nome}.`,
  })
  store.alterarStatusProjeto(inscricao.projetoId, STATUS_PROJETO.EM_ANDAMENTO)

  store.registrarEmail({
    para: inscricao.discente?.email ?? '',
    assunto: `Contato liberado: ${inscricao.projeto?.titulo}`,
    corpo: `Olá, ${inscricao.discente?.nome}. O CAEX liberou o contato da coordenação. Coordenador(a): ${coordenador?.nome ?? '-'} — ${coordenador?.email ?? '-'}.`,
  })

  if (coordenador?.email) {
    store.registrarEmail({
      para: coordenador.email,
      assunto: `Contato liberado com ${inscricao.discente?.nome}`,
      corpo: `O CAEX liberou o contato de ${inscricao.discente?.nome} (${inscricao.discente?.email}) para o projeto "${inscricao.projeto?.titulo}".`,
    })
  }

  store.adicionarNotificacao({
    titulo: 'Contato liberado',
    mensagem: `Contato de ${inscricao.discente?.nome} com a coordenação de "${inscricao.projeto?.titulo}" liberado.`,
    tipo: 'contato',
    inscricaoId: inscricao.id,
  })

  return res.json(enriquecer(atualizada))
})

// CAEX emite o certificado após o relatório final.
router.patch('/inscricoes/:id/certificar', (req, res) => {
  const inscricao = store.buscarInscricao(req.params.id)
  if (!inscricao) return res.status(404).json({ erro: 'Inscrição não encontrada.' })

  if (inscricao.status === STATUS_INSCRICAO.CONCLUIDA) {
    return res.status(409).json({ erro: 'O certificado desta inscrição já foi emitido.' })
  }
  if (!inscricao.relatorio?.texto) {
    return res
      .status(400)
      .json({ erro: 'O relatório final precisa ser enviado antes do certificado.' })
  }

  const certificado = store.criarCertificado(inscricao.id)
  const atualizada = store.atualizarInscricao(inscricao.id, {
    status: STATUS_INSCRICAO.CONCLUIDA,
    certificadoCodigo: certificado.codigo,
    descricao: `Certificado ${certificado.codigo} emitido pelo CAEX.`,
  })
  store.alterarStatusProjeto(inscricao.projetoId, STATUS_PROJETO.CONCLUIDO)

  store.registrarEmail({
    para: inscricao.discente?.email ?? '',
    assunto: `Certificado EDAURDO ${certificado.codigo}`,
    corpo: `Parabéns, ${inscricao.discente?.nome}! O certificado de conclusão do projeto "${inscricao.projeto?.titulo}" foi emitido. Código: ${certificado.codigo}.`,
  })

  store.adicionarNotificacao({
    titulo: 'Certificado emitido',
    mensagem: `${certificado.codigo} emitido para ${inscricao.discente?.nome}.`,
    tipo: 'certificado',
    inscricaoId: inscricao.id,
  })

  return res.json({ inscricao: enriquecer(atualizada), certificado })
})

module.exports = router
