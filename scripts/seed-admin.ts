import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "admin@uade.edu.ar"
  const password = "password123"

  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    if (existingUser.role !== "admin") {
      await prisma.user.update({
        where: { email },
        data: { role: "admin" }
      })
      console.log(`User ${email} updated to admin role.`)
    } else {
      console.log(`Admin user ${email} already exists.`)
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        name: "Admin",
        email,
        passwordHash,
        role: "admin",
      }
    })
    console.log(`Created admin user ${email} with password ${password}`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
