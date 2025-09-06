import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, formato, filtros } = body

    let datos: any[] = []

    switch (tipo) {
      case "consolidado":
        datos = await generarReporteConsolidado(filtros)
        break
      case "flujo-caja":
        datos = await generarReporteFlujoCaja(filtros)
        break
      case "morosidad":
        datos = await generarReporteMorosidad(filtros)
        break
      case "clientes":
        datos = await generarReporteClientes(filtros)
        break
      default:
        return NextResponse.json({ success: false, error: "Tipo de reporte no válido" }, { status: 400 })
    }

    if (formato === "excel") {
      const excelBuffer = await generarExcel(datos, tipo)

      return new NextResponse(new Uint8Array(excelBuffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="reporte_${tipo}_${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    } else if (formato === "csv") {
      const csvContent = generarCSV(datos)

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="reporte_${tipo}_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      datos,
      total: datos.length,
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ success: false, error: "Error al generar el reporte" }, { status: 500 })
  }
}

async function generarReporteConsolidado(filtros: any) {
  if (!sql) {
    return []
  }

  const query = `
    SELECT 
      c."RazonSocial",
      c."RucDni",
      c."NombreContacto",
      c."Email",
      c."Telefono",
      cl."Codigo" as "Clasificacion",
      cl."Descripcion" as "ClasificacionDescripcion",
      car."Nombre" as "Cartera",
      s."Nombre" as "Servicio",
      c."MontoFijoMensual",
      COALESCE(SUM(p."Monto"), 0) as "TotalPagado",
      COUNT(p."IdPago") as "CantidadPagos",
      MAX(p."Fecha") as "UltimoPago",
      COALESCE(
        (c."MontoFijoMensual" * EXTRACT(MONTH FROM AGE(CURRENT_DATE, c."FechaRegistro"))) - 
        COALESCE(SUM(p."Monto"), 0), 
        0
      ) as "SaldoPendiente",
      COUNT(n."IdNotificacion") as "CantidadNotificaciones",
      COUNT(cp."IdCompromisoPago") as "CantidadCompromisos"
    FROM "Cliente" c
    LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
    LEFT JOIN "Cartera" car ON c."IdCartera" = car."IdCartera"
    LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
    LEFT JOIN "Pago" p ON c."IdCliente" = p."IdCliente" AND p."Estado" = 'CONFIRMADO'
    LEFT JOIN "Notificacion" n ON c."IdCliente" = n."IdCliente"
    LEFT JOIN "CompromisoPago" cp ON c."IdCliente" = cp."IdCliente"
    GROUP BY c."IdCliente", cl."Codigo", cl."Descripcion", car."Nombre", s."Nombre"
    ORDER BY c."RazonSocial"
  `

  return await sql.query(query)
}

async function generarReporteFlujoCaja(filtros: any) {
  if (!sql) {
    return []
  }

  const query = `
    SELECT 
      c."UltimoDigitoRUC" as "DigitoRUC",
      COUNT(c."IdCliente") as "CantidadClientes",
      COALESCE(SUM(p."Monto"), 0) as "TotalPagado",
      COALESCE(
        SUM(c."MontoFijoMensual" * EXTRACT(MONTH FROM AGE(CURRENT_DATE, c."FechaRegistro"))) - 
        COALESCE(SUM(p."Monto"), 0), 
        0
      ) as "SaldoPendiente"
    FROM "Cliente" c
    LEFT JOIN "Pago" p ON c."IdCliente" = p."IdCliente" AND p."Estado" = 'CONFIRMADO'
    GROUP BY c."UltimoDigitoRUC"
    ORDER BY c."UltimoDigitoRUC"
  `

  return await sql.query(query)
}

