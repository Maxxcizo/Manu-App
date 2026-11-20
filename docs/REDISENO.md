# Primavera Segura: rediseño integral

Documento de trabajo del rediseño de `primavera-segura/`. Contiene la auditoría (etapa 1), la dirección visual (etapa 2), la arquitectura multiplataforma (etapa 3) y el plan de pantallas (etapa 4). El reporte final está en la sección 6.

---

## 1. Auditoría del frontend (estado en el commit `6d657b7`)

### 1.1 Estructura

| Área | Estado |
|---|---|
| Rutas | `app/login.tsx`, `app/index.tsx` (redirección), `app/(app)/` con `Tabs` (7 pestañas), y `app/(flow)/` con `Stack` para registrar, detalle y comparación. |
| Navegación por rol | Las pestañas se ocultan con `href: null` según `user.role`. |
| Componentes | Un solo archivo `src/components/ui.tsx` con Screen, Card, Button, Chip, Field, Tag, Notice y Bar. También `IncidentForm`, `IncidentMap` (`.tsx` y `.web.tsx`), `RequireRole` y `SyntheticBanner`. |
| Estado | `AppProvider` (sesión, incidentes, error y refresh) sobre un `Repository` con dos implementaciones (demo y Supabase). |
| Tokens | `src/theme.ts`: 13 colores y radios sueltos. No hay escala tipográfica, de espaciado ni de movimiento. |
| Mapa | Se genera HTML de Leaflet con SRI y CSP. La comunicación es de un solo sentido: cada cambio de datos reconstruye el documento completo. |

### 1.2 Problemas encontrados

**Navegación**
- N1. El administrador tiene **7 pestañas inferiores** en móvil. La guía recomienda 5 como máximo, y en 375 px las etiquetas se cortan.
- N2. En web se reutiliza la barra de pestañas móvil estirada a todo el ancho. No hay navegación lateral ni encabezado de página.
- N3. Las pantallas de `(flow)` pierden la navegación principal en web. Para volver al módulo hay que usar el navegador.
- N4. `href: null` dentro de `Tabs` rebota a `/home` cuando se navega a esas rutas. Ya pasó con el formulario y obligó a crear el grupo `(flow)`.
- N5. Falta una pantalla para rutas desconocidas (`+not-found`).

**Jerarquía y layout**
- L1. Todas las pantallas son una columna de tarjetas de máximo 760 px. En 1440 px queda casi la mitad de la pantalla vacía y no hay tablas.
- L2. Todo es tarjeta: filtros, métricas, listas y avisos tienen el mismo peso visual.
- L3. El encabezado verde con la etiqueta en mayúsculas "LA PRIMAVERA" se repite en cada pantalla y gasta unos 120 px verticales en móvil.
- L4. No se respetan las safe areas: el encabezado usa `paddingTop: 44` fijo.
- L5. Los filtros de fecha son dos campos de texto libre sin atajos. Tampoco hay búsqueda.
- L6. La lista de incidentes corta en 60 resultados sin paginación ni aviso.

**Componentes y consistencia**
- C1. Todos los botones tienen la misma altura y el mismo peso. No hay variante terciaria ni botón de ícono.
- C2. La gravedad depende solo del color y se muestra en minúsculas ("alta").
- C3. Los metadatos se arman con cadenas "A · B · C" en lugar de estructura.
- C4. No hay toasts. Las confirmaciones son bloques `Notice` que se quedan en la pantalla.
- C5. No hay estados de carga. Si el iframe del mapa no carga, no hay indicador ni mensaje de error.
- C6. No hay selector desplegable. Los 7 tipos de incidente se muestran como chips que ocupan 4 filas en móvil.
- C7. No hay bottom sheets ni diálogos. Desactivar una cuenta pasa sin pedir confirmación.

**Formularios**
- F1. Para registrar la ubicación hay que escribir latitud y longitud a mano; no se puede elegir en el mapa.
- F2. No se marcan los campos obligatorios ni hay textos de ayuda.
- F3. Los errores de tipo y gravedad salen dentro de un `Notice` rojo, no junto a su control.
- F4. Después de guardar, el formulario sigue lleno y no ofrece un siguiente paso claro.
- F5. No se maneja el teclado: no hay `keyboardShouldPersistTaps` ni una barra de envío fija.

