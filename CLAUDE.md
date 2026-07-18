# El Rincón de Chacho — Contexto del Proyecto

## ¿Qué es esto?
Plataforma privada para un grupo de amigos ("Chachos") que registra y comparte:
- Estadísticas de su equipo de fútbol amateur
- Rankings del juego de cartas "Podrida"
- Un prode deportivo entre ellos
- Crónicas/memorias del grupo
- Galería de fotos

El sitio está **en producción** en `https://elrincondechacho.com`. Fue construido de manera autodidacta a lo largo de varios años, por lo que el código es funcional pero heterogéneo en patrones y estilo.

---

## Stack técnico

### Frontend
- **React** (Create React App, `npm start` para desarrollo)
- **React Router v6** — rutas definidas en `frontend/src/App.js`
- **Redux Toolkit** — usado para: usuarios, jugadores, equipos, torneos, estadísticas de partidos, votos
- **React Query (@tanstack/react-query)** — usado para: crónicas, podrida, prode, y nuevas features
- **Axios** para llamadas HTTP
- **Swiper** para sliders
- **React Toastify** para notificaciones

> ⚠️ El proyecto mezcla Redux y React Query sin un criterio unificado. No cambiar esta arquitectura sin conversarlo primero.

> 🎯 **Deuda técnica prioritaria — migración a React Query:** A largo plazo, todo el estado del servidor debe vivir en React Query y Redux debe eliminarse. El síntoma del problema es tener que sincronizar manualmente ambos sistemas (ej: despachar una acción Redux después de una mutación de React Query). La migración se hace sección por sección, en el mismo orden que el rediseño. El estado de auth (usuario logueado, JWT) es el último en migrar. **Recordar este objetivo en cada sesión** y priorizar React Query para cualquier feature nueva.

### Backend
- **Node.js + Express** (`npm run dev` para desarrollo)
- **MongoDB** con Mongoose (IDs son ObjectIDs, NO numéricos)
- **JWT** para autenticación
- Estructura: `backend/src/` → controllers / routes / repository / middlewares

### Despliegue
- Frontend y backend servidos desde el mismo dominio en el VPS
- En producción: `baseURL = ""` (rutas relativas). En desarrollo: `baseURL = "http://localhost:8080"` (definido en `.env`)

---

## Rutas del sitio

| Ruta | Descripción | Notas |
|------|-------------|-------|
| `/` | Login | Pública |
| `/register` | Registro | Público |
| `/home` | Home principal | Auth requerida |
| `/photo-gallery` | Galería de fotos | Auth requerida |
| `/podrida` | Sección Podrida | Auth requerida |
| `/prode` | Sección Prode | Auth requerida |
| `/cronicas` | Listado de crónicas | Auth requerida |
| `/cronicas/:id` | Detalle de crónica | IDs son ObjectIDs de Mongo |
| `/chachos` | Chachos — tab Inicio | Auth requerida |
| `/chachos/historical-stats` | Chachos — tab Estadísticas | Auth requerida |
| `/chachos/tournament-rounds` | Chachos — tab Fechas | Auth requerida |
| `/chachos/squad` | Plantel | Auth requerida |
| `/admin/users` | Panel admin — usuarios | Admin requerido |
| `/admin/chachos` | Panel admin — Chachos | Admin requerido |
| `/admin/podrida` | Panel admin — Podrida | Admin requerido |
| `/admin/prode` | Panel admin — Prode | Admin requerido |
| `/admin/cronicas` | Panel admin — Crónicas | Admin requerido |

> ⚠️ `/admin` sin subruta muestra página en blanco — no hay index route. El sidebar siempre linkea a `/admin/users` directamente, así que en la práctica no es un problema.

---

## Endpoints backend relevantes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/chachos/tournament-round` | GET | Todos los tournament rounds (**singular**, no plural) |
| `/api/podrida/match/all` | GET | Todas las partidas de Podrida |
| `/api/podrida/match/last` | GET | Última partida de Podrida |
| `/api/cronica` | GET | Todas las crónicas |
| `/api/cronica/:id` | GET | Crónica por ObjectID |

> ⚠️ El endpoint es `/tournament-round` (singular). Usar `/tournament-rounds` (plural) da 404.

---

## Skills instaladas globalmente

- **`frontend-design`** — guía de diseño de interfaces premium (`~/.claude/skills/frontend-design.md`)
- **`ui-ux-pro-max`** — sistema de diseño con 67 estilos, 96 paletas, 57 pares tipográficos (`~/.claude/skills/ui-ux-pro-max/`)

