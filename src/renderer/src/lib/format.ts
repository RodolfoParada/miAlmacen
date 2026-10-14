export function formatearFecha(fecha: string): string {
  const date = new Date(fecha.replace(' ', 'T') + 'Z')
  if (Number.isNaN(date.getTime())) return fecha
  return date.toLocaleString('es-CL')
}
