# Primavera Segura: plan para la app final

> **Estado al 20/11/2026:** ver la sección 8 al final. El código está en `primavera-segura/`.

Fuentes: los documentos de Stage 1 (Mobile, Project Admin, Software), Stage 2 (Cybersecurity, Project Admin, Software), Stage 3 (Project Admin, Software), el flow map y el prototipo de 20 pantallas que está en este repo.
Fecha del plan: 20/11/2026 (fin de S9). Entrega final, H5: **27/11/2026**. Queda **1 semana**.

---

## 0. Decisiones que hay que cerrar hoy

Los documentos se contradicen en tres puntos. Este plan elige una opción para cada uno, y cada elección se puede defender con algún documento.

| # | Conflicto | Qué dice cada documento | Decisión recomendada |
|---|---|---|---|
| D1 | Plataforma | Stage 2 Software y Stage 3 Software: app Android con **Expo + React Native**, pruebas con jest-expo y Maestro. WBS 1.5.2 y Stage 2 Cyber: **web responsiva** sin app nativa. PB-24: acceso "desde celular o laptop". | **Expo (React Native) con `react-native-web`.** Un solo código genera el APK de Android y la versión web. Cumple con Stage 2/3 Software, con PB-24 y con lo que evalúa Cyber, que es el acceso desde el navegador. |
| D2 | Captura sin conexión | Stage 1 Mobile y Stage 2 Software: *offline-first*. WBS 1.5.2: "Captura sin internet (queda para después)". Stage 2 Cyber §1.2 la excluye y C07 pide **no guardar incidentes en el dispositivo**. | **Fuera de esta entrega.** Las pantallas 09 Sincronización y 10 Error recuperable se convierten en un estado de "sin conexión, reintenta". Lo offline queda en el manual técnico como trabajo futuro. Con una semana, la cola offline y la deduplicación son el mayor riesgo. |
| D3 | Brigadas y misiones | El prototipo trae "Asignar misión", "Iniciar ruta" y "Ver misión". El acta (4.1) deja **fuera de alcance** al "equipo de respuesta y patrullajes", y Cyber §1.0 deja fuera el "despacho de emergencias". | **Brigadas queda solo de lectura**: incidentes por zona y brigada. Se quitan los botones de asignar o despachar. Inicio del rescatista muestra "incidentes recientes cerca" en lugar de "mi misión". |

Mientras D1–D3 no estén aprobadas por la directora (Karla), los demás puntos de este plan las dan por hechas.

---

## 1. Stack

| Capa | Elección | Por qué (fuente) |
|---|---|---|
| App | Expo SDK 54+ con **Expo Router** y TypeScript | Stage 2 Software 1.4.2 y Stage 3 Software |
| Mapa | **Leaflet** con OpenStreetMap/OpenTopoMap. En Android se carga en `react-native-webview`; en web se usa directo | No necesita API keys en el cliente (Cyber R1/C03) y funciona en Expo Go y en web. Las capas de senderos, agua, accesos y límite del bosque se cargan como GeoJSON |
| Backend | **Supabase**: Postgres con **PostGIS**, Auth, Row Level Security y funciones RPC | Stage 1 Mobile (PostGIS, OAuth/RBAC, API). Cyber C01/C02/C04/C11: HTTPS, sesiones, roles validados en el servidor y respaldos |
| Lógica de servidor | Funciones SQL `security definer` y RLS. No se usa un servidor aparte | Cyber §2.2 F8: el backend decide los permisos, nunca el rol que manda el cliente |
| Exportación | `expo-print` para PDF y `react-native-view-shot` para la imagen del mapa | PB-17 / WBS 1.5.3 |
| Pruebas | **Jest + RNTL** (jest-expo) para unitarias y de componentes, cobertura de 70% o más. **Maestro** para E2E en Android, **Playwright** para E2E en web | Stage 1 Software (70%) y Stage 3 Software |
| CI | GitHub Actions: lint, `jest --coverage` con umbral de 70, `npm audit` y Dependabot | Stage 1 Software (CI en cada PR) y Cyber C10 |
| Despliegue | Web en Vercel o Netlify (HTTPS). APK con EAS Build (perfil `preview`) | WBS 1.7.3 / PB-24 |

Hace falta reutilizar el diseño del prototipo actual: los tokens de color y tipografía de `css/styles.css`, los íconos de `assets/icons` y las capas de `assets/map`. Hay que pasarlo todo a un `theme.ts` y a componentes de React Native.

---

