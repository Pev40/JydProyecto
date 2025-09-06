import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, DollarSign, Calendar, TrendingUp, Search } from "lucide-react"
import Link from "next/link"

export default function TipoCambioPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/configuracion">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tipo de Cambio SUNAT</h1>
                <p className="text-gray-600 mt-1">Consulta el tipo de cambio oficial</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de cambio actual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Tipo de Cambio Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">USD a PEN</p>
                  <p className="text-3xl font-bold text-green-600">S/ 3.75</p>
                  <p className="text-xs text-gray-500">Actualizado hoy</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Compra</p>
                    <p className="font-semibold">S/ 3.74</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Venta</p>
                    <p className="font-semibold">S/ 3.76</p>
                  </div>
                </div>
                <Button className="w-full" id="consultar-actual">
                  <Calendar className="h-4 w-4 mr-2" />
                  Consultar Actual
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Consulta por fecha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Consulta por Fecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input id="fecha" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <Button className="w-full bg-transparent" variant="outline" id="consultar-fecha">
                  <Search className="h-4 w-4 mr-2" />
                  Consultar por Fecha
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico mensual */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Histórico Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="mes">Mes</Label>
                  <select id="mes" className="w-full p-2 border rounded-md">
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8" selected>
                      Agosto
                    </option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="año">Año</Label>
                  <Input
                    id="año"
                    type="number"
                    defaultValue={new Date().getFullYear()}
                    min="2020"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-transparent" variant="outline" id="consultar-mensual">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Consultar Mensual
                  </Button>
                </div>
              </div>

              <div id="resultado-mensual" className="hidden">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Resultados aparecerán aquí</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <script
        dangerouslySetInnerHTML={{
          __html: `
          document.getElementById('consultar-actual').addEventListener('click', async () => {
            try {
              const response = await fetch('/api/consultas/tipo-cambio');
              const result = await response.json();
              if (result.success) {
                alert('Tipo de cambio actual: Compra S/ ' + result.data.buy_price + ' - Venta S/ ' + result.data.sell_price);
              } else {
                alert('Error: ' + result.error);
              }
            } catch (error) {
              alert('Error al consultar tipo de cambio');
            }
          });

          document.getElementById('consultar-fecha').addEventListener('click', async () => {
            const fecha = document.getElementById('fecha').value;
            try {
              const response = await fetch('/api/consultas/tipo-cambio?fecha=' + fecha);
              const result = await response.json();
              if (result.success) {
                alert('Tipo de cambio para ' + fecha + ': Compra S/ ' + result.data.buy_price + ' - Venta S/ ' + result.data.sell_price);
              } else {
                alert('Error: ' + result.error);
              }
            } catch (error) {
              alert('Error al consultar tipo de cambio');
            }
          });

          document.getElementById('consultar-mensual').addEventListener('click', async () => {
            const mes = document.getElementById('mes').value;
            const año = document.getElementById('año').value;
            try {
              const response = await fetch('/api/consultas/tipo-cambio?mes=' + mes + '&año=' + año);
              const result = await response.json();
              if (result.success && Array.isArray(result.data)) {
                const resultadoDiv = document.getElementById('resultado-mensual');
                resultadoDiv.innerHTML = '<h4 class="font-semibold mb-2">Histórico de ' + mes + '/' + año + '</h4>';
                result.data.forEach(item => {
                  resultadoDiv.innerHTML += '<p class="text-sm">' + item.date + ': Compra S/ ' + item.buy_price + ' - Venta S/ ' + item.sell_price + '</p>';
                });
                resultadoDiv.classList.remove('hidden');
              } else {
                alert('Error: ' + result.error);
              }
            } catch (error) {
              alert('Error al consultar histórico mensual');
            }
          });
        `,
        }}
      />
    </div>
  )
}
