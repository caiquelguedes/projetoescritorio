export default function Toast({ toast, onFechar }) {
  if (!toast) return null

  return (
    <div className={`toast toast--${toast.tipo}`} role="status">
      <span>{toast.mensagem}</span>
      <button type="button" className="botao-icone" onClick={onFechar} aria-label="Fechar aviso">
        ×
      </button>
    </div>
  )
}
