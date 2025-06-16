// Archivo: src/components/RoleGuard.tsx

'use client'

import { useAuth } from '@/hooks/useAuth'
import { Shield, AlertCircle } from 'lucide-react'

interface RoleGuardProps {
  allowedRoles: ('doctor' | 'assistant')[]
  children: React.ReactNode
  fallback?: React.ReactNode
  showFallback?: boolean
}

export default function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback,
  showFallback = true 
}: RoleGuardProps) {
  const { user, loading } = useAuth()

  // Mientras carga, mostrar spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Si no hay usuario, no mostrar nada (el middleware debería redirigir)
  if (!user) {
    return null
  }

  // Si el usuario tiene el rol permitido, mostrar el contenido
  if (allowedRoles.includes(user.role)) {
    return <>{children}</>
  }

  // Si no tiene permisos y no queremos mostrar fallback, no mostrar nada
  if (!showFallback) {
    return null
  }

  // Si hay un fallback personalizado, usarlo
  if (fallback) {
    return <>{fallback}</>
  }

  // Fallback por defecto: mensaje de sin permisos
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <Shield className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
      <p className="text-sm text-gray-600 text-center max-w-md">
        No tienes permisos para acceder a esta sección. Esta funcionalidad está disponible solo para:{' '}
        <span className="font-medium">
          {allowedRoles.map(role => role === 'doctor' ? 'Doctores' : 'Asistentes').join(' y ')}
        </span>
      </p>
      <div className="mt-4 flex items-center text-xs text-gray-500">
        <AlertCircle className="w-4 h-4 mr-1" />
        Tu rol actual: {user.role === 'doctor' ? 'Doctor' : 'Asistente'}
      </div>
    </div>
  )
}