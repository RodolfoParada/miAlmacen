import JsBarcode from 'jsbarcode'

export interface DatosEtiquetaHtml {
  codigo: string
  nombre: string
  precio?: number
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function svgCodigoBarras(codigo: string): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const formato = /^\d{12,13}$/.test(codigo) ? 'EAN13' : 'CODE128'
  try {
    JsBarcode(svg, codigo, {
      format: formato,
      width: 2,
      height: 60,
      displayValue: true,
      margin: 0,
      fontSize: 14
    })
  } catch {
    return ''
  }
  return svg.outerHTML
}

export function generarEtiquetaHtml(datos: DatosEtiquetaHtml): string {
  const precio = datos.precio != null ? `$${(datos.precio / 100).toFixed(2)}` : ''
  const barras = svgCodigoBarras(datos.codigo)

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: 50mm 30mm; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; }
  .etiqueta {
    width: 50mm;
    height: 30mm;
    padding: 2mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1mm;
    text-align: center;
    overflow: hidden;
  }
  .nombre { font-size: 9pt; font-weight: 700; line-height: 1.1; }
  .precio { font-size: 12pt; font-weight: 700; }
  svg { max-width: 46mm; }
</style>
</head>
<body>
  <div class="etiqueta">
    <div class="nombre">${escapar(datos.nombre)}</div>
    ${barras}
    ${precio ? `<div class="precio">${escapar(precio)}</div>` : ''}
  </div>
</body>
</html>`
}
