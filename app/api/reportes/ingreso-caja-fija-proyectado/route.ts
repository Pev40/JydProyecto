import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    if (!sql) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const año = Number.parseInt(searchParams.get("año") || new Date().getFullYear().toString())

    // Obtener datos del reporte usando las tablas base
    const result = await sql`
      SELECT 
        c."IdCliente",
        c."RazonSocial" as "Concepto",
        c."RucDni" as "CodigoCliente",
        c."FechaRegistro" as "FechaInicioServicio",
        '31' as "FechaCorte",
        CAST(0 AS DECIMAL(12,2)) as "SaldoAnterior",
        c."MontoFijoMensual" as "ImporteServicioFijo",
        CAST(0 AS DECIMAL(12,2)) as "ImporteVariable",
        c."MontoFijoMensual" as "ImporteAcumulado",
        'FACTURA' as "TipoComprobante",
        'DIGITAL' as "MedioDocumento",
        COALESCE(s."Descripcion", 'Servicio contable mensual') as "VariableDescripcion",
        CAST(NULL AS DATE) as "FechaUltimaConsulta",
        (
          SELECT MAX(p."Fecha"::DATE)
          FROM "Pago" p 
          WHERE p."IdCliente" = c."IdCliente"
        ) as "FechaUltimoPago",
        CASE 
          WHEN c."AplicaMontoFijo" = true AND c."MontoFijoMensual" > 0 THEN 'ACTIVO'
          ELSE 'INACTIVO'
        END as "EstadoDeuda"
      FROM "Cliente" c
      LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
      WHERE c."AplicaMontoFijo" = true
      ORDER BY c."RazonSocial"
    `

    // Obtener proyecciones personalizadas si existen
    const proyecciones = await sql`
      SELECT 
        "IdCliente",
        "Mes",
        "MontoProyectado"
      FROM "ProyeccionesCajaFija"
      WHERE "Año" = ${año}
    `

    type Row = {
      IdCliente: number
      Concepto?: string
      CodigoCliente?: string
      FechaInicioServicio?: string
      FechaCorte?: string
      SaldoAnterior?: string | number
      ImporteServicioFijo?: string | number
      ImporteVariable?: string | number
      ImporteAcumulado?: string | number
      TipoComprobante?: string
      MedioDocumento?: string
      VariableDescripcion?: string
      FechaUltimaConsulta?: string
      FechaUltimoPago?: string
      EstadoDeuda?: string
    }

    type Proyeccion = {
      IdCliente: number
      Mes: number
      MontoProyectado: number
    }

    // Crear mapa de proyecciones por cliente
    const proyeccionesMap = new Map<number, Map<number, number>>()
    proyecciones.forEach((proj: any) => {
      if (!proyeccionesMap.has(proj.IdCliente)) {
        proyeccionesMap.set(proj.IdCliente, new Map())
      }
      proyeccionesMap.get(proj.IdCliente)!.set(proj.Mes, proj.MontoProyectado)
    })

    const datos = result.map((row: any) => {
      // Generar proyecciones mensuales
      const mesesProyectados: Record<string, number> = {}
      const mesesAbreviados = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
      
      for (let mes = 1; mes <= 12; mes++) {
        const claveMes = `${mesesAbreviados[mes - 1]}-${año.toString().slice(-2)}`
        const montoFijo = Number.parseFloat(String(row.ImporteServicioFijo || 0))
        
        // Usar proyección personalizada si existe, sino usar monto fijo
        const proyeccionesCliente = proyeccionesMap.get(row.IdCliente)
        const montoProyectado = proyeccionesCliente?.get(mes) ?? montoFijo
        
        mesesProyectados[claveMes] = montoProyectado
      }

      return {
        concepto: row.Concepto || "",
        codigoCliente: row.CodigoCliente || "",
        fechaInicio: row.FechaInicioServicio ? new Date(row.FechaInicioServicio).toLocaleDateString("es-PE") : "",
        fechaCorte: row.FechaCorte || "",
        saldoAnterior: Number.parseFloat(String(row.SaldoAnterior || 0)),
        importeServicio: Number.parseFloat(String(row.ImporteServicioFijo || 0)),
        importeVariable: Number.parseFloat(String(row.ImporteVariable || 0)),
        importeAcumulado: Number.parseFloat(String(row.ImporteAcumulado || 0)),
        tipoComprobante: row.TipoComprobante || "",
        medioDoc: row.MedioDocumento || "",
        variableDescripcion: row.VariableDescripcion || "",
        fechaConsulta: row.FechaUltimaConsulta ? new Date(row.FechaUltimaConsulta).toLocaleDateString("es-PE") : "",
        fechaPago: row.FechaUltimoPago ? new Date(row.FechaUltimoPago).toLocaleDateString("es-PE") : "",
        estadoDeuda: row.EstadoDeuda || "SIN_DATOS",
        mesesProyectados,
      }
    })

    // Calcular totales por mes
    const mesesAbreviados = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
    const totalesPorMes: Record<string, number> = {}

    mesesAbreviados.forEach((mes) => {
      const claveMes = `${mes}-${año.toString().slice(-2)}`
      totalesPorMes[claveMes] = datos.reduce((sum, cliente) => {
        return sum + (Number.parseFloat(String(cliente.mesesProyectados[claveMes])) || 0)
      }, 0)
    })

    // Calcular resumen de ingresos
    const mesesCompletos = [
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

    const resumenIngresos = mesesCompletos.map((mes, index) => {
      const claveMes = `${mesesAbreviados[index]}-${año.toString().slice(-2)}`
      return {
        mes,
        total: totalesPorMes[claveMes] || 0,
      }
    })

    const totalAnual = Object.values(totalesPorMes).reduce((sum, val) => sum + val, 0)

    return NextResponse.json({
      datos,
      totalesPorMes,
      resumenIngresos,
      año,
      totalAnual,
      totalClientes: datos.length,
    })
  } catch (error) {
    console.error("Error en reporte caja fija proyectado:", error)
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
    const { datos, ano, totalesPorMes, resumenIngresos } = await request.json()

    const wb = XLSX.utils.book_new()

    const mesesAbreviados = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

    // Crear datos para la hoja principal
    const excelData: (string | number)[][] = []

    // Encabezado principal
    excelData.push([
      "J&D CONSULTORES DE NEGOCIOS",
      "",
      "",
      "",
      "INGRESO DE CAJA FIJA PROYECTADO",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      ...mesesAbreviados.map((mes) => `${mes}-${ano.slice(-2)}`),
    ])
    excelData.push([]) // Fila vacía

    // Encabezados de columnas
    const headers = [
      "CONCEPTO",
      "CODIGO CLIENTE",
      "FECHA INICIO",
      "FECHA CORTE",
      "SALDO ANTERIOR",
      "IMPORTE SERVICIO",
      "IMPORTE VARIABLE",
      "IMPORTE ACUMULADO",
      "TIPO COMPROBANTE",
      "MEDIO DOC",
      "VARIABLE DESCRIPCION",
      "FECHA CONSULTA",
      "FECHA PAGO",
      ...mesesAbreviados.map((mes) => `${mes}-${ano.slice(-2)}`),
    ]
    excelData.push(headers)

    // Datos de clientes
    type ClienteRow = {
      concepto: string
      codigoCliente: string
      fechaInicio: string
      fechaCorte: string
      saldoAnterior: number
      importeServicio: number
      importeVariable: number
      importeAcumulado: number
      tipoComprobante: string
      medioDoc: string
      variableDescripcion: string
      fechaConsulta: string
      fechaPago: string
      mesesProyectados: Record<string, number>
    }

    datos.forEach((cliente: ClienteRow) => {
      const fila = [
        cliente.concepto,
        cliente.codigoCliente,
        cliente.fechaInicio,
        cliente.fechaCorte,
        cliente.saldoAnterior,
        cliente.importeServicio,
        cliente.importeVariable,
        cliente.importeAcumulado,
        cliente.tipoComprobante,
        cliente.medioDoc,
        cliente.variableDescripcion,
        cliente.fechaConsulta,
        cliente.fechaPago,
      ]

      // Agregar valores de meses
      mesesAbreviados.forEach((mes) => {
        const claveMes = `${mes}-${ano.slice(-2)}`
        fila.push(cliente.mesesProyectados[claveMes] || 0)
      })

      excelData.push(fila)
    })

    // Fila de totales
    const filaTotales = ["TOTAL CLIENTES FIJOS", "", "", "", "", "", "", "", "", "", "", "", ""]
    mesesAbreviados.forEach((mes) => {
      const claveMes = `${mes}-${ano.slice(-2)}`
      filaTotales.push(totalesPorMes[claveMes] || 0)
    })
    excelData.push(filaTotales)

    // Crear hoja principal
    const ws = XLSX.utils.aoa_to_sheet(excelData)

    // Configurar anchos de columna
    ws["!cols"] = [
      { width: 15 }, // CONCEPTO
      { width: 12 }, // CODIGO CLIENTE
      { width: 12 }, // FECHA INICIO
      { width: 12 }, // FECHA CORTE
      { width: 15 }, // SALDO ANTERIOR
      { width: 15 }, // IMPORTE SERVICIO
      { width: 15 }, // IMPORTE VARIABLE
      { width: 18 }, // IMPORTE ACUMULADO
      { width: 15 }, // TIPO COMPROBANTE
      { width: 12 }, // MEDIO DOC
      { width: 20 }, // VARIABLE DESCRIPCION
      { width: 15 }, // FECHA CONSULTA
      { width: 12 }, // FECHA PAGO
      ...mesesAbreviados.map(() => ({ width: 12 })), // Meses
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Caja Fija Proyectado")

    // Crear hoja de resumen
    const resumenData: (string | number)[][] = []
    resumenData.push(["RESUMEN INGRESOS DEL MES", "TOTAL"])
    resumenData.push([])

    resumenIngresos.forEach((item: any) => {
      resumenData.push([item.mes, item.total])
    })

    const totalAnual = resumenIngresos.reduce((sum: number, item: any) => sum + item.total, 0)
    resumenData.push(["TOTAL ANUAL", totalAnual])

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
    wsResumen["!cols"] = [{ width: 20 }, { width: 15 }]
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Mensual")

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
        "Content-Disposition": `attachment; filename="ingreso-caja-fija-proyectado-${ano}.xlsx"`,
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
