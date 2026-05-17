import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  console.log("Limpiando base de datos...")
  await db.product.deleteMany()
  await db.store.deleteMany()

  console.log("Agregando locales...")
  const rustica = await db.store.create({
    data: {
      name: "Rústica Pastelería",
      category: "pasteleria",
      tagline: "Pastelería artesanal y cafetería",
      imageUrl: "/images/pasteleria-claudio.jpg", // Using placeholder until real photo is obtained
      estimatedWaitMinutes: 5,
      isOpen: true,
      rating: 4.8,
    }
  })

  const cantina = await db.store.create({
    data: {
      name: "La Cantina",
      category: "buffet",
      tagline: "El clásico comedor universitario",
      imageUrl: "/images/comedor_4.jpg",
      estimatedWaitMinutes: 15,
      isOpen: true,
      rating: 4.2,
    }
  })

  console.log("Agregando productos a Rústica...")
  await db.product.createMany({
    data: [
      {
        storeId: rustica.id,
        name: "Porción de Chocotorta",
        description: "Clásica chocotorta argentina con dulce de leche y queso crema.",
        price: 4500,
        category: "Postres",
        imageUrl: "/images/products/brownie.jpg", 
      },
      {
        storeId: rustica.id,
        name: "Alfajor de Maicena",
        description: "Relleno de abundante dulce de leche y coco rallado.",
        price: 1500,
        category: "Postres",
        imageUrl: "/images/products/medialunas.jpg",
      },
      {
        storeId: rustica.id,
        name: "Café de Especialidad",
        description: "Latte o Flat White con granos de origen.",
        price: 2500,
        category: "Bebidas",
        imageUrl: "/images/products/cafe-con-leche.jpg",
      }
    ]
  })

  console.log("Agregando productos a La Cantina...")
  await db.product.createMany({
    data: [
      {
        storeId: cantina.id,
        name: "Milanesa con Puré",
        description: "Milanesa de carne o pollo con puré de papas.",
        price: 6500,
        category: "Platos",
        imageUrl: "/images/products/sandwich-veggie.jpg",
      },
      {
        storeId: cantina.id,
        name: "Tarta de Jamón y Queso",
        description: "Porción abundante con ensalada mixta.",
        price: 5000,
        category: "Platos",
        imageUrl: "/images/products/tostado-mixto.jpg",
      },
      {
        storeId: cantina.id,
        name: "Lata Coca-Cola",
        description: "Línea Coca-Cola 354ml fría.",
        price: 1500,
        category: "Bebidas",
        imageUrl: "/images/products/jugo-naranja.jpg",
      }
    ]
  })

  console.log("¡Base de datos inicializada!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
