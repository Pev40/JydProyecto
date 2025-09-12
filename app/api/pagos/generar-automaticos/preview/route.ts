import { type NextRequest, NextResponse } from "next/server"
import { sql, testConnection } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") || new Date().toISOString().slice(0, 7)

    if (!sql || !(await testConnection())) {
      // Datos mock para demostración
      const mockClientes = [
        {
          IdCliente: 1,
          RazonSocial: "EMPRESA DEMO SAC",
          MontoFijoMensual: 500,
          UltimoPago: "2024-01-15T00:00:00Z",
          MesesSinPago: 0,
        },
        {
          IdCliente: 2,
          RazonSocial: "CONSULTORA ABC EIRL",
          MontoFijoMensual: 800,
          UltimoPago: "2023-12-15T00:00:00Z",
          MesesSinPago: 1,
        },
        {
          IdCliente: 3,
          RazonSocial: "SERVICIOS XYZ SRL",
          MontoFijoMensual: 300,
          UltimoPago: null,
          MesesSinPago: 4,
        },
      ]

      return NextResponse.json(mockClientes)
    }

    // Obtener clientes que tienen monto fijo mensual y no tienen pago generado para el mes
    const clientesParaGenerar = await sql`
      SELECT 
        c."IdCliente",
        c."RazonSocial",
        c."MontoFijoMensual",
        MAX(p."Fecha") as "UltimoPago",
        CASE 
          WHEN MAX(p."Fecha") IS NULL 
          THEN EXTRACT(MONTH FROM AGE(${mes + "-01"}::date, c."FechaRegistro"))
          ELSE EXTRACT(MONTH FROM AGE(${mes + "-01"}::date, MAX(p."Fecha")))
        END as "MesesSinPago"
      FROM "Cliente" c
      LEFT JOIN "Pago" p ON c."IdCliente" = p."IdCliente" AND p."Estado" = 'CONFIRMADO'
      WHERE c."AplicaMontoFijo" = true
        AND c."MontoFijoMensual" > 0
        AND NOT EXISTS (
          SELECT 1 FROM "Pago" p2 
          WHERE p2."IdCliente" = c."IdCliente" 
            AND DATE_TRUNC('month', p2."MesServicio") = ${mes + "-01"}::date
        )
      GROUP BY c."IdCliente", c."RazonSocial", c."MontoFijoMensual", c."FechaRegistro"
      ORDER BY c."RazonSocial"
    `

    return NextResponse.json(clientesParaGenerar)
  } catch (error) {
    console.error("Error fetching preview:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
