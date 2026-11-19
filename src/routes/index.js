const express = require('express')

const router = express.Router()

router.get('/health', (req, res) => {
  res.json({ ok: true, servico: 'EDAURO API', agora: new Date().toISOString() })
})

router.use('/auth', require('./auth'))
router.use('/projetos', require('./projetos'))
router.use('/inscricoes', require('./inscricoes'))
router.use('/caex', require('./caex'))

router.use((req, res) => {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` })
})

module.exports = router
