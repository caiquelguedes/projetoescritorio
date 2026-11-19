import { useEffect, useState } from 'react'
import { api } from '../api'
import StatusBadge from './StatusBadge.jsx'

export default function MeusProjetos({ versao, onChange, avisar }) {
  const [projetos, setProjetos] = useState([])
  const [inscricoes, setInscricoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(null)

  useEffect(() => {
    let ativo = true
    Promise.all([api.meusProjetos(), api.inscricoes()])
      .then(([listaProjetos, listaInscricoes]) => {
        if (ativo) {
          setProjetos(listaProjetos)
          setInscricoes(listaInscricoes)
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

  async function marcarRetorno(id) {
    setEnviando(id)
    try {
      await api.marcarRetorno(id)
      avisar('Status atualizado para “aguardando retorno”.')
      onChange()
    } catch (falha) {
      avisar(falha.message, 'erro')
    } finally {
      setEnviando(null)
    }
  }

  return (
    <section>
      <div className="cabecalho-secao">
        <div>
          <p className="olho">Coordenação</p>
          <h1>Meus projetos</h1>
          <p className="texto-suave">
            Projetos sob sua responsabilidade e solicitações recebidas via CAEX.
          </p>
        </div>
      </div>

      {erro && <p className="alerta alerta--erro">{erro}</p>}

      {carregando ? (
        <p className="estado-vazio">Carregando...</p>
      ) : (
        <>
          <h2 className="titulo-bloco">Projetos ({projetos.length})</h2>
          {projetos.length === 0 ? (
            <div className="estado-vazio">
              <strong>Nenhum projeto cadastrado para você.</strong>
              <span>Solicite ao CAEX a liberação de um novo projeto no mural.</span>
            </div>
          ) : (
            <div className="grade-simples">
              {projetos.map((projeto) => (
                <article className="cartao-linha" key={projeto.id}>
                  <div>
                    <strong>{projeto.titulo}</strong>
                    <p className="texto-suave">
                      {projeto.modalidade} · {projeto.area} · {projeto.periodo}
                    </p>
                  </div>
                  <StatusBadge status={projeto.status} />
                </article>
              ))}
            </div>
          )}

          <h2 className="titulo-bloco">Solicitações recebidas ({inscricoes.length})</h2>
          {inscricoes.length === 0 ? (
            <div className="estado-vazio">
              <strong>Nenhuma solicitação no momento.</strong>
            </div>
          ) : (
            <div className="lista-inscricoes">
              {inscricoes.map((inscricao) => (
                <article className="cartao-inscricao" key={inscricao.id}>
                  <div className="cartao-inscricao__topo">
                    <div>
                      <h3>{inscricao.projeto?.titulo}</h3>
                      <p className="texto-suave">
                        Interessado(a): {inscricao.discente?.nome} · {inscricao.discente?.email}
                      </p>
                    </div>
                    <StatusBadge status={inscricao.status} />
                  </div>

                  <div className="cartao-inscricao__acoes">
                    {inscricao.relatorio && (
                      <div className="caixa-destaque">
                        <strong>Relatório final enviado</strong>
                        <p>{inscricao.relatorio.texto}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      className="botao botao--secundario"
                      onClick={() => marcarRetorno(inscricao.id)}
                      disabled={
                        ['aguardando retorno', 'concluída'].includes(inscricao.status) ||
                        enviando === inscricao.id
                      }
                    >
                      {enviando === inscricao.id
                        ? 'Atualizando...'
                        : 'Marcar como aguardando retorno'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
