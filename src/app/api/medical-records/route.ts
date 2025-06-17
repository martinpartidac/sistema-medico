// Archivo: src/app/api/medical-records/route.ts
// SOLUCIÓN FINAL CORRECTA - Doctor opcional

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true
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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validar patientId
    if (!data.patientId) {
      return NextResponse.json(
        { error: 'PatientId es requerido' },
        { status: 400 }
      )
    }

    // Mapear 'reason' a 'chiefComplaint'
    const chiefComplaint = data.reason || data.chiefComplaint
    
    if (!chiefComplaint || !chiefComplaint.trim()) {
      return NextResponse.json(
        { error: 'Motivo de consulta es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos para crear historial
    const recordData = {
      chiefComplaint: chiefComplaint.trim(),
      symptoms: data.symptoms?.trim() || null,
      diagnosis: data.diagnosis?.trim() || null,
      treatment: data.treatment?.trim() || null,
      prescription: data.prescription?.trim() || null,
      notes: data.notes?.trim() || null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      bloodPressure: data.bloodPressure?.trim() || null,
      heartRate: data.heartRate?.trim() || null,
      temperature: data.temperature?.trim() || null,
      weight: data.weight?.trim() || null,
      height: data.height?.trim() || null,
      patientId: data.patientId,
      // DOCTOR OPCIONAL - Solo conectar si se proporciona
      ...(data.doctorId && {
        doctorId: data.doctorId
      })
    }

    // Crear historial médico
    const record = await prisma.medicalRecord.create({
      data: recordData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        }
      }
    })
    
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating medical record:', error)
    return NextResponse.json(
      { 
        error: 'Error al crear historial médico',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      },
      { status: 500 }
    )
  }
}