// Archivo: src/lib/roleAuth.ts

import { NextRequest, NextResponse } from 'next/server'
import { getUser, AuthUser } from './auth'

export async function requireRole(
  request: NextRequest, 
  allowedRoles: ('doctor' | 'assistant')[]
): Promise<{ success: true; user: AuthUser } | { success: false; response: NextResponse }> {
  
  // Verificar autenticación
  const user = await getUser(request)
  
  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
  }

  // Verificar rol
  if (!allowedRoles.includes(user.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'Sin permisos suficientes',
          required: allowedRoles,
          current: user.role
        },
        { status: 403 }
      )
    }
  }

  return { success: true, user }
}

// Helper para doctores únicamente
export async function requireDoctor(request: NextRequest) {
  return requireRole(request, ['doctor'])
}

// Helper para doctores y asistentes
export async function requireDoctorOrAssistant(request: NextRequest) {
  return requireRole(request, ['doctor', 'assistant'])
}

// Función para usar en APIs
export function withRoleAuth(
  allowedRoles: ('doctor' | 'assistant')[],
  handler: (request: NextRequest, user: AuthUser, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const auth = await requireRole(request, allowedRoles)
    
    if (!auth.success) {
      return auth.response
    }
    
    return handler(request, auth.user, context)
  }
}