**Mapa**
- M1. Al cambiar un filtro se reconstruye el `srcDoc` completo y se pierden el zoom y la posición.
- M2. Al tocar un marcador solo se abre un popup de Leaflet; la app no se entera de cuál se eligió.
- M3. No hay leyenda: el significado de los colores solo aparece en el subtítulo.
- M4. Los controles de zoom de Leaflet miden 30 px, menos que el mínimo táctil de 44 px.
- M5. Cuando el CDN no carga, el mapa queda en blanco sin explicación.

**Accesibilidad**
- A1. Hay chips sin `accessibilityState` en algunos lugares y botones de ícono sin etiqueta.
- A2. Falta `prefers-reduced-motion`; hoy no hay movimiento, pero lo que se agregue debe respetarlo.
- A3. No hay foco visible personalizado en web: se depende del contorno por defecto, que a veces se oculta.
- A4. El texto de 11–12 px en etiquetas secundarias queda cerca del límite de legibilidad para uso en exteriores.

**Código**
- K1. `ui.tsx` mezcla primitivas, layout y patrones en un solo archivo.
- K2. Cada pantalla repite la lógica de filtros (estado y `useMemo`).
- K3. Hay estilos en línea dispersos en las pantallas, con números mágicos de espaciado.

### 1.3 Soluciones (resumen; el detalle está en las secciones 3 y 4)

- **Navegación:** un shell de navegación propio sobre un `Stack` de Expo Router, que corrige N1–N4. Es barra lateral en escritorio, riel en tablet y barra inferior de 4 o 5 destinos en móvil; el resto va a "Más".
- **Componentes:** un sistema de diseño en `src/theme/` y `src/ui/`, con componentes por responsabilidad, y un hook de filtros compartido (`use_incident_filters`).
- **Pantallas web:** tablas, paneles maestro-detalle y mapa con panel lateral.
- **Mapa:** comunicación en dos sentidos con mensajes validados, actualización sin recargar, leyenda, estados de carga y error, y modo para elegir ubicación.

---

## 2. Dirección visual

### 2.1 De qué se trata el producto

Primavera Segura la usan brigadistas voluntarios en un bosque protegido de 30 mil hectáreas, a pleno sol, con poca señal y a veces con guantes. También la usan coordinadores que deciden desde una laptop a dónde mandar apoyo. Su materia prima es la **cartografía**: senderos, curvas de nivel, cuerpos de agua y puntos de incidente. Debe sentirse como un **instrumento de campo**: preciso, sobrio y legible, no como un panel de administración genérico.

### 2.2 Lo que descarté y por qué

La skill `ui-ux-pro-max` recomendó un tema **oscuro OLED** con verde operativo y Fira Code/Fira Sans. Lo descarté por tres razones:
1. El requisito no funcional de Stage 1 Mobile pide una "interfaz de alto contraste visible bajo luz solar directa". Un fondo oscuro se lee peor al sol.
2. Fondo casi negro con un solo acento brillante y monoespaciada para etiquetas es justo uno de los patrones genéricos que la skill `frontend-design` pide evitar.
3. El socio ya validó el verde bosque `#175B47` del prototipo de Figma, y conviene mantener esa continuidad.

De esa recomendación conservé lo que sí aplica: rojo de incidente con ámbar de advertencia, foco visible y estados de error que nunca se ocultan.

### 2.3 Identidad: "carta topográfica"

- **Concepto:** la interfaz se comporta como una hoja de carta topográfica. Hay un lienzo claro y frío, información en tinta de pino y el color reservado para lo que tiene significado geográfico o de riesgo.
- **Elemento memorable:** las **curvas de nivel** del prototipo, tomadas del trazo del asset `curvas-de-nivel.svg`. Aparecen solo en el panel de marca del login y en la cabecera de la barra lateral. El resto de la interfaz es callada.
- **La gravedad tiene su propio sistema.** Usa una rampa cálida (ocre, naranja, rojo) separada del verde de marca, para que "baja" nunca se confunda con "éxito". Siempre se acompaña de un **glifo de 1, 2 o 3 barras** y del texto, de modo que no depende solo del color (WCAG 1.4.1).

### 2.4 Tokens

