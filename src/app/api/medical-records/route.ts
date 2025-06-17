// Archivo: src/app/api/medical-records/route.ts
// Versión simplificada sin doctor (según tu schema original)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los historiales médicos
export async function GET() {
  try {
    console.log('🔍 GET /api/medical-records - Obteniendo historiales...')
    
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
    
    console.log(`✅ Encontrados ${records.length} historiales médicos`)
    return NextResponse.json(records)
  } catch (error) {
    console.error('❌ Error fetching medical records:', error)
    return NextResponse.json(
      { error: 'Error al obtener historiales médicos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo historial médico
export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/medical-records - Creando historial...')
    
    const data = await request.json()
    console.log('📋 Datos recibidos:', JSON.stringify(data, null, 2))
    
    // Validación básica
    if (!data.patientId) {
      console.error('❌ PatientId faltante')
      return NextResponse.json(
        { error: 'PatientId es requerido' },
        { status: 400 }
      )
    }

    if (!data.chiefComplaint || !data.chiefComplaint.trim()) {
      console.error('❌ Motivo de consulta faltante')
      return NextResponse.json(
        { error: 'Motivo de consulta es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el paciente existe
    console.log('🔍 Verificando paciente:', data.patientId)
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    })

    if (!patient) {
      console.error('❌ Paciente no encontrado:', data.patientId)
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }
    console.log('✅ Paciente encontrado:', patient.firstName, patient.lastName)

    // Crear el historial médico SIN doctorId (según tu schema original)
    const recordData = {
      chiefComplaint: data.chiefComplaint?.trim() || '',
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
      patientId: data.patientId
      // NO incluir doctorId si no existe en tu schema
    }

    console.log('💾 Datos preparados para Prisma:', JSON.stringify(recordData, null, 2))
    
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
    
    console.log('✅ Historial médico creado exitosamente:', record.id)
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating medical record:')
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    console.error('Error code:', error?.code)
    
    // Errores específicos de Prisma
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un historial con estos datos' },
        { status: 409 }
      )
    }
    
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Error de referencia: paciente no válido' },
        { status: 400 }
      )
    }

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Error al crear historial médico',
        details: process.env.NODE_ENV === 'development' ? error?.message : 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}