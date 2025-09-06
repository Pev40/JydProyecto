import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 500 })
    }

    // Datos para gráfico de pagos por mes
    const pagosPorMes = await sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "Fecha"), 'Mon') as mes,
        COUNT(*) as cantidad,
        SUM("Monto")::numeric as monto
      FROM "Pago"
      WHERE "Fecha" >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "Fecha")
      ORDER BY DATE_TRUNC('month', "Fecha")
    `

    // Datos para gráfico de clientes por clasificación
    const clientesPorClasificacion = await sql`
      SELECT 
        c."Descripcion" as name,
        COUNT(cl."IdCliente") as value,
        c."Color" as color
      FROM "Clasificacion" c
      LEFT JOIN "Cliente" cl ON c."IdClasificacion" = cl."IdClasificacion"
      GROUP BY c."IdClasificacion", c."Descripcion", c."Color"
      ORDER BY c."IdClasificacion"
    `

    // Datos para evolución de morosidad (simulado)
    const evolucionMorosidad = [
      { mes: "Ene", morosos: 15, recuperados: 8 },
      { mes: "Feb", morosos: 18, recuperados: 12 },
      { mes: "Mar", morosos: 12, recuperados: 15 },
      { mes: "Abr", morosos: 20, recuperados: 10 },
      { mes: "May", morosos: 16, recuperados: 18 },
      { mes: "Jun", morosos: 14, recuperados: 22 },
    ]

    return NextResponse.json({
      pagosPorMes: pagosPorMes.map((p) => ({
        mes: p.mes,
        cantidad: Number(p.cantidad),
        monto: Number(p.monto),
      })),
      clientesPorClasificacion: clientesPorClasificacion.map((c) => ({
        name: c.name,
        value: Number(c.value),
        color: c.color === "green" ? "#10b981" : c.color === "orange" ? "#f59e0b" : "#ef4444",
      })),
      evolucionMorosidad,
    })
  } catch (error) {
    console.error("Error fetching chart data:", error)

    // Datos mock en caso de error
    return NextResponse.json({
      pagosPorMes: [
        { mes: "Ene", cantidad: 45, monto: 22500 },
        { mes: "Feb", cantidad: 52, monto: 26000 },
        { mes: "Mar", cantidad: 48, monto: 24000 },
        { mes: "Abr", cantidad: 61, monto: 30500 },
        { mes: "May", cantidad: 55, monto: 27500 },
        { mes: "Jun", cantidad: 67, monto: 33500 },
      ],
      clientesPorClasificacion: [
        { name: "Al día", value: 65, color: "#10b981" },
        { name: "Deuda leve", value: 25, color: "#f59e0b" },
        { name: "Morosos", value: 10, color: "#ef4444" },
      ],
      evolucionMorosidad: [
        { mes: "Ene", morosos: 15, recuperados: 8 },
        { mes: "Feb", morosos: 18, recuperados: 12 },
        { mes: "Mar", morosos: 12, recuperados: 15 },
        { mes: "Abr", morosos: 20, recuperados: 10 },
        { mes: "May", morosos: 16, recuperados: 18 },
        { mes: "Jun", morosos: 14, recuperados: 22 },
      ],
    })
  }
}
