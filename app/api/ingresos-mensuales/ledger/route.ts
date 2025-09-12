import { type NextRequest, NextResponse } from "next/server"
import { sql, testConnection } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") || new Date().toISOString().slice(0, 7)

    if (!sql || !(await testConnection())) {
      // Datos mock para demostración
      const mockLedger = [
        {
          IdCliente: 1,
          RazonSocial: "EMPRESA DEMO SAC",
          MontoFijoMensual: 500,
          TotalPagado: 1500,
          SaldoPendiente: 0,
          UltimoPago: "2024-01-15T00:00:00Z",
          MesesDeuda: 0,
        },
        {
          IdCliente: 2,
          RazonSocial: "CONSULTORA ABC EIRL",
          MontoFijoMensual: 800,
          TotalPagado: 1600,
          SaldoPendiente: 800,
          UltimoPago: "2023-12-15T00:00:00Z",
          MesesDeuda: 1,
        },
        {
          IdCliente: 3,
          RazonSocial: "SERVICIOS XYZ SRL",
          MontoFijoMensual: 300,
          TotalPagado: 600,
          SaldoPendiente: 1200,
          UltimoPago: "2023-10-15T00:00:00Z",
          MesesDeuda: 4,
        },
      ]

      return NextResponse.json(mockLedger)
    }

    const ledgerClientes = await sql`
      SELECT 
        c."IdCliente",
        c."RazonSocial",
        c."MontoFijoMensual",
        COALESCE(SUM(CASE WHEN p."Estado" = 'CONFIRMADO' THEN p."Monto" ELSE 0 END), 0) as "TotalPagado",
        GREATEST(
          (c."MontoFijoMensual" * EXTRACT(MONTH FROM AGE(${mes + "-01"}::date, c."FechaRegistro"))) - 
          COALESCE(SUM(CASE WHEN p."Estado" = 'CONFIRMADO' THEN p."Monto" ELSE 0 END), 0), 
          0
        ) as "SaldoPendiente",
        MAX(CASE WHEN p."Estado" = 'CONFIRMADO' THEN p."Fecha" ELSE NULL END) as "UltimoPago",
        CASE 
          WHEN MAX(CASE WHEN p."Estado" = 'CONFIRMADO' THEN p."Fecha" ELSE NULL END) IS NULL 
          THEN EXTRACT(MONTH FROM AGE(${mes + "-01"}::date, c."FechaRegistro"))
          ELSE EXTRACT(MONTH FROM AGE(${mes + "-01"}::date, MAX(CASE WHEN p."Estado" = 'CONFIRMADO' THEN p."Fecha" ELSE NULL END)))
        END as "MesesDeuda"
      FROM "Cliente" c
      LEFT JOIN "Pago" p ON c."IdCliente" = p."IdCliente"
      WHERE c."AplicaMontoFijo" = true
      GROUP BY c."IdCliente", c."RazonSocial", c."MontoFijoMensual", c."FechaRegistro"
      ORDER BY "SaldoPendiente" DESC, c."RazonSocial"
    `

    return NextResponse.json(ledgerClientes)
  } catch (error) {
    console.error("Error fetching ledger:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
