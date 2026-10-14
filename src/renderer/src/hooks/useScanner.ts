import { useEffect, useRef } from 'react'

export interface OpcionesScanner {
  onCodigo: (codigo: string) => void
  activo?: boolean
  umbral?: number
  longitudMinima?: number
}

function esEditable(elemento: Element | null): boolean {
  if (!elemento) return false
  const tag = elemento.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (elemento as HTMLElement).isContentEditable
  )
}

/**
 * Detecta el ingreso del pistola láser (teclado HID): una ráfaga de teclas
 * (separación < `umbral` ms) terminada en `Enter`. Se ignora si el foco está
 * en un campo editable (ahí el navegador ya maneja la entrada).
 */
export function useScanner({
  onCodigo,
  activo = true,
  umbral = 50,
  longitudMinima = 4
}: OpcionesScanner): void {
  const buffer = useRef('')
  const ultimaTecla = useRef(0)
  const callback = useRef(onCodigo)
  callback.current = onCodigo

  useEffect(() => {
    if (!activo) return

    const manejar = (evento: KeyboardEvent): void => {
      if (evento.ctrlKey || evento.altKey || evento.metaKey) return

      if (esEditable(document.activeElement)) {
        buffer.current = ''
        return
      }

      if (evento.key === 'Enter') {
        const codigo = buffer.current
        buffer.current = ''
        const separacion = performance.now() - ultimaTecla.current
        if (codigo.length >= longitudMinima && separacion <= umbral * 4) {
          evento.preventDefault()
          callback.current(codigo)
        }
        return
      }

      if (evento.key.length !== 1) return

      const ahora = performance.now()
      const delta = ahora - ultimaTecla.current
      ultimaTecla.current = ahora

      if (delta <= umbral && buffer.current.length > 0) {
        buffer.current += evento.key
      } else {
        buffer.current = evento.key
      }
      evento.preventDefault()
    }

    window.addEventListener('keydown', manejar)
    return () => window.removeEventListener('keydown', manejar)
  }, [activo, umbral, longitudMinima])
}
