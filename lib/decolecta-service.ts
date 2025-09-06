interface DecolectaRucResponse {
  razon_social: string
  numero_documento: string
  estado: string
  condicion: string
  direccion: string
  ubigeo: string
  via_tipo: string
  via_nombre: string
  zona_codigo: string
  zona_tipo: string
  numero: string
  interior: string
  lote: string
  dpto: string
  manzana: string
  kilometro: string
  distrito: string
  provincia: string
  departamento: string
  es_agente_retencion: boolean
  es_buen_contribuyente: boolean
  locales_anexos: any
}

interface DecolectaDniResponse {
  first_name: string
  first_last_name: string
  second_last_name: string
  document_number: string
}

interface DecolectaTipoCambioResponse {
  buy_price: string
  sell_price: string
  base_currency: string
  quote_currency: string
  date: string
}

class DecolectaService {
  private baseUrl = "https://api.decolecta.com/v1"
  private apiKey = process.env.DECOLECTA_API_KEY

  private async makeRequest<T>(endpoint: string): Promise<T | null> {
    if (!this.apiKey) {
      console.warn("DECOLECTA_API_KEY no está configurada")
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        console.error(`Error en API Decolecta: ${response.status} - ${response.statusText}`)
        return null
      }

      const data = await response.json()
      //console.log("Respuesta de Decolecta:", data)
      return data
    } catch (error) {
      console.error("Error calling Decolecta API:", error)
      return null
    }
  }

  async consultarRuc(ruc: string): Promise<DecolectaRucResponse | null> {
    if (!ruc || ruc.length !== 11) {
      return null
    }

    return await this.makeRequest<DecolectaRucResponse>(`/sunat/ruc?numero=${ruc}`)
  }

  async consultarDni(dni: string): Promise<DecolectaDniResponse | null> {
    if (!dni || dni.length !== 8) {
      return null
    }

    return await this.makeRequest<DecolectaDniResponse>(`/reniec/dni?numero=${dni}`)
  }

  async obtenerTipoCambio(fecha?: string): Promise<DecolectaTipoCambioResponse | null> {
    let endpoint = "/tipo-cambio/sunat"

    if (fecha) {
      endpoint += `?date=${fecha}`
    }

    return await this.makeRequest<DecolectaTipoCambioResponse>(endpoint)
  }

  async obtenerTipoCambioMensual(mes: number, año: number): Promise<DecolectaTipoCambioResponse[] | null> {
    const endpoint = `/tipo-cambio/sunat?month=${mes}&year=${año}`
    return await this.makeRequest<DecolectaTipoCambioResponse[]>(endpoint)
  }
}

export const decolectaService = new DecolectaService()