## 2. Estándares (Stage 1 Software, "Coding standards")

- Ramas: `main` (protegida), `develop` y `feature/PB-xx-descripcion` o `fix/PB-xx-...`.
- Commits con Conventional Commits: `feat(map): ...`, `fix(form): ...`, `security(auth): ...`.
- Un PR por historia, con el ID de la historia, qué cambió y cómo probarlo. Cada PR necesita **1 aprobación de otra persona** y nadie aprueba su propio PR.
- Nombres: funciones y variables en `snake_case` (`load_incidents()`), clases y componentes en `PascalCase` y constantes en `UPPER_CASE`. Los archivos van en `snake_case`, salvo los componentes de React, que llevan PascalCase porque así lo usa Stage 3 con `IncidentForm.jsx`. **Esta excepción hay que anotarla en el README.**
- El código va en inglés. Los textos de la interfaz y la documentación, en español.
- Los secretos solo se guardan en `.env`, que no se sube al repo. Al cliente solo llegan la `anon key` y la URL de Supabase, que son públicas. La `service_role` **nunca** entra al repo.
- Cada bug corregido lleva una prueba que lo reproduce.

---

## 3. Modelo de datos (WBS 1.3.4)

```
profiles        id (auth.users), full_name, role ENUM(rescatista, coordinador, administrador),
                brigade, is_active
incident_types  id, code, label                    -- catálogo (WBS 1.3.2.1)
trails          id, name, geom LINESTRING
layers          id, kind ENUM(acceso, cuerpo_agua, uso_publico), name, geom
forest_boundary id, geom POLYGON                    -- polígono oficial de La Primavera
incidents       id uuid, type_id, severity ENUM(baja, media, alta),
                occurred_on DATE, location GEOGRAPHY(Point,4326),
                location_precision ENUM(exacta, sendero, kilometro),
                trail_id NULL, km NULL, status ENUM(pendiente, validado, cerrado),
                source ENUM(app, historico), created_by, created_at
audit_log       id, actor_id, action, result, created_at   -- sin datos del incidente (C09)
```

Restricciones que se validan en el servidor (Cyber C05/C06, PB-11):

- `ST_Within(location, forest_boundary)`.
- `occurred_on <= current_date`.
- El tipo tiene que existir en el catálogo y la gravedad en el ENUM.
- **No hay columnas para datos personales del paciente** (PB-21 / C08).

Funciones RPC:

| Función | Qué hace | Historias |
|---|---|---|
| `create_incident(...)` | Valida, inserta y escribe en la bitácora | PB-11 |
| `get_incidents(filters)` | Devuelve los incidentes filtrados | PB-06, PB-09 |
| `get_critical_zones(from, to, filters)` | Calcula las zonas críticas | PB-07 |
| `compare_periods(a_from, a_to, b_from, b_to)` | Compara dos periodos | PB-10 |
| `get_stats(from, to)` | Estadísticas por tipo, gravedad, sendero y día de la semana | PB-19 |

**Método de zonas críticas (WBS 1.4.3.1):**
- Cuadrícula cuadrada de unos 500 m (celdas de 0.0045° × 0.0048°). Se cambió de hexágonos a cuadros para que la misma regla se pueda calcular igual en SQL y en TypeScript.
- Puntaje por celda = Σ peso de la gravedad (baja 1, media 2, alta 3).
- Es zona crítica una celda con puntaje ≥ percentil 80 y con **n ≥ 5** incidentes.
- Si una celda o un periodo tiene menos de 5 incidentes, se marca con **"datos insuficientes"**: es el indicador de confianza de PB-16.
- La comparación de periodos usa la misma cuadrícula y calcula la diferencia de puntaje por celda: empeora, mejora o se mantiene.

**RLS (PB-20 / C02):**

| Rol | Lectura | Escritura |
|---|---|---|
| Rescatista | Incidentes | Solo puede crear incidentes |
| Coordinador | Todo | Valida y cierra incidentes |
| Administrador | Todo | Además, gestiona usuarios y roles |

La regla por defecto es **negar**.

---

## 4. Alcance: de las pantallas del prototipo a las historias

