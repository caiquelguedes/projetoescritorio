const express = require('express')

const store = require('../store')
const { autenticar, exigirPerfil } = require('../middlewares')
const { textoObrigatorio } = require('../validacao')
const {
  PERFIL,
  PERFIS_GESTORES,
  STATUS_PROJETO,
  STATUS_INSCRICAO,
} = require('../constants')

const router = express.Router()

function podeAcessar(inscricao, usuario) {
  if (PERFIS_GESTORES.includes(usuario.perfil)) return true
  if (inscricao.discenteId === usuario.id) return true
  return inscricao.projeto?.coordenadorId === usuario.id
}

// Verificação pública do certificado (painel do CAEX e conferência externa).
router.get('/certificados/:codigo', (req, res) => {
  const certificado = store.buscarCertificado(req.params.codigo)
  if (!certificado) return res.status(404).json({ erro: 'Certificado não encontrado.' })

  const inscricao = store.buscarInscricao(certificado.inscricaoId)
  return res.json({
    ...certificado,
    discente: inscricao?.discente,
    projeto: inscricao?.projeto
      ? { titulo: inscricao.projeto.titulo, area: inscricao.projeto.area }
      : undefined,
  })
})

router.use(autenticar)

router.get('/minhas', exigirPerfil(PERFIL.DISCENTE), (req, res) => {
  res.json(store.listarInscricoes({ discenteId: req.usuario.id }))
})

router.get('/', (req, res) => {
  const filtros = {}
  if (req.usuario.perfil === PERFIL.DISCENTE) filtros.discenteId = req.usuario.id
  if ([PERFIL.DOCENTE, PERFIL.SERVIDOR].includes(req.usuario.perfil)) {
    filtros.coordenadorId = req.usuario.id
  }
  if (req.query.status) filtros.status = String(req.query.status)

  res.json(store.listarInscricoes(filtros))
})

router.get('/:id', (req, res) => {
  const inscricao = store.buscarInscricao(req.params.id)

  if (!inscricao || !podeAcessar(inscricao, req.usuario)) {
    return res.status(404).json({ erro: 'Inscrição não encontrada.' })
  }

  if (inscricao.contatoLiberado && inscricao.projeto?.coordenador) {
    inscricao.contatoCoordenador = {
      nome: inscricao.projeto.coordenador.nome,
      email: inscricao.projeto.coordenador.email,
    }
  }

  return res.json(inscricao)
})

// Coordenação (ou CAEX) sinaliza que aguarda retorno.
router.patch('/:id/retorno', (req, res) => {
  const inscricao = store.buscarInscricao(req.params.id)
  if (!inscricao) return res.status(404).json({ erro: 'Inscrição não encontrada.' })

  if (
    !PERFIS_GESTORES.includes(req.usuario.perfil) &&
    inscricao.projeto?.coordenadorId !== req.usuario.id
  ) {
    return res.status(403).json({ erro: 'Somente a coordenação do projeto pode fazer isso.' })
  }

  const atualizada = store.atualizarInscricao(inscricao.id, {
    status: STATUS_INSCRICAO.AGUARDANDO_RETORNO,
    descricao: `${req.usuario.nome} marcou o projeto como aguardando retorno.`,
  })
  store.alterarStatusProjeto(inscricao.projetoId, STATUS_PROJETO.AGUARDANDO_RETORNO)

  store.adicionarNotificacao({
    titulo: 'Projeto aguardando retorno',
    mensagem: `"${inscricao.projeto?.titulo}" foi marcado como aguardando retorno pela coordenação.`,
    tipo: 'status',
    inscricaoId: inscricao.id,
  })

  return res.json(atualizada)
})

// Entrega do relatório final pelo discente.
router.post('/:id/relatorio', exigirPerfil(PERFIL.DISCENTE), (req, res) => {
  const inscricao = store.buscarInscricao(req.params.id)
  if (!inscricao || inscricao.discenteId !== req.usuario.id) {
    return res.status(404).json({ erro: 'Inscrição não encontrada.' })
  }

  if (inscricao.status === STATUS_INSCRICAO.CONCLUIDA) {
    return res.status(409).json({ erro: 'Esta inscrição já foi concluída.' })
  }

  const texto = textoObrigatorio(req.body?.texto, 'relatório')
  if (texto.length < 20) {
    return res
      .status(400)
      .json({ erro: 'O relatório deve ter pelo menos 20 caracteres.' })
  }

  const atualizada = store.atualizarInscricao(inscricao.id, {
    relatorio: { texto, enviadoEm: new Date().toISOString() },
    descricao: 'Relatório final enviado pelo discente. Aguardando emissão do certificado.',
  })

  store.adicionarNotificacao({
    titulo: 'Relatório final enviado',
    mensagem: `${req.usuario.nome} enviou o relatório de "${inscricao.projeto?.titulo}".`,
    tipo: 'relatorio',
    inscricaoId: inscricao.id,
  })

  store.registrarEmail({
    para: store.listarUsuarios().find((u) => u.perfil === PERFIL.CAEX)?.email ?? 'caex@ufjf.br',
    assunto: `Relatório final recebido: ${inscricao.projeto?.titulo}`,
    corpo: `${req.usuario.nome} enviou o relatório final. Acesse o painel CAEX para emitir o certificado.`,
  })

  return res.json(atualizada)
})

module.exports = router
