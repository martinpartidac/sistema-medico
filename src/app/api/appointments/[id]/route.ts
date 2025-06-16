// Archivo: src/app/api/appointments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

// PUT - Actualizar cita
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const data = await request.json()
    
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        date: new Date(data.date),
        reason: data.reason,
        status: data.status,
        notes: data.notes || null,
        patientId: data.patientId
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    })
    
    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cita' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cita
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    await prisma.appointment.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Cita eliminada' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cita' },
      { status: 500 }
    )
  }
}