import { useEffect, useState } from 'react'
import { api } from '../api'
import Modal from './Modal.jsx'
import StatusBadge from './StatusBadge.jsx'

function linhaDoTempo(inscricao) {
  const etapas = [
    { titulo: 'Interesse manifestado', feita: true },
    { titulo: 'Contato liberado pelo CAEX', feita: inscricao.contatoLiberado },
    {
      titulo: 'Projeto em andamento',
      feita: ['em andamento', 'aguardando retorno', 'concluída'].includes(inscricao.status),
    },
    { titulo: 'Relatório enviado', feita: Boolean(inscricao.relatorio) },
    { titulo: 'Certificado emitido', feita: Boolean(inscricao.certificadoCodigo) },
  ]
  return etapas
}

export default function MinhasInscricoes({ versao, onChange, avisar }) {
  const [inscricoes, setInscricoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [textos, setTextos] = useState({})
  const [enviando, setEnviando] = useState(null)
  const [certificado, setCertificado] = useState(null)

  useEffect(() => {
    let ativo = true
    api.minhasInscricoes()
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

  async function enviarRelatorio(inscricao) {
    const texto = (textos[inscricao.id] ?? '').trim()
    if (texto.length < 20) {
      avisar('Escreva ao menos 20 caracteres no relatório.', 'erro')
      return
    }
    setEnviando(inscricao.id)
    try {
      await api.enviarRelatorio(inscricao.id, texto)
      avisar('Relatório enviado! O CAEX foi notificado para emitir o certificado.')
      setTextos((anterior) => ({ ...anterior, [inscricao.id]: '' }))
      onChange()
    } catch (falha) {
      avisar(falha.message, 'erro')
    } finally {
      setEnviando(null)
    }
  }

  async function verCertificado(codigo) {
    try {
      setCertificado(await api.verificarCertificado(codigo))
    } catch (falha) {
      avisar(falha.message, 'erro')
    }
  }

  return (
    <section>
      <div className="cabecalho-secao">
        <div>
          <p className="olho">Acompanhamento</p>
          <h1>Minhas inscrições</h1>
          <p className="texto-suave">
            Acompanhe cada etapa, converse com a coordenação e envie seu relatório final.
          </p>
        </div>
      </div>

      {erro && <p className="alerta alerta--erro">{erro}</p>}

      {carregando ? (
        <p className="estado-vazio">Carregando inscrições...</p>
      ) : inscricoes.length === 0 ? (
        <div className="estado-vazio">
          <strong>Você ainda não manifestou interesse.</strong>
          <span>Vá ao mural e escolha um projeto para começar.</span>
        </div>
      ) : (
        <div className="lista-inscricoes">
          {inscricoes.map((inscricao) => (
            <article className="cartao-inscricao" key={inscricao.id}>
              <div className="cartao-inscricao__topo">
                <div>
                  <p className="olho">{inscricao.projeto?.modalidade}</p>
                  <h3>{inscricao.projeto?.titulo}</h3>
                </div>
                <StatusBadge status={inscricao.status} />
              </div>

              <ol className="timeline">
                {linhaDoTempo(inscricao).map((etapa) => (
                  <li key={etapa.titulo} className={etapa.feita ? 'timeline__feita' : ''}>
                    <span className="timeline__marca" aria-hidden="true">
                      {etapa.feita ? '✓' : ''}
                    </span>
                    {etapa.titulo}
                  </li>
                ))}
              </ol>

              {inscricao.contatoCoordenador && (
                <div className="caixa-destaque">
                  <strong>Contato da coordenação liberado</strong>
                  <span>{inscricao.contatoCoordenador.nome}</span>
                  <a href={`mailto:${inscricao.contatoCoordenador.email}`}>
                    {inscricao.contatoCoordenador.email}
                  </a>
                </div>
              )}

              {inscricao.status === 'concluída' && inscricao.certificadoCodigo ? (
                <div className="caixa-certificado">
                  <div>
                    <strong>Certificado emitido</strong>
                    <span>Código: {inscricao.certificadoCodigo}</span>
                  </div>
                  <button
                    type="button"
                    className="botao botao--secundario"
                    onClick={() => verCertificado(inscricao.certificadoCodigo)}
                  >
                    Ver certificado
                  </button>
                </div>
              ) : !inscricao.relatorio && inscricao.contatoLiberado ? (
                <div className="form-relatorio">
                  <label htmlFor={`relatorio-${inscricao.id}`}>Relatório final</label>
                  <p className="texto-suave">
                    Descreva as atividades realizadas e os resultados obtidos no projeto.
                  </p>
                  <textarea
                    id={`relatorio-${inscricao.id}`}
                    rows={5}
                    value={textos[inscricao.id] ?? ''}
                    onChange={(evento) =>
                      setTextos((anterior) => ({
                        ...anterior,
                        [inscricao.id]: evento.target.value,
                      }))
                    }
                    placeholder="Ex.: Participei das atividades de..."
                  />
                  <button
                    type="button"
                    className="botao botao--primario"
                    onClick={() => enviarRelatorio(inscricao)}
                    disabled={enviando === inscricao.id}
                  >
                    {enviando === inscricao.id ? 'Enviando...' : 'Enviar relatório'}
                  </button>
                </div>
              ) : inscricao.relatorio ? (
                <div className="caixa-destaque">
                  <strong>Relatório enviado</strong>
                  <p>{inscricao.relatorio.texto}</p>
                </div>
              ) : (
                <p className="texto-suave">
                  Aguardando o CAEX liberar o contato da coordenação.
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {certificado && (
        <Modal titulo="Certificado EDAURDO" onFechar={() => setCertificado(null)}>
          <div className="certificado">
            <p className="olho">Certificamos que</p>
            <h3>{certificado.discente?.nome}</h3>
            <p>
              participou do projeto <strong>{certificado.projeto?.titulo}</strong> (
              {certificado.projeto?.area}), tendo cumprido as atividades e entregado o
              relatório final.
            </p>
            <div className="certificado__codigo">
              Código de verificação: <strong>{certificado.codigo}</strong>
              <br />
              Emitido em {new Date(certificado.emitidoEm).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}
