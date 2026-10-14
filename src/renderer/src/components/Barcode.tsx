import React, { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

export function elegirFormato(codigo: string): string {
  return /^\d{12,13}$/.test(codigo) ? 'EAN13' : 'CODE128'
}

interface Props {
  value: string
  formato?: string
  ancho?: number
  alto?: number
  mostrarTexto?: boolean
  className?: string
}

function Barcode({
  value,
  formato,
  ancho = 2,
  alto = 60,
  mostrarTexto = true,
  className
}: Props): React.JSX.Element {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    svg.innerHTML = ''
    if (!value.trim()) return
    try {
      JsBarcode(svg, value, {
        format: formato ?? elegirFormato(value),
        width: ancho,
        height: alto,
        displayValue: mostrarTexto,
        margin: 4,
        fontSize: 14
      })
    } catch {
      svg.innerHTML = ''
    }
  }, [value, formato, ancho, alto, mostrarTexto])

  return <svg ref={ref} className={className} />
}

export default Barcode
