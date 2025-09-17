// Cliente API para comunicarse con el nuevo backend
import {
  ClientesResponse,
  ClienteResponse,
  PagosResponse,
  PagoResponse,
  PagoApi,
  CatalogosResponse,
  ClasificacionApi,
  CarteraApi,
  ServicioApi,
  BancoApi,
  CategoriaEmpresaApi,
  DashboardStatsResponse,
  DashboardChartsResponse,
  ActividadRecienteResponse,
  NotificacionesResponse,
  CompromisosResponse,
  CompromisoResponse,
  PlantillasResponse,
  ConsultaDniResponse,
  ConsultaRucResponse,
  TipoCambioResponse,
  CronogramaSunatResponse,
  CronogramaSunatApi,
  ClasificacionesAutomaticasResponse,
  RecibosResponse,
  ReciboResponse,
  EstadisticasRecibosResponse,
  LoginResponse,
  UserResponse,
  UsuariosResponse,
  UsuarioResponse,
  CreateUsuarioResponse,
  UpdateUsuarioResponse,
  CreateClienteData,
  CreatePagoData,
  // CreateNotificacionData,
  // CreateCompromisoData,
  // CreatePlantillaData,
  CreateUsuarioData,
  UpdateUsuarioData,
  ServiciosAdicionalesResponse,
  PagoDetallesResponse,
  RecibosEnviadosResponse,
  EnviarReciboAutomaticoData,
  EnviarReciboAutomaticoResponse,
} from "@/lib/types/api";

