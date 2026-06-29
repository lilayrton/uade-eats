import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { MercadoPagoConfig, Payment } from "mercadopago"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { transactionId } = await req.json()
    if (!transactionId) {
      return NextResponse.json({ error: "transactionId is required" }, { status: 400 })
    }

    const transaction = await db.walletTransaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction || transaction.userId !== session.id) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.status === "completed") {
      return NextResponse.json({ success: true, amount: transaction.amount })
    }

    if (transaction.status !== "pending") {
      return NextResponse.json({ success: false, status: transaction.status })
    }

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN || "TEST-MOCK-ACCESS-TOKEN-SANDBOX"
    })
    const payment = new Payment(mpClient)

    const searchResult = await payment.search({
      options: { external_reference: `wallet_${transactionId}` }
    })

    const approvedPayment = searchResult.results?.find((p: any) => p.status === "approved")

    // Solo en desarrollo local aprobamos automáticamente sin pago real (testing sin MP).
    // En producción SIEMPRE se exige un pago approved de Mercado Pago.
    const allowLocalAutoApprove = process.env.NODE_ENV !== "production"
    const shouldCredit = !!approvedPayment || allowLocalAutoApprove

    if (shouldCredit) {
      // Transición atómica pending -> completed: solo el primer caller
      // (confirm o webhook) obtiene count === 1 y acredita el saldo, evitando
      // doble acreditación ante ejecuciones concurrentes.
      const result = await db.walletTransaction.updateMany({
        where: { id: transactionId, status: "pending" },
        data: { status: "completed" }
      })
      if (result.count === 1) {
        await db.user.update({
          where: { id: session.id },
          data: { walletBalance: { increment: transaction.amount } }
        })
      }

      return NextResponse.json({ success: true, amount: transaction.amount })
    }

    return NextResponse.json({ success: false, status: "pending" })
  } catch (error) {
    console.error("Wallet confirm error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
