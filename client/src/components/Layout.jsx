import { PERFIL_LABEL } from '../constants.js'

export default function Layout({ usuario, abas, abaAtiva, onTrocarAba, onSair, children }) {
  return (
    <div className="app">
      <header className="cabecalho">
        <div className="cabecalho__interno">
          <div className="marca">
            <div className="marca__selo" aria-hidden="true">
              E
            </div>
            <div>
              <strong className="marca__nome">EDAURO</strong>
              <span className="marca__legenda">Projetos de extensão e pesquisa</span>
            </div>
          </div>

          <div className="cabecalho__usuario">
            <div className="cabecalho__identidade">
              <strong>{usuario.nome}</strong>
              <span>{PERFIL_LABEL[usuario.perfil] ?? usuario.perfil}</span>
            </div>
            <button type="button" className="botao botao--ghost" onClick={onSair}>
              Sair
            </button>
          </div>
        </div>

        <nav className="abas" aria-label="Seções do sistema">
          {abas.map((aba) => (
            <button
              key={aba.id}
              type="button"
              className={`aba ${abaAtiva === aba.id ? 'aba--ativa' : ''}`}
              onClick={() => onTrocarAba(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="conteudo">{children}</main>

      <footer className="rodape">
        EDAURDO · protótipo integrado aos dados institucionais (SIGA/UFJF)
      </footer>
    </div>
  )
}
