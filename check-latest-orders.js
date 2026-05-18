const { PrismaClient } = require("@prisma/client")
const db = new PrismaClient()

async function main() {
  const orders = await db.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      store: { select: { name: true } }
    }
  })
  console.log("=== LATEST 5 ORDERS ===")
  console.dir(orders, { depth: null })
}

main().catch(console.error).finally(() => db.$disconnect())
