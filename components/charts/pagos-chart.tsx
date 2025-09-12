"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import type { TooltipProps, ValueType, NameType } from "recharts"

interface PagoData {
  mes: string
  cantidad: number
  monto: number
}

export function PagosChart() {
  const [data, setData] = useState<PagoData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/dashboard/charts")
      if (response.ok) {
        const chartData = await response.json()
        setData(chartData.pagosPorMes || [])
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
      // Datos mock en caso de error
      setData([
        { mes: "Ene", cantidad: 45, monto: 22500 },
        { mes: "Feb", cantidad: 52, monto: 26000 },
        { mes: "Mar", cantidad: 48, monto: 24000 },
        { mes: "Abr", cantidad: 61, monto: 30500 },
        { mes: "May", cantidad: 55, monto: 27500 },
        { mes: "Jun", cantidad: 67, monto: 33500 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `S/ ${value.toLocaleString("es-PE")}`
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label} 2024`}</p>
          <p className="text-blue-600">{`Cantidad: ${payload[0].value as number} pagos`}</p>
          <p className="text-green-600">{`Monto: ${formatCurrency(payload[1].value as number)}`}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pagos por Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Pagos por Mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="cantidad" fill="#3b82f6" name="Cantidad de Pagos" />
            <Bar yAxisId="right" dataKey="monto" fill="#10b981" name="Monto Total (S/)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
