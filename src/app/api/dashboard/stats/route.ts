// Archivo: src/app/api/dashboard/stats/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fechas para calcular rangos
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Consultas paralelas para optimizar rendimiento
    const [
      totalPatients,
      appointmentsToday,
      newPatientsThisWeek,
      appointmentsThisWeek,
      appointmentsByStatus,
      recentMedicalRecords,
      upcomingAppointments,
      patientsGrowthData
    ] = await Promise.all([
      // Total de pacientes
      prisma.patient.count(),
      
      // Citas de hoy
      prisma.appointment.count({
        where: {
          date: {
            gte: startOfDay,
            lt: endOfDay
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
            gte: new Date()
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
      
      // Crecimiento de pacientes (últimos 6 meses)
      prisma.$queryRaw`
        SELECT 
          strftime('%Y-%m', createdAt) as month,
          COUNT(*) as count
        FROM patients 
        WHERE createdAt >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', createdAt)
        ORDER BY month ASC
      `
    ])

    // Procesar datos de crecimiento para el gráfico
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const processedGrowthData = (patientsGrowthData as any[]).map(item => ({
      month: monthNames[parseInt(item.month.split('-')[1]) - 1] + ' ' + item.month.split('-')[0],
      patients: parseInt(item.count)
    }))

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
      patientsGrowthData: processedGrowthData
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    )
  }
}