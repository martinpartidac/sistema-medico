import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function GET() {
  return NextResponse.json({ message: 'Test endpoint working' })
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('=== TEST AUTH DEBUG ===')
    console.log('Email received:', email)
    console.log('Password received:', password)
    
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
        isActive: true 
      }
    })
    
    console.log('User found:', !!user)
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado', email })
    }
    
    console.log('Stored hash preview:', user.password.substring(0, 20))
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log('Password match:', isValid)
    
    return NextResponse.json({
      success: true,
      userFound: true,
      passwordMatch: isValid,
      userEmail: user.email,
      userRole: user.role,
      storedHashPreview: user.password.substring(0, 20) + '...'
    })
    
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({ 
      error: 'Error interno', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}