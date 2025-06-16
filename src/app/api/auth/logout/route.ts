// Archivo: src/app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session-token')?.value

    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.json({ success: true })
    
    // Eliminar cookie de sesión
    response.cookies.set('session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })

    return response
  } catch (error) {
    console.error('Error in logout:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}