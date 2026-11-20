# Primavera Segura

Mapa de seguimiento de incidentes en el Bosque La Primavera para Más Bosque Manu.
Expo (React Native + react-native-web) con Supabase (Postgres/PostGIS) como backend. Un solo código genera la app Android y la versión web.

## Cómo correrlo

```bash
cd primavera-segura
npm install
npm run web        # navegador
npm run android    # Android (Expo Go o emulador)
```

Sin variables de entorno la app arranca en **modo demostración**: usa datos sintéticos en memoria y tres cuentas de prueba (`rescatista@demo.mx`, `coordinador@demo.mx`, `admin@demo.mx`, contraseña `demo`). La app lo avisa en pantalla.

Para conectar el backend real copia `.env.example` a `.env` y llena la URL y la `anon key` de tu proyecto Supabase. **Nunca** pongas la `service_role` key en el cliente ni en el repo.

## Backend (Supabase)

Ejecuta en orden en el SQL editor de Supabase:

1. `supabase/migrations/0001_schema.sql`: tablas, RLS (negar por defecto), funciones RPC y bitácora.
2. `supabase/migrations/0002_forest_boundary.sql`: límite del bosque. **Es un rectángulo provisional**; reemplázalo con el polígono oficial.

Después crea los usuarios en Authentication y promueve roles con la función `set_user_role` (o desde la pantalla Usuarios con una cuenta administradora). Todo usuario nuevo nace como `rescatista`.

## Roles

| Rol | Puede |
|---|---|
| rescatista | Ver mapa e incidentes, registrar incidentes |
| coordinador | Lo anterior, más zonas críticas, comparación de periodos, reportes y validar/cerrar incidentes |
| administrador | Todo lo anterior, más gestionar usuarios y roles |

Los permisos se hacen cumplir en el servidor (RLS y funciones RPC). Ocultar pestañas en la app es solo comodidad de interfaz.

## Pruebas y calidad

```bash
npm test               # Jest + React Native Testing Library
npm run test:coverage  # exige 70% de líneas (estándar de Stage 1)
npm run typecheck
npm run lint
```

CI (`.github/workflows/tests.yml`): typecheck, lint, cobertura, build web, `npm audit` y gitleaks.

## Estructura

```
app/            rutas (Expo Router): login, (app) pestañas, (flow) pantallas sobre las pestañas
src/lib/        lógica pura y probada: validación, zonas críticas, comparación, exportación
src/data/       repositorio (Supabase y demo), sesión, datos sintéticos
src/components/ UI y mapa Leaflet
supabase/       migraciones SQL
```

## Convenciones

- Rama `main` protegida, `develop` de integración, `feature/PB-xx-...` por historia. Commits convencionales. Un PR por historia con 1 aprobación de otra persona.
- Código en inglés; textos de interfaz y documentación en español.
- Funciones y variables en `snake_case`; clases, tipos y componentes en `PascalCase` (así lo exige React).

## Decisiones de alcance

- **Sin captura sin conexión** en esta entrega (WBS 1.5.2 y Stage 2 Cybersecurity lo excluyen). La app no guarda incidentes en el dispositivo.
- **Brigadas y despacho fuera de alcance** (acta 4.1): no hay asignación de misiones.
- Los datos sintéticos están marcados como tales hasta que se importen los registros reales del socio.
