const BASE = import.meta.env.VITE_API_URL ?? '/api'

let token = localStorage.getItem('edauro:token')

export function definirToken(novoToken) {
  token = novoToken
  if (novoToken) localStorage.setItem('edauro:token', novoToken)
  else localStorage.removeItem('edauro:token')
}

export function obterToken() {
  return token
}

async function requisitar(caminho, { metodo = 'GET', corpo, autenticado = true } = {}) {
  const cabecalhos = { 'Content-Type': 'application/json' }
  if (autenticado && token) cabecalhos.Authorization = `Bearer ${token}`

  const resposta = await fetch(`${BASE}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new Error(dados.erro ?? `Falha na requisição (${resposta.status}).`)
  return dados
}

export const api = {
  health: () => requisitar('/health', { autenticado: false }),
  usuariosDemo: () => requisitar('/auth/usuarios', { autenticado: false }),
  login: (credencial) =>
    requisitar('/auth/login', { metodo: 'POST', corpo: { credencial }, autenticado: false }),

  projetos: () => requisitar('/projetos'),
  meusProjetos: () => requisitar('/projetos/meus'),
  criarProjeto: (dados) => requisitar('/projetos', { metodo: 'POST', corpo: dados }),
  manifestarInteresse: (id) => requisitar(`/projetos/${id}/interesse`, { metodo: 'POST' }),

  minhasInscricoes: () => requisitar('/inscricoes/minhas'),
  inscricoes: () => requisitar('/inscricoes'),
  enviarRelatorio: (id, texto) =>
    requisitar(`/inscricoes/${id}/relatorio`, { metodo: 'POST', corpo: { texto } }),
  marcarRetorno: (id) => requisitar(`/inscricoes/${id}/retorno`, { metodo: 'PATCH' }),
  verificarCertificado: (codigo) =>
    requisitar(`/inscricoes/certificados/${codigo}`, { autenticado: false }),

  inscricoesCAEX: () => requisitar('/caex/inscricoes'),
  projetosCAEX: () => requisitar('/caex/projetos'),
  notificacoes: () => requisitar('/caex/notificacoes'),
  marcarLida: (id) => requisitar(`/caex/notificacoes/${id}/lida`, { metodo: 'PATCH' }),
  emails: () => requisitar('/caex/emails'),
  liberarContato: (id) =>
    requisitar(`/caex/inscricoes/${id}/liberar-contato`, { metodo: 'PATCH' }),
  certificar: (id) => requisitar(`/caex/inscricoes/${id}/certificar`, { metodo: 'PATCH' }),
}
