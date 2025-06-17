// Archivo: src/components/SmartAppointmentForm.tsx
// REEMPLAZA COMPLETAMENTE el archivo anterior con este

'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, User, Calendar, Clock, Phone, Mail, X, CheckCircle } from 'lucide-react'
import { getDateInputValue } from '@/lib/dateUtils'

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

interface AppointmentFormData {
  date: string
  time: string
  reason: string
  notes: string
}

interface SmartAppointmentFormProps {
  selectedDate: string
  onSubmit: (success: boolean) => void
  onCancel: () => void
  editingAppointment?: any
}

export default function SmartAppointmentForm({ 
  selectedDate, 
  onSubmit, 
  onCancel, 
  editingAppointment 
}: SmartAppointmentFormProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Form data para la cita
  const [appointmentData, setAppointmentData] = useState<AppointmentFormData>({
    date: selectedDate,
    time: '09:00',
    reason: '',
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
    if (editingAppointment) {
      const appointmentDate = new Date(editingAppointment.date)
      setAppointmentData({
        date: appointmentDate.toISOString().split('T')[0],
        time: appointmentDate.toTimeString().slice(0, 5),
        reason: editingAppointment.reason,
        notes: editingAppointment.notes || ''
      })
      setSelectedPatient(editingAppointment.patient)
      setSearchTerm(`${editingAppointment.patient.firstName} ${editingAppointment.patient.lastName}`)
    }
  }, [editingAppointment])

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

    if (!appointmentData.date || !appointmentData.time || !appointmentData.reason) {
      alert('Completa todos los campos obligatorios de la cita')
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

      // Crear o actualizar la cita
      const url = editingAppointment 
        ? `/api/appointments/${editingAppointment.id}` 
        : '/api/appointments'
      const method = editingAppointment ? 'PUT' : 'POST'

      const appointmentPayload = {
        patientId,
        date: appointmentData.date,
        time: appointmentData.time,
        reason: appointmentData.reason,
        notes: appointmentData.notes
      }

      console.log('Enviando cita:', appointmentPayload)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentPayload)
      })

      if (response.ok) {
        console.log('Cita creada/actualizada exitosamente')
        onSubmit(true)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar la cita')
      }

    } catch (error) {
      console.error('Error saving appointment:', error)
      alert(`Error al guardar la cita: ${error.message}`)
      onSubmit(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
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
                Paso 1: Seleccionar Paciente
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

            {/* SECCIÓN 2: DATOS DE LA CITA */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Paso 2: Datos de la Cita
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={appointmentData.date}
                    onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={appointmentData.time}
                    onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la consulta *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={appointmentData.reason}
                  onChange={(e) => setAppointmentData({...appointmentData, reason: e.target.value})}
                  placeholder="Ej: Consulta general, revisión, dolor de cabeza..."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData({...appointmentData, notes: e.target.value})}
                  placeholder="Observaciones adicionales..."
                />
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
                    <Calendar className="h-4 w-4 mr-2" />
                    {editingAppointment ? 'Actualizar Cita' : 'Crear Cita'}
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