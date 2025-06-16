// Archivo: src/app/api/medical-records/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los historiales médicos
export async function GET() {
  try {
    const records = await prisma.medicalRecord.findMany({
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching medical records:', error)
    return NextResponse.json(
      { error: 'Error al obtener historiales médicos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo historial médico
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
    
    const record = await prisma.medicalRecord.create({
      data: {
        chiefComplaint: data.chiefComplaint,
        symptoms: data.symptoms || null,
        diagnosis: data.diagnosis || null,
        treatment: data.treatment || null,
        prescription: data.prescription || null,
        notes: data.notes || null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        bloodPressure: data.bloodPressure || null,
        heartRate: data.heartRate || null,
        temperature: data.temperature || null,
        weight: data.weight || null,
        height: data.height || null,
        patientId: data.patientId,
        doctorId: doctor.id
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true
          }
        }
      }
    })
    
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating medical record:', error)
    return NextResponse.json(
      { error: 'Error al crear historial médico' },
      { status: 500 }
    )
  }
}