// Archivo: src/app/api/medical-records/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Actualizar historial médico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const record = await prisma.medicalRecord.update({
      where: { id: params.id },
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
    
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating medical record:', error)
    return NextResponse.json(
      { error: 'Error al actualizar historial médico' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar historial médico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.medicalRecord.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Historial médico eliminado' })
  } catch (error) {
    console.error('Error deleting medical record:', error)
    return NextResponse.json(
      { error: 'Error al eliminar historial médico' },
      { status: 500 }
    )
  }
}