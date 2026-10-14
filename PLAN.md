# PLAN.md — miAlmacen

Plan de implementación del sistema de almacén/POS descrito en `CLAUDE.md` y `SPEC.md`.

## Objetivo

Aplicación de escritorio (Electron + React + TypeScript) para:
- Gestionar inventario (productos, stock).
- Vender y **descontar stock** automáticamente en una transacción.
- Generar e imprimir **códigos de barras** personalizados o usar el del producto.
- Escanear con **pistola láser** para inventario y venta.
- Funcionar en **Windows, macOS y Linux**.
- Usar una base de datos **SQLite local** (`better-sqlite3`).

## Stack ya instalado

- electron `44`, electron-vite `5`, vite `7`, `@vitejs/plugin-react` `5`
- react `19`, typescript `7`, electron-builder
- Estructura: `src/main`, `src/preload`, `src/renderer`

## Dependencias a agregar

```bash
npm i better-sqlite3 jsbarcode
npm i -D @types/better-sqlite3 @types/jsbarcode
# opcional
npm i react-router-dom zod
```

Notas:
- `better-sqlite3` es un **módulo nativo**: debe recompilarse contra Electron.
  Agregar `"postinstall": "electron-builder install-app-deps"` y mantener
  `externalizeDepsPlugin()` en `electron.vite.config.ts` (ya está).
- `jsbarcode` requiere `@types/jsbarcode`.

---

## Decisiones de diseño

1. **Ubicación de la BD.** `CLAUDE.md` dice "dentro del proyecto"; `SPEC.md` usa
   `app.getPath('userData')`. Decisión: usar `userData` (obligatorio en apps
   empaquetadas porque el directorio de instalación es de solo lectura).
   En desarrollo se puede sobreescribir con `MIALMACEN_DB_PATH` para tener el
   `.db` dentro del repo. `userData` sigue siendo "local" y dentro de la app.
2. **Dinero en centavos.** `precio`/`total`/`subtotal` se guardan como `INTEGER`
   (centavos) para evitar errores de coma flotante.
3. **Seguridad.** `contextIsolation: true`, `sandbox: false`, `nodeIntegration`
   desactivado. Todo acceso a datos pasa por IPC (`contextBridge`).
4. **Tipos compartidos.** Una carpeta `src/shared` con tipos de dominio usada por
   main, preload y renderer.
5. **Precio de venta.** Se guarda el precio en `ventas_detalle` (histórico) para
   que cambios futuros de precio no alteren ventas pasadas.

---

## Estructura objetivo

```
src/
  shared/
    types.ts                # Producto, ItemVentaInput, Venta
    api.ts                  # contrato de window.api (IPC) + tipos de impresión
    money.ts                # conversión centavos <-> display
  main/
    index.ts                # arranque, ventana, registro de IPC
    db/
      index.ts              # conexión better-sqlite3 + esquema + migraciones
      productos.repo.ts     # CRUD productos
      ventas.repo.ts        # transacción de venta + historial
    ipc/
      productos.ts          # handlers db:buscar-producto, db:guardar-producto...
      ventas.ts             # handler db:ejecutar-venta
      printer.ts            # handler printer:imprimir-etiqueta / ticket
    printer/
      index.ts              # impresión silenciosa y listado de impresoras
  preload/
    index.ts                # contextBridge -> window.api tipado
    index.d.ts
  renderer/
    index.html
    src/
      main.tsx
      App.tsx               # layout + navegación
      lib/api.ts            # wrapper tipado de window.api
      hooks/useScanner.ts   # detección de pistola láser (keydown)
      hooks/useCarrito.ts
      components/
        Barcode.tsx         # <svg>/<canvas> con jsbarcode
        ScannerInput.tsx
        ProductoForm.tsx
        TablaProductos.tsx
      pages/
        Inventario.tsx
        Venta.tsx
        Etiquetas.tsx
        Historial.tsx
      assets/main.css
```

---

## Fases

### Fase 0 — Preparación
- [x] Instalar dependencias (SQLite, jsbarcode, router).
- [x] `postinstall` con `electron-builder install-app-deps`.
- [x] Crear `src/shared/types.ts` con los tipos de dominio.
- [x] Probar que `better-sqlite3` carga dentro de Electron (verificado con
      `npm run smoke`, que ejecuta la capa de datos dentro de Electron).
- **Criterio:** la app arranca y abre la BD sin errores en las 3 plataformas.
      *(La BD se probó en Electron/Linux; el empaquetado multiplataforma se
      valida en la Fase 9.)*

una vez terminada la Fase 0 actualizarla y comenzar con la siguiente sin preguntar.

### Fase 1 — Capa de datos (main)
- [x] `db/index.ts`: abrir DB en `userData` (+ override por env), `PRAGMA
      journal_mode = WAL`, `foreign_keys = ON`.