**Color (contrastes WCAG medidos)**

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `ink` | `#17251F` | Texto principal | 15.9:1 sobre blanco |
| `ink_muted` | `#4F5F58` | Texto secundario | 6.75:1 |
| `ink_subtle` | `#6B7A73` | Solo texto auxiliar de 14 px o más | 4.51:1 |
| `canvas` | `#F3F5F2` | Fondo de la app (niebla fría, no crema) | — |
| `surface` | `#FFFFFF` | Paneles | — |
| `line` / `line_strong` | `#D9E0DB` / `#74857D` | Divisores / borde de controles | — / 3.89:1 |
| `bosque` | `#175B47` | Marca y acción primaria | Blanco sobre él: 8:1 |
| `pino` | `#0F2A22` | Barra lateral web | Texto `#E6EFEA`: 13:1 |
| `agua` | `#24617F` | Información | 5.75:1 sobre su tinte |
| Gravedad baja | marcador `#D9A514`, texto `#6B4E00` | Siempre con contorno de tinta en el mapa | 6.9:1 (texto), 7:1 (contorno) |
| Gravedad media | `#D9661A`, texto `#8A3D00` | | 6.4:1 |
| Gravedad alta | `#B3222A`, texto `#9E1A21` | | 6.3:1 |

**Tipografía:** **Atkinson Hyperlegible Next**, del Braille Institute, diseñada para distinguir caracteres con baja visión y condiciones adversas. Encaja con un uso al sol y en movimiento, y no es la sans por defecto de cualquier proyecto. Es una sola familia con pesos 400, 600 y 700, y cifras tabulares para los datos.

La escala tipográfica es: 12 (mínimo, solo metadatos), 14, 16 (cuerpo), 18, 22, 28 y 36 (título web).

**Espaciado:** rejilla de 4 pt. Escala 4, 8, 12, 16, 20, 24, 32, 40, 48 y 64. Los márgenes laterales se adaptan al tamaño: 16, 20, 24, 32 y 40.

**Radios por jerarquía (no uno para todo):**

| Elemento | Radio |
|---|---|
| Controles | 10 |
| Paneles | 14 |
| Sheets y diálogos | 20 |
| Chips y badges | pill |
| Tablas dentro de paneles | 0 |

**Elevación:** los paneles usan borde de 1 px y no llevan sombra. La sombra queda solo para capas flotantes: sheets, toasts, controles sobre el mapa y menús.

**Movimiento:** 120 ms para presión, 200 ms para entrar y 160 ms para salir; la salida es más rápida que la entrada. Si el sistema pide "reducir movimiento", las animaciones se sustituyen por cambios instantáneos de opacidad.

**Íconos:** Ionicons en variante outline en toda la navegación y el contenido, y filled solo para el destino activo. Tamaños de 16, 20 y 24.

---

## 3. Arquitectura multiplataforma

| Capa | Compartido | Específico por plataforma |
|---|---|---|
| Tokens (`src/theme/`) | Todo | — |
| Lógica (`src/lib`, `src/data`, hooks) | Todo | — |
| Primitivas (`src/ui/`): Text, Button, IconButton, TextField, Badge, Banner, Toast, EmptyState, Skeleton, PageHeader, DataTable | Sí | Retroalimentación de presión: `android_ripple` en Android y hover y foco en web, con `Platform.select` |
| `Select` | API | `Select.tsx` abre un bottom sheet; `Select.web.tsx` usa un `<select>` nativo con el estilo del sistema |
| `Sheet` | API | `Sheet.tsx` es un bottom sheet animado; `Sheet.web.tsx` es un diálogo centrado o un panel lateral según el ancho |
| Shell de navegación | Configuración por rol (`nav_config.ts`) | Barra lateral (≥1024), riel (768–1023) o barra inferior con safe area (<768), según `use_breakpoint` |
| Mapa | Generador de HTML y protocolo de mensajes | `IncidentMap.tsx` (WebView con `postMessage`) e `IncidentMap.web.tsx` (iframe sandbox con `postMessage` que valida la fuente) |

**Breakpoints** (`use_breakpoint`, basado en `useWindowDimensions`):

| Nombre | Ancho |
|---|---|
| `xs` | <375 |
| `sm` | 375–430 |
| `md` | 431–767 |
| `lg` | 768–1023 |
| `xl` | 1024–1439 |
| `xxl` | ≥1440 |

