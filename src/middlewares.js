const store = require('./store')

// Autenticação simplificada: em produção, trocar pelo login institucional (SIGA).
function autenticar(req, res, next) {
  const cabecalho = req.header('Authorization') ?? ''
  const token = cabecalho.replace(/^Bearer\s+/i, '').trim()
  const usuario = token ? store.usuarioPorId(token) : undefined

  if (!usuario) {
    return res.status(401).json({ erro: 'Autenticação necessária.' })
  }

  req.usuario = usuario
  return next()
}

function exigirPerfil(...perfisPermitidos) {
  return (req, res, next) => {
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: 'Seu perfil não pode realizar esta ação.' })
    }
    return next()
  }
}

function erroGlobal(erro, req, res, next) {
  console.error('[EDAURO][ERRO]', erro)
  if (res.headersSent) return next(erro)

  return res.status(erro.status ?? 500).json({
    erro: erro.message ?? 'Erro interno do servidor.',
  })
}

module.exports = { autenticar, exigirPerfil, erroGlobal }