| Pantalla del prototipo | Historias | Responsable (WBS / RACI) | Prioridad |
|---|---|---|---|
| 01 Login y cierre de sesión | PB-20 | Gael | Must |
| 11 Acceso denegado (aparece cuando el servidor responde 403) | PB-20 | Gael | Must |
| 03 Mapa con capas activables y pines por gravedad | PB-05, PB-06 | Isaac | Must |
| 14 Zonas críticas | PB-07, PB-16 | Isaac | Must |
| 13 Comparación de periodos | PB-10, PB-16 | Isaac | Must |
| 04 Lista de incidentes con filtros combinables | PB-09 | Santiago | Must |
| 05 Detalle | PB-06 | Santiago | Must |
| 06 Registrar incidente | PB-11 | Gael | Must |
| 07 Registro correcto | PB-11 | Gael | Must |
| 12 Dashboard: resumen, senderos con más incidentes, graves | PB-18 | Santiago | Should |
| Estadísticas, dentro del dashboard o de reportes | PB-19 | Andrés | Should |
| 16 Reportes: exportar PDF o imagen; CSV y GeoJSON | PB-17, PB-14 | Santiago | Could |
| 17–20 Administración: inicio, incidentes, usuarios y roles | PB-20 | Gael | Must (usuarios y roles); Should (resto) |
| 02 Inicio del rescatista (sin misión, ver D3) | PB-18 | Santiago | Should |
| 08 Perfil | PB-20 | Gael | Should |
| 15 Brigadas, solo lectura (ver D3) | — | Isaac | Could |
| 09 y 10 Sincronización y error, reducidas a estado sin conexión (ver D2) | — | Gael | Could |

Datos (Andrés, WBS 1.3):
- Script de importación del histórico. Lee CSV o Excel, limpia, deduplica, anonimiza, georreferencia y llena `location_precision`.
- **Reporte de cobertura** con la meta de 90% georreferenciado.
- Si a la fecha no llegaron los datos del socio (H1/H2), se usa un **seed sintético** que se etiqueta así en la app y en el reporte. Hay que decirlo con claridad en la presentación.

---

## 5. Calendario (7 días)

| Día | Qué | Quién |
|---|---|---|
| **Vie 20/11** | Aprobar D1–D3. Crear el proyecto Expo (`npx create-expo-app`) y Supabase. Ramas, protección de `main`, plantilla de PR y CI con jest y audit. Esquema SQL, RLS y seed. `theme.ts` con los tokens del prototipo | Karla (decisiones), Gael (repo, CI, Supabase), Andrés (esquema y seed), Isaac (theme y navegación) |
| **Sáb 21 – Dom 22** | Login y roles, formulario y `create_incident`. Mapa con capas e incidentes. Lista, detalle y filtros. Importación de datos y reporte de cobertura | Gael · Isaac · Santiago · Andrés |
| **Lun 23** | Zonas críticas, comparación de periodos e indicador de confianza. Dashboard y estadísticas. Pantallas de administración | Isaac · Santiago y Andrés · Gael |
| **Mar 24** | Exportación PDF e imagen. Pruebas unitarias y de componentes hasta llegar a 70%. Flujos de Maestro y Playwright: login → registrar → ver en mapa | Santiago · todos (cada quien prueba lo suyo) · Santiago (E2E) |
| **Mié 25** | **Congelar funciones.** Pasar el checklist C01–C12 de Cyber con evidencia. Desplegar la web y el APK. Prueba de aceptación: el socio registra un incidente de prueba (PB-15) | Gael (seguridad y despliegue), Karla (aceptación) |
| **Jue 26** | Manual de usuario con capturas finales, manual técnico, exportar la base de datos (PB-14) y ensayo de la presentación | Santiago, Andrés, Karla |
| **Vie 27** | **H5:** presentación, demo y acta de cierre | Karla y todos |

Reglas para que alcance el tiempo:
- Lo Must se termina antes que cualquier Should o Could.
- Si el martes algo Must sigue roto, se recortan los Could: Brigadas, sincronización, CSV y GeoJSON.

---

## 6. Seguridad: llevar el checklist de Cyber de "Does Not Meet" a "Meets"

