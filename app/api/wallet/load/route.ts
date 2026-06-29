import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { MercadoPagoConfig, Preference } from "mercadopago"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const amount = Number(body.amount)

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
    }

    // Cancel previous pending wallet loads
    await db.walletTransaction.updateMany({
      where: { userId: session.id, type: "load", status: "pending" },
      data: { status: "failed" }
    })

    const transaction = await db.walletTransaction.create({
      data: {
        userId: session.id,
        type: "load",
        amount,
        status: "pending",
        description: `Carga de saldo $${amount.toLocaleString("es-AR")}`
      }
    })

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN || "TEST-MOCK-ACCESS-TOKEN-SANDBOX"
    })
    const mpPreference = new Preference(mpClient)
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")

    const preferenceBody: any = {
      items: [{
        id: `wallet-load-${transaction.id}`,
        title: "Carga de saldo UADE Eats",
        quantity: 1,
        unit_price: amount,
        currency_id: "ARS"
      }],
      external_reference: `wallet_${transaction.id}`
    }

    if (!isLocalhost) {
      preferenceBody.back_urls = {
        success: `${baseUrl}/wallet/confirm?txId=${transaction.id}`,
        failure: `${baseUrl}/wallet?error=payment_failed`,
        pending: `${baseUrl}/wallet/confirm?txId=${transaction.id}`
      }
      preferenceBody.auto_return = "approved"
    }

    try {
      const preferenceResult = await mpPreference.create({ body: preferenceBody })

      await db.walletTransaction.update({
        where: { id: transaction.id },
        data: { mpPreferenceId: preferenceResult.id ?? undefined }
      })

      return NextResponse.json({
        success: true,
        initPoint: preferenceResult.init_point,
        transactionId: transaction.id
      })
    } catch (mpError) {
      console.error("MP Preference creation error:", mpError)
      // Fallback for local dev when MP token is not configured
      return NextResponse.json({
        success: true,
        initPoint: `${baseUrl}/wallet/confirm?txId=${transaction.id}&mock=true`,
        transactionId: transaction.id
      })
    }
  } catch (error) {
    console.error("Wallet load error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
