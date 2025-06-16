// Archivo: src/app/api/patients/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los pacientes
export async function GET() {
  try {
    // Primero verificamos si existe al menos un doctor
    let doctor = await prisma.user.findFirst()
    
    if (!doctor) {
      // Crear doctor por defecto si no existe
      doctor = await prisma.user.create({
        data: {
          id: 'default-doctor-id',
          email: 'doctor@ejemplo.com',
          name: 'Dr. Juan Pérez',
          specialty: 'Medicina General',
          phone: '+52 81 1234 5678'
        }
      })
    }

    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: 'Error al obtener pacientes' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo paciente
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Buscar doctor existente o usar el por defecto
    let doctor = await prisma.user.findFirst()
    
    if (!doctor) {
      doctor = await prisma.user.create({
        data: {
          id: 'default-doctor-id',
          email: 'doctor@ejemplo.com',
          name: 'Dr. Juan Pérez',
          specialty: 'Medicina General',
          phone: '+52 81 1234 5678'
        }
      })
    }
    
    const patient = await prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone,
        dateOfBirth: new Date(data.dateOfBirth),
        doctorId: doctor.id
      }
    })
    
    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: 'Error al crear paciente' },
      { status: 500 }
    )
  }
}