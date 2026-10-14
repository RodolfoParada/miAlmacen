import React, { useEffect, useState } from 'react'
import api from '../lib/api'

function TitleBar(): React.JSX.Element {
  const [maximizado, setMaximizado] = useState(false)

  useEffect(() => {
    void api.ventana.estaMaximizada().then(setMaximizado)
    return api.ventana.onCambioMaximizado(setMaximizado)
  }, [])

  return (
    <div className="titulo-barra" onDoubleClick={() => api.ventana.maximizar()}>
      <div className="titulo-arrastre">
        <span className="titulo-icono">▮</span>
        <span className="titulo-app">miAlmacen</span>
      </div>
      <div className="ventana-controles">
        <button type="button" aria-label="Minimizar" title="Minimizar" onClick={() => api.ventana.minimizar()}>
          &#x2013;
        </button>
        <button
          type="button"
          aria-label={maximizado ? 'Restaurar' : 'Maximizar'}
          title={maximizado ? 'Restaurar' : 'Maximizar'}
          onClick={() => api.ventana.maximizar()}
        >
          {maximizado ? '\u2750' : '\u25A1'}
        </button>
        <button
          type="button"
          className="cerrar"
          aria-label="Cerrar"
          title="Cerrar"
          onClick={() => api.ventana.cerrar()}
        >
          &#x2715;
        </button>
      </div>
    </div>
  )
}

export default TitleBar
