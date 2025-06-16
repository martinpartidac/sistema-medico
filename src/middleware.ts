// Archivo: src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicPaths = [
    '/login',
    '/api/auth/login',
    '/api/auth/logout',
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

  // Verificar si hay token de sesión (validación básica)
  const token = request.cookies.get('session-token')?.value

  if (!token) {
    // No hay token, redirigir a login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si hay token, permitir acceso (la validación real se hará en cada API)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Proteger todas las rutas excepto:
     * - api/auth (rutas de autenticación)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}