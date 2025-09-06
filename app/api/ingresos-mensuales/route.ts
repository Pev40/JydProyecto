import { NextResponse } from "next/server"
import { sql, testConnection } from "@/lib/db"

export async function GET() {
  try {
    if (!sql || !(await testConnection())) {
      // Datos mock para demostración
      const mockData = []
      const currentDate = new Date()

      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const mes = date.toISOString().slice(0, 7)

        mockData.push({
          mes,
          ingresos: Math.random() * 10000 + 5000,
          pagos_count: Math.floor(Math.random() * 20) + 10,
          clientes_activos: Math.floor(Math.random() * 15) + 10,
          promedio_por_cliente: Math.random() * 800 + 400,
        })
      }

      return NextResponse.json(mockData)
    }

    const ingresosMensuales = await sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', p."Fecha"), 'YYYY-MM') as mes,
        COALESCE(SUM(p."Monto"), 0) as ingresos,
        COUNT(p."IdPago") as pagos_count,
        COUNT(DISTINCT p."IdCliente") as clientes_activos,
        CASE 
          WHEN COUNT(DISTINCT p."IdCliente") > 0 
          THEN COALESCE(SUM(p."Monto"), 0) / COUNT(DISTINCT p."IdCliente")
          ELSE 0 
        END as promedio_por_cliente
      FROM "Pago" p
      WHERE p."Estado" = 'CONFIRMADO'
        AND p."Fecha" >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', p."Fecha")
      ORDER BY mes DESC
    `

    return NextResponse.json(ingresosMensuales)
  } catch (error) {
    console.error("Error fetching ingresos mensuales:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
