import { useCallback, useEffect, useState } from 'react'
import { api, definirToken } from './api'
import Login from './components/Login.jsx'
import Layout from './components/Layout.jsx'
import Mural from './components/Mural.jsx'
import MinhasInscricoes from './components/MinhasInscricoes.jsx'
import MeusProjetos from './components/MeusProjetos.jsx'
import PainelCAEX from './components/PainelCAEX.jsx'
import Toast from './components/Toast.jsx'
import './App.css'

const ABAS = {
  discente: [
    { id: 'mural', label: 'Mural de projetos' },
    { id: 'inscricoes', label: 'Minhas inscrições' },
  ],
  docente: [{ id: 'meus-projetos', label: 'Meus projetos' }],
  servidor: [{ id: 'meus-projetos', label: 'Meus projetos' }],
  caex: [
    { id: 'solicitacoes', label: 'Solicitações' },
    { id: 'notificacoes', label: 'Notificações' },
    { id: 'novo-projeto', label: 'Novo projeto' },
    { id: 'auditoria', label: 'E-mails enviados' },
  ],
  administrador: [
    { id: 'solicitacoes', label: 'Solicitações' },
    { id: 'notificacoes', label: 'Notificações' },
    { id: 'novo-projeto', label: 'Novo projeto' },
    { id: 'auditoria', label: 'E-mails enviados' },
  ],
}

function abaInicial(perfil) {
  return ABAS[perfil]?.[0]?.id ?? 'mural'
}

function usuarioSalvo() {
  try {
    return JSON.parse(localStorage.getItem('edauro:usuario') ?? 'null')
  } catch {
    return null
  }
}

export default function App() {
  const [usuario, setUsuario] = useState(usuarioSalvo)
  const [usuarios, setUsuarios] = useState([])
  const [erroLogin, setErroLogin] = useState('')
  const [conectando, setConectando] = useState(false)
  const [aba, setAba] = useState(() => abaInicial(usuarioSalvo()?.perfil))
  const [versao, setVersao] = useState(0)
  const [toast, setToast] = useState(null)

  const avisar = useCallback((mensagem, tipo = 'sucesso') => {
    setToast({ mensagem, tipo })
  }, [])

  const onChange = useCallback(() => {
    setVersao((anterior) => anterior + 1)
  }, [])

  useEffect(() => {
    api.usuariosDemo().then(setUsuarios).catch(() => setUsuarios([]))
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const temporizador = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(temporizador)
  }, [toast])

  async function entrar(credencial) {
    setConectando(true)
    setErroLogin('')
    try {
      const dados = await api.login(credencial)
      definirToken(dados.token)
      localStorage.setItem('edauro:usuario', JSON.stringify(dados.usuario))
      setUsuario(dados.usuario)
      setAba(abaInicial(dados.usuario.perfil))
      setVersao((anterior) => anterior + 1)
    } catch (falha) {
      setErroLogin(falha.message)
    } finally {
      setConectando(false)
    }
  }

  function sair() {
    definirToken(null)
    localStorage.removeItem('edauro:usuario')
    setUsuario(null)
    setAba('mural')
    setToast(null)
  }

  if (!usuario) {
    return (
      <>
        <Login
          usuarios={usuarios}
          onLogin={entrar}
          erro={erroLogin}
          conectando={conectando}
        />
        <Toast toast={toast} onFechar={() => setToast(null)} />
      </>
    )
  }

  return (
    <>
      <Layout
        usuario={usuario}
        abas={ABAS[usuario.perfil] ?? ABAS.discente}
        abaAtiva={aba}
        onTrocarAba={setAba}
        onSair={sair}
      >
        {aba === 'mural' && (
          <Mural versao={versao} onChange={onChange} avisar={avisar} />
        )}
        {aba === 'inscricoes' && (
          <MinhasInscricoes versao={versao} onChange={onChange} avisar={avisar} />
        )}
        {aba === 'meus-projetos' && (
          <MeusProjetos versao={versao} onChange={onChange} avisar={avisar} />
        )}
        {['solicitacoes', 'notificacoes', 'novo-projeto', 'auditoria'].includes(aba) && (
          <PainelCAEX
            aba={aba}
            versao={versao}
            onChange={onChange}
            avisar={avisar}
            usuarios={usuarios}
          />
        )}
      </Layout>
      <Toast toast={toast} onFechar={() => setToast(null)} />
    </>
  )
}
