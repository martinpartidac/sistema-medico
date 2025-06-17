// Archivo: src/app/api/dashboard/stats/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  getTodayStartMexico, 
  getTodayEndMexico, 
  getMexicoDate 
} from '@/lib/dateUtils'

export async function GET() {
  try {
    // Fechas corregidas para México
    const today = getMexicoDate()
    const startOfDay = getTodayStartMexico()
    const endOfDay = getTodayEndMexico()
    
    // Inicio de la semana en México
    const startOfWeek = new Date(today)
    const dayOfWeek = startOfWeek.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Lunes como inicio de semana
    startOfWeek.setDate(today.getDate() - daysToSubtract)
    startOfWeek.setHours(0, 0, 0, 0)
    
    // Inicio del mes en México
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    startOfMonth.setHours(0, 0, 0, 0)

    console.log('=== DEBUG DASHBOARD STATS ===')
    console.log('Fecha actual México:', today.toISOString())
    console.log('Inicio del día:', startOfDay.toISOString())
    console.log('Fin del día:', endOfDay.toISOString())
    console.log('Inicio de semana:', startOfWeek.toISOString())

    // Consultas paralelas para optimizar rendimiento
    const [
      totalPatients,
      appointmentsToday,
      newPatientsThisWeek,
      appointmentsThisWeek,
      appointmentsByStatus,
      recentMedicalRecords,
      upcomingAppointments,
      appointmentsTodayDetails
    ] = await Promise.all([
      // Total de pacientes
      prisma.patient.count(),
      
      // Citas de hoy (corregido)
      prisma.appointment.count({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      
      // Nuevos pacientes esta semana
      prisma.patient.count({
        where: {
          createdAt: {
            gte: startOfWeek
          }
        }
      }),
      
      // Citas esta semana
      prisma.appointment.count({
        where: {
          date: {
            gte: startOfWeek
          }
        }
      }),
      
      // Citas por estado
      prisma.appointment.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }),
      
      // Historiales médicos recientes (últimos 5)
      prisma.medicalRecord.findMany({
        take: 5,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      
      // Próximas citas (siguientes 5)
      prisma.appointment.findMany({
        take: 5,
        where: {
          date: {
            gte: startOfDay // Desde hoy en adelante
          },
          status: 'scheduled'
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      }),

      // Debug: obtener citas de hoy con detalles
      prisma.appointment.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      })
    ])

    // Debug: mostrar citas de hoy
    console.log(`Citas de hoy encontradas: ${appointmentsTodayDetails.length}`)
    appointmentsTodayDetails.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.patient.firstName} ${apt.patient.lastName} - ${apt.date.toISOString()} - ${apt.reason}`)
    })

    // Formatear datos de estados de citas
    const appointmentStatusData = appointmentsByStatus.map(item => ({
      status: item.status,
      count: item._count.status,
      label: item.status === 'scheduled' ? 'Programadas' :
             item.status === 'completed' ? 'Completadas' :
             item.status === 'cancelled' ? 'Canceladas' : item.status
    }))

    const stats = {
      totalPatients,
      appointmentsToday,
      newPatientsThisWeek,
      appointmentsThisWeek,
      appointmentStatusData,
      recentMedicalRecords,
      upcomingAppointments,
      // Información de debug
      debug: {
        todayStart: startOfDay.toISOString(),
        todayEnd: endOfDay.toISOString(),
        appointmentsTodayCount: appointmentsTodayDetails.length,
        appointmentsTodayList: appointmentsTodayDetails.map(apt => ({
          patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
          date: apt.date.toISOString(),
          reason: apt.reason
        }))
      }
    }

    console.log('Stats finales:', {
      totalPatients,
      appointmentsToday,
      upcomingAppointments: upcomingAppointments.length
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    )
  }
}