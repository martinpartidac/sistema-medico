// Archivo: src/app/api/appointments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

// GET - Obtener todas las citas
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    
    let whereClause = {}
    
    if (date) {
      const selectedDate = new Date(date)
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      whereClause = {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    }
    
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })
    
    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Error al obtener citas' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva cita
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const data = await request.json()
    
    // Buscar doctor (puede ser el usuario actual si es doctor, o el primer doctor disponible)
    let doctorId = user.role === 'doctor' ? user.id : null
    
    if (!doctorId) {
      const firstDoctor = await prisma.user.findFirst({
        where: { role: 'doctor', isActive: true }
      })
      
      if (!firstDoctor) {
        return NextResponse.json(
          { error: 'No hay doctores disponibles' },
          { status: 400 }
        )
      }
      
      doctorId = firstDoctor.id
    }
    
    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(data.date),
        reason: data.reason,
        notes: data.notes || null,
        patientId: data.patientId,
        doctorId: doctorId,
        createdBy: user.id // Usuario que creó la cita
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
    
    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Error al crear cita' },
      { status: 500 }
    )
  }
}