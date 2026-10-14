import { app, BrowserWindow } from 'electron'
import { join } from 'path'

const preload = join(process.cwd(), 'out/preload/index.js')
const indexHtml = join(process.cwd(), 'out/renderer/index.html')

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { preload, sandbox: false } })

  try {
    await win.loadFile(indexHtml)
    const resultado = await win.webContents.executeJavaScript(`
      (async () => {
        const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
        await esperar(300)
        const navs = [...document.querySelectorAll('.nav-link')].map((a) => a.textContent)
        const inicial = document.querySelector('.pagina h2')?.textContent
        location.hash = '#/inventario'
        await esperar(200)
        const inventario = document.querySelector('.pagina h2')?.textContent
        location.hash = '#/historial'
        await esperar(200)
        const historial = document.querySelector('.pagina h2')?.textContent
        return { navs, inicial, inventario, historial }
      })()
    `)
    console.log('UI_RESULT', JSON.stringify(resultado))
  } catch (e) {
    console.error('UI_ERROR', e)
    app.exit(1)
    return
  }

  app.exit(0)
})
