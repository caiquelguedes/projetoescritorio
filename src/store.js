const {
  PERFIL,
  STATUS_PROJETO,
  STATUS_INSCRICAO,
} = require('./constants')

// ---------------------------------------------------------------------------
// Banco em memória (substituível pelo BD da UFJF/SIGA depois).
// ---------------------------------------------------------------------------

const usuarios = [
  {
    id: 'usr-ana',
    nome: 'Ana Beatriz Lima',
    perfil: PERFIL.DISCENTE,
    credencial: '2023123456',
    curso: 'Ciência da Computação',
    email: 'ana.lima@discente.ufjf.br',
  },
  {
    id: 'usr-joao',
    nome: 'João Pedro Alves',
    perfil: PERFIL.DISCENTE,
    credencial: '2023987654',
    curso: 'Engenharia de Software',
    email: 'joao.alves@discente.ufjf.br',
  },
  {
    id: 'usr-carlos',
    nome: 'Prof. Carlos Eduardo Rocha',
    perfil: PERFIL.DOCENTE,
    credencial: '1234567',
    departamento: 'Departamento de Computação',
    email: 'carlos.rocha@ufjf.br',
  },
  {
    id: 'usr-marta',
    nome: 'Marta Helena Souza',
    perfil: PERFIL.SERVIDOR,
    credencial: '7654321',
    departamento: 'Pró-Reitoria de Extensão',
    email: 'marta.souza@ufjf.br',
  },
  {
    id: 'usr-caex',
    nome: 'Equipe CAEX',
    perfil: PERFIL.CAEX,
    credencial: 'caex',
    email: 'caex@ufjf.br',
  },
  {
    id: 'usr-admin',
    nome: 'Administração EDAURDO',
    perfil: PERFIL.ADMINISTRADOR,
    credencial: 'admin',
    email: 'administracao@ufjf.br',
  },
]

const projetos = [
  {
    id: 'prj-1',
    titulo: 'Monitoria de Algoritmos e Estruturas de Dados',
    area: 'Computação',
    modalidade: 'Monitoria',
    cargaHoraria: '12 h/semana',
    vagas: 3,
    periodo: '2026/1',
    resumo:
      'Apoio às turmas de Algoritmos com exercícios, plantões de dúvidas e produção de material didático.',
    requisitos: [
      'Ter cursado Algoritmos I',
      'Disponibilidade para plantões à tarde',
      'Conhecimento básico de Python',
    ],
    coordenadorId: 'usr-carlos',
    status: STATUS_PROJETO.DISPONIVEL,
    criadoEm: '2026-01-10T12:00:00.000Z',
    liberadoPor: 'usr-caex',
  },
  {
    id: 'prj-2',
    titulo: 'Oficina de Robótica Educacional em Escolas Públicas',
    area: 'Educação / Robótica',
    modalidade: 'Extensão',
    cargaHoraria: '20 h/semana',
    vagas: 5,
    periodo: '2026/1',
    resumo:
      'Leitura de oficinas de montagem e programação de robôs para estudantes do ensino fundamental.',
    requisitos: [
      'Interesse em educação básica',
      'Noções de Arduino (desejável)',
      'Disponibilidade para deslocamento aos sábados',
    ],
    coordenadorId: 'usr-marta',
    status: STATUS_PROJETO.DISPONIVEL,
    criadoEm: '2026-01-14T12:00:00.000Z',
    liberadoPor: 'usr-caex',
  },
  {
    id: 'prj-3',
    titulo: 'Levantamento de Dados sobre Evasão nos Cursos de Exactas',
    area: 'Pesquisa / Estatística',
    modalidade: 'Iniciação Científica',
    cargaHoraria: '20 h/semana',
    vagas: 2,
    periodo: '2026/1',
    resumo:
      'Organização e análise de dados acadêmicos anonimizados para apoiar políticas de permanência estudantil.',
    requisitos: [
      'Conhecimento de planilhas ou R',
      'Cuidado com confidencialidade de dados',
    ],
    coordenadorId: 'usr-carlos',
    status: STATUS_PROJETO.DISPONIVEL,
    criadoEm: '2026-01-20T12:00:00.000Z',
    liberadoPor: 'usr-caex',
  },
  {
    id: 'prj-4',
    titulo: 'Produção de Material Acessível para Disciplinas Online',
    area: 'Acessibilidade / Design',
    modalidade: 'Extensão',
    cargaHoraria: '10 h/semana',
    vagas: 4,
    periodo: '2026/1',
    resumo:
      'Revisão e adaptação de slides e videosaulas para atender às diretrizes de acessibilidade digital.',
    requisitos: ['Familiaridade com ferramentas de apresentação'],
    coordenadorId: 'usr-marta',
    status: STATUS_PROJETO.DISPONIVEL,
    criadoEm: '2026-02-01T12:00:00.000Z',
    liberadoPor: 'usr-caex',
  },
]