Según el breakpoint cambian la navegación, el número de columnas, el tamaño del título, los márgenes y la densidad de la información. En escritorio se muestran tablas y en móvil, listas.

**Dependencias nuevas, todas instaladas con `npx expo install`:**
- `react-native-svg`: dibuja las curvas de nivel, el glifo de gravedad y las gráficas con nitidez en Android y web. Viene incluida en Expo Go.
- `@expo-google-fonts/atkinson-hyperlegible-next` y `expo-font`: aseguran la misma tipografía en Android (que de otro modo usaría Roboto) y en web.

Ninguna otra dependencia es necesaria. Las animaciones usan `Animated` de React Native, que funciona en web.

---

## 4. Plan de pantallas

| Pantalla | Móvil | Web (≥1024) |
|---|---|---|
| Login | Cabecera de marca compacta con curvas y formulario debajo | Dos columnas: panel de marca con curvas y propósito del producto, y formulario |
| Inicio / Resumen | Acción principal, franja de cifras y listas cortas | Selector de periodo, franja de cifras, rejilla de 2 o 3 columnas con gráficas y pendientes de validar |
| Mapa | Mapa a pantalla completa, capas flotantes, leyenda en sheet y tarjeta del incidente elegido | Mapa más panel lateral de 360 px con filtros, leyenda y detalle del elegido |
| Incidentes | Búsqueda, botón de filtros (sheet) y lista paginada | Barra de herramientas, tabla ordenable y paginada, y panel maestro-detalle |
| Detalle | Pantalla con minimapa, datos y acciones | La misma pantalla en dos columnas, o integrada en el panel maestro-detalle |
| Registrar | Una columna con barra de envío fija | Dos columnas: datos a la izquierda, mapa para elegir ubicación a la derecha |
| Zonas críticas | Mapa arriba y ranking abajo | Mapa con tabla de ranking y explicación del método |
| Comparación | Presets de periodos y lista con tendencia | Resumen A/B y tabla |
| Reportes | Lista de formatos con alcance por periodo | Igual, en rejilla |
| Usuarios | Lista, edición en sheet y confirmación al desactivar | Tabla con rol editable y confirmación |
| Perfil / Más | Cuenta y accesos a Informes y Usuarios según el rol | Cuenta |
| Sin acceso / 404 | Estado vacío con acción para volver | Igual |

Contratos que no cambian: `Repository`, `AppProvider`, Supabase, RLS, RPC, exportaciones, validación y `build_map_html` (que se amplía sin quitar SRI ni CSP).

---

## 6. Reporte final (20/11/2026)

### 6.1 Qué cambió

**Navegación (N1–N5)**
- Shell propio con un `Stack` de Expo Router, que reemplaza a `Tabs` y al grupo `(flow)`:
  - Escritorio (≥1024): barra lateral color pino, con el motivo de curvas en la cabecera.
  - Tablet (768–1023): riel.
  - Teléfono: barra inferior con safe area.
- La barra inferior tiene un máximo de 5 destinos:
  - Rescatista: "Reportar" en el centro.
  - Coordinación y administración: el destino "Más" agrupa Comparación, Informes y Usuarios.
- La navegación entre secciones usa `go_to_section` (`dismissTo`/`push`), así que la pila queda acotada. Verificado: después de 5 saltos solo quedan montadas Inicio y la sección actual.
- Se agregó `+not-found`.

**Sistema de diseño**
- `src/theme/` contiene colores, tipografía, espaciado, radios, sombras, movimiento y breakpoints.
- `src/ui/` tiene 15 componentes por responsabilidad: Text, Button, IconButton, TextField, Select (Android y web), Chip, ChoiceGroup, Badge (SeverityBadge con glifo), Banner, Toast, Sheet, ConfirmDialog, DataTable, Pagination, Page, Panel, Columns, KeyValue, EmptyState, Skeleton, Brand y Charts.
- Ya no quedan colores escritos a mano en pantallas ni componentes. El único lugar con colores propios es el HTML del mapa, que es un documento aparte dentro del iframe.

**Pantallas rediseñadas (todas)**
- Login, Resumen, Mapa, Incidentes, Detalle, Registrar, Zonas críticas, Comparación, Informes, Usuarios, Cuenta, Acceso restringido y 404.
- En escritorio hay tablas ordenables y paginadas, maestro-detalle en Incidentes (≥1360 px), mapa con panel lateral y formulario en dos columnas.
- En móvil hay listas, filtros en bottom sheet, mapa a pantalla completa con tarjeta del punto elegido y barra de envío fija.

