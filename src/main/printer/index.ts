import { BrowserWindow, type WebContents } from 'electron'
import type { Impresora, OpcionesImpresion, ResultadoImpresion } from '@shared/api'

async function conWebContents<T>(fn: (wc: WebContents) => Promise<T>): Promise<T> {
  const ventana = new BrowserWindow({ show: false })
  try {
    return await fn(ventana.webContents)
  } finally {
    ventana.destroy()
  }
}

export async function listarImpresoras(): Promise<Impresora[]> {
  const impresoras = await conWebContents((wc) => wc.getPrintersAsync())
  return impresoras.map((p) => ({
    name: p.name,
    displayName: p.displayName,
    description: p.description
  }))
}

export async function imprimirHtml(
  html: string,
  opciones?: OpcionesImpresion
): Promise<ResultadoImpresion> {
  const ventana = new BrowserWindow({ show: false, webPreferences: { sandbox: false } })
  try {
    await ventana.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))

    return await new Promise<ResultadoImpresion>((resolve) => {
      ventana.webContents.print(
        {
          silent: opciones?.silent ?? true,
          deviceName: opciones?.deviceName,
          landscape: opciones?.landscape ?? false,
          copies: opciones?.copies ?? 1,
          printBackground: true
        },
        (success, failureReason) => {
          resolve(success ? { ok: true } : { ok: false, error: failureReason })
        }
      )
    })
  } finally {
    ventana.destroy()
  }
}
