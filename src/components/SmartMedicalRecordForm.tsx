// Archivo: src/components/SmartMedicalRecordForm.tsx

'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, User, FileText, Heart, Thermometer, Scale, X, CheckCircle } from 'lucide-react'

interface Patient {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  dateOfBirth: string
}

interface PatientFormData {
  firstName: string
  lastName: string
  phone: string
  email: string
  dateOfBirth: string
}

interface MedicalRecordFormData {
  // Información Clínica
  reason: string
  symptoms: string
  diagnosis: string
  treatment: string
  prescription: string
  
  // Signos Vitales
  bloodPressure: string
  heartRate: string
  temperature: string
  weight: string
  height: string
  followUpDate: string
  
  // Notas adicionales
  notes: string
}

interface SmartMedicalRecordFormProps {
  onSubmit: (success: boolean) => void
  onCancel: () => void
  editingRecord?: any
}

export default function SmartMedicalRecordForm({ 
  onSubmit, 
  onCancel, 
  editingRecord 
}: SmartMedicalRecordFormProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Form data para el historial médico
  const [recordData, setRecordData] = useState<MedicalRecordFormData>({
    reason: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    followUpDate: '',
    notes: ''
  })

  // Form data para nuevo paciente
  const [newPatientData, setNewPatientData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: ''
  })

  // Cargar pacientes
  useEffect(() => {
    fetchPatients()
  }, [])

  // Si estamos editando, cargar los datos
  useEffect(() => {
    if (editingRecord) {
      setRecordData({
        reason: editingRecord.reason || '',
        symptoms: editingRecord.symptoms || '',
        diagnosis: editingRecord.diagnosis || '',
        treatment: editingRecord.treatment || '',
        prescription: editingRecord.prescription || '',
        bloodPressure: editingRecord.bloodPressure || '',
        heartRate: editingRecord.heartRate || '',
        temperature: editingRecord.temperature || '',
        weight: editingRecord.weight || '',
        height: editingRecord.height || '',
        followUpDate: editingRecord.followUpDate || '',
        notes: editingRecord.notes || ''
      })
      setSelectedPatient(editingRecord.patient)
      setSearchTerm(`${editingRecord.patient.firstName} ${editingRecord.patient.lastName}`)
    }
  }, [editingRecord])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  // Filtrar pacientes según búsqueda
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase()
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) || patient.phone.includes(searchTerm)
  }).slice(0, 5) // Mostrar máximo 5 resultados

  // Manejar selección de paciente
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchTerm(`${patient.firstName} ${patient.lastName}`)
    setShowNewPatientForm(false)
    setShowSearchResults(false)
  }

  // Limpiar selección de paciente
  const clearPatientSelection = () => {
    setSelectedPatient(null)
    setSearchTerm('')
    setShowNewPatientForm(false)
    setShowSearchResults(false)
  }

  // Crear nuevo paciente
  const createNewPatient = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPatientData)
      })

      if (response.ok) {
        const createdPatient = await response.json()
        setSelectedPatient(createdPatient)
        setSearchTerm(`${createdPatient.firstName} ${createdPatient.lastName}`)
        setShowNewPatientForm(false)
        await fetchPatients() // Actualizar lista
        return createdPatient.id
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear paciente')
      }
    } catch (error) {
      console.error('Error creating patient:', error)
      alert(`Error al crear el paciente: ${error.message}`)
      return null
    }
  }

  // Validar formulario
  const validateForm = (): boolean => {
    if (!selectedPatient && !showNewPatientForm) {
      alert('Debes seleccionar un paciente o crear uno nuevo')
      return false
    }

    if (showNewPatientForm) {
      if (!newPatientData.firstName || !newPatientData.lastName || !newPatientData.phone || !newPatientData.dateOfBirth) {
        alert('Completa todos los campos obligatorios del paciente')
        return false
      }
    }

    if (!recordData.reason || !recordData.diagnosis) {
      alert('El motivo de consulta y diagnóstico son obligatorios')
      return false
    }

    return true
  }

  // Enviar formulario completo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      let patientId = selectedPatient?.id

      // Si hay datos de nuevo paciente, crearlo primero
      if (showNewPatientForm && !selectedPatient) {
        patientId = await createNewPatient()
        if (!patientId) {
          setLoading(false)
          return
        }
      }

      if (!patientId) {
        alert('Error: No se pudo obtener el ID del paciente')
        setLoading(false)
        return
      }

      // Crear o actualizar el historial médico
      const url = editingRecord 
        ? `/api/medical-records/${editingRecord.id}` 
        : '/api/medical-records'
      const method = editingRecord ? 'PUT' : 'POST'

      const recordPayload = {
        patientId,
        ...recordData
      }

      console.log('Enviando historial médico:', recordPayload)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordPayload)
      })

      if (response.ok) {
        console.log('Historial médico creado/actualizado exitosamente')
        onSubmit(true)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar el historial médico')
      }

    } catch (error) {
      console.error('Error saving medical record:', error)
      alert(`Error al guardar el historial médico: ${error.message}`)
      onSubmit(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {editingRecord ? 'Editar Historial Médico' : 'Nuevo Historial Médico'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN 1: SELECCIONAR/CREAR PACIENTE */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Seleccionar Paciente
              </h4>

              {/* Paciente ya seleccionado */}
              {selectedPatient && !showNewPatientForm && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="font-medium text-green-900">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </p>
                        <p className="text-sm text-green-700">{selectedPatient.phone}</p>
                        {selectedPatient.email && (
                          <p className="text-sm text-green-700">{selectedPatient.email}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearPatientSelection}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Buscador de pacientes */}
              {!selectedPatient && !showNewPatientForm && (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Buscar paciente por nombre o teléfono..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowSearchResults(e.target.value.length > 0)
                      }}
                      onFocus={() => setShowSearchResults(searchTerm.length > 0)}
                    />
                  </div>

                  {/* Resultados de búsqueda */}
                  {showSearchResults && filteredPatients.length > 0 && (
                    <div className="border border-gray-200 rounded-md bg-white max-h-40 overflow-y-auto">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handlePatientSelect(patient)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {patient.phone}
                            </span>
                          </div>
                          {patient.email && (
                            <div className="text-xs text-gray-400">{patient.email}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mensaje si no hay resultados */}
                  {showSearchResults && searchTerm && filteredPatients.length === 0 && (
                    <div className="text-center py-3 text-gray-500 bg-gray-50 rounded border">
                      <p>No se encontró ningún paciente con "{searchTerm}"</p>
                      <p className="text-sm">¿Deseas crear un nuevo paciente?</p>
                    </div>
                  )}
                </div>
              )}

              {/* Botón para crear nuevo paciente */}
              {!selectedPatient && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewPatientForm(!showNewPatientForm)
                    setSearchTerm('')
                    setShowSearchResults(false)
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mt-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {showNewPatientForm ? 'Cancelar nuevo paciente' : 'Crear nuevo paciente'}
                </button>
              )}

              {/* Formulario para nuevo paciente */}
              {showNewPatientForm && (
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Datos del nuevo paciente:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        required={showNewPatientForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newPatientData.firstName}
                        onChange={(e) => setNewPatientData({...newPatientData, firstName: e.target.value})}
                        placeholder="Nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                      <input
                        type="text"
                        required={showNewPatientForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newPatientData.lastName}
                        onChange={(e) => setNewPatientData({...newPatientData, lastName: e.target.value})}
                        placeholder="Apellido"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                      <input
                        type="tel"
                        required={showNewPatientForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newPatientData.phone}
                        onChange={(e) => setNewPatientData({...newPatientData, phone: e.target.value})}
                        placeholder="81-1234-5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newPatientData.email}
                        onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento *</label>
                      <input
                        type="date"
                        required={showNewPatientForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newPatientData.dateOfBirth}
                        onChange={(e) => setNewPatientData({...newPatientData, dateOfBirth: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: INFORMACIÓN CLÍNICA Y SIGNOS VITALES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información Clínica */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Información Clínica
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de consulta *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={recordData.reason}
                      onChange={(e) => setRecordData({...recordData, reason: e.target.value})}
                      placeholder="Ej: Dolor de cabeza"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={recordData.symptoms}
                      onChange={(e) => setRecordData({...recordData, symptoms: e.target.value})}
                      placeholder="Describe los síntomas del paciente..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico *</label>
                    <textarea
                      rows={2}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={recordData.diagnosis}
                      onChange={(e) => setRecordData({...recordData, diagnosis: e.target.value})}
                      placeholder="Diagnóstico médico"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={recordData.treatment}
                      onChange={(e) => setRecordData({...recordData, treatment: e.target.value})}
                      placeholder="Tratamiento recomendado..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receta médica</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={recordData.prescription}
                      onChange={(e) => setRecordData({...recordData, prescription: e.target.value})}
                      placeholder="Medicamentos recetados..."
                    />
                  </div>
                </div>
              </div>

              {/* Signos Vitales */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  Signos Vitales
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Presión arterial</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={recordData.bloodPressure}
                        onChange={(e) => setRecordData({...recordData, bloodPressure: e.target.value})}
                        placeholder="120/80"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Freq. cardíaca</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={recordData.heartRate}
                        onChange={(e) => setRecordData({...recordData, heartRate: e.target.value})}
                        placeholder="80"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={recordData.temperature}
                        onChange={(e) => setRecordData({...recordData, temperature: e.target.value})}
                        placeholder="36.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={recordData.weight}
                        onChange={(e) => setRecordData({...recordData, weight: e.target.value})}
                        placeholder="70"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={recordData.height}
                        onChange={(e) => setRecordData({...recordData, height: e.target.value})}
                        placeholder="170"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de seguimiento</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={recordData.followUpDate}
                        onChange={(e) => setRecordData({...recordData, followUpDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={recordData.notes}
                      onChange={(e) => setRecordData({...recordData, notes: e.target.value})}
                      placeholder="Observaciones adicionales, recomendaciones especiales..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTONES */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    {editingRecord ? 'Actualizar Historial' : 'Crear Historial'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}