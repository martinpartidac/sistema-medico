'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, User, Building, Phone, Mail, MapPin, Stethoscope } from 'lucide-react'
import Link from 'next/link'

interface SystemConfig {
  id: string
  doctorName: string
  clinicName: string
  doctorSpecialty?: string
  doctorPhone?: string
  doctorEmail?: string
  clinicAddress?: string
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    doctorName: '',
    clinicName: '',
    doctorSpecialty: '',
    doctorPhone: '',
    doctorEmail: '',
    clinicAddress: ''
  })

  // Fetch current configuration
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/system/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setFormData({
          doctorName: data.doctorName || '',
          clinicName: data.clinicName || '',
          doctorSpecialty: data.doctorSpecialty || '',
          doctorPhone: data.doctorPhone || '',
          doctorEmail: data.doctorEmail || '',
          clinicAddress: data.clinicAddress || ''
        })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const response = await fetch('/api/system/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchConfig()
        setMessage('Configuración guardada correctamente')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Error al guardar la configuración')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const getDoctorInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
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
              <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Success Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Información del Médico y Clínica</h3>
              <p className="text-sm text-gray-500">
                Configure la información que aparecerá en todo el sistema
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información del Médico */}
                <div className="space-y-6">
                  <h4 className="text-md font-medium text-gray-900 flex items-center border-b pb-2">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Información del Médico
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Nombre del Médico *
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.doctorName}
                      onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
                      placeholder="Dr. Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Especialidad
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        className="mt-1 block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.doctorSpecialty}
                        onChange={(e) => setFormData({...formData, doctorSpecialty: e.target.value})}
                        placeholder="Medicina General"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        className="mt-1 block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.doctorPhone}
                        onChange={(e) => setFormData({...formData, doctorPhone: e.target.value})}
                        placeholder="+52 81 1234 5678"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        className="mt-1 block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.doctorEmail}
                        onChange={(e) => setFormData({...formData, doctorEmail: e.target.value})}
                        placeholder="doctor@ejemplo.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Información de la Clínica */}
                <div className="space-y-6">
                  <h4 className="text-md font-medium text-gray-900 flex items-center border-b pb-2">
                    <Building className="h-5 w-5 mr-2 text-green-600" />
                    Información de la Clínica
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Nombre de la Clínica *
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.clinicName}
                      onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
                      placeholder="Sistema Médico"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Dirección
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <textarea
                        rows={3}
                        className="mt-1 block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.clinicAddress}
                        onChange={(e) => setFormData({...formData, clinicAddress: e.target.value})}
                        placeholder="Av. Revolución #123, Col. Centro, Monterrey, N.L. 64000"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Vista previa del header:</h5>
                    <div className="flex items-center justify-between bg-white p-4 rounded border">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                          ⚡
                        </div>
                        <h1 className="text-lg font-bold text-gray-900">
                          {formData.clinicName || 'Sistema Médico'}
                        </h1>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {formData.doctorName || 'Dr. Juan Pérez'}
                        </span>
                        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {getDoctorInitials(formData.doctorName || 'Dr. Juan Pérez')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Configuración
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}