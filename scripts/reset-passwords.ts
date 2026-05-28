import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const users = await db.user.findMany()
  const newPassword = "Password123!"
  const newHash = await bcrypt.hash(newPassword, 10)

  console.log(`Cambiando la contraseña de todos los usuarios (${users.length}) a: ${newPassword}`)

  for (const user of users) {
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    })
    console.log(`- Contraseña actualizada para: ${user.name} (${user.email})`)
  }

  console.log("¡Contraseñas restablecidas con éxito!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
