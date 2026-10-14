import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { GuardarProductoInput } from '@shared/api'
import type { Producto } from '@shared/types'
import api from '../lib/api'
import ProductoForm from '../components/ProductoForm'
import TablaProductos from '../components/TablaProductos'
import { useScanner } from '../hooks/useScanner'

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

function Inventario(): React.JSX.Element {
  const [productos, setProductos] = useState<Producto[]>([])
  const [filtro, setFiltro] = useState('')
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null)
  const [plantilla, setPlantilla] = useState<Producto | null>(null)
  const [codigoNuevo, setCodigoNuevo] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  const cargar = useCallback(async (): Promise<void> => {
    setProductos(await api.listarProductos())
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    if (!q) return productos
    return productos.filter(
      (p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
    )
  }, [productos, filtro])

  const guardar = async (datos: GuardarProductoInput): Promise<void> => {
    await api.guardarProducto(datos)
    await cargar()
    setSeleccionado(null)
    setPlantilla(null)
    setCodigoNuevo(null)
    setMensaje({ tipo: 'ok', texto: datos.id ? 'Producto actualizado' : 'Producto agregado' })
  }

  const seleccionar = (producto: Producto | null): void => {
    setSeleccionado(producto)
    setPlantilla(null)
    setCodigoNuevo(null)
  }

  const duplicar = (producto: Producto): void => {
    setSeleccionado(null)
    setCodigoNuevo(null)
    setPlantilla(producto)
    setMensaje({
      tipo: 'ok',
      texto: `Duplicando "${producto.nombre}". Asigna un nuevo código y ajusta lo que necesites.`
    })
  }

  const eliminar = async (producto: Producto): Promise<void> => {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"?`)) return
    try {
      await api.eliminarProducto(producto.id)
      if (seleccionado?.id === producto.id) seleccionar(null)
      await cargar()
      setMensaje({ tipo: 'ok', texto: 'Producto eliminado' })
    } catch (e) {
      setMensaje({ tipo: 'error', texto: (e as Error).message })
    }
  }

  useScanner({
    onCodigo: (codigo) => {
      const encontrado = productos.find((p) => p.codigo === codigo)
      if (encontrado) {
        setFiltro('')
        setCodigoNuevo(null)
        setPlantilla(null)
        setSeleccionado(encontrado)
        setMensaje({ tipo: 'ok', texto: `Editando "${encontrado.nombre}"` })
      } else {
        setFiltro('')
        setSeleccionado(null)
        setPlantilla(null)
        setCodigoNuevo(codigo)
        setMensaje({
          tipo: 'ok',
          texto: `Código ${codigo} nuevo. Completa nombre, precio y stock y guarda.`
        })
      }
    }
  })

  return (
    <section className="pagina">
      <header className="pagina-header">
        <h2>Inventario</h2>
        <p className="pagina-sub">{productos.length} productos registrados</p>
      </header>

      {mensaje && <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

      <ProductoForm
        producto={seleccionado}
        plantilla={plantilla}
        codigoInicial={codigoNuevo}
        onGuardar={guardar}
        onCancelar={() => seleccionar(null)}
        onGenerarCodigo={() => api.generarCodigo()}
      />

      <div className="panel">
        <div className="panel-header">
          <h3>Listado</h3>
          <input
            style={{ maxWidth: 280 }}
            placeholder="Buscar por código o nombre"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtrados.length > 0) {
                seleccionar(filtrados[0])
              }
            }}
          />
        </div>

        {filtrados.length === 0 ? (
          <p className="vacio">No hay productos que mostrar.</p>
        ) : (
          <TablaProductos
            productos={filtrados}
            onEditar={seleccionar}
            onDuplicar={duplicar}
            onEliminar={eliminar}
          />
        )}
      </div>
    </section>
  )
}

export default Inventario