- [x] Esquema (`CREATE TABLE IF NOT EXISTS`) según `SPEC.md`:
      `productos`, `ventas`, `ventas_detalle` (con `precio_unitario`).
- [x] Repositorio `productos.repo.ts`: buscar por código, listar, crear,
      actualizar, ajustar stock.
- [x] Repositorio `ventas.repo.ts`: `procesarVenta` con `db.transaction` que
      inserta venta + detalle y **descuenta stock**.
- [x] Validación: no vender más que el stock disponible (rollback si falla).
- **Criterio:** tests manuales de venta descuentan stock y registran detalle.
      Verificado con `npm run smoke`.

una vez terminada la Fase 1 actualizarla y comenzar con la siguiente sin preguntar.

### Fase 2 — IPC + preload tipado
- [x] Handlers en `main/ipc/*` con `ipcMain.handle`:
      `db:buscar-producto`, `db:listar-productos`, `db:guardar-producto`,
      `db:ejecutar-venta`, `db:historial-ventas`, `printer:imprimir-etiqueta`,
      `printer:listar-impresoras`.
      (También `db:buscar-producto-id`, `db:eliminar-producto`,
      `db:ajustar-stock`, `db:obtener-venta`, `printer:imprimir-ticket`.)
- [x] `preload/index.ts` expone `window.api` (firmado con `Api` de
      `@shared/api`).
- [x] `lib/api.ts` en el renderer con tipos; `index.d.ts` actualizado.
- **Criterio:** `window.api.ping()`/búsquedas responden desde la UI.
      Verificado con `npm run smoke:ipc` (preload + handlers en una ventana
      real: guardar → buscar → vender (stock 5→3) → historial → ping).

una vez terminada la Fase 2 actualizarla y comenzar con la siguiente sin preguntar.

### Fase 3 — UI base
- [x] Layout con navegación: **Inventario / Venta / Etiquetas / Historial**
      (`HashRouter` + `NavLink`, layout sidebar + contenido).
- [x] Sistema de estilos (CSS propio con variables en `assets/main.css`).
- [x] Estado de carrito (`useCarrito`) y utilidades de dinero (`@shared/money`).
- **Criterio:** se puede navegar entre secciones. Verificado con
      `npm run smoke:ui` (carga el renderer construido y comprueba las rutas).

una vez terminada la Fase 3 actualizarla y comenzar con la siguiente sin preguntar.

### Fase 4 — Inventario (CRUD)
- [x] `TablaProductos` con búsqueda/filtro (por código o nombre).
- [x] `ProductoForm`: código, nombre, precio, stock (alta/edición).
- [x] Generar código interno automático (`P-000001`, `db:generar-codigo`).
- [x] Entrada por lector: escanear/escribir un código existente y pulsar
      `Enter` lo selecciona para editar (integración del hook en la Fase 6).
- **Criterio:** crear/editar/eliminar productos y ver el stock. Verificado con
      `npm run smoke:inv` (crear stock 7 → editar a 3 → eliminar).

una vez terminada la Fase 4 actualizarla y comenzar con la siguiente sin preguntar.

