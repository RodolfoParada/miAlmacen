import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Produccion as ProduccionTipo, Producto } from '@shared/types'
import { aGramos, formatearPeso } from '@shared/money'
import api from '../lib/api'
import { formatearFecha } from '../lib/format'

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

function Produccion(): React.JSX.Element {
  const [productos, setProductos] = useState<Producto[]>([])
  const [historial, setHistorial] = useState<ProduccionTipo[]>([])
  const [productoId, setProductoId] = useState('')
  const [kg, setKg] = useState('')
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async (): Promise<void> => {
    const [lista, prod] = await Promise.all([
      api.listarProductos(),
      api.historialProducciones()
    ])
    setProductos(lista)
    setHistorial(prod)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const fabricables = useMemo(() => productos.filter((p) => p.unidad === 'PESO'), [productos])

  const seleccionado = fabricables.find((p) => String(p.id) === productoId)

  const registrar = async (evento: React.FormEvent): Promise<void> => {
    evento.preventDefault()
    setMensaje(null)

    if (!seleccionado) {
      setMensaje({ tipo: 'error', texto: 'Elegí un producto por peso' })
      return
    }
    const gramos = aGramos(Number(kg.replace(',', '.')))
    if (gramos <= 0) {
      setMensaje({ tipo: 'error', texto: 'La cantidad producida debe ser mayor a cero' })
      return
    }

    try {
      setGuardando(true)
      const registro = await api.registrarProduccion(seleccionado.id, gramos)
      await cargar()
      setKg('')
      setMensaje({
        tipo: 'ok',
        texto: `Sumados ${formatearPeso(registro.gramos)} a ${registro.nombre}`
      })
    } catch (e) {
      setMensaje({ tipo: 'error', texto: (e as Error).message })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="pagina">
      <header className="pagina-header">
        <h2>Producción</h2>
        <p className="pagina-sub">Registrá lo que fabricás para sumar stock (por peso).</p>
      </header>

      {mensaje && <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="panel">
        <div className="panel-header">
          <h3>Registrar producción</h3>
          {seleccionado && <span className="badge">En stock: {formatearPeso(seleccionado.stock)}</span>}
        </div>

        {fabricables.length === 0 ? (
          <p className="vacio">
            Todavía no hay productos por peso. Creá uno en Inventario con tipo «Por peso (kg)».
          </p>
        ) : (
          <form onSubmit={registrar}>
            <div className="grid-2">
              <div className="campo">
                <label>Producto</label>
                <select value={productoId} onChange={(e) => setProductoId(e.target.value)}>
                  <option value="">— Elegir —</option>
                  {fabricables.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Cantidad (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.000"
                  value={kg}
                  onChange={(e) => setKg(e.target.value)}
                />
              </div>
            </div>

            {seleccionado && kg && (
              <p className="pagina-sub" style={{ marginTop: '0.5rem' }}>
                Stock resultante: {formatearPeso(seleccionado.stock + aGramos(Number(kg.replace(',', '.')) || 0))}
              </p>
            )}

            <div className="acciones fin" style={{ marginTop: '0.9rem' }}>
              <button type="submit" className="primario" disabled={guardando || !seleccionado}>
                {guardando ? 'Guardando…' : 'Registrar producción'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Producción del día / reciente</h3>
          <span className="badge">{historial.length} registros</span>
        </div>

        {historial.length === 0 ? (
          <p className="vacio">Sin registros de producción.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="num">Cantidad</th>
                <th className="num">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((registro) => (
                <tr key={registro.id}>
                  <td>
                    {registro.nombre}
                    <div className="pagina-sub">{registro.codigo}</div>
                  </td>
                  <td className="num">{formatearPeso(registro.gramos)}</td>
                  <td className="num">{formatearFecha(registro.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default Produccion
