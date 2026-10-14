import React, { useEffect, useMemo, useState } from 'react'
import type { Impresora } from '@shared/api'
import type { Producto } from '@shared/types'
import { formatearMoneda } from '@shared/money'
import api from '../lib/api'
import Barcode from '../components/Barcode'
import { generarEtiquetaHtml } from '../lib/etiqueta'

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

function Etiquetas(): React.JSX.Element {
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoId, setProductoId] = useState<number | ''>('')
  const [codigo, setCodigo] = useState('')
  const [impresoras, setImpresoras] = useState<Impresora[]>([])
  const [impresora, setImpresora] = useState('')
  const [copias, setCopias] = useState(1)
  const [imprimiendo, setImprimiendo] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  const producto = useMemo(
    () => productos.find((p) => p.id === productoId) ?? null,
    [productos, productoId]
  )

  useEffect(() => {
    void (async () => {
      setProductos(await api.listarProductos())
      try {
        setImpresoras(await api.listarImpresoras())
      } catch {
        setImpresoras([])
      }
    })()
  }, [])

  useEffect(() => {
    if (producto) setCodigo(producto.codigo)
  }, [producto])

  const nuevoCodigo = async (): Promise<void> => {
    setCodigo(await api.generarCodigo())
  }

  const imprimir = async (): Promise<void> => {
    if (!codigo.trim()) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un producto o define un código' })
      return
    }
    setMensaje(null)
    setImprimiendo(true)
    try {
      const html = generarEtiquetaHtml({
        codigo: codigo.trim(),
        nombre: producto?.nombre ?? codigo.trim(),
        precio: producto?.precio
      })
      const resultado = await api.imprimirEtiqueta(html, {
        deviceName: impresora || undefined,
        copies: copias,
        silent: true
      })
      setMensaje(
        resultado.ok
          ? { tipo: 'ok', texto: 'Etiqueta enviada a la impresora' }
          : { tipo: 'error', texto: `No se pudo imprimir: ${resultado.error ?? 'desconocido'}` }
      )
    } catch (e) {
      setMensaje({ tipo: 'error', texto: (e as Error).message })
    } finally {
      setImprimiendo(false)
    }
  }

  return (
    <section className="pagina">
      <header className="pagina-header">
        <h2>Etiquetas</h2>
        <p className="pagina-sub">Genera códigos de barras y imprime etiquetas.</p>
      </header>

      {mensaje && <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="grid-2">
        <div>
          <div className="panel">
            <div className="panel-header">
              <h3>Producto</h3>
            </div>
            <div className="campo">
              <label>Seleccionar producto</label>
              <select
                value={productoId}
                onChange={(e) =>
                  setProductoId(e.target.value === '' ? '' : Number(e.target.value))
                }
              >
                <option value="">— Etiqueta libre —</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.codigo})
                  </option>
                ))}
              </select>
            </div>
            <div className="campo" style={{ marginTop: '0.75rem' }}>
              <label>Código de barras</label>
              <div className="acciones">
                <input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                <button type="button" onClick={nuevoCodigo}>
                  Nuevo código
                </button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Impresión</h3>
            </div>
            <div className="grid-form">
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
              <div className="campo">
                <label>Copias</label>
                <input
                  type="number"
                  min="1"
                  value={copias}
                  onChange={(e) => setCopias(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>
            <div className="acciones fin" style={{ marginTop: '0.9rem' }}>
              <button
                type="button"
                className="primario"
                onClick={imprimir}
                disabled={imprimiendo || !codigo.trim()}
              >
                {imprimiendo ? 'Imprimiendo…' : 'Imprimir etiqueta'}
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Vista previa</h3>
          </div>
          <div className="etiqueta-centro">
            <div className="etiqueta-preview">
              <div className="nombre">{producto?.nombre ?? codigo ?? 'Sin nombre'}</div>
              {codigo ? <Barcode value={codigo} alto={50} ancho={1.6} /> : null}
              {producto && <div className="precio">{formatearMoneda(producto.precio)}</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Etiquetas
