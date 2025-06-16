// Archivo: src/app/api/patients/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Actualizar paciente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const patient = await prisma.patient.update({
      where: { id: params.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone,
        dateOfBirth: new Date(data.dateOfBirth),
      }
    })
    
    return NextResponse.json(patient)
  } catch (error) {
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: 'Error al actualizar paciente' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar paciente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.patient.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Paciente eliminado' })
  } catch (error) {
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { error: 'Error al eliminar paciente' },
      { status: 500 }
    )
  }
}