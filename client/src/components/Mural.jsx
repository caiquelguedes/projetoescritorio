import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import Modal from './Modal.jsx'
import StatusBadge from './StatusBadge.jsx'

export default function Mural({ versao, onChange, avisar }) {
  const [projetos, setProjetos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [modalidade, setModalidade] = useState('todas')
  const [detalhe, setDetalhe] = useState(null)
  const [confirmacao, setConfirmacao] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let ativo = true
    api.projetos()
      .then((dados) => {
        if (ativo) {
          setProjetos(dados)
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

  const modalidades = useMemo(
    () => ['todas', ...new Set(projetos.map((projeto) => projeto.modalidade))],
    [projetos],
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return projetos.filter((projeto) => {
      const combinaTexto =
        !termo ||
        projeto.titulo.toLowerCase().includes(termo) ||
        projeto.area.toLowerCase().includes(termo) ||
        projeto.resumo.toLowerCase().includes(termo)
      const combinaModalidade =
        modalidade === 'todas' || projeto.modalidade === modalidade
      return combinaTexto && combinaModalidade
    })
  }, [projetos, busca, modalidade])

  async function confirmarInteresse() {
    if (!confirmacao) return
    setEnviando(true)
    try {
      await api.manifestarInteresse(confirmacao.id)
      avisar('Interesse registrado! O CAEX foi notificado e acionou a coordenação.')
      setConfirmacao(null)
      setDetalhe(null)
      onChange()
    } catch (falha) {
      avisar(falha.message, 'erro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section>
      <div className="cabecalho-secao">
        <div>
          <p className="olho">Oportunidades liberadas pelo CAEX</p>
          <h1>Mural de projetos</h1>
          <p className="texto-suave">
            {projetos.length} {projetos.length === 1 ? 'projeto disponível' : 'projetos disponíveis'}.
            Os requisitos são informativos e não eliminam sua inscrição.
          </p>
        </div>
        <div className="filtros">
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar projeto ou área..."
            aria-label="Buscar projetos"
          />
          <select
            value={modalidade}
            onChange={(evento) => setModalidade(evento.target.value)}
            aria-label="Filtrar por modalidade"
          >
            {modalidades.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao === 'todas' ? 'Todas as modalidades' : opcao}
              </option>
            ))}
          </select>
        </div>
      </div>

      {erro && <p className="alerta alerta--erro">{erro}</p>}

      {carregando ? (
        <p className="estado-vazio">Carregando projetos...</p>
      ) : filtrados.length === 0 ? (
        <div className="estado-vazio">
          <strong>Nenhum projeto por aqui no momento.</strong>
          <span>Novas oportunidades aparecem no mural assim que o CAEX as libera.</span>
        </div>
      ) : (
        <div className="grade-projetos">
          {filtrados.map((projeto) => (
            <article className="cartao-projeto" key={projeto.id}>
              <div className="cartao-projeto__topo">
                <span className="etiqueta">{projeto.modalidade}</span>
                <StatusBadge status={projeto.status} />
              </div>
              <h3>{projeto.titulo}</h3>
              <p className="cartao-projeto__resumo">{projeto.resumo}</p>

              <dl className="metadados">
                <div>
                  <dt>Área</dt>
                  <dd>{projeto.area}</dd>
                </div>
                <div>
                  <dt>Carga horária</dt>
                  <dd>{projeto.cargaHoraria}</dd>
                </div>
                <div>
                  <dt>Vagas</dt>
                  <dd>{projeto.vagas}</dd>
                </div>
                <div>
                  <dt>Período</dt>
                  <dd>{projeto.periodo}</dd>
                </div>
              </dl>

              <div className="requisitos-previa">
                <span className="requisitos-previa__titulo">Requisitos mínimos</span>
                <ul>
                  {projeto.requisitos.slice(0, 2).map((requisito) => (
                    <li key={requisito}>{requisito}</li>
                  ))}
                </ul>
                {projeto.requisitos.length > 2 && (
                  <small>+ {projeto.requisitos.length - 2} requisito(s)</small>
                )}
              </div>

              <div className="cartao-projeto__acoes">
                <button
                  type="button"
                  className="botao botao--ghost"
                  onClick={() => setDetalhe(projeto)}
                >
                  Ver detalhes
                </button>
                <button
                  type="button"
                  className="botao botao--primario"
                  onClick={() => setConfirmacao(projeto)}
                >
                  Tenho interesse
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {detalhe && (
        <Modal
          titulo={detalhe.titulo}
          onFechar={() => setDetalhe(null)}
          rodape={
            <>
              <button type="button" className="botao botao--ghost" onClick={() => setDetalhe(null)}>
                Fechar
              </button>
              <button
                type="button"
                className="botao botao--primario"
                onClick={() => {
                  setConfirmacao(detalhe)
                  setDetalhe(null)
                }}
              >
                Manifestar interesse
              </button>
            </>
          }
        >
          <div className="linha-badges">
            <span className="etiqueta">{detalhe.modalidade}</span>
            <StatusBadge status={detalhe.status} />
          </div>
          <p>{detalhe.resumo}</p>
          <dl className="metadados metadados--modal">
            <div>
              <dt>Área</dt>
              <dd>{detalhe.area}</dd>
            </div>
            <div>
              <dt>Carga horária</dt>
              <dd>{detalhe.cargaHoraria}</dd>
            </div>
            <div>
              <dt>Vagas</dt>
              <dd>{detalhe.vagas}</dd>
            </div>
            <div>
              <dt>Período</dt>
              <dd>{detalhe.periodo}</dd>
            </div>
          </dl>
          <h4>Requisitos mínimos</h4>
          <ul className="lista-requisitos">
            {detalhe.requisitos.map((requisito) => (
              <li key={requisito}>{requisito}</li>
            ))}
          </ul>
          <p className="alerta alerta--info">
            Os requisitos são apenas informativos: o sistema não bloqueia sua manifestação de
            interesse. O contato da coordenação é liberado pelo CAEX.
          </p>
        </Modal>
      )}

      {confirmacao && (
        <Modal
          titulo="Confirmar manifestação de interesse"
          onFechar={() => setConfirmacao(null)}
          rodape={
            <>
              <button
                type="button"
                className="botao botao--ghost"
                onClick={() => setConfirmacao(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="botao botao--primario"
                onClick={confirmarInteresse}
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Confirmar interesse'}
              </button>
            </>
          }
        >
          <p>
            Você está manifestando interesse em <strong>{confirmacao.titulo}</strong>.
          </p>
          <ul className="lista-passos">
            <li>O projeto deixará de aparecer no mural.</li>
            <li>O CAEX será notificado e acionará a coordenação do projeto.</li>
            <li>Você e o(a) coordenador(a) receberão um e-mail confirmando a inscrição.</li>
            <li>Depois que o CAEX liberar o contato, o status passa a “em andamento”.</li>
          </ul>
        </Modal>
      )}
    </section>
  )
}
