import React from 'react'
import type { Producto } from '@shared/types'
import { formatearMoneda, formatearPeso } from '@shared/money'

interface Props {
  productos: Producto[]
  onEditar: (producto: Producto) => void
  onEliminar: (producto: Producto) => void
  onDuplicar: (producto: Producto) => void
}

function claseStock(producto: Producto): string {
  const minimo = producto.unidad === 'PESO' ? 5000 : 5
  if (producto.stock <= 0) return 'badge agotado'
  if (producto.stock < minimo) return 'badge bajo'
  return 'badge ok'
}

function TablaProductos({ productos, onEditar, onEliminar, onDuplicar }: Props): React.JSX.Element {
  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th className="num">Precio</th>
          <th className="num">Stock</th>
          <th className="num">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {productos.map((producto) => (
          <tr key={producto.id}>
            <td>{producto.codigo}</td>
            <td>
              {producto.nombre}
              {producto.accesoRapido && <span className="badge tecla">{producto.accesoRapido}</span>}
            </td>
            <td className="num">
              {formatearMoneda(producto.precio)}
              {producto.unidad === 'PESO' && <span className="pagina-sub"> /kg</span>}
            </td>
            <td className="num">
              <span className={claseStock(producto)}>
                {producto.unidad === 'PESO' ? formatearPeso(producto.stock) : producto.stock}
              </span>
            </td>
            <td className="num">
              <div className="acciones fin">
                <button type="button" onClick={() => onEditar(producto)}>
                  Editar
                </button>
                <button type="button" onClick={() => onDuplicar(producto)}>
                  Duplicar
                </button>
                <button type="button" className="peligro" onClick={() => onEliminar(producto)}>
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TablaProductos
