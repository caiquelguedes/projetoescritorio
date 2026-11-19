import { useState } from 'react'
import { PERFIL_LABEL } from '../constants.js'

const INICIAIS = {
  discente: 'D',
  docente: 'P',
  servidor: 'S',
  caex: 'C',
  administrador: 'A',
}

export default function Login({ usuarios, onLogin, erro, conectando }) {
  const [credencial, setCredencial] = useState('')

  function enviar(evento) {
    evento.preventDefault()
    if (credencial.trim()) onLogin(credencial.trim())
  }

  return (
    <div className="login">
      <section className="login__apresentacao">
        <div className="marca marca--grande">
          <div className="marca__selo" aria-hidden="true">
            E
          </div>
          <div>
            <strong className="marca__nome">EDAURO</strong>
            <span className="marca__legenda">Projetos de extensão e pesquisa</span>
          </div>
        </div>

        <h1>
          Conectando <em>talentos</em> a projetos da UFJF
        </h1>
        <p>
          O mural reúne oportunidades liberadas pelo CAEX. Discentes manifestam interesse,
          a coordenação é acionada e todo o caminho — do primeiro contato ao certificado —
          fica registrado aqui.
        </p>

        <ul className="login__passos">
          <li>
            <span>01</span> Explore o mural e veja os requisitos mínimos
          </li>
          <li>
            <span>02</span> Manifeste interesse: o CAEX é notificado
          </li>
          <li>
            <span>03</span> Receba o contato da coordenação e participe
          </li>
          <li>
            <span>04</span> Envie o relatório final e receba o certificado
          </li>
        </ul>
      </section>

      <section className="login__cartao">
        <h2>Acessar o sistema</h2>
        <p className="texto-suave">Use sua matrícula ou SIAPE.</p>

        <form onSubmit={enviar}>
          <label htmlFor="credencial">Matrícula / SIAPE</label>
          <input
            id="credencial"
            value={credencial}
            onChange={(evento) => setCredencial(evento.target.value)}
            placeholder="Ex.: 2023123456"
            autoComplete="username"
          />
          {erro && <p className="alerta alerta--erro">{erro}</p>}
          <button className="botao botao--primario botao--largo" disabled={conectando || !credencial.trim()}>
            {conectando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login__separador">
          <span>ou entre como (demonstração)</span>
        </div>

        <div className="perfis-rapidos">
          {usuarios.map((usuario) => (
            <button
              key={usuario.id}
              type="button"
              className="perfil-rapido"
              onClick={() => onLogin(usuario.credencial)}
              disabled={conectando}
              title={`Credencial: ${usuario.credencial}`}
            >
              <span className={`avatar avatar--${usuario.perfil}`}>
                {INICIAIS[usuario.perfil] ?? '?'}
              </span>
              <span className="perfil-rapido__texto">
                <strong>{usuario.nome}</strong>
                <small>{PERFIL_LABEL[usuario.perfil] ?? usuario.perfil}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
