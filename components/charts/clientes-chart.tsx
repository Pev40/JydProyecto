"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { TooltipProps, ValueType, NameType } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

interface ClienteData {
  name: string
  value: number
  color: string
}

export function ClientesChart() {
  const [data, setData] = useState<ClienteData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/dashboard/charts")
      if (response.ok) {
        const chartData = await response.json()
        setData(chartData.clientesPorClasificacion || [])
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
      // Datos mock en caso de error
      setData([
        { name: "Al día", value: 65, color: "#10b981" },
        { name: "Deuda leve", value: 25, color: "#f59e0b" },
        { name: "Morosos", value: 10, color: "#ef4444" },
      ])
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
    const datum = (payload && payload[0]?.payload) as (ClienteData & { total: number }) | undefined
    if (active && datum) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{datum.name}</p>
          <p style={{ color: datum.color }}>
            {`${datum.value} clientes (${((datum.value / datum.total) * 100).toFixed(1)}%)`}
          </p>
        </div>
      )
    }
    return null
  }

  const dataWithTotal = data.map((item) => ({
    ...item,
    total: data.reduce((sum, d) => sum + d.value, 0),
  }))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Distribución de Clientes
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
          <Users className="h-5 w-5" />
          Distribución de Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithTotal.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
