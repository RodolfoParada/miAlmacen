# miAlmacen

Punto de venta e inventario de escritorio para almacenes. Guarda el stock,
descuenta existencias al vender, genera e imprime códigos de barras
personalizados y funciona con cualquier lector láser (teclado HID).

Stack: **Electron + React + TypeScript** (empaquetado con electron-vite y
electron-builder). La base de datos SQLite vive dentro de la aplicación.

## Requisitos

- Node.js 20+ y npm.
- Windows, macOS o Linux (x64/arm64).

## Instalación

```bash
npm install        # instala dependencias y recompila better-sqlite3
npm run dev        # modo desarrollo con recarga en caliente
```

`better-sqlite3` v13 usa *prebuilds* N-API por plataforma, por lo que no
necesita compilarse contra Electron; electron-builder los incluye al empaquetar.

## Uso

| Sección        | Qué hace                                                              |
| -------------- | --------------------------------------------------------------------- |
| **Venta**      | Escanea o busca productos, ajusta cantidades y cobra (descuenta stock).|
| **Inventario** | Alta/edición/duplicado/borrado de productos, búsqueda y selección por escaneo. |
| **Producción** | Registra lo fabricado por peso (ej. pan) para sumar stock.            |
| **Etiquetas**  | Vista previa de etiqueta y código de barras; genera códigos nuevos.    |
| **Historial**  | Lista de ventas con detalle y reimpresión de tickets.                  |

- El campo del lector acepta tanto el **código de barras** como el **nombre**
  del producto.
- Desde la barra lateral puedes **respaldar la base de datos** a un archivo
  `.db`.

### Productos por peso (ej. pan)

- En **Inventario**, al elegir el tipo *Por peso (kg)* el precio pasa a ser
  **por kilo** y el stock se ingresa en **kg** (se guarda internamente en gramos).
- En **Venta**, al agregar un producto por peso se abre un diálogo donde puedes
  escribir los **kilos** o directamente el **monto $**; cada uno calcula el otro.
- En **Producción** registras cuánto fabricaste (en kg) y se suma al stock.
- Cada producto puede tener un **acceso rápido** (`F1`–`F12`) que muestra un
  botón en Venta y se activa al presionar esa tecla.


### Códigos de barras

- 12–13 dígitos numéricos → se dibujan como **EAN-13**.
- Cualquier otro código → **Code128**.
- El botón *Generar* / *Nuevo código* crea códigos internos secuenciales
  (`P-000001`, …).

## Datos

La base de datos se guarda en el directorio de datos del usuario:

- Windows: `%APPDATA%/ScanPOS/pos_almacen.db`
- macOS: `~/Library/Application Support/ScanPOS/pos_almacen.db`
- Linux: `~/.config/ScanPOS/pos_almacen.db`

Puedes forzar otra ubicación con la variable de entorno `MIALMACEN_DB_PATH`.

## Compilar instaladores

```bash
npm run build           # typecheck + build de producción
npm run build:unpack    # paquete sin instalador (rápido, para probar)
npm run build:linux     # AppImage + .deb
npm run build:win       # instalador NSIS (.exe)  → requiere Windows o wine
npm run build:mac       # .dmg                    → requiere macOS
```

Los artefactos quedan en `dist/`. Por limitaciones de cada sistema operativo,
Windows y macOS deben compilarse en su propia plataforma (o en CI).

## Pruebas (smoke)

Cada fase tiene una prueba E2E headless que corre dentro de Electron:

```bash
npm run smoke         # capa de datos
npm run smoke:ipc     # IPC + preload
npm run smoke:ui      # layout y navegación
npm run smoke:inv     # inventario (CRUD)
npm run smoke:venta   # venta y descuento de stock
npm run smoke:scan    # lector láser / escaneo
npm run smoke:etq     # etiquetas y código de barras
npm run smoke:hist    # historial y tickets
npm run smoke:peso    # productos por peso y producción (capa de datos)
npm run smoke:pesoui  # venta por kg/$ y accesos rápidos (F1..F12)
npm run smoke:flow    # flujo completo: alta → escaneo → venta → etiqueta → ticket
npm run smoke:qa      # casos borde: duplicados, stock 0, respaldo
npm run smoke:all     # todas las anteriores (excepto flow/qa)
```

En Linux sin servidor gráfico puede requerirse `--no-sandbox` (ya incluido en
los scripts).

## Atajos

- **Enter** en el campo del lector agrega el producto (venta) o lo selecciona
  (inventario).
- **Enter** en el buscador del inventario selecciona el primer resultado.
- **F1–F12** en Venta agregan el producto con ese acceso rápido.
- **Enter** confirma y **Esc** cancela el diálogo de venta por peso.
