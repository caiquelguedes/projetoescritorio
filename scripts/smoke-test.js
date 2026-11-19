// Teste rápido de ponta a ponta. Requer a API rodando em http://localhost:3001.
const BASE = process.env.API_URL ?? 'http://localhost:3001/api'

async function requisitar(caminho, { metodo = 'GET', token, corpo } = {}) {
  const resposta = await fetch(`${BASE}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const dados = await resposta.json()
  if (!resposta.ok) throw new Error(`${metodo} ${caminho}: ${dados.erro}`)
  return dados
}

async function login(credencial) {
  const dados = await requisitar('/auth/login', { metodo: 'POST', corpo: { credencial } })
  return dados.token
}

function conferir(condicao, mensagem) {
  if (!condicao) throw new Error(`Falha: ${mensagem}`)
  console.log(`ok - ${mensagem}`)
}

async function main() {
  const saude = await requisitar('/health')
  conferir(saude.ok === true, 'API responde')

  const ana = await login('2023123456')
  const caex = await login('caex')
  const carlos = await login('1234567')

  const muralAntes = await requisitar('/projetos', { token: ana })
  conferir(muralAntes.length === 4, 'mural começa com 4 projetos')

  const inscricao = await requisitar('/projetos/prj-1/interesse', {
    metodo: 'POST',
    token: ana,
  })
  conferir(inscricao.status === 'em contato', 'interesse gera status "em contato"')

  const muralDepois = await requisitar('/projetos', { token: ana })
  conferir(muralDepois.length === 3, 'projeto solicitado sai do mural')

  const solicitacoes = await requisitar('/caex/inscricoes', { token: caex })
  conferir(solicitacoes.length === 1, 'CAEX recebe a solicitação')

  const notificacoes = await requisitar('/caex/notificacoes', { token: caex })
  conferir(notificacoes.length >= 2, 'CAEX e coordenação são notificados')

  const emailsAntes = await requisitar('/caex/emails', { token: caex })
  conferir(emailsAntes.length === 2, 'e-mails de confirmação são registrados')

  const liberada = await requisitar(`/caex/inscricoes/${inscricao.id}/liberar-contato`, {
    metodo: 'PATCH',
    token: caex,
  })
  conferir(liberada.contatoLiberado === true, 'CAEX libera o contato da coordenação')
  conferir(
    liberada.contatoCoordenador?.email === 'carlos.rocha@ufjf.br',
    'contato do coordenador é liberado',
  )

  const demandas = await requisitar('/inscricoes', { token: carlos })
  conferir(demandas.length === 1, 'coordenação vê a demanda')

  const aguardando = await requisitar(`/inscricoes/${inscricao.id}/retorno`, {
    metodo: 'PATCH',
    token: carlos,
  })
  conferir(aguardando.status === 'aguardando retorno', 'coordenação marca retorno')

  await requisitar(`/inscricoes/${inscricao.id}/relatorio`, {
    metodo: 'POST',
    token: ana,
    corpo: { texto: 'Participei dos plantões de dúvidas e produzi material de estudo.' },
  })
  conferir(true, 'discente envia relatório final')

  const resultado = await requisitar(`/caex/inscricoes/${inscricao.id}/certificar`, {
    metodo: 'PATCH',
    token: caex,
  })
  conferir(
    resultado.inscricao.status === 'concluída' && Boolean(resultado.certificado.codigo),
    'CAEX emite certificado',
  )

  const verificado = await requisitar(
    `/inscricoes/certificados/${resultado.certificado.codigo}`,
  )
  conferir(verificado.discente.nome === 'Ana Beatriz Lima', 'certificado é verificável')

  console.log('\nFluxo concluído com sucesso.')
}

main().catch((erro) => {
  console.error(erro)
  process.exitCode = 1
})
