import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()
const amount = parseFloat(process.argv[2] ?? "0")

async function main() {
  const { count: txDeleted } = await db.walletTransaction.deleteMany()
  console.log(`- ${txDeleted} transacciones eliminadas`)

  const users = await db.user.findMany({ select: { id: true, name: true, email: true } })
  for (const user of users) {
    await db.user.update({ where: { id: user.id }, data: { walletBalance: amount } })
    console.log(`- ${user.name} (${user.email}): balance → $${amount}`)
  }

  console.log(`\n✓ Wallet reseteada para ${users.length} usuarios (balance: $${amount})`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