/** @type {Array<{id:string, projetoId:string, discenteId:string, status:string, contatoLiberado:boolean, relatorio:any, criadoEm:string, historico:Array<any>}>} */
const inscricoes = []
const notificacoes = []
const emails = []
const certificados = []

let sequencia = 100
const proximoId = (prefixo) => `${prefixo}-${++sequencia}`
const agora = () => new Date().toISOString()

// ---------------------------------------------------------------------------
// Usuários
// ---------------------------------------------------------------------------

function listarUsuarios() {
  return usuarios.map(({ id, nome, perfil, credencial, curso, departamento, email }) => ({
    id,
    nome,
    perfil,
    credencial,
    curso,
    departamento,
    email,
  }))
}

function usuarioPorId(id) {
  return usuarios.find((usuario) => usuario.id === id)
}

function usuarioPorCredencial(credencial) {
  const chave = String(credencial ?? '').trim().toLowerCase()
  return usuarios.find((usuario) => usuario.credencial.toLowerCase() === chave)
}

// ---------------------------------------------------------------------------
// Projetos
// ---------------------------------------------------------------------------

function listarProjetos() {
  return projetos.map((projeto) => ({
    ...projeto,
    coordenador: resumoDoUsuario(projeto.coordenadorId),
  }))
}

function listarProjetosDoMural() {
  return listarProjetos().filter(
    (projeto) =>
      projeto.status === STATUS_PROJETO.DISPONIVEL &&
      !inscricoes.some((inscricao) => inscricao.projetoId === projeto.id),
  )
}

function buscarProjeto(id) {
  return listarProjetos().find((projeto) => projeto.id === id)
}

function criarProjeto(dados, liberadoPor) {
  const projeto = {
    id: proximoId('prj'),
    titulo: dados.titulo.trim(),
    area: dados.area.trim(),
    modalidade: dados.modalidade.trim(),
    cargaHoraria: dados.cargaHoraria.trim(),
    vagas: Number(dados.vagas),
    periodo: dados.periodo.trim(),
    resumo: dados.resumo.trim(),
    requisitos: dados.requisitos,
    coordenadorId: dados.coordenadorId,
    status: STATUS_PROJETO.DISPONIVEL,
    criadoEm: agora(),
    liberadoPor,
  }
  projetos.push(projeto)
  return buscarProjeto(projeto.id)
}

function alterarStatusProjeto(projetoId, status) {
  const projeto = projetos.find((item) => item.id === projetoId)
  if (projeto) projeto.status = status
  return buscarProjeto(projetoId)
}

function projetosDoCoordenador(usuarioId) {
  return listarProjetos().filter((projeto) => projeto.coordenadorId === usuarioId)
}

// ---------------------------------------------------------------------------
// Inscrições / manifestações de interesse
// ---------------------------------------------------------------------------

function listarInscricoes(filtros = {}) {
  let resultado = inscricoes.map((inscricao) => ({
    ...inscricao,
    projeto: buscarProjeto(inscricao.projetoId),
    discente: resumoDoUsuario(inscricao.discenteId),
  }))

  if (filtros.discenteId) {
    resultado = resultado.filter((item) => item.discenteId === filtros.discenteId)
  }
  if (filtros.coordenadorId) {
    resultado = resultado.filter(
      (item) => item.projeto?.coordenadorId === filtros.coordenadorId,
    )
  }
  if (filtros.status) {
    resultado = resultado.filter((item) => item.status === filtros.status)
  }

  return resultado.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
}

