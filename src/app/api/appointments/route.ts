// Archivo: src/app/api/appointments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { 
  getStartOfDayMexico, 
  getEndOfDayMexico, 
  createMexicoDate,
  getTodayStartMexico,
  getTodayEndMexico
} from '@/lib/dateUtils'

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
      // Usar las funciones de fecha corregidas para México
      const startOfDay = getStartOfDayMexico(date)
      const endOfDay = getEndOfDayMexico(date)
      
      console.log(`Filtrando citas para ${date}:`)
      console.log(`Inicio: ${startOfDay.toISOString()}`)
      console.log(`Fin: ${endOfDay.toISOString()}`)
      
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
    
    console.log(`Encontradas ${appointments.length} citas`)
    
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
    
    console.log('Datos recibidos para nueva cita:', data)
    
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
    
    // Crear la fecha correctamente en zona horaria de México
    let appointmentDate: Date
    
    if (typeof data.date === 'string' && data.date.includes('T')) {
      // Si ya viene con hora (formato ISO)
      appointmentDate = new Date(data.date)
    } else {
      // Si viene como objeto con date y time separados
      const dateStr = data.date.split('T')[0] // Asegurar que solo tomamos la fecha
      const timeStr = data.time || '09:00' // Usar hora por defecto si no viene
      
      console.log(`Creando cita para: ${dateStr} a las ${timeStr}`)
      
      // Usar la función corregida para crear fecha en México
      appointmentDate = createMexicoDate(dateStr, timeStr)
    }
    
    console.log('Fecha final de la cita:', appointmentDate.toISOString())
    
    const appointment = await prisma.appointment.create({
      data: {
        date: appointmentDate,
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
    
    console.log('Cita creada exitosamente:', appointment.id)
    
    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Error al crear cita', details: error.message },
      { status: 500 }
    )
  }
}