---

## Sistema de diseño — decisiones tomadas

### Paleta de colores (App.css)
```css
--primary-color:    #191919   /* navbar, fondos oscuros */
--secondary-color:  #457b9d   /* azul acento */
--third-color:      #a8dadc   /* teal — acento principal */
--fourth-color:     #e63946   /* rojo */
--background-color: #f8fbfe   /* fondo claro (secciones light) */
--text-color:       #343a40

/* Fondos oscuros */
--bg-deep:          #0a0a0a   /* hero, auth pages */
--bg-panel:         #0d0d0d   /* sidebar, user menu, inputs */
--bg-card-dark:     #111111   /* cards sobre dark */

/* Tipografía sobre fondos oscuros */
--text-bright:       #e8e8e8  /* títulos principales */
--text-body-dark:    #c0cdd8  /* cuerpo, nombres */
--text-label-dark:   #98a8b8  /* labels de form, navbar — ratio 8.13:1 */
--text-muted-dark:   #94a4b4  /* taglines, descripciones — ratio 7.75:1 */
--text-subtle-dark:  #909fb0  /* decorativos, metadata — ratio 7.32:1 */
--input-text-dark:   #d0d8e0  /* texto dentro de inputs */
--input-placeholder: #4a5a6a  /* placeholder de inputs */
```

### Fuentes
```css
--primary-font:   "Roboto"        /* cuerpo general */
--secondary-font: "Poppins"       /* UI, subtítulos, labels */
--accent-font:    "Protest Strike" /* SOLO para títulos principales */
```
- **"Urbanist"** fue agregada en esta sesión para cards y stats del Home
- **Protest Strike** debe usarse EXCLUSIVAMENTE en el título principal del hero. No abusar en cards, stats ni secciones secundarias

### Principios estéticos del dueño del proyecto
- Sobriedad y elegancia por encima de todo
- Dark theme para el home (hero oscuro que continúa en secciones)
- Sin efectos de hover violentos o bruscos — transiciones suaves de 0.4-0.5s
- Sin colores demasiado saturados o "colorinches"
- Sin tipografía genérica (Roboto para cuerpo está OK, pero no para títulos)
- Cards con fade-in escalonado activado por scroll (IntersectionObserver)

### ⚠️ Reglas obligatorias del sistema de diseño

#### Principio general
**Cualquier valor CSS que se vaya a reutilizar debe definirse como variable global en `App.css :root`**, sin excepción. Esto aplica a colores, tipografía, espaciado, radios, transiciones, letter-spacing, font-weight, y cualquier otra propiedad que se repita. Nunca hardcodear valores directamente en los CSS de componente.

#### Colores
1. **Todo color debe ser una variable global** de `App.css :root`. Cero valores hex hardcodeados en archivos de componente.
2. **Todo color de tipografía debe tener un ratio de contraste mínimo de 7:1** contra el fondo sobre el que se muestra. Verificar siempre con la API de WebAIM antes de adoptar un color nuevo:
   `https://webaim.org/resources/contrastchecker/?fcolor=XXXXXX&bcolor=YYYYYY&api`
   Un ratio de 7:1 equivale al nivel WCAG AAA — el estándar más exigente.

#### Variables definidas en App.css (referencia completa)
```css
/* Avatar inicial — usar SIEMPRE esta variable, nunca hardcodear el gradiente */
--avatar-gradient: linear-gradient(135deg, var(--secondary-color), var(--third-color));

/* Font weights */
--fw-regular: 400 | --fw-medium: 500 | --fw-semibold: 600
--fw-bold: 700 | --fw-extrabold: 800 | --fw-black: 900

/* Font sizes */
--text-4xs: 0.55rem   /* piso absoluto: segunda línea de metadata en tablas */
--text-3xs: 0.6rem    /* micro-meta: liga/horario de card, pills mínimos */
--text-2xs: 0.65rem   /* meta, bar text */
--text-xs:  0.75rem   /* errores, links secundarios */
--text-sm:  0.82rem   /* body small, subtítulos */
--text-base: 0.88rem  /* body estándar, inputs */
--text-md:  1rem
--text-lg:  1.4rem    /* títulos de card/form */
--text-xl:  1.75rem   /* títulos de sección */

/* Letter spacing */
--ls-tight: 0.02em | --ls-normal: 0.04em | --ls-wide: 0.14em
--ls-wider: 0.25em | --ls-widest: 0.3em

/* Border radius */
--radius-xs: 6px | --radius-sm: 8px | --radius-md: 10px
--radius-lg: 12px | --radius-xl: 16px | --radius-2xl: 20px | --radius-full: 9999px

/* Transiciones */
--transition-fast: 0.2s ease | --transition-base: 0.3s ease
--transition-slow: 0.45s ease | --transition-panel: 0.38s cubic-bezier(0.4,0,0.2,1)

/* Espaciado */
--space-xs: 0.5rem | --space-sm: 0.875rem | --space-md: 1.25rem
--space-lg: 2rem | --space-xl: 3rem | --space-2xl: 5rem
```

