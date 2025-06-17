'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Calendar, Clock, User, Phone, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getDateInputValue, formatMexicoDate, formatMexicoTime } from '@/lib/dateUtils'

interface Patient {
  id: string
  firstName: string
  lastName: string
  phone: string
}

interface Appointment {
  id: string
  date: string
  reason: string
  status: string
  notes?: string
  patient: Patient
  createdAt: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  // Usar la función corregida para obtener la fecha de hoy en México
  const [selectedDate, setSelectedDate] = useState(getDateInputValue())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    reason: '',
    notes: ''
  })

  // Fetch appointments con filtro de fecha
  const fetchAppointments = async (dateFilter?: string) => {
    try {
      const url = dateFilter 
        ? `/api/appointments?date=${dateFilter}`
        : '/api/appointments'
      
      console.log('Fetching appointments for date:', dateFilter || 'all')
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('Appointments received:', data.length)
        setAppointments(data)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
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
    fetchPatients()
  }, [])

  // Fetch appointments cuando cambia la fecha seleccionada
  useEffect(() => {
    if (selectedDate) {
      fetchAppointments(selectedDate)
    }
  }, [selectedDate])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      console.log('Enviando datos de cita:', formData)
      
      const url = editingAppointment ? `/api/appointments/${editingAppointment.id}` : '/api/appointments'
      const method = editingAppointment ? 'PUT' : 'POST'
      
      // Enviar date y time por separado para mejor control
      const payload = {
        patientId: formData.patientId,
        date: formData.date, // YYYY-MM-DD
        time: formData.time, // HH:MM
        reason: formData.reason,
        notes: formData.notes,
      }
      
      console.log('Payload enviado:', payload)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchAppointments(selectedDate)
        setShowForm(false)
        setEditingAppointment(null)
        setFormData({ patientId: '', date: '', time: '', reason: '', notes: '' })
      } else {
        const errorData = await response.json()
        console.error('Error creating appointment:', errorData)
        alert('Error al crear la cita: ' + (errorData.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error saving appointment:', error)
      alert('Error de conexión al guardar la cita')
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      try {
        const response = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
        if (response.ok) {
          await fetchAppointments(selectedDate)
        }
      } catch (error) {
        console.error('Error deleting appointment:', error)
      }
    }
  }

  // Handle edit
  const handleEdit = (appointment: Appointment) => {
    const appointmentDate = new Date(appointment.date)
    setEditingAppointment(appointment)
    setFormData({
      patientId: appointment.patient.id,
      date: appointmentDate.toISOString().split('T')[0],
      time: appointmentDate.toTimeString().slice(0, 5),
      reason: appointment.reason,
      notes: appointment.notes || ''
    })
    setShowForm(true)
  }

  // Navigation functions
  const goToPreviousDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const goToNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const goToToday = () => {
    setSelectedDate(getDateInputValue())
  }

  const formatDateDisplay = (dateString: string) => {
    return new Date(dateString + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTimeDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programada'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Agenda de Citas</h1>
            </div>
            <button
              onClick={() => {
                setFormData({
                  patientId: '',
                  date: selectedDate,
                  time: '09:00',
                  reason: '',
                  notes: ''
                })
                setShowForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Date Navigation */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-medium text-gray-900 capitalize">
                  {formatDateDisplay(selectedDate)}
                </h2>
                <button
                  onClick={goToNextDay}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Hoy
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            
            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
              Debug: Fecha seleccionada: {selectedDate} | Total citas: {appointments.length}
            </div>
          </div>

          {/* Appointments List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Cargando citas...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {appointments.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay citas programadas para este día</p>
                  <p className="text-sm text-gray-400 mt-1">Fecha: {selectedDate}</p>
                  <button
                    onClick={() => {
                      setFormData({
                        patientId: '',
                        date: selectedDate,
                        time: '09:00',
                        reason: '',
                        notes: ''
                      })
                      setShowForm(true)
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Programar primera cita
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {appointments
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((appointment) => (
                    <li key={appointment.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {formatTimeDisplay(appointment.date)}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                  {getStatusText(appointment.status)}
                                </span>
                              </div>
                              <div className="mt-1 space-y-1">
                                <div className="flex items-center text-sm text-gray-600">
                                  <User className="h-4 w-4 mr-2" />
                                  {appointment.patient.firstName} {appointment.patient.lastName}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-4 w-4 mr-2" />
                                  {appointment.patient.phone}
                                </div>
                                <p className="text-sm text-gray-800 font-medium">
                                  {appointment.reason}
                                </p>
                                {appointment.notes && (
                                  <p className="text-sm text-gray-600">
                                    {appointment.notes}
                                  </p>
                                )}
                                {/* Debug info */}
                                <p className="text-xs text-gray-400">
                                  Debug: {appointment.date}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(appointment.id)}
                            className="text-red-600 hover:text-red-900"
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

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Motivo de la consulta</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Ej: Consulta general, revisión, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Notas (opcional)</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
                
                {/* Debug info en el form */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Debug: Fecha={formData.date}, Hora={formData.time}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingAppointment(null)
                      setFormData({ patientId: '', date: '', time: '', reason: '', notes: '' })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    {editingAppointment ? 'Actualizar' : 'Crear'}
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