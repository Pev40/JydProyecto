import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    if (!sql) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const año = searchParams.get("año") || new Date().getFullYear().toString()
    const mes = searchParams.get("mes") || ""
    const cliente = searchParams.get("cliente") || ""

    // Construir la consulta usando template literals de Neon
    let result
    
    if (mes && mes !== "" && cliente && cliente !== "") {
      // Filtro por año, mes y cliente
      result = await sql`
        SELECT 
          "Mes",
          "Año",
          "NombreMes",
          "Cliente",
          "Fecha",
          "DetalleServicio",
          "NumeroRecibo",
          "Medio",
          "Banco",
          "MontoDevengado",
          "MontoPagado",
          "SaldoPendiente",
          "Observaciones",
          "MontoOriginal",
          "Estado"
        FROM VistaReporteCajaVariable
        WHERE "Año" = ${Number.parseInt(año)}
          AND "Mes" = ${Number.parseInt(mes)}
          AND LOWER("Cliente") LIKE ${`%${cliente.toLowerCase()}%`}
        ORDER BY "Fecha" DESC, "Cliente"
      `
    } else if (mes && mes !== "") {
      // Filtro por año y mes
      result = await sql`
        SELECT 
          "Mes",
          "Año",
          "NombreMes",
          "Cliente",
          "Fecha",
          "DetalleServicio",
          "NumeroRecibo",
          "Medio",
          "Banco",
          "MontoDevengado",
          "MontoPagado",
          "SaldoPendiente",
          "Observaciones",
          "MontoOriginal",
          "Estado"
        FROM VistaReporteCajaVariable
        WHERE "Año" = ${Number.parseInt(año)}
          AND "Mes" = ${Number.parseInt(mes)}
        ORDER BY "Fecha" DESC, "Cliente"
      `
    } else if (cliente && cliente !== "") {
      // Filtro por año y cliente
      result = await sql`
        SELECT 
          "Mes",
          "Año",
          "NombreMes",
          "Cliente",
          "Fecha",
          "DetalleServicio",
          "NumeroRecibo",
          "Medio",
          "Banco",
          "MontoDevengado",
          "MontoPagado",
          "SaldoPendiente",
          "Observaciones",
          "MontoOriginal",
          "Estado"
        FROM VistaReporteCajaVariable
        WHERE "Año" = ${Number.parseInt(año)}
          AND LOWER("Cliente") LIKE ${`%${cliente.toLowerCase()}%`}
        ORDER BY "Fecha" DESC, "Cliente"
      `
    } else {
      // Solo filtro por año
      result = await sql`
        SELECT 
          "Mes",
          "Año",
          "NombreMes",
          "Cliente",
          "Fecha",
          "DetalleServicio",
          "NumeroRecibo",
          "Medio",
          "Banco",
          "MontoDevengado",
          "MontoPagado",
          "SaldoPendiente",
          "Observaciones",
          "MontoOriginal",
          "Estado"
        FROM VistaReporteCajaVariable
        WHERE "Año" = ${Number.parseInt(año)}
        ORDER BY "Fecha" DESC, "Cliente"
      `
    }

    // Agrupar por mes
    type Row = {
      Mes: number
      NombreMes: string
      Cliente: string
      Fecha: string
      DetalleServicio?: string
      NumeroRecibo?: string
      Medio?: string
      Banco?: string
      MontoDevengado?: string | number
      MontoPagado?: string | number
      SaldoPendiente?: string | number
      Observaciones?: string
      Estado: string
    }

    const datosPorMes: Record<string, {
      mes: string
      cliente: string
      fecha: string
      detalleServicio: string
      numeroRecibo: string
      medio: string
      banco: string
      devengado: number
      pagado: number
      saldoPendiente: number
      observaciones: string
      estado: string
    }[]> = {}

    result.forEach((row: Row) => {
      const nombreMes = row.NombreMes || `MES_${row.Mes}`
      if (!datosPorMes[nombreMes]) {
        datosPorMes[nombreMes] = []
      }

      datosPorMes[nombreMes].push({
        mes: nombreMes,
        cliente: row.Cliente,
        fecha: new Date(row.Fecha).toLocaleDateString("es-PE"),
        detalleServicio: row.DetalleServicio || "",
        numeroRecibo: row.NumeroRecibo || "",
        medio: row.Medio || "",
        banco: row.Banco || "",
        devengado: Number.parseFloat(String(row.MontoDevengado || 0)),
        pagado: Number.parseFloat(String(row.MontoPagado || 0)),
        saldoPendiente: Number.parseFloat(String(row.SaldoPendiente || 0)),
        observaciones: row.Observaciones || "",
        estado: row.Estado,
      })
    })

    // Calcular totales
    const totales = {
      devengado: result.reduce((sum, row: Row) => sum + Number.parseFloat(String(row.MontoDevengado || 0)), 0),
      pagado: result.reduce((sum, row: Row) => sum + Number.parseFloat(String(row.MontoPagado || 0)), 0),
      saldoPendiente: result.reduce(
        (sum, row: Row) => sum + Number.parseFloat(String(row.SaldoPendiente || 0)),
        0,
      ),
    }

    return NextResponse.json({
      datos: datosPorMes,
      totales,
      filtros: { año, mes, cliente },
      totalRegistros: result.length,
    })
  } catch (error) {
    console.error("Error en reporte caja variable:", error)
    return NextResponse.json(
      {
        error: "Error al generar reporte",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { datos, filtros } = await request.json()

    const wb = XLSX.utils.book_new()
    const excelData: (string | number)[][] = []

    // Encabezado principal
    excelData.push(["J&D CONSULTORES DE NEGOCIOS", "", "", "", "INGRESO DE CAJA VARIABLE", "", "", "", "", "", ""])
    excelData.push(["", "", "", "", `AÑO: ${filtros.año}`, "", "", "", "", "", ""])
    excelData.push([]) // Fila vacía

    // Encabezados de columnas
    const headers = [
      "MES",
      "CLIENTE",
      "FECHA",
      "DETALLE DEL SERVICIO",
      "NRO RECIBO",
      "MEDIO",
      "BANCO",
      "DEVENGADO",
      "PAGADO",
      "SALDO PENDIENTE",
      "OBSERVACIÓN",
    ]
    excelData.push(headers)

    // Datos por mes
    const mesesOrdenados = [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ]

    let totalDevengado = 0
    let totalPagado = 0
    let totalSaldoPendiente = 0

    mesesOrdenados.forEach((mes) => {
      if (datos[mes] && datos[mes].length > 0) {
        // Datos del mes
        datos[mes].forEach((item) => {
          excelData.push([
            mes,
            item.cliente,
            item.fecha,
            item.detalleServicio,
            item.numeroRecibo,
            item.medio,
            item.banco,
            item.devengado,
            item.pagado,
            item.saldoPendiente,
            item.observaciones,
          ])

          totalDevengado += item.devengado
          totalPagado += item.pagado
          totalSaldoPendiente += item.saldoPendiente
        })

        // Subtotal del mes
        const subtotalDevengado = datos[mes].reduce((sum: number, item) => sum + item.devengado, 0)
        const subtotalPagado = datos[mes].reduce((sum: number, item) => sum + item.pagado, 0)
        const subtotalSaldoPendiente = datos[mes].reduce((sum: number, item) => sum + item.saldoPendiente, 0)

        excelData.push([
          `TOTAL ${mes}`,
          "",
          "",
          "",
          "",
          "",
          "",
          subtotalDevengado,
          subtotalPagado,
          subtotalSaldoPendiente,
          "",
        ])
        excelData.push([]) // Fila vacía
      }
    })

    // Total general
    excelData.push(["TOTAL GENERAL", "", "", "", "", "", "", totalDevengado, totalPagado, totalSaldoPendiente, ""])

    const ws = XLSX.utils.aoa_to_sheet(excelData)

    // Configurar anchos de columna
    ws["!cols"] = [
      { width: 15 }, // MES
      { width: 25 }, // CLIENTE
      { width: 12 }, // FECHA
      { width: 30 }, // DETALLE DEL SERVICIO
      { width: 15 }, // NRO RECIBO
      { width: 15 }, // MEDIO
      { width: 15 }, // BANCO
      { width: 15 }, // DEVENGADO
      { width: 15 }, // PAGADO
      { width: 18 }, // SALDO PENDIENTE
      { width: 25 }, // OBSERVACIÓN
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Caja Variable")

    // Generar buffer del archivo Excel
    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "buffer",
      cellStyles: true,
    })

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ingreso-caja-variable-${filtros.año}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error generando Excel:", error)
    return NextResponse.json(
      {
        error: "Error al generar el archivo Excel",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
