# Dominus Joyería · Inventario de Relojes

App de inventario para Dominus Joyería. Next.js 15 + TypeScript + Tailwind + Supabase.
Diseño minimalista en modo oscuro (negro `#000000`, dorado `#DDAD2D`).

## Funcionalidades

- Registro de relojes: hasta 3 fotos, marca, milímetros, movimiento automático, precios y estado.
- Las fotos se convierten automáticamente a **JPG optimizado** (`browser-image-compression`) antes de subirse.
- **Precio Costo** se calcula solo: `Precio Compra + 20%`.
- **3 PDFs** por reloj (una página, negro y dorado):
  - **Mayorista**: logo, foto, marca, mm, movimiento, **Precio Mayorista** + **Precio Sugerido (Cliente)**.
  - **Catálogo (cliente del mayorista)**: **sin logo, sin precios**. Solo foto, marca, mm, movimiento.
  - **Cliente directo**: logo, foto, marca, mm, movimiento, **Precio Final Cliente**.
- **Enviar reloj (WhatsApp)**: genera una tarjeta de imagen (canvas) **sin logo** con foto, marca, mm, movimiento y precio final, y abre el menú nativo de compartir (Web Share API).

---

## 1. Instalar

```bash
npm install
```

## 2. Variables de entorno

Copia `.env.local.example` a `.env.local` y completa:

```bash
cp .env.local.example .env.local
```

| Variable | Dónde se obtiene | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key | Sí |
| `NEXT_PUBLIC_CURRENCY` | Símbolo de moneda (`$`, `₡`…). Por defecto `$` | No |
| `DOMINUS_USER` / `DOMINUS_PASS` | Usuario y contraseña para proteger la app (Basic Auth) | No (recomendado) |

> Si defines `DOMINUS_USER` **y** `DOMINUS_PASS`, la app pedirá usuario/contraseña al entrar.
> Si los dejas vacíos, la app queda abierta.

## 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query**, pega todo el contenido de `supabase/schema.sql` y pulsa **Run**.
   Esto crea la tabla `relojes`, el bucket público `relojes` y las políticas necesarias.
3. Copia la **Project URL** y la **anon key** a tu `.env.local`.

## 4. Ejecutar en local

```bash
npm run dev
```

Abre http://localhost:3000

## 5. Desplegar en Vercel

> ⚠️ **No uses el "Vercel Drop" del navegador (arrastrar y soltar).** Pierde archivos
> de carpetas anidadas (deja fuera `src/app`) y el build falla con
> *"Couldn't find any 'pages' or 'app' directory"*. Usa GitHub o la CLI.

### Opción A — GitHub (recomendada)

1. Descomprime el ZIP.
2. Sube TODA la carpeta a un repo de GitHub.
3. En Vercel → **New Project** → importa el repo (detecta Next.js solo).
4. En **Settings → Environment Variables**, agrega las mismas variables de `.env.local`.
5. Deploy.

### Opción B — Vercel CLI

```bash
npm i -g vercel
cd dominus-inventario
vercel          # vista previa
vercel --prod   # producción
```

La CLI sube la carpeta completa respetando la estructura.

---

## Notas de seguridad

Esta es una herramienta **interna**. Las políticas de Supabase permiten lectura/escritura con la
`anon key` (que es pública), por eso se incluye el **Basic Auth** del middleware para proteger la
interfaz. Para seguridad fuerte (multiusuario, login real), integra **Supabase Auth** y reemplaza
las políticas de `schema.sql` por unas basadas en `auth.uid()`.

## Estructura

```
.
├── middleware.ts            # Basic Auth opcional
├── supabase/schema.sql      # Tabla, bucket y políticas
├── public/logo.png          # Logo Dominus (blanco/dorado)
└── src/
    ├── app/                 # layout, página, estilos globales
    ├── components/          # Header, formulario, inventario, tarjeta, UI
    ├── lib/                 # supabase, pricing, compresión, PDF, tarjeta WhatsApp
    └── types/               # tipos del dominio
```
