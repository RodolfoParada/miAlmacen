import type { Unidad } from './types'

export const aCentavos = (valor: number): number => Math.round(valor * 100)

export const aUnidades = (centavos: number): number => centavos / 100

export function formatearMoneda(centavos: number, locale = 'es-CL', simbolo = '$'): string {
  const numero = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(centavos / 100)
  return `${simbolo}${numero}`
}

export const aGramos = (kg: number): number => Math.round(kg * 1000)

export const aKg = (gramos: number): number => gramos / 1000

export function formatearPeso(gramos: number, locale = 'es-CL'): string {
  const numero = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(gramos / 1000)
  return `${numero} kg`
}

/** Subtotal de una línea: `precio` es por unidad o por kg según `unidad`. */
export const subtotalLinea = (unidad: Unidad, precio: number, cantidad: number): number =>
  unidad === 'PESO' ? Math.round((precio * cantidad) / 1000) : precio * cantidad

/** Gramos equivalentes a un monto de dinero, dado el precio por kg. */
export const gramosPorMonto = (monto: number, precioKg: number): number =>
  precioKg <= 0 ? 0 : Math.round((monto * 1000) / precioKg)
