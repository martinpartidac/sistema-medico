// Archivo: src/lib/auth.ts

import bcrypt from 'bcrypt'
import { prisma } from './prisma'
import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'doctor' | 'assistant'
  specialty?: string
}

// Hashear contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verificar contraseña
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generar token de sesión
export function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36)
}

// Crear sesión
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  })

  return token
}

// Validar sesión
export async function validateSession(token: string): Promise<AuthUser | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } })
      }
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as 'doctor' | 'assistant',
      specialty: session.user.specialty || undefined
    }
  } catch (error) {
    console.error('Error validating session:', error)
    return null
  }
}

// Obtener usuario de la request
export async function getUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('session-token')?.value
  if (!token) return null
  
  return validateSession(token)
}

// Eliminar sesión
export async function deleteSession(token: string): Promise<void> {
  try {
    await prisma.session.delete({ where: { token } })
  } catch (error) {
    console.error('Error deleting session:', error)
  }
}