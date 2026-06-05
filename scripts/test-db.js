const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:ayrton01A2003!@db.muljptbteqxzhufvbsko.supabase.co:5432/postgres"
    }
  }
})

async function main() {
  try {
    const stores = await prisma.store.findMany()
    console.log("Connected successfully! Stores count:", stores.length)
  } catch (error) {
    console.error("Connection failed:", error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
