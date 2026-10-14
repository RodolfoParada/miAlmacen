import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Impresora } from '@shared/api'
import type { Venta } from '@shared/types'
import { formatearMoneda } from '@shared/money'
import api from '../lib/api'
import { formatearFecha } from '../lib/format'
import { generarTicketHtml } from '../lib/ticket'

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

function Historial(): React.JSX.Element {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [seleccionId, setSeleccionId] = useState<number | null>(null)
  const [impresoras, setImpresoras] = useState<Impresora[]>([])
  const [impresora, setImpresora] = useState('')
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)
  const [imprimiendo, setImprimiendo] = useState(false)

  const cargar = useCallback(async (): Promise<void> => {
    const lista = await api.historialVentas()
    setVentas(lista)
    setSeleccionId((actual) => actual ?? lista[0]?.id ?? null)
  }, [])

  useEffect(() => {
    void cargar()
    void (async () => {
      try {
        setImpresoras(await api.listarImpresoras())
      } catch {
        setImpresoras([])
      }
    })()
  }, [cargar])

  const seleccion = useMemo(
    () => ventas.find((v) => v.id === seleccionId) ?? null,
    [ventas, seleccionId]
  )

  const reimprimir = async (): Promise<void> => {
    if (!seleccion) return
    setMensaje(null)
    setImprimiendo(true)
    try {
      const html = generarTicketHtml(seleccion)
      const resultado = await api.imprimirTicket(html, {
        deviceName: impresora || undefined,
        silent: true
      })
      setMensaje(
        resultado.ok
          ? { tipo: 'ok', texto: `Ticket #${seleccion.id} enviado a la impresora` }
          : { tipo: 'error', texto: `No se pudo imprimir: ${resultado.error ?? 'desconocido'}` }
      )
    } catch (e) {
      setMensaje({ tipo: 'error', texto: (e as Error).message })
    } finally {
      setImprimiendo(false)
    }
  }

  const totalVendido = useMemo(
    () => ventas.reduce((acc, venta) => acc + venta.total, 0),
    [ventas]
  )

  return (
    <section className="pagina">
      <header className="pagina-header">
        <h2>Historial</h2>
        <p className="pagina-sub">
          {ventas.length} ventas · Total {formatearMoneda(totalVendido)}
        </p>
      </header>

      {mensaje && <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

      {ventas.length === 0 ? (
        <div className="panel">
          <p className="vacio">Todavía no hay ventas registradas.</p>
        </div>
      ) : (
        <div className="grid-2">
          <div className="panel">
            <div className="panel-header">
              <h3>Ventas</h3>
            </div>
            <table className="tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr
                    key={venta.id}
                    onClick={() => setSeleccionId(venta.id)}
                    style={{
                      cursor: 'pointer',
                      background: venta.id === seleccionId ? 'var(--bg-soft)' : undefined
                    }}
                  >
                    <td>{venta.id}</td>
                    <td>{formatearFecha(venta.fecha)}</td>
                    <td className="num">{formatearMoneda(venta.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            {seleccion ? (
              <>
                <div className="panel-header">
                  <h3>Ticket #{seleccion.id}</h3>
                  <span className="badge">{formatearFecha(seleccion.fecha)}</span>
                </div>
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="num">Cant.</th>
                      <th className="num">Precio</th>
                      <th className="num">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seleccion.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.nombre}
                          <div className="pagina-sub">{item.codigo}</div>
                        </td>
                        <td className="num">{item.cantidad}</td>
                        <td className="num">{formatearMoneda(item.precioUnitario)}</td>
                        <td className="num">{formatearMoneda(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="total-row">
                  <span>Total</span>
                  <span>{formatearMoneda(seleccion.total)}</span>
                </div>

                <div className="grid-form" style={{ marginTop: '0.9rem' }}>
                  <div className="campo">
                    <label>Impresora</label>
                    <select value={impresora} onChange={(e) => setImpresora(e.target.value)}>
                      <option value="">Predeterminada del sistema</option>
                      {impresoras.map((imp) => (
                        <option key={imp.name} value={imp.name}>
                          {imp.displayName || imp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="acciones fin" style={{ marginTop: '0.9rem' }}>
                  <button
                    type="button"
                    className="primario"
                    onClick={reimprimir}
                    disabled={imprimiendo}
                  >
                    {imprimiendo ? 'Imprimiendo…' : 'Reimprimir ticket'}
                  </button>
                </div>
              </>
            ) : (
              <p className="vacio">Selecciona una venta.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default Historial
