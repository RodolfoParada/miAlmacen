import React, { useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Inventario from './pages/Inventario'
import Venta from './pages/Venta'
import Etiquetas from './pages/Etiquetas'
import Historial from './pages/Historial'
import Produccion from './pages/Produccion'
import TitleBar from './components/TitleBar'
import api from './lib/api'

const secciones = [
  { to: '/inventario', label: 'Inventario' },
  { to: '/venta', label: 'Venta' },
  { to: '/produccion', label: 'Producción' },
  { to: '/etiquetas', label: 'Etiquetas' },
  { to: '/historial', label: 'Historial' }
]

function App(): React.JSX.Element {
  const [respaldo, setRespaldo] = useState<string | null>(null)

  const respaldar = async (): Promise<void> => {
    setRespaldo('Guardando…')
    try {
      const resultado = await api.respaldarBaseDeDatos()
      if (resultado.ok) {
        setRespaldo(`Respaldo guardado en ${resultado.ruta}`)
      } else if (resultado.cancelado) {
        setRespaldo(null)
      } else {
        setRespaldo(`Error: ${resultado.error ?? 'desconocido'}`)
      }
    } catch (e) {
      setRespaldo(`Error: ${(e as Error).message}`)
    }
  }

  return (
    <div className="ventana">
      <TitleBar />
      <div className="app">
        <aside className="sidebar">
          <nav className="nav">
            {secciones.map((seccion) => (
              <NavLink
                key={seccion.to}
                to={seccion.to}
                className={({ isActive }) => (isActive ? 'nav-link activo' : 'nav-link')}
              >
                {seccion.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button type="button" className="respaldar" onClick={respaldar}>
              Respaldar BD
            </button>
            {respaldo && <p className="respaldar-msg">{respaldo}</p>}
            <span className="sidebar-tag">POS · Inventario</span>
          </div>
        </aside>

        <main className="contenido">
          <Routes>
            <Route path="/" element={<Navigate to="/venta" replace />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/venta" element={<Venta />} />
            <Route path="/produccion" element={<Produccion />} />
            <Route path="/etiquetas" element={<Etiquetas />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="*" element={<Navigate to="/venta" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
