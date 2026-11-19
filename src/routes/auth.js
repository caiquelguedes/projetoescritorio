const express = require('express')

const store = require('../store')
const { autenticar } = require('../middlewares')
const { textoObrigatorio } = require('../validacao')

const router = express.Router()

// Endpoint de demonstração: liste os perfis para testar a interface.
router.get('/usuarios', (req, res) => {
  res.json(store.listarUsuarios())
})

router.post('/login', (req, res) => {
  const credencial = textoObrigatorio(req.body?.credencial, 'credencial')
  const usuario = store.usuarioPorCredencial(credencial)

  if (!usuario) {
    return res.status(404).json({
      erro: 'Credencial não encontrada. Use uma das credenciais de demonstração.',
    })
  }

  return res.json({ token: usuario.id, usuario: store.usuarioPorId(usuario.id) })
})

router.get('/eu', autenticar, (req, res) => {
  res.json(req.usuario)
})

module.exports = router
