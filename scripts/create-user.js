const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createUser() {
  try {
    // ========================================
    // CONFIGURA AQUÍ LOS DATOS DEL USUARIO
    // ========================================
    
    const userData = {
      email: 'maria.asistente@clinica.com', // ← Cambia esto
      password: 'temp123',                  // ← Contraseña temporal simple
      name: 'María García',                 // ← Cambia esto
      role: 'assistant',                    // 'doctor' o 'assistant'
      specialty: null,                      // ← Solo para doctores (null para asistentes)
      phone: '+52 81 9876 5432'            // ← Cambia esto
    }
    
    // ========================================
    
    console.log('Creando usuario...')
    
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })
    
    if (existingUser) {
      console.log('❌ Error: Ya existe un usuario con ese email')
      return
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        specialty: userData.role === 'doctor' ? userData.specialty : null,
        phone: userData.phone
      }
    })
    
    console.log('✅ Usuario creado exitosamente!')
    console.log('==========================================')
    console.log('📋 CREDENCIALES PARA ENTREGAR AL USUARIO')
    console.log('==========================================')
    console.log(`👤 Nombre: ${newUser.name}`)
    console.log(`📧 Email: ${newUser.email}`)
    console.log(`🔑 Contraseña temporal: ${userData.password}`)
    console.log(`👨‍⚕️ Rol: ${newUser.role === 'doctor' ? 'Doctor' : 'Asistente'}`)
    if (newUser.specialty) {
      console.log(`🩺 Especialidad: ${newUser.specialty}`)
    }
    console.log('==========================================')
    console.log('⚠️  IMPORTANTE:')
    console.log('   - Entrégale estas credenciales al usuario')
    console.log('   - Dile que debe cambiar su contraseña')
    console.log('   - Puede cambiarla en: Dashboard > Cambiar Contraseña')
    console.log('==========================================')
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()