Si al trabajar en una sección nueva se necesita un valor que no está en esta lista, **definirlo primero en `:root` y luego usarlo** — nunca al revés.

---

## Home — estado actual ✅ CERRADO

### Estructura
1. **Hero** — dark (#0a0a0a), título gigante en Protest Strike con gradient teal en "Chacho", línea vertical decorativa, CTA "Explorar el sitio" que hace scroll a las cards
2. **Stats 2x2** — grilla de 4 métricas dinámicas con count-up animation al cargar (Años / Podridas / Partidos de Chachos / Crónicas)
3. **Sección cards** — 4 cards verticales en grilla con fade-in escalonado por IntersectionObserver

### Archivos del Home
- `frontend/src/components/Home/Home.jsx`
- `frontend/src/components/Home/HomeStyles.css`
- `frontend/src/App.css` (import de Urbanist)
- `frontend/src/reactquery/chachos/fetchAllTournamentRounds.js`

### Scroll Snap
- **>1100px (desktop)**: `.hw` es el scroll container (`scroll-snap-type: y mandatory`). Cada sección tiene `height: calc(100vh - 80px)` y `scroll-snap-align: start` — el scroll salta entre secciones sin posiciones intermedias
- **900–1100px (tablet)**: snap desactivado, scroll natural. El grid 2×2 es más alto que el viewport y no cabe con snap
- **≤900px (mobile)**: snap desactivado, flujo natural, `height: auto`
- Los tamaños de fuente del hero usan `min(vw, vh)` para escalar con la dimensión más restrictiva del viewport

### Decisión crítica — cards como `<div>`
Las cards son `<div>` con `onClick={() => navigate(ruta)}`, **NO `<Link>`**.
Razón: `<Link>` renderiza un `<a>` y los browsers aplican estilos de hover que son imposibles de anular completamente con CSS.

### Diseño final de las cards (Opción B)
- Grid 4 columnas en desktop, 2 en tablet (≤1100px), 1 en mobile (≤640px)
- Número `01–04` como watermark gigante translúcido en esquina sup. derecha (oculto en mobile)
- Ícono 60px en cuadrado redondeado con fondo del color propio de cada sección
- Título en Urbanist 1.45rem, descripción en Poppins 0.8rem
- Hover: línea de color fino en borde superior (`::before`) + fondo del ícono se intensifica + flecha se ilumina. Sin transform ni movimiento.
- Cada card tiene su propio color de acento: teal / amarillo / naranja / rojo

### Mobile (≤640px) — cards horizontales
En mobile las cards cambian a layout horizontal (patrón celda/lista):
- Ícono 48px a la izquierda, título+descripción al centro, flecha a la derecha
- Watermark oculto
- Touch target generoso (padding 1.1rem vertical)

### Íconos de cards
SVGs custom con `color` como prop inline (evita override de `* { color: var(--text-color) }`):
- Chachos → `IconUsers` — color `#a8dadc`
- Podrida → `IconLayers` — color `#f6c90e`
- Prode → `IconBars` — color `#f97316`
- Crónicas → `IconOpenBook` — color `#e63946`

---

## Navbar + Sidebar — estado actual ✅ CERRADO

### Archivos
- `frontend/src/components/Layout/Navbar/Navbar.jsx` + `NavbarStyle.css`
- `frontend/src/components/Layout/Sidebar/Sidebar.jsx` + `SidebarStyle.css`
- `frontend/src/components/Layout/Icons/SectionIcons.jsx` — SVGs compartidos entre Home y Sidebar

### Navbar
- Selector CSS es `nav.navbar` (no `nav` genérico) para no afectar al `<nav>` del Sidebar
- `border-bottom: 1px solid rgba(255,255,255,0.07)` — reemplazó el box-shadow agresivo
- **Logo**: monograma "C" en SVG (gradient teal, cuadrado redondeado con borde sutil) + texto "El Rincón de **Chacho**". Ambos envueltos en `<Link to="/home">` sin decoración
- **Breadcrumb**: separador vertical `|` + nombre de sección activa, inline en el flujo flex junto al logo. Se oculta en home. En mobile se oculta el logo-text pero se mantiene el breadcrumb (`[C] | Podrida`)
- **Área de usuario**: chip con avatar de inicial (círculo gradient teal), nombre, chevron bold (`stroke-width: 2.8`). Border visible en reposo, hover en teal
- `first_name` siempre como fuente del nombre — sin condición duplicada
- En mobile (≤600px): se ocultan logo-text y nombre de usuario; el breadcrumb y el monograma permanecen

### Sidebar
- Fondo dark `#0d0d0d` con borde derecho sutil
- Header: título "El Rincón de **Chacho**" (Protest Strike, gradient teal en "Chacho") + botón cerrar con borde visible
- Divisor: línea con gradient teal que desvanece en los extremos
- Click fuera del sidebar lo cierra (overlay semitransparente)
- Links en orden: Home → Galería → Chachos → Podrida → Prode → Crónicas → Admin
- Íconos de Chachos/Podrida/Prode/Crónicas son los mismos SVGs que las cards del home (importados desde SectionIcons.jsx)
- Home y Galería usan Material Symbols
- Colores de íconos definidos como variables CSS en App.css (ver abajo)
- Active state: highlight full-width + acento izquierdo teal (`inset 3px 0 0`)
- Hijos del `<a>` son `<div>` (no `<span>`) para evitar herencia de `a:hover > span { scale: 1.1 }` de ButtonsStyle.css

### Variables de color de sección (App.css `:root`)
```css
--color-home:     #94a3b8;
--color-galeria:  #67e8f9;
--color-chachos:  #a8dadc;
--color-podrida:  #f6c90e;
--color-prode:    #f97316;
--color-cronicas: #e63946;
--color-admin:    #6b8a9a;
```

---

## Auth pages — estado actual ✅ CERRADO

### Archivos
- `frontend/src/components/Users/Login/userLogin.jsx` + `userLoginStyles.css`
- `frontend/src/components/Users/Register/userRegister.jsx` + `userRegisterStyles.css`
- `frontend/src/components/Users/PasswordManagement/ForgotPassword.jsx`
- `frontend/src/components/Users/PasswordManagement/ResetPassword.jsx`
- `frontend/src/components/Users/PasswordManagement/ForgotPasswordStyles.css` — **compartido** por ForgotPassword y ResetPassword

### Patrón común
- Fondo `#0a0a0a` dark en todas — continuidad total con el home
- Barra inferior decorativa igual al hero: "amigos · fútbol · apuestas · memoria" + año
- `height: calc(100vh - 80px)` en desktop (sin scroll), `min-height` en mobile
- Inputs dark con focus en teal, botón teal full-width, mensajes de error en rojo
- Validaciones limpias (sin el "chacal" informal)

### Login (`/`)
- Split layout: izquierda título gigante Protest Strike + tagline + 4 chips de sección; derecha card con form
- Glow teal + línea vertical decorativa (misma que el hero)
- Link "¿Olvidaste tu contraseña?" inline junto al label de contraseña

### Register (`/register`)
- Split layout: izquierda "Unite al / Rincón de / **Chacho**" + tagline + 3 perks con checkmarks teal; derecha card con form
- Nombre + Apellido en dos columnas (colapsan a una en mobile ≤480px)
- "¿Ya tenés cuenta? Ingresá al Rincón de Chacho" al pie del form

### ForgotPassword (`/forgot-password`)
- Card centrada, ícono `lock_reset` en cuadrado teal
- Estado de éxito: form reemplazado por panel con `mark_email_read` + mensaje
- "← Volver al login" al pie

### ResetPassword (`/reset-password/:token`)
- Card centrada, ícono `lock_open` en cuadrado teal
- Fix del bug `type="newPassword"` → `type="password"` correcto
- Estado de éxito: check teal + redirect automático a los 2 segundos
- "← Volver al login" al pie

---

## UserMenu — estado actual ✅ CERRADO

### Archivos
- `frontend/src/components/Layout/UserMenu/UserMenu.jsx` + `UserMenuStyle.css`

### Diseño
- Panel dark `#0d0d0d` que aparece debajo de la navbar a la derecha (`top: 80px; right: 0`)
- Animación: fade + slide down suave con `cubic-bezier` — sin el hack de `translateY(-450px)` anterior
- Borde izquierdo y borde inferior sutil + `border-bottom-left-radius: 16px`
- Divisor teal igual al del Sidebar
- Click fuera del panel lo cierra (overlay semitransparente, mismo patrón que Sidebar)
- Lógica corregida: `um-open` cuando `userMenuOpen === true` (sin doble negación)

### Estructura
1. **Header**: avatar circular gradient teal con inicial, nombre completo, email (con ellipsis si es largo), botón cerrar con borde visible + hover teal (idéntico al Sidebar)
2. **Acciones**: "Cambiar contraseña" → `/forgot-password` + "Cerrar sesión" (hover en rojo)
- Hijos de `<a>` y `<button>` son `<div>` (no `<span>`) para evitar herencia de `button:hover span { scale: 1.1 }` de ButtonsStyle.css

### Decisión de scope
Se descartaron: Mi perfil, Mis favoritos, Destacados, redes sociales del creador. El menú muestra solo lo que tiene funcionalidad real. Stats personales del usuario se descartaron por la complejidad de la tabla de equivalencias entre user IDs y participantes de cada sección.

---

## Sección Chachos — estado del rediseño

### Tab Inicio ✅ CERRADO (junio 2026)
Archivos: `frontend/src/components/Chachos/ChachosInicio/ChachosInicio.jsx` + `ChachosInicioStyles.css`

Secciones implementadas (en orden):
1. Hero del último partido (resultado, rival, highlights)
2. Banner de votación (teal=abierta, verde=ya votó)
3. Formulario de voto — `<select>` desplegable (1–10 en 0.5), sin número de camiseta, perlas con toggle. CTA de pills de últimas fechas oculto si `open_for_vote=true`
4. Resultados de votación — ranking con sweep animado en #1, perlas con avatar
5. Rendimiento del equipo — barra tripartita + forma reciente 5 pills
6. Últimas 5 fechas — grilla pills con CTA condicional
7. Chips de perlas del torneo — 4 chips temáticos, líder con avatar, resto colapsado a 4 visibles con "Ver N más"
8. Estadísticas individuales — desktop: tabla 7 cols sorteable con scroll; mobile: pills selector (GOL/AST/AM/ROJ/PTS) + tabla 4 cols (Jugador/PJ/stat/AVG)

Backend modificado: `tournamentRoundRepository.js` — rankings pipeline agrega `*_pearl_count` y `avg_points` a 2 decimales; `seasonRounds` select incluye `open_for_vote`.

### Tabs pendientes
- **Estadísticas** — Rankings por torneo, perlas acumuladas, head-to-head vs rivales
- **Fechas** — Lista de fechas con detalle por partido
- **Jugadores** (reemplaza Nosotros) — Grid de cards con ficha completa

---

## Lo que queda pendiente (próximas sesiones)

- Tabs Estadísticas / Fechas / Jugadores de la sección Chachos
- Rediseño estético de las secciones internas (Podrida, Prode, Crónicas, Galería)
- Sistema de diseño global coherente entre secciones internas
- Página 404 con diseño real

---

## Commits de referencia
- `chore: snapshot before Home redesign` — estado previo al rediseño del Home

---

## Preferencias de trabajo del dueño del proyecto
- Ir por partes, sección por sección. No atacar todo junto
- Siempre proponer antes de codificar cuando se trata de cambios de diseño grandes
- No modificar nada sin haberlo discutido primero
- Verificar siempre en Chrome antes de dar algo por cerrado
- No asumir rutas, IDs ni estructuras de datos — verificar en el código
- El dueño prueba en producción local (`localhost`) en tiempo real
- **Nunca abreviar el nombre del sitio** — siempre "El Rincón de Chacho" completo. Jamás "el Rincón" a secas en ningún texto visible del sitio (títulos, subtítulos, taglines, placeholders, mensajes, etc.)
- **Referencias visuales y estéticas**: para decisiones de diseño, buscar inspiración en **[21st.dev](https://21st.dev)** y **[awwwards.com](https://awwwards.com)** — patrones modernos, componentes premium, tendencias actuales. Aplicar siempre dentro del sistema de diseño ya establecido (dark, teal, Protest Strike, Urbanist, sobriedad)
