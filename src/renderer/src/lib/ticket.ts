import type { Venta } from '@shared/types'
import { formatearMoneda } from '@shared/money'
import { formatearFecha } from './format'

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function generarTicketHtml(venta: Venta): string {
  const lineas = venta.items
    .map(
      (item) => `
      <tr>
        <td class="cant">${item.cantidad}×</td>
        <td class="nom">${escapar(item.nombre)}</td>
        <td class="sub">${formatearMoneda(item.subtotal)}</td>
      </tr>`
    )
    .join('')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Courier New', monospace; font-size: 11pt; color: #000; }
  .ticket { width: 72mm; }
  .centro { text-align: center; }
  h1 { font-size: 14pt; margin: 0 0 2mm; }
  .meta { font-size: 9pt; margin-bottom: 3mm; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 0.5mm 0; }
  .cant { width: 8mm; }
  .sub { text-align: right; white-space: nowrap; }
  .sep { border-top: 1px dashed #000; margin: 2mm 0; }
  .total { display: flex; justify-content: space-between; font-size: 13pt; font-weight: 700; }
  .pie { text-align: center; font-size: 9pt; margin-top: 4mm; }
</style>
</head>
<body>
  <div class="ticket">
    <h1 class="centro">miAlmacen</h1>
    <div class="meta centro">
      Ticket #${venta.id}<br />
      ${escapar(formatearFecha(venta.fecha))}
    </div>
    <div class="sep"></div>
    <table>
      ${lineas}
    </table>
    <div class="sep"></div>
    <div class="total"><span>TOTAL</span><span>${formatearMoneda(venta.total)}</span></div>
    <div class="pie">¡Gracias por su compra!</div>
  </div>
</body>
</html>`
}
