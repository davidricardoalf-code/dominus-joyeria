import { NextRequest, NextResponse } from 'next/server';

// Protección opcional de la app por Basic Auth.
// Se activa SOLO si defines DOMINUS_USER y DOMINUS_PASS en el entorno.
export function middleware(req: NextRequest) {
  const user = process.env.DOMINUS_USER;
  const pass = process.env.DOMINUS_PASS;

  // Si no hay credenciales configuradas, la app queda abierta.
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const sep = decoded.indexOf(':');
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (u === user && p === pass) return NextResponse.next();
    } catch {
      // cae al 401
    }
  }

  return new NextResponse('Acceso restringido · Dominus Joyería', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Dominus Joyeria", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
