import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { registrarIpc } from '../src/main/ipc'

const dbPath = join(tmpdir(), `mialmacen-venta-${Date.now()}.db`)
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
  const filasCarrito = () =>
    [...document.querySelectorAll('.tabla tbody tr')].map((tr) =>
      [...tr.children].map((td) => td.textContent.trim())
    )

  await window.api.guardarProducto({ codigo: 'V-1', nombre: 'Galleta', precio: 500, stock: 4 })

  location.hash = '#/venta'
  await esperar(400)

  const buscador = document.querySelector('.scanner input')
  const enviar = () => document.querySelector('.scanner').requestSubmit()
  setVal(buscador, 'V-1')
  await esperar(60)
  enviar()
  await esperar(300)
  const carrito1 = filasCarrito()
  const total1 = document.querySelector('.total-row span:last-child')?.textContent

  setVal(buscador, 'V-1')
  await esperar(60)
  enviar()
  await esperar(200)
  const total2 = document.querySelector('.total-row span:last-child')?.textContent

  const cobrar = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Cobrar')
  cobrar.click()
  await esperar(500)

  const mensaje = document.querySelector('.mensaje')?.textContent
  const stockRestante = (await window.api.buscarProducto('V-1'))?.stock
  const ventas = (await window.api.historialVentas()).length

  return { carrito1, total1, total2, mensaje, stockRestante, ventas }
})()
`

app.whenReady().then(async () => {
  registrarIpc()
  const win = new BrowserWindow({ show: false, webPreferences: { preload, sandbox: false } })

  try {
    await win.loadFile(indexHtml)
    const resultado = await win.webContents.executeJavaScript(script)
    console.log('VENTA_RESULT', JSON.stringify(resultado))
  } catch (e) {
    console.error('VENTA_ERROR', e)
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
