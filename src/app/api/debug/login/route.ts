import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('=== DEBUG LOGIN ===')
    console.log('Email:', email)
    console.log('Password:', password)
    
    // Paso 1: Buscar usuario
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
        isActive: true
      }
    })
    
    console.log('Usuario encontrado:', !!user)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado', email })
    }
    
    console.log('Usuario email:', user.email)
    console.log('Usuario hash:', user.password.substring(0, 20) + '...')
    
    // Paso 2: Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log('Password válida:', isValidPassword)
    
    if (!isValidPassword) {
      return NextResponse.json({ 
        error: 'Contraseña incorrecta',
        inputPassword: password,
        storedHash: user.password.substring(0, 20) + '...'
      })
    }
    
    // Paso 3: Intentar crear sesión
    const sessionToken = crypto.randomUUID() + '-' + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    console.log('Creando sesión...')
    
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt
      }
    })
    
    console.log('Sesión creada:', !!session)
    
    return NextResponse.json({
      success: true,
      userFound: true,
      passwordMatch: true,
      sessionCreated: true,
      sessionToken: sessionToken.substring(0, 10) + '...'
    })
    
  } catch (error) {
    console.error('ERROR COMPLETO:', error)
    return NextResponse.json({ 
      error: 'Error interno', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}