**Mapa**
- Se conservan Leaflet 1.9.4, OpenStreetMap, SRI, CSP, el iframe con sandbox `allow-scripts` y el WebView.
- Nuevo protocolo de mensajes en dos sentidos, validado con `map_protocol.ts`:
  - Al filtrar, el mapa se actualiza sin recargarse.
  - Seleccionar un punto lo muestra en la app.
  - En el formulario, tocar el mapa llena latitud y longitud.
- Se agregaron leyenda, estados de carga y de error con reintento, controles de 44 px y marcadores que codifican la gravedad con color, tamaño y contorno.

**Microinteracciones**
- Retroalimentación al presionar: ripple en Android, hover en web.
- Anillo de foco solo con teclado.
- Toasts y sheets animados con salida más rápida que la entrada.
- Transiciones nativas: `slide_from_right` para el detalle y `slide_from_bottom` para registrar.
- Todo respeta "reducir movimiento" con `useReducedMotion`.

**Dependencias nuevas**, instaladas con `expo install`: `react-native-svg`, `expo-font`, `expo-asset` (requerida por `expo-font`) y `@expo-google-fonts/atkinson-hyperlegible-next`.

**Sin cambios:** `supabase/`, `repository.ts`, `supabase_repository.ts`, `validation.ts`, `zones.ts`, contratos RPC y exportaciones.

**Único cambio en datos:** `AppProvider` expone `loading`, para mostrar skeletons durante la primera carga. `TRAILS` se movió a `src/lib/catalog.ts`.

### 6.2 Pruebas ejecutadas

| Verificación | Resultado |
|---|---|
| `npx tsc --noEmit` | Sin errores |
| `npx expo lint` | Sin errores ni avisos |
| `npx jest --coverage` | 7 suites, 53 pruebas; 82.9% de líneas (mínimo 70%) |
| `npx expo export --platform web` | Compila |
| `npx expo-doctor` | 20/20 |
| Revisión visual web en 1440×900, 1280×800, 1024×768 y 768×1024 | Revisado con capturas, sin desbordamiento horizontal |
| Revisión visual móvil web en 320×568, 375×812, 390×844 y 430×932 | Revisado con capturas y medición de `scrollWidth` |
| Flujos probados en el navegador | Login de los 3 roles, pestañas por rol, filtros en sheet, mapa filtrado, maestro-detalle, detalle y volver, registrar con error y con éxito, toast, desactivar cuenta con confirmación, cerrar sesión, acceso restringido y 404 |
| Clic en marcador, zoom y elegir ubicación | Verificados **en el documento del mapa cargado como página principal**, con un stub de `ReactNativeWebView`. El navegador automatizado no entrega clics dentro del iframe sandbox de otro origen, así que el recorrido clic en iframe → app en web **no se pudo probar**. La recepción de mensajes del lado de la app está cubierta por las pruebas del parser. |

**No probado:** Android. No hay emulador ni teléfono Android en este entorno; la variante nativa (WebView, ripple, bottom sheet de `Select`, safe areas reales y teclado) compila con TypeScript pero no se ejecutó. Tampoco se probaron lectores de pantalla ni el modo "reducir movimiento" activado en el sistema.

### 6.3 Pendientes y recomendaciones

1. **Probar en Android real o emulador** (`npx expo start` + Expo Go, o `eas build --profile preview`). Revisar sobre todo:
   - el mapa en WebView: selección e inserción de datos con `injectJavaScript`;
   - el teclado en Registrar;
   - el botón atrás de hardware en sheets y en la pila.
2. **Probar el clic dentro del iframe con un navegador manual** en web, para cerrar el único recorrido que no pude automatizar.
3. **Probar los toasts en pantallas de flujo:** el toast se sube 72 px para librar la barra inferior, y en esas pantallas, que no la muestran, puede verse un poco alto.
4. **Modo oscuro:** no se implementó a propósito, por la legibilidad bajo el sol. Si se quiere, los tokens semánticos permiten agregarlo sin tocar las pantallas.
5. **Revisión de accesibilidad con lector de pantalla:** TalkBack en Android y VoiceOver o NVDA en web.
