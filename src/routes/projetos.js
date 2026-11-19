const express = require('express')

const store = require('../store')
const { autenticar, exigirPerfil } = require('../middlewares')
const { textoObrigatorio, numeroPositivo } = require('../validacao')
const {
  PERFIL,
  PERFIS_GESTORES,
  PERFIS_COORDENADORES,
} = require('../constants')

const router = express.Router()

// O mural mostra só o essencial. Contato da coordenação fica bloqueado até o CAEX liberar.
function dadosDoMural(projeto) {
  const {
    id,
    titulo,
    area,
    modalidade,
    cargaHoraria,
    vagas,
    periodo,
    resumo,
    requisitos,
    status,
    criadoEm,
  } = projeto
  return {
    id,
    titulo,
    area,
    modalidade,
    cargaHoraria,
    vagas,
    periodo,
    resumo,
    requisitos,
    status,
    criadoEm,
  }
}

router.use(autenticar)

router.get('/', (req, res) => {
  res.json(store.listarProjetosDoMural().map(dadosDoMural))
})

// Projetos sob responsabilidade do docente/servidor autenticado.
router.get('/meus', (req, res) => {
  if (!PERFIS_COORDENADORES.includes(req.usuario.perfil)) {
    return res.status(403).json({ erro: 'Somente coordenadores têm projetos próprios.' })
  }
  return res.json(store.projetosDoCoordenador(req.usuario.id))
})

router.get('/:id', (req, res) => {
  const projeto = store.buscarProjeto(req.params.id)
  if (!projeto) return res.status(404).json({ erro: 'Projeto não encontrado.' })

  return res.json({
    ...dadosDoMural(projeto),
    coordenador: projeto.coordenador
      ? {
          nome: projeto.coordenador.nome,
          departamento: projeto.coordenador.departamento ?? projeto.coordenador.curso,
        }
      : undefined,
  })
})

// Cadastro de projeto pelo CAEX (é ele quem libera para o mural).
router.post('/', exigirPerfil(...PERFIS_GESTORES), (req, res) => {
  const coordenador = store.usuarioPorId(req.body?.coordenadorId)
  if (!coordenador || !PERFIS_COORDENADORES.includes(coordenador.perfil)) {
    return res
      .status(400)
      .json({ erro: 'Selecione um coordenador docente ou servidor válido.' })
  }

  const requisitosBrutos = req.body?.requisitos
  const requisitos = Array.isArray(requisitosBrutos)
    ? requisitosBrutos.map((item) => String(item).trim()).filter(Boolean)
    : String(requisitosBrutos ?? '')
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)

  if (!requisitos.length) {
    return res.status(400).json({ erro: 'Informe ao menos um requisito mínimo.' })
  }

  const projeto = store.criarProjeto(
    {
      titulo: textoObrigatorio(req.body?.titulo, 'título'),
      area: textoObrigatorio(req.body?.area, 'área'),
      modalidade: textoObrigatorio(req.body?.modalidade, 'modalidade'),
      cargaHoraria: textoObrigatorio(req.body?.cargaHoraria, 'carga horária'),
      periodo: textoObrigatorio(req.body?.periodo, 'período'),
      resumo: textoObrigatorio(req.body?.resumo, 'resumo'),
      vagas: numeroPositivo(req.body?.vagas, 'vagas'),
      requisitos,
      coordenadorId: coordenador.id,
    },
    req.usuario.id,
  )

  return res.status(201).json(dadosDoMural(projeto))
})

// Manifestação de interesse: cria a inscrição, tira o projeto do mural e aciona CAEX + coordenação.
router.post('/:id/interesse', exigirPerfil(PERFIL.DISCENTE), (req, res) => {
  const projeto = store.buscarProjeto(req.params.id)

  if (!projeto || !store.listarProjetosDoMural().some((item) => item.id === req.params.id)) {
    return res.status(404).json({ erro: 'Este projeto não está mais disponível no mural.' })
  }

  if (store.inscricaoExiste(projeto.id, req.usuario.id)) {
    return res.status(409).json({ erro: 'Você já manifestou interesse neste projeto.' })
  }

  const inscricao = store.criarInscricao(projeto.id, req.usuario.id)
  const coordenador = store.usuarioPorId(projeto.coordenadorId)

  store.adicionarNotificacao({
    titulo: 'Nova manifestação de interesse',
    mensagem: `${req.usuario.nome} demonstrou interesse em "${projeto.titulo}". É necessário acionar a coordenação.`,
    tipo: 'interesse',
    inscricaoId: inscricao.id,
  })

  store.adicionarNotificacao({
    titulo: 'Demanda enviada à coordenação',
    mensagem: `Solicitação de contato sobre "${projeto.titulo}" encaminhada para ${coordenador?.nome ?? 'a coordenação'}.`,
    tipo: 'demanda_coordenador',
    inscricaoId: inscricao.id,
  })

  store.registrarEmail({
    para: req.usuario.email,
    assunto: `Inscrição confirmada: ${projeto.titulo}`,
    corpo: `Olá, ${req.usuario.nome}. Sua inscrição em "${projeto.titulo}" foi registrada. O CAEX entrará em contato assim que a coordenação responder.`,
  })

  if (coordenador?.email) {
    store.registrarEmail({
      para: coordenador.email,
      assunto: `Nova solicitação de inscrição: ${projeto.titulo}`,
      corpo: `${req.usuario.nome} (${req.usuario.email}) manifestou interesse no projeto "${projeto.titulo}". Por favor, responda ao CAEX.`,
    })
  }

  return res.status(201).json(inscricao)
})

module.exports = router
