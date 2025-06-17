// Archivo: src/app/api/medical-records/route.ts
// SOLUCIÓN FINAL - Fix relación Prisma

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

    // SOLUCIÓN: Usar 'connect' para la relación patient
    const record = await prisma.medicalRecord.create({
      data: {
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
        // FIX: Conectar paciente explícitamente
        patient: {
          connect: {
            id: data.patientId
          }
        }
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