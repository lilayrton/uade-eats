import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se seleccionó ningún archivo" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate a unique safe filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const originalExt = path.extname(file.name) || ".jpg"
    const filename = `product-${uniqueSuffix}${originalExt}`

    // Ensure target folder exists
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    // Save physical file
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    return NextResponse.json({ success: true, url: `/uploads/${filename}` })
  } catch (error) {
    console.error("Error in upload API:", error)
    return NextResponse.json({ error: "Error al guardar el archivo" }, { status: 500 })
  }
}
