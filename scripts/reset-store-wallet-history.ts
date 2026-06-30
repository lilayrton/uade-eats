import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.order.updateMany({
    where: { paymentMethod: 'wallet' },
    data: { paymentMethod: 'efectivo' }
  })
  console.log(`Updated ${result.count} orders from wallet to efectivo`)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