const API_BASE_URL = 'http://localhost:4444';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Incluir cookies para autenticación automática
    config.credentials = 'include';

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Intentar leer JSON si el servidor lo devuelve; si no, leer como texto
        const contentType = response.headers.get('content-type') || '';
        let errorText: string | undefined;
        if (contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          errorText = errorData?.error || JSON.stringify(errorData);
        } else {
          // Puede ser HTML (por ejemplo un error 500 que devuelve una página) o texto plano
          errorText = await response.text().catch(() => `HTTP ${response.status}: ${response.statusText}`);
        }

        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Si el body está vacío, devolver un objeto vacío tipado
      const contentType = response.headers.get('content-type') || '';
      if (!contentType) {
        // No hay content-type: intentar leer texto, si está vacío devolver {} como fallback
        const text = await response.text().catch(() => '');
        if (!text) return {} as T;
        // Si hay texto, intentar parsearlo como JSON por si acaso
        try {
          return JSON.parse(text) as T;
        } catch {
          // No es JSON: lanzar con mensaje informativo
          throw new Error(`Unexpected response (no Content-Type). Body starts with: ${text.slice(0,200)}`);
        }
      }

      if (contentType.includes('application/json')) {
        return await response.json();
      }

      // Si recibimos HTML o texto, leer el texto y lanzar error con información útil
      const text = await response.text().catch(() => '');
      if (contentType.includes('text/html') || text.trim().startsWith('<')) {
        throw new Error(`Expected JSON but received HTML (status ${response.status}). Body starts with: ${text.slice(0,200)}`);
      }

      // Para otros content-types (text/plain, etc.) intentar parsear como JSON, si falla devolver texto
      try {
        return JSON.parse(text) as T;
      } catch {
        // No es JSON; devolver texto envuelto o lanzar según preferencia. Aquí lanzamos para forzar manejo explicito.
        throw new Error(`Expected JSON but received: ${text.slice(0,200)}`);
      }
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  }

  // Clientes
  async getClientes(params?: {
    page?: number;
    limit?: number;
    ultimoDigito?: number;
    clasificacion?: string;
    cartera?: number;
    search?: string;
  }): Promise<ClientesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.ultimoDigito !== undefined) searchParams.set('ultimoDigito', params.ultimoDigito.toString());
    if (params?.clasificacion) searchParams.set('clasificacion', params.clasificacion);
    if (params?.cartera) searchParams.set('cartera', params.cartera.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<ClientesResponse>(
      `/clientes${query ? `?${query}` : ''}`
    );
  }

  async getClienteById(id: number): Promise<ClienteResponse> {
    return this.request<ClienteResponse>(`/clientes/${id}`);
  }

  async createCliente(data: CreateClienteData) {
    return this.request<{ success: boolean; clienteId: number }>(`/clientes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClienteEstado(id: number, estado: string) {
    return this.request<{ success: boolean; message: string }>(`/clientes/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  }

  async searchClientes(query: string): Promise<ClientesResponse> {
    return this.request<ClientesResponse>(`/clientes/search?q=${encodeURIComponent(query)}`);
  }

  // Pagos
  async getPagos(params?: {
    cliente_id?: number;
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<PagosResponse> {
    const searchParams = new URLSearchParams();
    if (params?.cliente_id) searchParams.set('cliente_id', params.cliente_id.toString());
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<PagosResponse>(
      `/pagos${query ? `?${query}` : ''}`
    );
  }

  async createPago(data: CreatePagoData) {
    return this.request<PagoResponse>(`/pagos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePagoEstado(id: number, estado: string) {
    return this.request<{ success: boolean; message: string; pago: PagoApi }>(`/pagos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  }

  // Catálogos
  async getCatalogos(): Promise<CatalogosResponse> {
    return this.request<CatalogosResponse>(`/catalogos`);
  }

  async getClasificaciones() {
    return this.request<{ success: boolean; clasificaciones: ClasificacionApi[] }>(`/catalogos/clasificaciones`);
  }

  async getCarteras() {
    return this.request<{ success: boolean; carteras: CarteraApi[] }>(`/catalogos/carteras`);
  }

  async getServicios() {
    return this.request<{ success: boolean; servicios: ServicioApi[] }>(`/catalogos/servicios`);
  }

  async getBancos() {
    return this.request<{ success: boolean; bancos: BancoApi[] }>(`/catalogos/bancos`);
  }

  async getCategoriasEmpresa() {
    return this.request<{ success: boolean; categoriasEmpresa: CategoriaEmpresaApi[] }>(`/catalogos/categorias-empresa`);
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<DashboardStatsResponse>(`/dashboard/stats`);
  }

  async getDashboardCharts() {
    return this.request<DashboardChartsResponse>(`/dashboard/charts`);
  }

  async getActividadReciente() {
    return this.request<ActividadRecienteResponse>(`/dashboard/actividad-reciente`);
  }

  // Notificaciones
  async getNotificaciones(clienteId?: number) {
    const query = clienteId ? `?clienteId=${clienteId}` : '';
    return this.request<NotificacionesResponse>(`/notificaciones${query}`);
  }

  async createNotificacion(data: { idCliente: number; idTipoNotificacion: number; contenido: string; asunto?: string }) {
    return this.request<{ success: boolean; notificacionId: number; message: string }>(`/notificaciones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Compromisos
  async getCompromisos(params?: { cliente_id?: number; estado?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.cliente_id) searchParams.set('cliente_id', params.cliente_id.toString());
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<CompromisosResponse>(
      `/compromisos${query ? `?${query}` : ''}`
    );
  }

  async createCompromiso(data: { idCliente: number; fechaCompromiso: string; montoCompromiso: number; observaciones?: string; idResponsable?: number }) {
    return this.request<CompromisoResponse>(`/compromisos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompromiso(id: number, data: { estado?: string; observaciones?: string }) {
    return this.request<{ success: boolean; message: string }>(`/compromisos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Plantillas
  async getPlantillas() {
    return this.request<PlantillasResponse>(`/plantillas`);
  }

  async createPlantilla(data: { nombre: string; idClasificacion: number; contenido: string }) {
    return this.request<{ success: boolean; plantillaId: number; message: string }>(`/plantillas`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Consultas externas
  async consultarDni(dni: string) {
    return this.request<ConsultaDniResponse>(`/consultas/dni?numero=${dni}`);
  }

  async consultarRuc(ruc: string) {
    return this.request<ConsultaRucResponse>(`/consultas/ruc?numero=${ruc}`);
  }

  async obtenerTipoCambio(fecha?: string, mes?: number, año?: number) {
    const params = new URLSearchParams();
    if (fecha) params.set('fecha', fecha);
    if (mes) params.set('mes', mes.toString());
    if (año) params.set('año', año.toString());

    const query = params.toString();
    return this.request<TipoCambioResponse>(`/consultas/tipo-cambio${query ? `?${query}` : ''}`);
  }

  // Cronograma SUNAT
  async getCronogramaSunat(año?: number, accion?: string) {
    const params = new URLSearchParams();
    if (año) params.set('año', año.toString());
    if (accion) params.set('accion', accion);

    const query = params.toString();
    return this.request<CronogramaSunatResponse>(`/cronograma-sunat${query ? `?${query}` : ''}`);
  }

  async gestionarCronogramaSunat(data: { accion: string; año?: number; añoOrigen?: number; añoDestino?: number; usuario?: string; cronograma?: CronogramaSunatApi[] }) {
    return this.request<{ success: boolean; message: string }>(`/cronograma-sunat`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<LoginResponse>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request<{ success: boolean; message: string }>(`/auth/logout`, {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request<UserResponse>(`/auth/me`);
  }

  // Usuarios
  async getUsuarios(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<UsuariosResponse>(
      `/usuarios${query ? `?${query}` : ''}`
    );
  }

  async getUsuarioById(id: number) {
    return this.request<UsuarioResponse>(`/usuarios/${id}`);
  }

  async createUsuario(data: CreateUsuarioData) {
    return this.request<CreateUsuarioResponse>(`/usuarios`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUsuario(id: number, data: UpdateUsuarioData) {
    return this.request<UpdateUsuarioResponse>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUsuario(id: number) {
    return this.request<{ success: boolean; message: string }>(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  }

  // Clasificación automática
  async getClasificacionesAutomaticas(params?: { accion?: string; cliente_id?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.accion) searchParams.set('accion', params.accion);
    if (params?.cliente_id) searchParams.set('cliente_id', params.cliente_id.toString());

    const query = searchParams.toString();
    return this.request<ClasificacionesAutomaticasResponse>(`/clasificacion-automatica${query ? `?${query}` : ''}`);
  }

  async aplicarClasificacionesAutomaticas(data: { accion: string; cliente_ids?: number[] }) {
    return this.request<ClasificacionesAutomaticasResponse>(`/clasificacion-automatica`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Recibos
  async getRecibos(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<RecibosResponse>(`/recibos${query ? `?${query}` : ''}`);
  }

  async generarRecibo(data: { pagoId: number }) {
    return this.request<ReciboResponse>(`/recibos/generar`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reenviarRecibo(reciboId: number) {
    return this.request<{ success: boolean; message: string }>(`/recibos/${reciboId}/enviar`, {
      method: 'POST',
    });
  }

  async getEstadisticasRecibos() {
    return this.request<EstadisticasRecibosResponse>(`/recibos/enviados/estadisticas`);
  }

  // Endpoints adicionales para servicios
  async getServiciosAdicionales(clienteId: number) {
    return this.request<ServiciosAdicionalesResponse>(`/servicios-adicionales?clienteId=${clienteId}`);
  }

  async enviarReciboAutomatico(data: EnviarReciboAutomaticoData) {
    return this.request<EnviarReciboAutomaticoResponse>(`/recibos/enviar-automatico`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPagoConDetalles(pagoId: number) {
    return this.request<PagoDetallesResponse>(`/pagos/${pagoId}/detalles`);
  }

  async getRecibosEnviados(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request<RecibosEnviadosResponse>(`/recibos/enviados${query ? `?${query}` : ''}`);
  }
}

// Exportar instancia singleton
export const apiClient = new ApiClient();

// Exportar clase para crear instancias personalizadas si es necesario
export { ApiClient };