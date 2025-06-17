// Archivo: src/lib/dateUtils.ts

// Zona horaria de México (Monterrey)
const MEXICO_TIMEZONE = 'America/Monterrey'

/**
 * Obtiene la fecha actual en la zona horaria de México
 */
export function getMexicoDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: MEXICO_TIMEZONE }))
}

/**
 * Convierte una fecha a la zona horaria de México
 */
export function toMexicoTime(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: MEXICO_TIMEZONE }))
}

/**
 * Crea una fecha desde string considerando zona horaria de México
 */
export function createMexicoDate(dateString: string, timeString?: string): Date {
  const dateTimeString = timeString ? `${dateString}T${timeString}` : dateString
  
  // Crear la fecha como si fuera en México
  const localDate = new Date(dateTimeString)
  
  // Ajustar por la diferencia de zona horaria
  const offset = localDate.getTimezoneOffset()
  const mexicoOffset = -360 // México es UTC-6 (360 minutos)
  const adjustment = (offset - mexicoOffset) * 60000 // Convertir a milisegundos
  
  return new Date(localDate.getTime() + adjustment)
}

/**
 * Obtiene el inicio del día en México para una fecha específica
 */
export function getStartOfDayMexico(dateString: string): Date {
  const date = new Date(dateString + 'T00:00:00')
  return createMexicoDate(dateString, '00:00:00')
}

/**
 * Obtiene el final del día en México para una fecha específica
 */
export function getEndOfDayMexico(dateString: string): Date {
  const date = new Date(dateString + 'T23:59:59')
  return createMexicoDate(dateString, '23:59:59')
}

/**
 * Obtiene el inicio del día de hoy en México
 */
export function getTodayStartMexico(): Date {
  const today = getMexicoDate()
  const todayString = today.toISOString().split('T')[0]
  return getStartOfDayMexico(todayString)
}

/**
 * Obtiene el final del día de hoy en México
 */
export function getTodayEndMexico(): Date {
  const today = getMexicoDate()
  const todayString = today.toISOString().split('T')[0]
  return getEndOfDayMexico(todayString)
}

/**
 * Convierte fecha a string en formato local de México
 */
export function formatMexicoDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Convierte fecha a string de hora en formato de México
 */
export function formatMexicoTime(date: Date): string {
  return date.toLocaleTimeString('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Convierte fecha a string completo en formato de México
 */
export function formatMexicoDateTime(date: Date): string {
  return date.toLocaleString('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Verifica si una fecha es hoy en México
 */
export function isToday(date: Date): boolean {
  const today = getMexicoDate()
  const compareDate = toMexicoTime(date)
  
  return today.getFullYear() === compareDate.getFullYear() &&
         today.getMonth() === compareDate.getMonth() &&
         today.getDate() === compareDate.getDate()
}

/**
 * Obtiene el string de fecha en formato YYYY-MM-DD para input HTML
 */
export function getDateInputValue(date: Date = getMexicoDate()): string {
  const mexicoDate = toMexicoTime(date)
  const year = mexicoDate.getFullYear()
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0')
  const day = String(mexicoDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Obtiene el string de hora en formato HH:MM para input HTML
 */
export function getTimeInputValue(date: Date): string {
  const mexicoDate = toMexicoTime(date)
  const hours = String(mexicoDate.getHours()).padStart(2, '0')
  const minutes = String(mexicoDate.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}