async function generarReporteMorosidad(filtros: any) {
  if (!sql) {
    return []
  }

  const query = `
    SELECT 
      c."RazonSocial",
      c."RucDni",
      c."NombreContacto",
      c."Email",
      c."Telefono",
      cl."Codigo" as "Clasificacion",
      cl."Descripcion" as "ClasificacionDescripcion",
      c."FechaRegistro",
      COALESCE(SUM(p."Monto"), 0) as "TotalPagado",
      COALESCE(
        (c."MontoFijoMensual" * EXTRACT(MONTH FROM AGE(CURRENT_DATE, c."FechaRegistro"))) - 
        COALESCE(SUM(p."Monto"), 0), 
        0
      ) as "SaldoPendiente",
      EXTRACT(DAY FROM AGE(CURRENT_DATE, MAX(p."Fecha"))) as "DiasSinPago",
      COUNT(cp."IdCompromisoPago") as "CompromisosIncumplidos"
    FROM "Cliente" c
    LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
    LEFT JOIN "Pago" p ON c."IdCliente" = p."IdCliente" AND p."Estado" = 'CONFIRMADO'
    LEFT JOIN "CompromisoPago" cp ON c."IdCliente" = cp."IdCliente" AND cp."Estado" = 'PENDIENTE' AND cp."FechaCompromiso" < CURRENT_DATE
    WHERE cl."Codigo" IN ('B', 'C')
    GROUP BY c."IdCliente", cl."Codigo", cl."Descripcion"
    ORDER BY "SaldoPendiente" DESC
  `

  return await sql.query(query)
}

async function generarReporteClientes(filtros: any) {
  if (!sql) {
    return []
  }

  let whereClause = "WHERE 1=1"

  if (filtros?.clasificacion) {
    whereClause += ` AND cl."Codigo" = '${filtros.clasificacion}'`
  }

  if (filtros?.cartera) {
    whereClause += ` AND c."IdCartera" = ${filtros.cartera}`
  }

  const query = `
    SELECT 
      c."RazonSocial",
      c."RucDni",
      c."NombreContacto",
      c."Email",
      c."Telefono",
      c."UltimoDigitoRUC",
      cl."Codigo" as "Clasificacion",
      cl."Descripcion" as "ClasificacionDescripcion",
      car."Nombre" as "Cartera",
      s."Nombre" as "Servicio",
      ce."Nombre" as "CategoriaEmpresa",
      c."MontoFijoMensual",
      c."FechaRegistro",
      c."FechaVencimiento"
    FROM "Cliente" c
    LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
    LEFT JOIN "Cartera" car ON c."IdCartera" = car."IdCartera"
    LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
    LEFT JOIN "CategoriaEmpresa" ce ON c."IdCategoriaEmpresa" = ce."IdCategoriaEmpresa"
    ${whereClause}
    ORDER BY c."RazonSocial"
  `

  return await sql.query(query)
}

async function generarExcel(datos: any[], tipo: string): Promise<Buffer> {
  // Simulación de generación de Excel
  // En producción se usaría una librería como 'exceljs' o 'xlsx'

  const headers = getHeadersForType(tipo)
  let csvContent = headers.join(",") + "\n"

  datos.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header] || ""
      return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
    })
    csvContent += values.join(",") + "\n"
  })

  return Buffer.from(csvContent, "utf-8")
}

function generarCSV(datos: any[]): string {
  if (datos.length === 0) return ""

  const headers = Object.keys(datos[0])
  let csvContent = headers.join(",") + "\n"

  datos.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header] || ""
      return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
    })
    csvContent += values.join(",") + "\n"
  })

  return csvContent
}

function getHeadersForType(tipo: string): string[] {
  switch (tipo) {
    case "consolidado":
      return [
        "RazonSocial",
        "RucDni",
        "NombreContacto",
        "Email",
        "Telefono",
        "Clasificacion",
        "ClasificacionDescripcion",
        "Cartera",
        "Servicio",
        "MontoFijoMensual",
        "TotalPagado",
        "SaldoPendiente",
        "CantidadPagos",
        "CantidadNotificaciones",
        "CantidadCompromisos",
      ]
    case "flujo-caja":
      return ["DigitoRUC", "CantidadClientes", "TotalPagado", "SaldoPendiente"]
    case "morosidad":
      return [
        "RazonSocial",
        "RucDni",
        "NombreContacto",
        "Email",
        "Telefono",
        "Clasificacion",
        "TotalPagado",
        "SaldoPendiente",
        "DiasSinPago",
        "CompromisosIncumplidos",
      ]
    case "clientes":
      return [
        "RazonSocial",
        "RucDni",
        "NombreContacto",
        "Email",
        "Telefono",
        "UltimoDigitoRUC",
        "Clasificacion",
        "Cartera",
        "Servicio",
        "CategoriaEmpresa",
        "MontoFijoMensual",
        "FechaRegistro",
      ]
    default:
      return []
  }
}
