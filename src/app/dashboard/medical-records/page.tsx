'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Search, FileText, Calendar, User, Heart, Thermometer, Weight, Activity, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const RoleGuard = dynamic(() => import('@/components/RoleGuard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
})

interface Patient {
  id: string
  firstName: string
  lastName: string
  phone: string
  dateOfBirth: string
}

interface MedicalRecord {
  id: string
  chiefComplaint: string
  symptoms?: string
  diagnosis?: string
  treatment?: string
  prescription?: string
  notes?: string
  followUpDate?: string
  bloodPressure?: string
  heartRate?: number
  temperature?: number
  weight?: number
  height?: number
  createdAt: string
  patient: Patient
}

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    chiefComplaint: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    notes: '',
    followUpDate: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: ''
  })

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
    }
  }

  // Fetch patients
  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
    fetchPatients()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingRecord ? `/api/medical-records/${editingRecord.id}` : '/api/medical-records'
      const method = editingRecord ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        followUpDate: formData.followUpDate || null,
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchRecords()
        setShowForm(false)
        setEditingRecord(null)
        setFormData({
          patientId: '', chiefComplaint: '', symptoms: '', diagnosis: '', treatment: '',
          prescription: '', notes: '', followUpDate: '', bloodPressure: '', heartRate: '',
          temperature: '', weight: '', height: ''
        })
      }
    } catch (error) {
      console.error('Error saving medical record:', error)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este historial médico?')) {
      try {
        const response = await fetch(`/api/medical-records/${id}`, { method: 'DELETE' })
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
    setFormData({
      patientId: record.patient.id,
      chiefComplaint: record.chiefComplaint,
      symptoms: record.symptoms || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      prescription: record.prescription || '',
      notes: record.notes || '',
      followUpDate: record.followUpDate ? record.followUpDate.split('T')[0] : '',
      bloodPressure: record.bloodPressure || '',
      heartRate: record.heartRate?.toString() || '',
      temperature: record.temperature?.toString() || '',
      weight: record.weight?.toString() || '',
      height: record.height?.toString() || ''
    })
    setShowForm(true)
  }

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      `${record.patient.firstName} ${record.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesPatient = selectedPatient === '' || record.patient.id === selectedPatient
    
    return matchesSearch && matchesPatient
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100
    return (weight / (heightInMeters * heightInMeters)).toFixed(1)
  }

  return (
    <RoleGuard allowedRoles={['doctor']}>
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
              onClick={() => setShowForm(true)}
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
          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buscar por paciente, motivo o diagnóstico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Patient Filter */}
              <select
                className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="">Todos los pacientes</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Medical Records List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Cargando historiales...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron historiales médicos</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Crear primer historial
                  </button>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <div key={record.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                              <FileText className="h-6 w-6 text-red-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {record.patient.firstName} {record.patient.lastName}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(record.createdAt)}
                              </div>
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {calculateAge(record.patient.dateOfBirth)} años
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Clinical Information */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Información Clínica</h4>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700">Motivo de consulta:</label>
                            <p className="text-sm text-gray-900 mt-1">{record.chiefComplaint}</p>
                          </div>

                          {record.symptoms && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Síntomas:</label>
                              <p className="text-sm text-gray-900 mt-1">{record.symptoms}</p>
                            </div>
                          )}

                          {record.diagnosis && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Diagnóstico:</label>
                              <p className="text-sm text-gray-900 mt-1 font-medium">{record.diagnosis}</p>
                            </div>
                          )}

                          {record.treatment && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Tratamiento:</label>
                              <p className="text-sm text-gray-900 mt-1">{record.treatment}</p>
                            </div>
                          )}

                          {record.prescription && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Receta:</label>
                              <p className="text-sm text-gray-900 mt-1">{record.prescription}</p>
                            </div>
                          )}
                        </div>

                        {/* Vital Signs */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Signos Vitales</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {record.bloodPressure && (
                              <div className="flex items-center space-x-2">
                                <Heart className="h-4 w-4 text-red-500" />
                                <div>
                                  <p className="text-xs text-gray-500">Presión arterial</p>
                                  <p className="text-sm font-medium">{record.bloodPressure}</p>
                                </div>
                              </div>
                            )}

                            {record.heartRate && (
                              <div className="flex items-center space-x-2">
                                <Activity className="h-4 w-4 text-red-500" />
                                <div>
                                  <p className="text-xs text-gray-500">Freq. cardíaca</p>
                                  <p className="text-sm font-medium">{record.heartRate} bpm</p>
                                </div>
                              </div>
                            )}

                            {record.temperature && (
                              <div className="flex items-center space-x-2">
                                <Thermometer className="h-4 w-4 text-orange-500" />
                                <div>
                                  <p className="text-xs text-gray-500">Temperatura</p>
                                  <p className="text-sm font-medium">{record.temperature}°C</p>
                                </div>
                              </div>
                            )}

                            {record.weight && (
                              <div className="flex items-center space-x-2">
                                <Weight className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="text-xs text-gray-500">Peso</p>
                                  <p className="text-sm font-medium">{record.weight} kg</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {record.weight && record.height && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-md">
                              <p className="text-xs text-gray-500">IMC (Índice de Masa Corporal)</p>
                              <p className="text-sm font-medium text-blue-900">
                                {calculateBMI(record.weight, record.height)}
                              </p>
                            </div>
                          )}

                          {record.followUpDate && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                              <p className="text-xs text-gray-500">Fecha de seguimiento</p>
                              <p className="text-sm font-medium text-yellow-900">
                                {formatDate(record.followUpDate)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {record.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <label className="text-sm font-medium text-gray-700">Notas adicionales:</label>
                          <p className="text-sm text-gray-900 mt-1">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {editingRecord ? 'Editar Historial Médico' : 'Nuevo Historial Médico'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Paciente</label>
                  <select
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.patientId}
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                  >
                    <option value="">Seleccionar paciente</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Clinical Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 border-b pb-2">Información Clínica</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Motivo de consulta *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.chiefComplaint}
                        onChange={(e) => setFormData({...formData, chiefComplaint: e.target.value})}
                        placeholder="Ej: Dolor de cabeza"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Síntomas</label>
                      <textarea
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.symptoms}
                        onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                        placeholder="Describa los síntomas del paciente..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Diagnóstico</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                        placeholder="Diagnóstico médico"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Tratamiento</label>
                      <textarea
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.treatment}
                        onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                        placeholder="Tratamiento recomendado..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Receta médica</label>
                      <textarea
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.prescription}
                        onChange={(e) => setFormData({...formData, prescription: e.target.value})}
                        placeholder="Medicamentos recetados..."
                      />
                    </div>
                  </div>

                  {/* Vital Signs */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 border-b pb-2">Signos Vitales</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Presión arterial</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.bloodPressure}
                          onChange={(e) => setFormData({...formData, bloodPressure: e.target.value})}
                          placeholder="120/80"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Freq. cardíaca</label>
                        <input
                          type="number"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.heartRate}
                          onChange={(e) => setFormData({...formData, heartRate: e.target.value})}
                          placeholder="80"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Temperatura (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.temperature}
                          onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                          placeholder="36.5"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Peso (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.weight}
                          onChange={(e) => setFormData({...formData, weight: e.target.value})}
                          placeholder="70"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Altura (cm)</label>
                        <input
                          type="number"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.height}
                          onChange={(e) => setFormData({...formData, height: e.target.value})}
                          placeholder="170"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Fecha de seguimiento</label>
                        <input
                          type="date"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.followUpDate}
                          onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Notas adicionales</label>
                      <textarea
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Observaciones adicionales, recomendaciones especiales..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingRecord(null)
                      setFormData({
                        patientId: '', chiefComplaint: '', symptoms: '', diagnosis: '', treatment: '',
                        prescription: '', notes: '', followUpDate: '', bloodPressure: '', heartRate: '',
                        temperature: '', weight: '', height: ''
                      })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    {editingRecord ? 'Actualizar' : 'Crear'} Historial
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}