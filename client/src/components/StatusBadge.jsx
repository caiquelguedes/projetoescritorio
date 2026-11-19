const ESTILOS = {
  Disponível: 'verde',
  'Em andamento': 'azul',
  'Aguardando retorno': 'amarelo',
  Concluído: 'cinza',
  'em contato': 'amarelo',
  'em andamento': 'azul',
  'aguardando retorno': 'laranja',
  concluída: 'verde',
}

export default function StatusBadge({ status }) {
  return <span className={`badge badge--${ESTILOS[status] ?? 'neutro'}`}>{status}</span>
}
