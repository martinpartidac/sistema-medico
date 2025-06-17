// Archivo: src/app/dashboard/medical-records/page.tsx
// Página actualizada con selector inteligente de pacientes

'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, FileText, User, Calendar, Search, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import SmartMedicalRecordForm from '@/components/SmartMedicalRecordForm'

interface Patient {
  id: string
  firstName: string
  lastName: string
  phone: string
}

interface MedicalRecord {
  id: string
  reason: string
  diagnosis: string
  symptoms?: string
  treatment?: string
  prescription?: string
  bloodPressure?: string
  heartRate?: string
  temperature?: string
  weight?: string
  height?: string
  notes?: string
  createdAt: string
  patient: Patient
}

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch medical records
  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/medical-records')
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      }
    } catch (error) {
      console.error('Error fetching medical records:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // Handle form submission
  const handleRecordSubmit = async (success: boolean) => {
    if (success) {
      await fetchRecords()
      setShowForm(false)
      setEditingRecord(null)
      console.log('Historial médico guardado exitosamente')
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este historial médico?')) {
      try {
        const response = await fetch(`/api/medical-records/${id}`, { 
          method: 'DELETE' 
        })
        if (response.ok) {
          await fetchRecords()
        }
      } catch (error) {
        console.error('Error deleting medical record:', error)
      }
    }
  }

  // Handle edit
  const handleEdit = (record: MedicalRecord) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  // Filter records based on search
  const filteredRecords = records.filter(record => {
    const patientName = `${record.patient.firstName} ${record.patient.lastName}`.toLowerCase()
    const search = searchTerm.toLowerCase()
    return patientName.includes(search) || 
           record.reason.toLowerCase().includes(search) ||
           record.diagnosis.toLowerCase().includes(search)
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4">
                <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Historiales Médicos</h1>
            </div>
            <button
              onClick={() => {
                setEditingRecord(null)
                setShowForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Historial
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Info Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-900">
                  ✨ Funcionalidad mejorada
                </h3>
                <p className="text-sm text-green-800 mt-1">
                  Ahora puedes crear historiales médicos para <strong>cualquier paciente</strong>, 
                  no solo los que tienen citas programadas. También puedes crear nuevos pacientes durante el proceso.
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar por paciente, motivo o diagnóstico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600">
                Mostrando {filteredRecords.length} de {records.length} historiales
              </p>
            )}
          </div>

          {/* Records List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Cargando historiales médicos...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {filteredRecords.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  {searchTerm ? (
                    <>
                      <p className="text-lg font-medium mb-2">No se encontraron historiales</p>
                      <p className="text-sm text-gray-400 mb-4">
                        No hay historiales que coincidan con "{searchTerm}"
                      </p>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Limpiar búsqueda
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-2">No hay historiales médicos</p>
                      <p className="text-sm text-gray-400 mb-4">Comienza creando el primer historial médico</p>
                      <button
                        onClick={() => {
                          setEditingRecord(null)
                          setShowForm(true)
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear primer historial
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredRecords
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((record) => (
                    <li key={record.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {record.patient.firstName} {record.patient.lastName}
                                </h3>
                                <span className="text-sm text-gray-500">
                                  - {formatDate(record.createdAt)}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-gray-600">
                                  <span className="font-medium mr-2">Motivo:</span>
                                  {record.reason}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <span className="font-medium mr-2">Diagnóstico:</span>
                                  {record.diagnosis}
                                </div>
                                {record.symptoms && (
                                  <div className="flex items-start text-sm text-gray-600">
                                    <span className="font-medium mr-2">Síntomas:</span>
                                    <span className="line-clamp-2">{record.symptoms}</span>
                                  </div>
                                )}
                                {(record.bloodPressure || record.temperature || record.weight) && (
                                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                                    {record.bloodPressure && (
                                      <span>📊 {record.bloodPressure}</span>
                                    )}
                                    {record.temperature && (
                                      <span>🌡️ {record.temperature}°C</span>
                                    )}
                                    {record.weight && (
                                      <span>⚖️ {record.weight}kg</span>
                                    )}
                                  </div>
                                )}
                                {record.treatment && (
                                  <div className="flex items-start text-sm text-gray-600">
                                    <span className="font-medium mr-2">Tratamiento:</span>
                                    <span className="line-clamp-1">{record.treatment}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar historial"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Eliminar historial"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Smart Medical Record Form Modal */}
      {showForm && (
        <SmartMedicalRecordForm
          onSubmit={handleRecordSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingRecord(null)
          }}
          editingRecord={editingRecord}
        />
      )}
    </div>
  )
}