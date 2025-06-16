import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas completamente públicas
  const publicPaths = [
    '/login',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/debug/login',
    '/api/test-auth',
    '/_next',
    '/favicon.ico'
  ]
  
  // Si es una ruta pública, permitir acceso
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Si está en la página principal, redirigir al dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Verificar token de sesión
  const token = request.cookies.get('session-token')?.value

  if (!token) {
    // Si es una request a API, devolver 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Si es una página, redirigir a login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si hay token, permitir acceso (la validación real se hará en cada API)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|api/debug|api/test-auth|_next/static|_next/image|favicon.ico).*)',
  ],
}