| ID | Implementación | Evidencia para la entrega |
|---|---|---|
| C01 | Supabase Auth, sesión con expiración y `signOut()` que invalida el refresh token | Prueba: una petición sin sesión recibe 401 |
| C02 | RLS que niega por defecto y RPC que revisa el rol en `profiles` | Prueba: un rescatista llama directo al endpoint de usuarios y recibe 403 |
| C03 | Solo `anon key` en el cliente. Escaneo de secretos con gitleaks en CI | Log de CI limpio |
| C04 | HTTPS en Supabase y en el hosting web, sin contenido mixto | Captura de los headers y del certificado |
| C05 | Validación en el cliente con `incident_validation.ts` (la misma lógica de Stage 3) **y** en `create_incident` | UT-01 a UT-09 y pruebas SQL |
| C06 | Consultas parametrizadas (RPC) y nada de `dangerouslySetInnerHTML`. Los popups de Leaflet escapan el texto | Prueba con un payload `<script>` |
| C07 | Sesión en `expo-secure-store` en Android y cookie o almacenamiento de sesión en web. Sin caché de incidentes | Inspección del almacenamiento después de cerrar sesión |
| C08 | El esquema no tiene campos de paciente y el importador los descarta. Las peticiones de tiles no llevan datos del incidente | Revisión del esquema y captura del tráfico de red |
| C09 | `audit_log` guarda actor, acción, resultado y hora, sin payload | Consulta de ejemplo |
| C10 | `package-lock.json`, Dependabot y `npm audit --audit-level=high` en CI | Reporte de CI |
| C11 | Respaldo diario de Supabase y procedimiento de restauración probado una vez | Documento de WBS 1.6.1.5 |
| C12 | Builds de producción sin logs de depuración y headers de seguridad en el hosting | Captura |

---

## 7. Criterios para dar la entrega por terminada (acta 3.3 y métricas 3.2)

- [ ] El socio, o el profesor si el socio no está, registra un incidente y lo ve en el mapa en **5 minutos o menos**.
- [ ] La comparación de fechas funciona con datos reales, o con el seed sintético declarado como tal.
- [ ] Las zonas críticas están calculadas y se presentan para validación escrita. La meta es 80% de coincidencia.
- [ ] El reporte de cobertura muestra 90% o más de incidentes georreferenciados.
- [ ] El rescatista no puede gestionar usuarios y eso está probado contra la API, no solo en la interfaz.
- [ ] La cobertura de pruebas es de 70% o más y el CI pasa en verde en `main`.
- [ ] La web está publicada con HTTPS y el APK es instalable.
- [ ] Se entregan el manual de usuario, el manual técnico y la base de datos exportada (CSV y GeoJSON).

---

## 8. Estado de ejecución (20/11/2026)

**Hecho y verificado** (typecheck, lint, 38 pruebas con 81.6% de líneas, build web y recorrido en el navegador):

- Proyecto Expo SDK 58 con Expo Router y TypeScript, web y Android.
- Esquema Supabase con RLS, validación en el servidor, bitácora y funciones RPC (`supabase/migrations`).
- Login con tres roles y pestañas por rol. Mapa Leaflet con incidentes y zonas críticas. Lista con filtros, detalle y validar/cerrar. Registro con validación. Comparación de periodos con aviso de pocos datos. Reportes en PDF, CSV y GeoJSON. Administración de usuarios y roles.
- Casos UT-01 a UT-09 y CT-01 a CT-03 del Stage 3 convertidos en pruebas reales.
- CI con typecheck, lint, cobertura, `npm audit` y gitleaks. Dependabot y plantilla de PR.

**Pendiente, y necesita a otra persona o un dato externo:**

| Pendiente | Quién | Nota |
|---|---|---|
| Aprobar D1–D3 | Karla | Se ejecutó con las tres recomendaciones. |
| Crear el proyecto Supabase, correr las migraciones y poner la URL y `anon key` en `.env` | Gael | Hasta entonces la app corre en modo demostración con datos sintéticos. **Los controles C01–C04 y C11 no se pueden dar por cumplidos hasta probarlos contra el servidor real.** |
| Polígono oficial del bosque | Andrés / socio | Hoy es un rectángulo provisional. |
| Registros históricos reales y script de importación con reporte de cobertura (90%) | Andrés | No existe todavía; el `seed` es sintético. |
| Validación escrita de zonas críticas con el socio (80%) | Karla / Isaac | |
| Publicar la web (HTTPS) y generar el APK con EAS | Gael | |
| Pruebas E2E con Maestro y Playwright | Santiago | No se escribieron. |
| Manuales de usuario y técnico, capacitación y prueba de aceptación PB-15 | Santiago / Karla | |
| Probar el APK en un teléfono Android real | todos | La app solo se probó en navegador. |

**Desviaciones respecto al plan original:**

- Cuadrícula cuadrada en vez de hexagonal (ver sección 3).
- Las pantallas Brigadas, Sincronización y Error de conexión no se construyeron, tal como decía D2/D3.
- No se usó `react-native-view-shot`; la exportación de imagen quedó fuera y PB-17 se cubre con PDF.
