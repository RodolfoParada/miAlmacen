import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { registrarIpc } from '../src/main/ipc'

const dbPath = join(tmpdir(), `mialmacen-flow-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

const preload = join(process.cwd(), 'out/preload/index.js')
const indexHtml = join(process.cwd(), 'out/renderer/index.html')

const script = `
(async () => {
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
  const setValor = (el, valor) => {
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement : HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value').set
    setter.call(el, valor)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
  const resultado = {}

  // 1. ALTA (UI Inventario)
  location.hash = '#/inventario'
  await esperar(400)
  const form = document.querySelector('form.panel')
  const [inCodigo, inNombre, inPrecio, inStock] = form.querySelectorAll('input')
  setValor(inCodigo, 'FLOW-1')
  setValor(inNombre, 'Producto Flujo')
  setValor(inPrecio, '2500')
  setValor(inStock, '5')
  form.requestSubmit()
  await esperar(500)
  resultado.alta = [...document.querySelectorAll('.tabla tbody tr')].some((tr) =>
    tr.textContent.includes('Producto Flujo')
  )

  // 2. ESCANEO + VENTA (UI Venta)
  location.hash = '#/venta'
  await esperar(400)
  const scan = document.querySelector('.scanner input')
  setValor(scan, 'FLOW-1')
  document.querySelector('.scanner').requestSubmit()
  await esperar(300)
  resultado.enCarrito = [...document.querySelectorAll('.tabla tbody tr')].some((tr) =>
    tr.textContent.includes('Producto Flujo')
  )
  resultado.totalCarrito = document.querySelector('.total-row span:last-child')?.textContent

  const cobrar = [...document.querySelectorAll('button')].find(
    (b) => b.textContent.trim() === 'Cobrar'
  )
  cobrar.click()
  await esperar(600)
  resultado.venta = document.querySelector('.mensaje')?.textContent
  resultado.stockTrasVenta = (await window.api.buscarProducto('FLOW-1'))?.stock

  // 3. ETIQUETA (UI Etiquetas)
  location.hash = '#/etiquetas'
  await esperar(500)
  const selectProducto = document.querySelector('.grid-2 select')
  const opcion = [...selectProducto.options].find((o) => o.textContent.includes('FLOW-1'))
  setValor(selectProducto, opcion.value)
  await esperar(400)
  resultado.barrasEtiqueta = document.querySelector('.etiqueta-preview svg')?.innerHTML.length ?? 0

  // 4. TICKET (UI Historial)
  location.hash = '#/historial'
  await esperar(500)
  resultado.ventasHistorial = document.querySelectorAll('.grid-2 .panel:first-child .tabla tbody tr').length
  resultado.detalleTicket = [...document.querySelectorAll('.grid-2 .panel:nth-child(2) .tabla tbody tr')]
    .map((tr) => tr.children[0].textContent.trim())

  return resultado
})()
`

app.whenReady().then(async () => {
  registrarIpc()
  const win = new BrowserWindow({ show: false, webPreferences: { preload, sandbox: false } })

  try {
    await win.loadFile(indexHtml)
    const resultado = await win.webContents.executeJavaScript(script)
    console.log('FLOW_RESULT', JSON.stringify(resultado))
  } catch (e) {
    console.error('FLOW_ERROR', e)
    app.exit(1)
    return
  }

  for (const sufijo of ['', '-wal', '-shm']) {
    try {
      rmSync(dbPath + sufijo)
    } catch {
      /* ignore */
    }
  }
  app.exit(0)
})
