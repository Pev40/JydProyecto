import { getPagos, getClienteById } from "@/lib/queries"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer, Send } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function GenerarReciboPage({ params }: PageProps) {
  const pagoId = Number.parseInt(params.id)

  if (isNaN(pagoId)) {
    notFound()
  }

  const pagos = await getPagos()
  const pago = pagos.find((p) => p.IdPago === pagoId)

  if (!pago) {
    notFound()
  }

  const cliente = await getClienteById(pago.IdCliente)

  if (!cliente) {
    notFound()
  }

  const numeroRecibo = `REC-${String(pago.IdPago).padStart(6, "0")}`
  const fechaEmision = new Date().toLocaleDateString("es-PE")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/recibos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Recibos
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Recibo de Pago</h1>
                <p className="text-gray-600 mt-1">Recibo N° {numeroRecibo}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recibo */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-8">
            {/* Header del recibo */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">J & D CONSULTORES DE NEGOCIOS S.A.C.</h2>
                <p className="text-gray-600">RUC: 20123456789</p>
                <p className="text-gray-600">Av. Principal 123, Arequipa</p>
                <p className="text-gray-600">Teléfono: (054) 123-456</p>
                <p className="text-gray-600">Email: contacto@jdconsultores.com</p>
              </div>
              <div className="text-right">
                <div className="bg-blue-100 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-800">RECIBO DE PAGO</h3>
                  <p className="text-blue-600">N° {numeroRecibo}</p>
                </div>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">DATOS DEL CLIENTE:</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Razón Social:</span> {cliente.RazonSocial}
                  </p>
                  <p>
                    <span className="font-medium">RUC/DNI:</span> {cliente.RucDni}
                  </p>
                  {cliente.NombreContacto && (
                    <p>
                      <span className="font-medium">Contacto:</span> {cliente.NombreContacto}
                    </p>
                  )}
                  {cliente.Email && (
                    <p>
                      <span className="font-medium">Email:</span> {cliente.Email}
                    </p>
                  )}
                  {cliente.Telefono && (
                    <p>
                      <span className="font-medium">Teléfono:</span> {cliente.Telefono}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">DATOS DEL RECIBO:</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Fecha de Emisión:</span> {fechaEmision}
                  </p>
                  <p>
                    <span className="font-medium">Fecha de Pago:</span>{" "}
                    {new Date(pago.Fecha).toLocaleDateString("es-PE")}
                  </p>
                  <p>
                    <span className="font-medium">Medio de Pago:</span> {pago.MedioPago}
                  </p>
                  {pago.BancoNombre && (
                    <p>
                      <span className="font-medium">Banco:</span> {pago.BancoNombre}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Estado:</span> {pago.Estado}
                  </p>
                </div>
              </div>
            </div>

            {/* Detalle del pago */}
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-4">DETALLE DEL PAGO:</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Concepto</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Período</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3 text-sm">{pago.Concepto}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(pago.MesServicio).toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        S/ {Number(pago.Monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">
                        TOTAL PAGADO:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-lg">
                        S/ {Number(pago.Monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Monto en letras */}
            <div className="mb-8">
              <p className="text-sm">
                <span className="font-medium">Son:</span> {convertirNumeroALetras(Number(pago.Monto))} SOLES
              </p>
            </div>

            {/* Observaciones */}
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-2">OBSERVACIONES:</h4>
              <p className="text-sm text-gray-600">
                Recibo generado automáticamente por el Sistema de Gestión de Cobranza. Para cualquier consulta,
                comuníquese al teléfono (054) 123-456 o al email contacto@jdconsultores.com
              </p>
            </div>

            {/* Footer */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <p>Recibo generado el {fechaEmision}</p>
                  <p>Sistema de Gestión de Cobranza v1.0</p>
                </div>
                <div className="text-right">
                  <div className="border-t border-gray-300 pt-2 mt-8 w-48">
                    <p className="text-sm text-gray-600">Firma y Sello</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function convertirNumeroALetras(numero: number): string {
  // Función simplificada para convertir números a letras
  // En producción se usaría una librería especializada
  const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
  const decenas = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
  const centenas = [
    "",
    "CIENTO",
    "DOSCIENTOS",
    "TRESCIENTOS",
    "CUATROCIENTOS",
    "QUINIENTOS",
    "SEISCIENTOS",
    "SETECIENTOS",
    "OCHOCIENTOS",
    "NOVECIENTOS",
  ]

  if (numero === 0) return "CERO"
  if (numero < 10) return unidades[numero]
  if (numero < 100) {
    const dec = Math.floor(numero / 10)
    const uni = numero % 10
    return decenas[dec] + (uni > 0 ? " Y " + unidades[uni] : "")
  }
  if (numero < 1000) {
    const cen = Math.floor(numero / 100)
    const resto = numero % 100
    return centenas[cen] + (resto > 0 ? " " + convertirNumeroALetras(resto) : "")
  }

  // Para números mayores, implementar lógica adicional
  return `${numero.toFixed(2)}`
}
