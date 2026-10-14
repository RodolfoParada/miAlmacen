import React, { useRef, useState } from 'react'

interface Props {
  onCodigo: (codigo: string) => void
  placeholder?: string
  autoFocus?: boolean
  deshabilitado?: boolean
}

/**
 * Campo pensado para el lector láser: al presionar Enter emite el contenido y
 * se limpia. También sirve para búsqueda manual por nombre.
 */
function ScannerInput({
  onCodigo,
  placeholder = 'Escanea un código',
  autoFocus = true,
  deshabilitado = false
}: Props): React.JSX.Element {
  const [valor, setValor] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const manejar = (evento: React.FormEvent): void => {
    evento.preventDefault()
    const codigo = valor.trim()
    if (!codigo) return
    onCodigo(codigo)
    setValor('')
    ref.current?.focus()
  }

  return (
    <form className="scanner" onSubmit={manejar}>
      <input
        ref={ref}
        value={valor}
        autoFocus={autoFocus}
        disabled={deshabilitado}
        placeholder={placeholder}
        onChange={(e) => setValor(e.target.value)}
      />
      <button type="submit" className="primario" disabled={deshabilitado || !valor.trim()}>
        Agregar
      </button>
    </form>
  )
}

export default ScannerInput
