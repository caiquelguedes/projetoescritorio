require('dotenv').config()

const express = require('express')
const cors = require('cors')
const fs = require('node:fs')
const path = require('node:path')

const rotas = require('./src/routes')
const { erroGlobal } = require('./src/middlewares')

const app = express()
const porta = Number(process.env.PORT) || 3001

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true,
  }),
)
app.use(express.json())

// Rotas da API (isoladas sob /api para não conflitar com o front).
app.use('/api', rotas)

// Em produção, entrega o build do client. Em dev, o Vite cuida da interface.
const diretorioClient = path.join(__dirname, 'client', 'dist')
if (fs.existsSync(diretorioClient)) {
  app.use(express.static(diretorioClient))
  app.get(/.*/, (req, res) => res.sendFile(path.join(diretorioClient, 'index.html')))
} else {
  app.get('/', (req, res) => {
    res.type('html').send(`
      <main style="font-family:system-ui;max-width:44rem;margin:4rem auto;line-height:1.5">
        <h1>EDAURO · API</h1>
        <p>Servidor rodando. A interface fica em <code>client/</code> (execute <code>npm run dev</code> lá).</p>
        <p>Health check: <a href="/api/health"><code>/api/health</code></a></p>
      </main>
    `)
  })
}

app.use(erroGlobal)

app.listen(porta, () => {
  console.log(`[EDAURO] API ouvindo em http://localhost:${porta}`)
})

module.exports = app
