import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const users = await db.user.findMany({
    include: { store: true }
  })
  console.log("=== USUARIOS REGISTRADOS CON HASHES ===")
  if (users.length === 0) {
    console.log("No hay usuarios en la base de datos.")
  } else {
    users.forEach(u => {
      console.log(`Nombre: ${u.name}`)
      console.log(`Email: ${u.email}`)
      console.log(`Rol: ${u.role}`)
      console.log(`Hash: ${u.passwordHash}`)
      console.log(`Local: ${u.store?.name || 'Ninguno'}`)
      console.log("-----------------------------------------")
    });
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
