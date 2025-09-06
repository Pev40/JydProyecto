"use client"

import { useEffect, useState } from "react"
import { PagosChart } from "./charts/pagos-chart"
import { ClientesChart } from "./charts/clientes-chart"
import { MorosidadChart } from "./charts/morosidad-chart"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Skeleton } from "./ui/skeleton"

interface ChartData {
  pagos: Array<{
    mes: string
    pagos: number
    monto: number
  }>
  clientes: Array<{
    name: string
    value: number
    color: string
  }>
  morosidad: Array<{
    mes: string
    morosos: number
    recuperados: number
  }>
}

export function DashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [])

  const fetchChartData = async () => {
    try {
      const response = await fetch("/api/dashboard/charts")
      if (response.ok) {
        const chartData = await response.json()
        setData(chartData)
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cargando gráficos...</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cargando gráficos...</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Cargando gráficos...</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PagosChart data={data.pagos} />
        <ClientesChart data={data.clientes} />
      </div>
      <div className="grid grid-cols-1">
        <MorosidadChart data={data.morosidad} />
      </div>
    </div>
  )
}
