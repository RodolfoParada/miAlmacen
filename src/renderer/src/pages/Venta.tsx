import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Producto } from '@shared/types'
import { aKg, formatearMoneda, formatearPeso, subtotalLinea } from '@shared/money'
import api from '../lib/api'
import { useCarrito } from '../hooks/useCarrito'
import ScannerInput from '../components/ScannerInput'
import DialogoPeso from '../components/DialogoPeso'

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

function Venta(): React.JSX.Element {
  const [productos, setProductos] = useState<Producto[]>([])
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)
  const [cobrando, setCobrando] = useState(false)
  const [pesoActivo, setPesoActivo] = useState<Producto | null>(null)
  const carrito = useCarrito()
  const navegar = useNavigate()

  const cargar = useCallback(async (): Promise<void> => {
    setProductos(await api.listarProductos())
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const agregarProducto = (producto: Producto): boolean => {
    if (producto.unidad === 'PESO') {
      setPesoActivo(producto)
      setMensaje(null)
      return true
    }
    const enCarrito = carrito.items.find((i) => i.producto.id === producto.id)?.cantidad ?? 0
    if (enCarrito + 1 > producto.stock) {
      setMensaje({
        tipo: 'error',
        texto: `Sin stock suficiente de ${producto.nombre} (disponible: ${producto.stock})`
      })
      return false
    }
    carrito.agregar(producto, 1)
    setMensaje(null)
    return true
  }

  const agregarPeso = (gramos: number): void => {
    if (!pesoActivo) return
    const enCarrito = carrito.items.find((i) => i.producto.id === pesoActivo.id)?.cantidad ?? 0
    if (enCarrito + gramos > pesoActivo.stock) {
      setMensaje({ tipo: 'error', texto: `Stock insuficiente de ${pesoActivo.nombre}` })
      setPesoActivo(null)
      return
    }
    carrito.agregar(pesoActivo, gramos)
    setPesoActivo(null)
    setMensaje({ tipo: 'ok', texto: `${formatearPeso(gramos)} de ${pesoActivo.nombre} agregado` })
  }

  const agregarPorTexto = (texto: string): void => {
    const q = texto.trim()
    if (!q) return

    let producto = productos.find((p) => p.codigo === q)
    if (!producto) {
      const coincidencias = productos.filter(
        (p) => p.nombre.toLowerCase().includes(q.toLowerCase()) || p.codigo.includes(q)
      )
      if (coincidencias.length > 1) {
        setMensaje({ tipo: 'error', texto: 'Varios productos coinciden, sé más específico' })
        return
      }
      producto = coincidencias[0]
    }

    if (!producto) {
      setMensaje({ tipo: 'error', texto: `Producto "${q}" no encontrado` })
      return
    }

    agregarProducto(producto)
  }

  const accesos = useMemo(
    () =>
      productos
        .filter((p) => p.accesoRapido)
        .sort((a, b) => (a.accesoRapido as string).localeCompare(b.accesoRapido as string)),
    [productos]
  )

  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent): void => {
      if (pesoActivo) return
      const atajo = accesos.find((p) => p.accesoRapido === evento.key)
      if (atajo) {
        evento.preventDefault()
        agregarProducto(atajo)
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accesos, pesoActivo, carrito.items])

  const cobrar = async (): Promise<void> => {
    if (carrito.items.length === 0) return
    setCobrando(true)
    setMensaje(null)
    try {
      const resultado = await api.ejecutarVenta(carrito.aItemsVenta())
      carrito.limpiar()
      await cargar()
      setMensaje({ tipo: 'ok', texto: `Venta #${resultado.ventaId} registrada correctamente` })
    } catch (e) {
      setMensaje({ tipo: 'error', texto: (e as Error).message })
    } finally {
      setCobrando(false)
    }
  }

  return (
    <section className="pagina">
      <header className="pagina-header">
        <h2>Venta</h2>
        <p className="pagina-sub">Escanea o busca un producto y agrégalo al carrito.</p>
      </header>

      {mensaje && <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="panel">
        <div className="acciones">
          <ScannerInput
            onCodigo={agregarPorTexto}
            placeholder="Código de barras o nombre del producto"
          />
          <button type="button" onClick={() => navegar('/historial')}>
            Ver historial
          </button>
        </div>
      </div>

      {accesos.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3>Accesos rápidos</h3>
            <span className="badge">Teclas F</span>
          </div>
          <div className="accesos">
            {accesos.map((p) => (
              <button
                key={p.id}
                type="button"
                className="acceso"
                onClick={() => agregarProducto(p)}
              >
                <span className="tecla-badge">{p.accesoRapido}</span>
                <span className="acceso-nombre">{p.nombre}</span>
                <span className="acceso-precio">
                  {formatearMoneda(p.precio)}
                  {p.unidad === 'PESO' ? ' /kg' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <h3>Carrito</h3>
          <span className="badge">{carrito.cantidadTotal} ítems</span>
        </div>

        {carrito.items.length === 0 ? (
          <p className="vacio">Carrito vacío. Escanea un producto para comenzar.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="num">Precio</th>
                <th className="num">Cantidad</th>
                <th className="num">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carrito.items.map((item) => {
                const esPeso = item.producto.unidad === 'PESO'
                return (
                  <tr key={item.producto.id}>
                    <td>
                      {item.producto.nombre}
                      <div className="pagina-sub">{item.producto.codigo}</div>
                    </td>
                    <td className="num">
                      {formatearMoneda(item.producto.precio)}
                      {esPeso ? ' /kg' : ''}
                    </td>
                    <td className="num">
                      {esPeso ? (
                        <div className="qty">
                          <input
                            className="cantidad-campo"
                            type="number"
                            step="0.001"
                            min="0"
                            value={aKg(item.cantidad)}
                            onChange={(e) =>
                              carrito.cambiarCantidad(
                                item.producto.id,
                                Math.round(Number(e.target.value.replace(',', '.')) * 1000)
                              )
                            }
                          />
                          <span className="pagina-sub">kg</span>
                        </div>
                      ) : (
                        <div className="qty">
                          <button
                            type="button"
                            onClick={() =>
                              carrito.cambiarCantidad(item.producto.id, item.cantidad - 1)
                            }
                          >
                            −
                          </button>
                          <input
                            className="cantidad-campo"
                            type="number"
                            min="0"
                            value={item.cantidad}
                            onChange={(e) =>
                              carrito.cambiarCantidad(item.producto.id, Number(e.target.value))
                            }
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (item.cantidad + 1 > item.producto.stock) {
                                setMensaje({
                                  tipo: 'error',
                                  texto: `Sin stock suficiente de ${item.producto.nombre}`
                                })
                              } else {
                                carrito.cambiarCantidad(item.producto.id, item.cantidad + 1)
                              }
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="num">
                      {formatearMoneda(
                        subtotalLinea(item.producto.unidad, item.producto.precio, item.cantidad)
                      )}
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        className="peligro"
                        onClick={() => carrito.quitar(item.producto.id)}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div className="total-row">
          <span>Total</span>
          <span>{formatearMoneda(carrito.total)}</span>
        </div>

        <div className="acciones fin" style={{ marginTop: '0.9rem' }}>
          <button
            type="button"
            onClick={() => carrito.limpiar()}
            disabled={carrito.items.length === 0}
          >
            Vaciar
          </button>
          <button
            type="button"
            className="primario"
            onClick={cobrar}
            disabled={carrito.items.length === 0 || cobrando}
          >
            {cobrando ? 'Cobrando…' : 'Cobrar'}
          </button>
        </div>
      </div>

      {pesoActivo && (
        <DialogoPeso
          producto={pesoActivo}
          onConfirmar={agregarPeso}
          onCancelar={() => setPesoActivo(null)}
        />
      )}
    </section>
  )
}

export default Venta
