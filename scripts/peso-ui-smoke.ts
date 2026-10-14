import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { registrarIpc } from '../src/main/ipc'

const dbPath = join(tmpdir(), `mialmacen-pesoui-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

const preload = join(process.cwd(), 'out/preload/index.js')
const indexHtml = join(process.cwd(), 'out/renderer/index.html')

const script = `
(async () => {
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
  const setVal = (el, v) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  await window.api.guardarProducto({
    codigo: 'PAN-1', nombre: 'Marraqueta', precio: 180000, stock: 0,
    unidad: 'PESO', accesoRapido: 'F2'
  })
  const pan = await window.api.buscarProducto('PAN-1')
  await window.api.registrarProduccion(pan.id, 10000)

  await window.api.guardarProducto({
    codigo: 'UNI-1', nombre: 'Bebida', precio: 150000, stock: 5,
    unidad: 'UNIDAD', accesoRapido: 'F1'
  })

  // remonta la vista para que cargue los productos recién creados
  location.hash = '#/inventario'
  await esperar(200)
  location.hash = '#/venta'
  await esperar(500)

  const accesos = [...document.querySelectorAll('.acceso')].map((b) => b.textContent)
  const allProd = (await window.api.listarProductos()).map((p) => ({
    c: p.codigo,
    ar: p.accesoRapido,
    u: p.unidad
  }))

  // F2 abre el diálogo de peso del pan
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }))
  await esperar(200)
  const modalAbierto = !!document.querySelector('.modal')

  // ingresa 0,5 kg
  setVal(document.querySelector('.modal input'), '0.5')
  await esperar(150)
  const resumen = document.querySelector('.peso-resumen')?.textContent
  const btn = document.querySelector('.modal .primario')
  const btnExiste = !!btn
  const btnDeshabilitado = btn ? btn.disabled : null
  btn && btn.click()
  await esperar(250)

  const filas = document.querySelectorAll('.tabla tbody tr').length
  const mensaje = document.querySelector('.mensaje')?.textContent
  const filaPan = document.querySelector('.tabla tbody tr')?.textContent
  const total = document.querySelector('.total-row span:last-child')?.textContent
  const stockAntesCobro = (await window.api.buscarProducto('PAN-1')).stock

  // cobra
  document.querySelector('.acciones.fin .primario').click()
  await esperar(400)
  const panTras = await window.api.buscarProducto('PAN-1')
  const historial = await window.api.historialProducciones()

  return {
    accesos,
    allProd,
    modalAbierto,
    resumen,
    btnExiste,
    btnDeshabilitado,
    filas,
    mensaje,
    filaPan,
    total,
    stockAntesCobro,
    stockTras: panTras.stock,
    prod: historial.length
  }
})()
`

app.whenReady().then(async () => {
  registrarIpc()
  const win = new BrowserWindow({ show: false, webPreferences: { preload, sandbox: false } })

  try {
    await win.loadFile(indexHtml)
    const resultado = await win.webContents.executeJavaScript(script)
    console.log('PESOUI_RESULT', JSON.stringify(resultado))
  } catch (e) {
    console.error('PESOUI_ERROR', e)
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