function buscarInscricao(id) {
  return listarInscricoes().find((inscricao) => inscricao.id === id)
}

function inscricaoExiste(projetoId, discenteId) {
  return inscricoes.some(
    (inscricao) => inscricao.projetoId === projetoId && inscricao.discenteId === discenteId,
  )
}

function criarInscricao(projetoId, discenteId) {
  const inscricao = {
    id: proximoId('ins'),
    projetoId,
    discenteId,
    status: STATUS_INSCRICAO.EM_CONTATO,
    contatoLiberado: false,
    relatorio: null,
    certificadoCodigo: null,
    criadoEm: agora(),
    historico: [
      {
        status: STATUS_INSCRICAO.EM_CONTATO,
        descricao: 'Interesse manifestado. CAEX e coordenação foram notificados.',
        em: agora(),
      },
    ],
  }
  inscricoes.push(inscricao)
  return buscarInscricao(inscricao.id)
}

function atualizarInscricao(id, { status, descricao, ...campos }) {
  const inscricao = inscricoes.find((item) => item.id === id)
  if (!inscricao) return undefined

  Object.assign(inscricao, campos)
  if (status) inscricao.status = status
  if (descricao) {
    inscricao.historico.push({ status: status ?? inscricao.status, descricao, em: agora() })
  }
  return buscarInscricao(id)
}

// ---------------------------------------------------------------------------
// Notificações, e-mails e certificados
// ---------------------------------------------------------------------------

function listarNotificacoes() {
  return [...notificacoes].reverse()
}

function adicionarNotificacao({ titulo, mensagem, tipo = 'info', inscricaoId = null }) {
  const notificacao = {
    id: proximoId('ntf'),
    titulo,
    mensagem,
    tipo,
    inscricaoId,
    lida: false,
    criadoEm: agora(),
  }
  notificacoes.push(notificacao)
  return notificacao
}

function marcarNotificacaoComoLida(id) {
  const notificacao = notificacoes.find((item) => item.id === id)
  if (notificacao) notificacao.lida = true
  return notificacao
}

function registrarEmail(mensagem) {
  const registro = { id: proximoId('mail'), ...mensagem, enviadoEm: agora() }
  emails.push(registro)
  console.log(
    `[EDAURO][E-MAIL] Para: ${registro.para} | Assunto: ${registro.assunto}`,
  )
  return registro
}

function listarEmails() {
  return [...emails].reverse()
}

function criarCertificado(inscricaoId) {
  const codigo = `EDA-${new Date().getFullYear()}-${String(sequencia + 1).padStart(4, '0')}`
  const certificado = {
    codigo,
    inscricaoId,
    emitidoEm: agora(),
  }
  certificados.push(certificado)
  return certificado
}

function buscarCertificado(codigo) {
  return certificados.find((certificado) => certificado.codigo === codigo)
}

// ---------------------------------------------------------------------------

function resumoDoUsuario(id) {
  const usuario = usuarioPorId(id)
  if (!usuario) return undefined
  const { id: usuarioId, nome, perfil, credencial, email, curso, departamento } = usuario
  return { id: usuarioId, nome, perfil, credencial, email, curso, departamento }
}

module.exports = {
  listarUsuarios,
  usuarioPorId,
  usuarioPorCredencial,
  listarProjetos,
  listarProjetosDoMural,
  buscarProjeto,
  criarProjeto,
  alterarStatusProjeto,
  projetosDoCoordenador,
  listarInscricoes,
  buscarInscricao,
  inscricaoExiste,
  criarInscricao,
  atualizarInscricao,
  listarNotificacoes,
  adicionarNotificacao,
  marcarNotificacaoComoLida,
  registrarEmail,
  listarEmails,
  criarCertificado,
  buscarCertificado,
}
