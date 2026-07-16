import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  console.log("Iniciando creación de usuarios por defecto...")

  // 1. Obtener la tienda "La Cantina" para asociarla al dueño
  const cantina = await db.store.findFirst({
    where: { name: "La Cantina" }
  })

  if (!cantina) {
    throw new Error("No se encontró 'La Cantina' en la base de datos. Asegúrate de correr seed.ts primero.")
  }

  // 2. Obtener la tienda "Rústica Pastelería"
  const rustica = await db.store.findFirst({
    where: { name: "Rústica Pastelería" }
  })

  if (!rustica) {
    throw new Error("No se encontró 'Rústica Pastelería' en la base de datos.")
  }

  const passwordHash = await bcrypt.hash("Password123!", 10)

  const defaultUsers = [
    {
      name: "Test",
      email: "test4@uade.edu.ar",
      role: "student",
      storeId: null
    },
    {
      name: "Ayrton Ferreira",
      email: "aferreiranieto@uade.edu.ar",
      role: "student",
      storeId: null
    },
    {
      name: "Test User",
      email: "testcheckout@uade.edu.ar",
      role: "student",
      storeId: null
    },
    {
      name: "Administracion La Cantina",
      email: "ayrtonkevin01@hotmail.com",
      role: "store_owner",
      storeId: cantina.id
    },
    {
      name: "Administración Rústica",
      email: "adminrustica@uade.edu.ar",
      role: "store_owner",
      storeId: rustica.id
    },
    {
      name: "Dario Lencina",
      email: "dariolencina@uade.edu.ar",
      role: "student",
      storeId: null
    },
    {
      name: "Valentin Avalos",
      email: "valenavalos@uade.edu.ar",
      role: "student",
      storeId: null
    }
  ]

  for (const userData of defaultUsers) {
    const existing = await db.user.findUnique({
      where: { email: userData.email }
    })

    if (!existing) {
      await db.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          passwordHash,
          storeId: userData.storeId
        }
      })
      console.log(`- Creado usuario: ${userData.name} (${userData.email})`)
    } else {
      // Actualizar la contraseña si ya existe por si acaso
      await db.user.update({
        where: { id: existing.id },
        data: { passwordHash }
      })
      console.log(`- Usuario ya existía, contraseña actualizada: ${userData.name} (${userData.email})`)
    }
  }

  console.log("¡Todos los usuarios por defecto han sido creados/actualizados con la contraseña 'Password123!'!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
