import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Producto } from '@shared/types'
import {
  aCentavos,
  aGramos,
  aKg,
  formatearMoneda,
  formatearPeso,
  gramosPorMonto,
  subtotalLinea
} from '@shared/money'

interface Props {
  producto: Producto
  onConfirmar: (gramos: number) => void
  onCancelar: () => void
}

const aNumero = (texto: string): number => Number(texto.replace(',', '.')) || 0

function DialogoPeso({ producto, onConfirmar, onCancelar }: Props): React.JSX.Element {
  const [kg, setKg] = useState('')
  const [monto, setMonto] = useState('')
  const [ultimo, setUltimo] = useState<'kg' | 'monto'>('kg')
  const kgRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    kgRef.current?.focus()
  }, [])

  const { gramos, subtotal } = useMemo(() => {
    if (ultimo === 'monto') {
      const g = gramosPorMonto(aCentavos(aNumero(monto)), producto.precio)
      return { gramos: g, subtotal: subtotalLinea('PESO', producto.precio, g) }
    }
    const g = aGramos(aNumero(kg))
    return { gramos: g, subtotal: subtotalLinea('PESO', producto.precio, g) }
  }, [ultimo, monto, kg, producto.precio])

  const excede = gramos > producto.stock
  const invalido = gramos <= 0 || excede

  const confirmar = (): void => {
    if (invalido) return
    onConfirmar(gramos)
  }

  const alTeclear = (evento: React.KeyboardEvent): void => {
    if (evento.key === 'Enter') {
      confirmar()
    } else if (evento.key === 'Escape') {
      onCancelar()
    }
  }

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()} onKeyDown={alTeclear}>
        <div className="panel-header">
          <h3>Vender por peso</h3>
          <span className="badge">{formatearMoneda(producto.precio)} /kg</span>
        </div>

        <p className="pagina-sub" style={{ marginBottom: '0.75rem' }}>
          {producto.nombre} · stock {formatearPeso(producto.stock)}
        </p>

        <div className="grid-2">
          <div className="campo">
            <label>Kilos</label>
            <input
              ref={kgRef}
              type="number"
              step="0.001"
              min="0"
              placeholder="0.000"
              value={kg}
              onChange={(e) => {
                setKg(e.target.value)
                setUltimo('kg')
              }}
            />
          </div>
          <div className="campo">
            <label>Monto ($)</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={monto}
              onChange={(e) => {
                setMonto(e.target.value)
                setUltimo('monto')
              }}
            />
          </div>
        </div>

        <div className="peso-resumen">
          <span>{formatearPeso(gramos)}</span>
          <strong>{formatearMoneda(subtotal)}</strong>
        </div>

        {excede && (
          <div className="mensaje error">
            Stock insuficiente (disponible {formatearPeso(producto.stock)})
          </div>
        )}

        <div className="acciones fin" style={{ marginTop: '0.9rem' }}>
          <button type="button" onClick={onCancelar}>
            Cancelar (Esc)
          </button>
          <button type="button" className="primario" onClick={confirmar} disabled={invalido}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DialogoPeso
