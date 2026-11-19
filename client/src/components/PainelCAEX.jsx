import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import StatusBadge from './StatusBadge.jsx'

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'em contato', label: 'Em contato' },
  { id: 'em andamento', label: 'Em andamento' },
  { id: 'aguardando retorno', label: 'Aguardando retorno' },
  { id: 'concluída', label: 'Concluídas' },
]

function Solicitacoes({ versao, onChange, avisar }) {
  const [inscricoes, setInscricoes] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [acao, setAcao] = useState(null)

  useEffect(() => {
    let ativo = true
    api.inscricoesCAEX()
      .then((dados) => {
        if (ativo) {
          setInscricoes(dados)
          setErro('')
        }
      })
      .catch((falha) => {
        if (ativo) setErro(falha.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [versao])

  const visiveis = useMemo(
    () => (filtro === 'todas' ? inscricoes : inscricoes.filter((item) => item.status === filtro)),
    [inscricoes, filtro],
  )

  async function executar(id, tipo) {
    setAcao(`${id}:${tipo}`)
    try {
      if (tipo === 'contato') {
        await api.liberarContato(id)
        avisar('Contato da coordenação liberado e e-mails enviados.')
      } else {
        const resultado = await api.certificar(id)
        avisar(`Certificado ${resultado.certificado.codigo} emitido com sucesso.`)
      }
      onChange()
    } catch (falha) {
      avisar(falha.message, 'erro')
    } finally {
      setAcao(null)
    }
  }

  return (
    <>
      <div className="filtros filtros--linha">
        {FILTROS.map((opcao) => (
          <button
            key={opcao.id}
            type="button"
            className={`pilula ${filtro === opcao.id ? 'pilula--ativa' : ''}`}
            onClick={() => setFiltro(opcao.id)}
          >
            {opcao.label}
          </button>
        ))}
      </div>

      {erro && <p className="alerta alerta--erro">{erro}</p>}

      {carregando ? (
        <p className="estado-vazio">Carregando solicitações...</p>
      ) : visiveis.length === 0 ? (
        <div className="estado-vazio">
          <strong>Nenhuma solicitação neste filtro.</strong>
        </div>
      ) : (
        <div className="lista-inscricoes">
          {visiveis.map((inscricao) => (
            <article className="cartao-inscricao" key={inscricao.id}>
              <div className="cartao-inscricao__topo">
                <div>
                  <h3>{inscricao.projeto?.titulo}</h3>
                  <p className="texto-suave">
                    {inscricao.discente?.nome} · {inscricao.discente?.credencial} ·{' '}
                    {inscricao.discente?.email}
                  </p>
                </div>
                <StatusBadge status={inscricao.status} />
              </div>

              <div className="cartao-inscricao__acoes">
                {inscricao.status === 'em contato' && (
                  <button
                    type="button"
                    className="botao botao--primario"
                    onClick={() => executar(inscricao.id, 'contato')}
                    disabled={acao === `${inscricao.id}:contato`}
                  >
                    {acao === `${inscricao.id}:contato` ? 'Liberando...' : 'Liberar contato'}
                  </button>
                )}

                {inscricao.relatorio && inscricao.status !== 'concluída' && (
                  <button
                    type="button"
                    className="botao botao--sucesso"
                    onClick={() => executar(inscricao.id, 'certificado')}
                    disabled={acao === `${inscricao.id}:certificado`}
                  >
                    {acao === `${inscricao.id}:certificado`
                      ? 'Emitindo...'
                      : 'Emitir certificado'}
                  </button>
                )}

                {inscricao.contatoCoordenador && (
                  <span className="info-linha">
                    Coordenação: {inscricao.contatoCoordenador.nome} ·{' '}
                    {inscricao.contatoCoordenador.email}
                  </span>
                )}
                {inscricao.certificadoCodigo && (
                  <span className="info-linha">
                    Certificado: <strong>{inscricao.certificadoCodigo}</strong>
                  </span>
                )}
              </div>

              {inscricao.relatorio && (
                <div className="caixa-destaque">
                  <strong>Relatório final</strong>
                  <p>{inscricao.relatorio.texto}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  )
}

function Notificacoes({ versao, onChange, avisar }) {
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    api.notificacoes()
      .then((dados) => {
        if (ativo) setNotificacoes(dados)
      })
      .catch((falha) => avisar(falha.message, 'erro'))
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [versao, avisar])

  async function marcarLida(id) {
    try {
      await api.marcarLida(id)
      onChange()
    } catch (falha) {
      avisar(falha.message, 'erro')
    }
  }

  return (
    <div className="lista-notificacoes">
      {carregando ? (
        <p className="estado-vazio">Carregando notificações...</p>
      ) : notificacoes.length === 0 ? (
        <div className="estado-vazio">
          <strong>Nenhuma notificação.</strong>
        </div>
      ) : (
        notificacoes.map((notificacao) => (
          <article
            key={notificacao.id}
            className={`notificacao ${notificacao.lida ? '' : 'notificacao--nova'}`}
          >
            <div className="notificacao__icone" aria-hidden="true">
              {notificacao.tipo === 'certificado' ? '★' : '!' }
            </div>
            <div>
              <strong>{notificacao.titulo}</strong>
              <p>{notificacao.mensagem}</p>
              <small>{new Date(notificacao.criadoEm).toLocaleString('pt-BR')}</small>
            </div>
            {!notificacao.lida && (
              <button
                type="button"
                className="botao botao--ghost botao--pequeno"
                onClick={() => marcarLida(notificacao.id)}
              >
                Marcar como lida
              </button>
            )}
          </article>
        ))
      )}
    </div>
  )
}

const FORMULARIO_VAZIO = {
  titulo: '',
  area: '',
  modalidade: 'Extensão',
  cargaHoraria: '',
  vagas: '2',
  periodo: '2026/1',
  resumo: '',
  requisitos: '',
  coordenadorId: '',
}

function NovoProjeto({ usuarios, onChange, avisar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO)
  const [enviando, setEnviando] = useState(false)
  const coordenadores = usuarios.filter((usuario) =>
    ['docente', 'servidor'].includes(usuario.perfil),
  )

  function alterar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (!formulario.coordenadorId) {
      avisar('Selecione um coordenador.', 'erro')
      return
    }
    setEnviando(true)
    try {
      await api.criarProjeto({
        ...formulario,
        vagas: Number(formulario.vagas),
        requisitos: formulario.requisitos.split('\n'),
      })
      avisar('Projeto publicado no mural!')
      setFormulario({ ...FORMULARIO_VAZIO, coordenadorId: formulario.coordenadorId })
      onChange()
    } catch (falha) {
      avisar(falha.message, 'erro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <div className="formulario__grade">
        <label className="campo campo--largo">
          <span>Título do projeto</span>
          <input
            value={formulario.titulo}
            onChange={(evento) => alterar('titulo', evento.target.value)}
            required
          />
        </label>
        <label className="campo">
          <span>Área</span>
          <input
            value={formulario.area}
            onChange={(evento) => alterar('area', evento.target.value)}
            required
          />
        </label>
        <label className="campo">
          <span>Modalidade</span>
          <select
            value={formulario.modalidade}
            onChange={(evento) => alterar('modalidade', evento.target.value)}
          >
            <option>Extensão</option>
            <option>Iniciação Científica</option>
            <option>Monitoria</option>
            <option>Projeto de ensino</option>
          </select>
        </label>
        <label className="campo">
          <span>Carga horária</span>
          <input
            value={formulario.cargaHoraria}
            onChange={(evento) => alterar('cargaHoraria', evento.target.value)}
            placeholder="Ex.: 12 h/semana"
            required
          />
        </label>
        <label className="campo">
          <span>Vagas</span>
          <input
            type="number"
            min="1"
            value={formulario.vagas}
            onChange={(evento) => alterar('vagas', evento.target.value)}
            required
          />
        </label>
        <label className="campo">
          <span>Período</span>
          <input
            value={formulario.periodo}
            onChange={(evento) => alterar('periodo', evento.target.value)}
            required
          />
        </label>
        <label className="campo">
          <span>Coordenador(a)</span>
          <select
            value={formulario.coordenadorId}
            onChange={(evento) => alterar('coordenadorId', evento.target.value)}
            required
          >
            <option value="">Selecione...</option>
            {coordenadores.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo campo--largo">
          <span>Resumo exibido no mural</span>
          <textarea
            rows={3}
            value={formulario.resumo}
            onChange={(evento) => alterar('resumo', evento.target.value)}
            required
          />
        </label>
        <label className="campo campo--largo">
          <span>Requisitos mínimos (um por linha)</span>
          <textarea
            rows={3}
            value={formulario.requisitos}
            onChange={(evento) => alterar('requisitos', evento.target.value)}
            placeholder={'Conhecimento básico de...\nDisponibilidade nos sábados'}
            required
          />
        </label>
      </div>
      <button type="submit" className="botao botao--primario" disabled={enviando}>
        {enviando ? 'Publicando...' : 'Publicar no mural'}
      </button>
    </form>
  )
}

function Auditoria({ versao, avisar }) {
  const [emails, setEmails] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    api.emails()
      .then((dados) => {
        if (ativo) setEmails(dados)
      })
      .catch((falha) => avisar(falha.message, 'erro'))
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [versao, avisar])

  return (
    <div className="lista-notificacoes">
      {carregando ? (
        <p className="estado-vazio">Carregando e-mails...</p>
      ) : emails.length === 0 ? (
        <div className="estado-vazio">
          <strong>Nenhum e-mail enviado ainda.</strong>
        </div>
      ) : (
        emails.map((email) => (
          <article className="notificacao" key={email.id}>
            <div className="notificacao__icone" aria-hidden="true">
              @
            </div>
            <div>
              <strong>{email.assunto}</strong>
              <p>Para: {email.para}</p>
              <p className="texto-suave">{email.corpo}</p>
              <small>{new Date(email.enviadoEm).toLocaleString('pt-BR')}</small>
            </div>
          </article>
        ))
      )}
    </div>
  )
}

const TITULOS = {
  solicitacoes: {
    titulo: 'Solicitações',
    descricao: 'Libere o contato da coordenação e emita os certificados após o relatório.',
  },
  notificacoes: {
    titulo: 'Notificações',
    descricao: 'Acompanhe os eventos do sistema e as demandas encaminhadas.',
  },
  'novo-projeto': {
    titulo: 'Novo projeto',
    descricao: 'Cadastre uma oportunidade e publique-a no mural.',
  },
  auditoria: {
    titulo: 'E-mails enviados',
    descricao: 'Registro das confirmações enviadas a discentes e coordenadores.',
  },
}

export default function PainelCAEX({ aba, versao, onChange, avisar, usuarios }) {
  const info = TITULOS[aba] ?? TITULOS.solicitacoes

  return (
    <section>
      <div className="cabecalho-secao">
        <div>
          <p className="olho">CAEX / Administração</p>
          <h1>{info.titulo}</h1>
          <p className="texto-suave">{info.descricao}</p>
        </div>
      </div>

      {aba === 'notificacoes' && (
        <Notificacoes versao={versao} onChange={onChange} avisar={avisar} />
      )}
      {aba === 'novo-projeto' && (
        <NovoProjeto usuarios={usuarios} onChange={onChange} avisar={avisar} />
      )}
      {aba === 'auditoria' && <Auditoria versao={versao} avisar={avisar} />}
      {(aba === 'solicitacoes' || !TITULOS[aba]) && (
        <Solicitacoes versao={versao} onChange={onChange} avisar={avisar} />
      )}
    </section>
  )
}
