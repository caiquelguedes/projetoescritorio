function textoObrigatorio(valor, nome) {
  if (typeof valor !== 'string' || !valor.trim()) {
    const erro = new Error(`O campo "${nome}" é obrigatório.`)
    erro.status = 400
    throw erro
  }
  return valor.trim()
}

function numeroPositivo(valor, nome) {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < 1) {
    const erro = new Error(`O campo "${nome}" deve ser um número inteiro positivo.`)
    erro.status = 400
    throw erro
  }
  return numero
}

module.exports = { textoObrigatorio, numeroPositivo }
