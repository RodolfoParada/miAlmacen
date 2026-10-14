import React, { useEffect, useRef, useState } from 'react'
import type { GuardarProductoInput } from '@shared/api'
import type { Producto, Unidad } from '@shared/types'
import { aCentavos, aGramos, aKg, aUnidades } from '@shared/money'

interface Props {
  producto: Producto | null
  plantilla?: Producto | null
  codigoInicial?: string | null
  onGuardar: (datos: GuardarProductoInput) => Promise<void>
  onCancelar: () => void
  onGenerarCodigo: () => Promise<string>
}

const ATAJOS = ['', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']

function ProductoForm({
  producto,
  plantilla = null,
  codigoInicial = null,
  onGuardar,
  onCancelar,
  onGenerarCodigo
}: Props): React.JSX.Element {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [unidad, setUnidad] = useState<Unidad>('UNIDAD')
  const [precio, setPrecio] = useState('0')
  const [stock, setStock] = useState('0')
  const [accesoRapido, setAccesoRapido] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const nombreRef = useRef<HTMLInputElement>(null)

  const esPeso = unidad === 'PESO'

  useEffect(() => {
    if (producto) {
      setCodigo(producto.codigo)
      setNombre(producto.nombre)
      setUnidad(producto.unidad)
      setPrecio(String(aUnidades(producto.precio)))
      setStock(producto.unidad === 'PESO' ? String(aKg(producto.stock)) : String(producto.stock))
      setAccesoRapido(producto.accesoRapido ?? '')
      setError(null)
      return
    }

    if (plantilla) {
      setCodigo('')
      setNombre(`${plantilla.nombre} (copia)`)
      setUnidad(plantilla.unidad)
      setPrecio(String(aUnidades(plantilla.precio)))
      setStock(
        plantilla.unidad === 'PESO' ? String(aKg(plantilla.stock)) : String(plantilla.stock)
      )
      setAccesoRapido('')
      setError(null)
      nombreRef.current?.focus()
      return
    }

    setCodigo(codigoInicial ?? '')
    setNombre('')
    setUnidad('UNIDAD')
    setPrecio('0')
    setStock('0')
    setAccesoRapido('')
    setError(null)

    if (codigoInicial) {
      nombreRef.current?.focus()
    }
  }, [producto, plantilla, codigoInicial])

  const cambiarUnidad = (valor: Unidad): void => {
    setUnidad(valor)
    setStock('0')
  }

  const submit = async (evento: React.FormEvent): Promise<void> => {
    evento.preventDefault()
    setError(null)

    const precioNum = Number(precio)
    const stockNum = Number(stock)

    if (!codigo.trim()) {
      setError('El código es obligatorio')
      return
    }
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (Number.isNaN(precioNum) || precioNum < 0) {
      setError(esPeso ? 'Precio por kilo inválido' : 'Precio inválido')
      return
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError(esPeso ? 'El stock (kg) debe ser mayor o igual a 0' : 'El stock debe ser un entero mayor o igual a 0')
      return
    }
    if (!esPeso && !Number.isInteger(stockNum)) {
      setError('El stock debe ser un entero mayor o igual a 0')
      return
    }

    try {
      setGuardando(true)
      await onGuardar({
        id: producto?.id,
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        precio: aCentavos(precioNum),
        stock: esPeso ? aGramos(stockNum) : stockNum,
        unidad,
        accesoRapido: accesoRapido || null
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  const generar = async (): Promise<void> => {
    setCodigo(await onGenerarCodigo())
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel-header">
        <h3>{producto ? `Editar: ${producto.nombre}` : 'Nuevo producto'}</h3>
        {!producto && codigoInicial && (
          <span className="badge">Código escaneado: {codigoInicial}</span>
        )}
      </div>

      {error && <div className="mensaje error">{error}</div>}

      <div className="grid-form">
        <div className="campo">
          <label>Código de barras</label>
          <div className="acciones">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Escanea o escribe"
            />
            <button type="button" onClick={generar}>
              Generar
            </button>
          </div>
        </div>
        <div className="campo">
          <label>Nombre</label>
          <input
            ref={nombreRef}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Tipo</label>
          <select value={unidad} onChange={(e) => cambiarUnidad(e.target.value as Unidad)}>
            <option value="UNIDAD">Por unidad</option>
            <option value="PESO">Por peso (kg)</option>
          </select>
        </div>
        <div className="campo">
          <label>{esPeso ? 'Precio por kilo' : 'Precio'}</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>{esPeso ? 'Stock (kg)' : 'Stock'}</label>
          <input
            type="number"
            step={esPeso ? '0.001' : '1'}
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Acceso rápido</label>
          <select value={accesoRapido} onChange={(e) => setAccesoRapido(e.target.value)}>
            {ATAJOS.map((tecla) => (
              <option key={tecla} value={tecla}>
                {tecla || '— Sin atajo —'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {esPeso && (
        <p className="pagina-sub" style={{ marginTop: '0.75rem' }}>
          Producto que fabricás y vendés por kilo (el stock se guarda en gramos).
        </p>
      )}

      <div className="acciones fin" style={{ marginTop: '0.9rem' }}>
        {producto && (
          <button type="button" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="submit" className="primario" disabled={guardando}>
          {producto ? 'Guardar cambios' : 'Agregar producto'}
        </button>
      </div>
    </form>
  )
}

export default ProductoForm
