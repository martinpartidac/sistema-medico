// Archivo: src/app/api/system/config/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener configuración del sistema
export async function GET() {
  try {
    let config = await prisma.systemConfig.findUnique({
      where: { id: 'system' }
    })

    // Si no existe configuración, crear una por defecto
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: 'system',
          doctorName: 'Dr. Juan Pérez',
          clinicName: 'Sistema Médico',
          doctorSpecialty: 'Medicina General',
          doctorPhone: '+52 81 1234 5678',
          doctorEmail: 'doctor@ejemplo.com'
        }
      })
    }
    
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching system config:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración del sistema' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración del sistema
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const config = await prisma.systemConfig.upsert({
      where: { id: 'system' },
      update: {
        doctorName: data.doctorName,
        clinicName: data.clinicName,
        doctorSpecialty: data.doctorSpecialty,
        doctorPhone: data.doctorPhone,
        doctorEmail: data.doctorEmail,
        clinicAddress: data.clinicAddress || null,
      },
      create: {
        id: 'system',
        doctorName: data.doctorName,
        clinicName: data.clinicName,
        doctorSpecialty: data.doctorSpecialty,
        doctorPhone: data.doctorPhone,
        doctorEmail: data.doctorEmail,
        clinicAddress: data.clinicAddress || null,
      }
    })
    
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating system config:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuración del sistema' },
      { status: 500 }
    )
  }
}