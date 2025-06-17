// Archivo: src/app/api/medical-records/route.ts
// VERSIÓN DEBUG - Para encontrar el error 500 específico

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
    console.log('🚀 Iniciando POST /api/medical-records')
    
    const data = await request.json()
    console.log('📦 Datos recibidos:', JSON.stringify(data, null, 2))
    
    // Validar patientId
    if (!data.patientId) {
      console.log('❌ PatientId faltante')
      return NextResponse.json(
        { error: 'PatientId es requerido' },
        { status: 400 }
      )
    }

    // Mapear 'reason' a 'chiefComplaint'
    const chiefComplaint = data.reason || data.chiefComplaint
    console.log('✅ Motivo de consulta mapeado:', chiefComplaint)
    
    if (!chiefComplaint || !chiefComplaint.trim()) {
      console.log('❌ Motivo de consulta vacío')
      return NextResponse.json(
        { error: 'Motivo de consulta es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el paciente existe
    console.log('🔍 Buscando paciente:', data.patientId)
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    })

    if (!patient) {
      console.log('❌ Paciente no encontrado')
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }
    console.log('✅ Paciente encontrado:', patient.firstName)

    // Preparar datos con validación de tipos
    console.log('💾 Preparando datos para Prisma...')
    const recordData = {
      chiefComplaint: String(chiefComplaint).trim(),
      symptoms: data.symptoms ? String(data.symptoms).trim() : null,
      diagnosis: data.diagnosis ? String(data.diagnosis).trim() : null,
      treatment: data.treatment ? String(data.treatment).trim() : null,
      prescription: data.prescription ? String(data.prescription).trim() : null,
      notes: data.notes ? String(data.notes).trim() : null,
      followUpDate: data.followUpDate && data.followUpDate.trim() ? new Date(data.followUpDate) : null,
      bloodPressure: data.bloodPressure ? String(data.bloodPressure).trim() : null,
      heartRate: data.heartRate ? String(data.heartRate).trim() : null,
      temperature: data.temperature ? String(data.temperature).trim() : null,
      weight: data.weight ? String(data.weight).trim() : null,
      height: data.height ? String(data.height).trim() : null,
      patientId: String(data.patientId)
    }

    console.log('💾 Datos finales para crear:', JSON.stringify(recordData, null, 2))

    // Intentar crear el record
    console.log('🔄 Ejecutando prisma.medicalRecord.create...')
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
        }
      }
    })
    
    console.log('🎉 Historial creado exitosamente! ID:', record.id)
    return NextResponse.json(record, { status: 201 })
    
  } catch (error) {
    console.error('💥 ERROR COMPLETO EN POST:')
    console.error('💥 Error name:', error.name)
    console.error('💥 Error message:', error.message)
    console.error('💥 Error code:', error.code)
    console.error('💥 Error stack:', error.stack)
    
    // Errores específicos de Prisma con más detalle
    if (error.code === 'P2002') {
      console.error('💥 Error P2002: Unique constraint violation')
      console.error('💥 Campos afectados:', error.meta?.target)
      return NextResponse.json(
        { 
          error: 'Error de duplicado - ya existe un historial con estos datos',
          details: `Conflicto en campos: ${error.meta?.target?.join(', ') || 'desconocido'}`
        },
        { status: 409 }
      )
    }
    
    if (error.code === 'P2003') {
      console.error('💥 Error P2003: Foreign key constraint')
      console.error('💥 Campo afectado:', error.meta?.field_name)
      return NextResponse.json(
        { 
          error: 'Error de referencia - ID de paciente no válido',
          details: `Campo problemático: ${error.meta?.field_name || 'patientId'}`
        },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      console.error('💥 Error P2025: Record not found')
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      )
    }

    if (error.code?.startsWith('P')) {
      console.error('💥 Error Prisma genérico:', error.code)
      return NextResponse.json(
        { 
          error: `Error de base de datos: ${error.code}`,
          details: error.message
        },
        { status: 500 }
      )
    }

    // Error genérico
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message,
        type: error.name
      },
      { status: 500 }
    )
  }
}