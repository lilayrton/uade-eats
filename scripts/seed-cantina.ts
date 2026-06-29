import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  console.log("Buscando 'La Cantina' en la base de datos...")
  
  const cantina = await db.store.findFirst({
    where: { name: "La Cantina" }
  })

  if (!cantina) {
    console.error("No se encontró La Cantina. Ejecuta seed.ts primero.")
    return
  }

  console.log("Eliminando productos de prueba anteriores de La Cantina...")
  await db.product.deleteMany({
    where: { storeId: cantina.id }
  })

  console.log("Agregando el menú completo...")

  const cantinaProducts = [
    { name: "Menú del día + bebida + postre", price: 20915, imageUrl: "/images/products/menu_del_dia.png", description: "Menú completo para estudiantes." },
    { name: "Menú del día sin bebida (empleados)", price: 17428, imageUrl: "/images/products/menu_del_dia.png", description: "Menú exclusivo para empleados." },
    { name: "Plato principal", price: 17227, imageUrl: "/images/products/mila_completa.png", description: "Opción del día sin guarnición." },
    { name: "Salad bar", price: 12728, imageUrl: "/images/products/salad_bar.png", description: "Armá tu ensalada a gusto." },
    { name: "Menú residencia", price: 11981, imageUrl: "/images/products/menu_del_dia.png", description: "Menú exclusivo para residentes." },
    { name: "Postre", price: 4869, imageUrl: "/images/products/brownie.jpg", description: "Variedad de postres caseros." },
    { name: "Café chico", price: 2773, imageUrl: "/images/products/cafe_medialunas.png", description: "Espresso o cortado pequeño." },
    { name: "Café grande", price: 5837, imageUrl: "/images/products/cafe_medialunas.png", description: "Café doble o en jarrito." },
    { name: "Té", price: 3018, imageUrl: "/images/products/cafe_medialunas.png", description: "Variedad de tés clásicos." },
    { name: "Medialuna", price: 1575, imageUrl: "/images/products/cafe_medialunas.png", description: "De manteca o grasa." },
    { name: "Medialuna con jamón y queso", price: 3522, imageUrl: "/images/products/baguette_sandwich.png", description: "Tostada y calentita." },
    { name: "Café y medialunas", price: 6539, imageUrl: "/images/products/cafe_medialunas.png", description: "Café con dos medialunas." },
    { name: "Yogurt 'La Cantina'", price: 7865, imageUrl: "/images/products/salad_bar.png", description: "Yogurt con cereales y frutas." },
    { name: "Baguette de jamón y queso | Caprese", price: 7865, imageUrl: "/images/products/baguette_sandwich.png", description: "En pan francés recién horneado." },
    { name: "Baguette de pollo | crudo | salame", price: 9435, imageUrl: "/images/products/baguette_sandwich.png", description: "Sándwich especial." },
    { name: "Árabe / Pebete de jamón y queso", price: 9603, imageUrl: "/images/products/baguette_sandwich.png", description: "Pan tierno con fiambres clásicos." },
    { name: "Pepsi Lata", price: 2332, imageUrl: "/images/products/jugo-naranja.jpg", description: "Lata 354ml." },
    { name: "Pepsi 500 cc", price: 2749, imageUrl: "/images/products/jugo-naranja.jpg", description: "Botella 500ml." },
    { name: "Coca Cola Lata", price: 2606, imageUrl: "/images/products/jugo-naranja.jpg", description: "Lata 354ml." },
    { name: "Coca Cola 500 cc", price: 3018, imageUrl: "/images/products/jugo-naranja.jpg", description: "Botella 500ml." },
    { name: "Agua con gas | Agua Saborizada", price: 2749, imageUrl: "/images/products/jugo-naranja.jpg", description: "Botella 500ml." },
    { name: "Citric", price: 5487, imageUrl: "/images/products/jugo-naranja.jpg", description: "Jugo natural de naranja." },
    { name: "Gatorade", price: 4390, imageUrl: "/images/products/jugo-naranja.jpg", description: "Bebida isotónica deportiva." },
    { name: "Budín | Brownie | Alfajor | Cookie", price: 5502, imageUrl: "/images/products/brownie.jpg", description: "Pastelería dulce artesanal." },
    { name: "Scon de queso", price: 2744, imageUrl: "/images/products/medialunas.jpg", description: "Ideal para acompañar el mate." },
    { name: "Fruta", price: 1498, imageUrl: "/images/products/salad_bar.png", description: "Fruta de estación fresca." },
    { name: "Mila completa", price: 12581, imageUrl: "/images/products/mila_completa.png", description: "Milanesa con huevos fritos y papas fritas." },
    { name: "Papas con cheddar", price: 8239, imageUrl: "/images/products/papas_cheddar.png", description: "Papas fritas con abundante cheddar derretido." }
  ].map(p => ({ ...p, storeId: cantina.id }))

  await db.product.createMany({
    data: cantinaProducts
  })

  console.log("¡Se agregaron 28 productos a La Cantina con éxito!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