### Fase 5 — Punto de venta
- [x] `Venta.tsx`: escanear/buscar producto → agrega al carrito.
- [x] Control de cantidades (−/+, campo), subtotal y total.
- [x] Botón **Cobrar** → `api.ejecutarVenta(items)` (transacción).
- [x] Bloquear venta si no hay stock; refresca stock tras vender.
- **Criterio:** vender descuenta stock y crea la venta en el historial.
      Verificado con `npm run smoke:venta` (stock 4→3, venta #1).

una vez terminada la Fase 5 actualizarla y comenzar con la siguiente sin preguntar.

### Fase 6 — Lector de código de barras
- [x] `useScanner.ts`: buffer de `keydown`, umbral ~50 ms, terminador `Enter`
      → callback con el código (ignora el foco en campos editables).
- [x] `ScannerInput.tsx`: campo que emite el código al pulsar `Enter` y se
      limpia (distingue ráfaga láser de tecleo humano por el umbral temporal).
- [x] Usado en Venta (agrega al carrito) e Inventario (selecciona el producto
      escaneado para editar).
- **Criterio:** escanear agrega el producto correcto sin usar el mouse.
      Verificado con `npm run smoke:scan` (ráfaga `SCAN-1` + `Enter`).


una vez terminada la Fase 6 actualizarla y comenzar con la siguiente sin preguntar.

### Fase 7 — Códigos de barras e impresión
- [x] `Barcode.tsx` con `jsbarcode` (Code128 por defecto; EAN-13 para 12/13
      dígitos numéricos).
- [x] `Etiquetas.tsx`: vista previa de etiqueta (nombre, precio, código).
- [x] `printer/index.ts`: `webContents.print({ silent: true, ... })` para
      etiqueta/ticket + `printer:listar-impresoras`.
- [x] Reutilizar el código del producto o generar uno nuevo (`Nuevo código`).
- **Criterio:** imprimir una etiqueta con código escaneable por el láser.
      Verificado con `npm run smoke:etq` (SVG generado; flujo de impresión
      manejado; el entorno de prueba no tiene impresoras).

una vez terminada la Fase 7 actualizarla y comenzar con la siguiente sin preguntar.


### Fase 8 — Historial y tickets
- [x] `Historial.tsx`: lista de ventas con fecha/total y detalle por venta.
- [x] Ticket de venta (HTML 80mm) impreso con `print()` silencioso + selector
      de impresora.
- **Criterio:** ver y reimprimir una venta. Verificado con `npm run smoke:hist`.

una vez terminada la Fase 8 actualizarla y comenzar con la siguiente sin preguntar.

### Fase 9 — Empaquetado multiplataforma
- [x] `electron-builder.yml` alineado con `appId: com.almacen.pos`,
      `productName: ScanPOS`, targets `nsis` / `dmg` / `AppImage`+`deb`.
- [x] Icono (`build/icon.png` 512×512) y `build/entitlements.mac.plist`.
- [x] Probado `npm run build:unpack` y `npm run build:linux` (AppImage + deb
      generados, app empaquetada arranca). `build:win`/`build:mac` requieren
      Windows (o wine) y macOS respectivamente; documentado en el README.
- [x] `better-sqlite3` v13 usa prebuilds N-API por plataforma, que
      electron-builder deja descomprimidos en `app.asar.unpacked`; no requiere
      recompilar por ABI.
- **Criterio:** instaladores en las 3 plataformas → Linux verificado aquí;
      Windows/macOS desde su SO o CI.

una vez terminada la Fase 9 actualizarla y comenzar con la siguiente sin preguntar.

### Fase 10 — QA y documentación
- [x] Probar flujo completo: alta → escaneo → venta → etiqueta → ticket
      (`npm run smoke:flow`).
- [x] Casos borde: stock 0, código duplicado, respaldo de BD (`npm run smoke:qa`).
- [x] `README.md` con instalación, uso, atajos y empaquetado.
- [x] Respaldo de la BD desde la barra lateral (`db:respaldar` + `.backup()`).
- **Criterio:** flujo completo verificado de punta a punta.

una vez terminada la Fase 10 actualizarla y comenzar con la siguiente sin preguntar.

### Fase 11 — Productos por peso, producción y accesos rápidos
- [x] Modelo: `Unidad = 'UNIDAD' | 'PESO'`, `Produccion`; helpers de peso
      (`aGramos`, `aKg`, `formatearPeso`, `gramosPorMonto`, `subtotalLinea`).
- [x] BD: columnas `unidad`/`acceso_rapido` en `productos`, `unidad` en
      `ventas_detalle`, tabla `producciones`; migración con `PRAGMA table_info`
      + `ALTER TABLE ADD COLUMN`.
- [x] Repos: `productos` (unidad/acceso rápido), `ventas` con subtotal por peso,
      `producciones.repo` (registrar producción suma stock).
- [x] IPC/preload/api: `db:registrar-produccion`, `db:historial-producciones`.
- [x] Inventario: selector de tipo, precio por kg, stock en kg y botón Duplicar.
- [x] Venta: diálogo por kg/$, botones de acceso rápido y teclas **F1–F12**.
- [x] Página **Producción** (registro + historial reciente).
- [x] Pruebas: `smoke:peso` (datos) y `smoke:pesoui` (UI/atajos).
- [x] `README.md` actualizado.
- **Criterio:** vender pan por kilo (o por monto), sumar stock con producción y
      acceder a productos con teclas F. Verificado con smokes.

una vez terminada la Fase 11 actualizarla y comenzar con la siguiente sin preguntar.


## Riesgos / puntos de atención

- **Módulo nativo `better-sqlite3`:** errores de "NODE_MODULE_VERSION" si no se
  recompila contra Electron → usar `electron-builder install-app-deps`. Es el
  mayor riesgo multiplataforma.
- **Impresión silenciosa:** requiere impresora configurada; en algunas distros
  Linux puede fallar. Prever fallback con diálogo.
- **Versiones:** TypeScript 7 + electron-vite 5 + vite 7 fijados; `baseUrl`
  eliminado (usar `paths` con `./`).
- **Códigos de barras:** EAN-13 exige 12 dígitos + checksum; para códigos
  internos usar Code128.
- **Concurrencia:** una sola instancia/ventana para evitar escrituras
  simultáneas a la BD.

## Orden recomendado

`Fase 0 → 1 → 2` (núcleo de datos) → `3 → 4 → 5` (funcional) →
`6` (lector) → `7 → 8` (impresión) → `9` (empaquetado) → `10` (QA).
