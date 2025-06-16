const bcrypt = require('bcrypt')

async function hashPassword(password) {
  const hashedPassword = await bcrypt.hash(password, 10)
  console.log(`Password: ${password}`)
  console.log(`Hashed: ${hashedPassword}`)
  console.log('---')
}

async function main() {
  console.log('🔐 Hasheando contraseñas...\n')
  
  await hashPassword('doctor123')
  await hashPassword('asistente123')
}

main()