'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, UserPlus, Activity, Clock, FileText, TrendingUp, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import RoleGuard from '@/components/RoleGuard'
import { getMexicoDate, formatMexicoTime, formatMexicoDate } from '@/lib/dateUtils'

interface DashboardStats {
  totalPatients: number
  appointmentsToday: number
  newPatientsThisWeek: number
  appointmentsThisWeek: number
  appointmentStatusData: Array<{
    status: string
    count: number
    label: string
  }>
  recentMedicalRecords: Array<{
    id: string
    chiefComplaint: string
    createdAt: string
    patient: {
      firstName: string
      lastName: string
    }
  }>
  upcomingAppointments: Array<{
    id: string
    date: string
    reason: string
    patient: {
      firstName: string
      lastName: string
      phone: string
    }
  }>
  debug?: {
    todayStart: string
    todayEnd: string
    appointmentsTodayCount: number
    appointmentsTodayList: Array<{
      patient: string
      date: string
      reason: string
    }>
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState({
    doctorName: 'Dr. Juan Pérez',
    clinicName: 'Sistema Médico'
  })
  const { user, logout } = useAuth()

  // Debug para ver qué usuario tenemos
  console.log('Usuario actual:', user)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats and config in parallel
        const [statsResponse, configResponse] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/system/config')
        ])
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          console.log('Dashboard stats recibidas:', statsData)
          setStats(statsData)
        }
        
        if (configResponse.ok) {
          const configData = await configResponse.json()
          setConfig({
            doctorName: configData.doctorName || 'Dr. Juan Pérez',
            clinicName: configData.clinicName || 'Sistema Médico'
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getDoctorInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      timeZone: 'America/Monterrey',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      timeZone: 'America/Monterrey'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                {config.clinicName}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/change-password" className="text-sm text-gray-500 hover:text-gray-700">
                Cambiar contraseña
              </Link>
              <button
                onClick={logout}
                className="flex items-center text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Salir
              </button>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || 'Usuario'}
                </span>
                {user?.role && (
                  <p className="text-xs text-gray-500">
                    {user.role === 'doctor' ? 'Doctor' : 'Asistente'}
                    {user.specialty && ` • ${user.specialty}`}
                  </p>
                )}
              </div>
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {getDoctorInitials(user?.name || 'Usuario')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Debug Info temporal */}
          {stats?.debug && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                🐛 Debug: Información de Fechas (temporal)
              </h3>
              <div className="text-xs text-yellow-700 space-y-1">
                <p><strong>Fecha actual México:</strong> {getMexicoDate().toLocaleString('es-MX')}</p>
                <p><strong>Rango de búsqueda hoy:</strong></p>
                <p className="ml-4">Inicio: {new Date(stats.debug.todayStart).toLocaleString('es-MX')}</p>
                <p className="ml-4">Fin: {new Date(stats.debug.todayEnd).toLocaleString('es-MX')}</p>
                <p><strong>Citas encontradas hoy:</strong> {stats.debug.appointmentsTodayCount}</p>
                {stats.debug.appointmentsTodayList.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {stats.debug.appointmentsTodayList.map((apt, i) => (
                      <p key={i}>• {apt.patient} - {new Date(apt.date).toLocaleString('es-MX')} - {apt.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Pacientes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.totalPatients || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Citas Hoy
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.appointmentsToday || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserPlus className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Nuevos Esta Semana
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.newPatientsThisWeek || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Citas Esta Semana
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.appointmentsThisWeek || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-600" />
                  Próximas Citas
                </h3>
              </div>
              <div className="p-6">
                {stats?.upcomingAppointments && stats.upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {stats.upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{appointment.reason}</p>
                          <p className="text-xs text-gray-500">{appointment.patient.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatTime(appointment.date)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(appointment.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay citas próximas programadas</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-red-600" />
                  Historiales Recientes
                </h3>
              </div>
              <div className="p-6">
                {stats?.recentMedicalRecords && stats.recentMedicalRecords.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentMedicalRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-gray-900">
                            {record.patient.firstName} {record.patient.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{record.chiefComplaint}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {formatDate(record.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay historiales médicos creados</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {stats?.appointmentStatusData && stats.appointmentStatusData.length > 0 && (
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Estado de Citas
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats.appointmentStatusData.map((item) => (
                    <div key={item.status} className="text-center p-4 bg-gray-50 rounded-md">
                      <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                      <p className="text-sm text-gray-600">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gestión de Pacientes - Todos pueden acceder */}
            <Link href="/dashboard/patients">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Pacientes</h3>
                      <p className="text-sm text-gray-500">Gestionar pacientes</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Agenda de Citas - Todos pueden acceder */}
            <Link href="/dashboard/appointments">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Agenda</h3>
                      <p className="text-sm text-gray-500">Programar citas</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Historiales - Solo doctores */}
            <RoleGuard allowedRoles={['doctor']} showFallback={false}>
              <Link href="/dashboard/medical-records">
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Activity className="h-8 w-8 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Historiales</h3>
                        <p className="text-sm text-gray-500">Ver expedientes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </RoleGuard>

            {/* Mensaje para asistentes */}
            <RoleGuard allowedRoles={['assistant']} showFallback={false}>
              <div className="bg-gray-100 overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-600">Historiales</h3>
                      <p className="text-sm text-gray-500">Solo para doctores</p>
                    </div>
                  </div>
                </div>
              </div>
            </RoleGuard>

            {/* Configuración - Solo doctores */}
            <RoleGuard allowedRoles={['doctor']} showFallback={false}>
              <Link href="/dashboard/settings">
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UserPlus className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Configuración</h3>
                        <p className="text-sm text-gray-500">Ajustes del sistema</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </RoleGuard>

            {/* Mensaje para asistentes */}
            <RoleGuard allowedRoles={['assistant']} showFallback={false}>
              <div className="bg-gray-100 overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserPlus className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-600">Configuración</h3>
                      <p className="text-sm text-gray-500">Solo para doctores</p>
                    </div>
                  </div>
                </div>
              </div>
            </RoleGuard>
          </div>
        </div>
      </main>
    </div>
  )
}