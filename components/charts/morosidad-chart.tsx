"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TooltipProps, ValueType, NameType } from "recharts"
import { AlertTriangle } from "lucide-react"

interface MorosidadData {
  mes: string
  morosos: number
  recuperados: number
}

export function MorosidadChart() {
  const [data, setData] = useState<MorosidadData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/dashboard/charts")
      if (response.ok) {
        const chartData = await response.json()
        setData(chartData.evolucionMorosidad || [])
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
      // Datos mock en caso de error
      setData([
        { mes: "Ene", morosos: 15, recuperados: 8 },
        { mes: "Feb", morosos: 18, recuperados: 12 },
        { mes: "Mar", morosos: 12, recuperados: 15 },
        { mes: "Abr", morosos: 20, recuperados: 10 },
        { mes: "May", morosos: 16, recuperados: 18 },
        { mes: "Jun", morosos: 14, recuperados: 22 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label} 2024`}</p>
          <p className="text-red-600">{`Nuevos morosos: ${payload[0].value}`}</p>
          <p className="text-green-600">{`Recuperados: ${payload[1].value}`}</p>
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
            <AlertTriangle className="h-5 w-5" />
            Evolución de Morosidad
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
          <AlertTriangle className="h-5 w-5" />
          Evolución de Morosidad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="morosos" stroke="#ef4444" strokeWidth={2} name="Nuevos Morosos" />
            <Line type="monotone" dataKey="recuperados" stroke="#10b981" strokeWidth={2} name="Clientes Recuperados" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
