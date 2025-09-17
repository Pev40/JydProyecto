// Interfaces para respuestas de la API del backend

// Respuesta base de API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos de paginación
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// Cliente
export interface ClienteApi {
  idcliente: number;
  razonsocial: string;
  nombrecontacto: string | null;
  rucdni: string;
  ultimodigitoruc: number;
  idclasificacion: number;
  clasificacion?: {
    codigo: string;
    descripcion: string;
    color: string;
  };
  idcartera: number;
  cartera?: {
    nombre: string;
  };
  idencargado: number;
  encargado?: {
    nombrecompleto: string;
  };
  idservicio: number;
  servicio?: {
    nombre: string;
  };
  montofijomensual: number;
  aplicamontofijo: boolean;
  idcategoriaempresa: number;
  categoriaempresa?: {
    nombre: string;
  };
  fecharegistro: string;
  fechavencimiento: string | null;
  email: string | null;
  telefono: string | null;
  estado: string;
  saldopendiente?: number;
}

// Cliente del frontend (con campos obligatorios)
export interface ClienteFrontend {
  IdCliente: number;
  RazonSocial: string;
  NombreContacto: string;
  RucDni: string;
  UltimoDigitoRUC: number;
  IdClasificacion: number;
  ClasificacionCodigo: string;
  ClasificacionDescripcion: string;
  ClasificacionColor: string;
  IdCartera: number;
  CarteraNombre: string;
  IdEncargado: number;
  EncargadoNombre: string;
  IdServicio: number;
  ServicioNombre: string;
  MontoFijoMensual: number;
  AplicaMontoFijo: boolean;
  IdCategoriaEmpresa: number;
  CategoriaEmpresa: string;
  FechaRegistro: string;
  FechaVencimiento: string;
  Email: string;
  Telefono: string;
  Estado: string;
  SaldoPendiente?: number;
}

export interface ClientesResponse {
  success: boolean;
  clientes: ClienteApi[];
  pagination: PaginationInfo;
}

export interface ClienteResponse {
  success: boolean;
  cliente: ClienteApi;
}

// Pago
export interface PagoApi {
  idpago: number;
  idcliente: number;
  cliente?: {
    razonsocial: string;
  };
  fecha: string;
  idbanco: number | null;
  banco?: {
    nombre: string;
  };
  monto: number;
  concepto: string;
  mediopago: string;
  urlcomprobante: string | null;
  messervicio: string | null;
  estado: string;
}

export interface PagosResponse {
  success: boolean;
  pagos: PagoApi[];
  pagination: PaginationInfo;
}

export interface PagoResponse {
  success: boolean;
  pago: PagoApi;
}

// Catálogos
export interface ClasificacionApi {
  idclasificacion: number;
  codigo: string;
  descripcion: string;
  color: string;
}

export interface CarteraApi {
  idcartera: number;
  nombre: string;
}

export interface ServicioApi {
  idservicio: number;
  nombre: string;
  descripcion: string;
}

export interface BancoApi {
  idbanco: number;
  nombre: string;
}

export interface CategoriaEmpresaApi {
  idcategoriaempresa: number;
  nombre: string;
  descripcion: string;
}

export interface UsuarioApi {
  idusuario: number;
  nombrecompleto: string;
  email: string;
}

export interface CatalogosResponse {
  success: boolean;
  clasificaciones: ClasificacionApi[];
  carteras: CarteraApi[];
  categorias: CategoriaEmpresaApi[];
  servicios: ServicioApi[];
  bancos: BancoApi[];
  usuarios: UsuarioApi[];
}

// Dashboard
export interface DashboardStatsApi {
  clientesActivos: number;
  pagosMesActual: number;
  ingresosTotales: number;
  clientesMorosos: number;
  variacionClientesActivos: number;
  variacionPagosMes: number;
  variacionIngresosTotales: number;
  variacionClientesMorosos: number;
}

export interface DashboardChartsApi {
  pagosPorMes: Array<{
    mes: string;
    cantidad: number;
    monto: number;
  }>;
  clientesPorClasificacion: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  evolucionMorosidad: Array<{
    mes: string;
    morosos: number;
    recuperados: number;
  }>;
  ingresosPorCartera: Array<{
    cartera: string;
    ingresos: number;
    porcentaje: number;
  }>;
  pagosPorMetodo: Array<{
    metodo: string;
    cantidad: number;
    porcentaje: number;
  }>;
}

export interface ActividadRecienteApi {
  id: number;
  tipo: 'pago' | 'cliente' | 'notificacion' | 'compromiso';
  descripcion: string;
  monto?: string;
  fecha: string;
  estado: string;
}

export interface DashboardStatsResponse {
  success: boolean;
  estadisticas: DashboardStatsApi;
}

export interface DashboardChartsResponse {
  success: boolean;
  pagosPorMes: Array<{
    mes: string;
    cantidad: number;
    monto: number;
  }>;
  clientesPorClasificacion: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  evolucionMorosidad: Array<{
    mes: string;
    morosos: number;
    recuperados: number;
  }>;
  ingresosPorCartera: Array<{
    cartera: string;
    ingresos: number;
    porcentaje: number;
  }>;
  pagosPorMetodo: Array<{
    metodo: string;
    cantidad: number;
    porcentaje: number;
  }>;
}

export interface ActividadRecienteResponse {
  success: boolean;
  actividad: ActividadRecienteApi[];
}

// Notificaciones
export interface NotificacionApi {
  idNotificacion: number;
  idCliente: number;
  clienteRazonSocial: string;
  fechaEnvio: string;
  idTipoNotificacion: number;
  tipoNotificacion: string;
  contenido: string;
  idResponsable: number;
  responsableNombre: string;
  estado: string;
}

export interface NotificacionesResponse {
  success: boolean;
  notificaciones: NotificacionApi[];
  pagination: PaginationInfo;
}

// Compromisos
export interface CompromisoApi {
  idCompromisoPago: number;
  idCliente: number;
  clienteRazonSocial: string;
  fechaCompromiso: string;
  montoCompromiso: number;
  fechaRegistro: string;
  idResponsable: number;
  responsableNombre: string;
  estado: string;
  observaciones: string | null;
}

export interface CompromisosResponse {
  success: boolean;
  compromisos: CompromisoApi[];
  pagination: PaginationInfo;
}

export interface CompromisoResponse {
  success: boolean;
  message: string;
  compromiso: CompromisoApi;
}

// Plantillas
export interface PlantillaApi {
  idPlantillaMensaje: number;
  nombre: string;
  contenido: string;
  idClasificacion: number;
  clasificacionNombre: string;
}

export interface PlantillasResponse {
  success: boolean;
  plantillas: PlantillaApi[];
}

// Consultas externas
export interface ConsultaDniResponse {
  success: boolean;
  data: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    ubigeo: string;
    direccion: string;
  };
}

export interface ConsultaRucResponse {
  success: boolean;
  data: {
    ruc: string;
    razonSocial: string;
    estado: string;
    condicion: string;
    ubigeo: string;
    tipoVia: string;
    nombreVia: string;
    zona: string;
    tipoZona: string;
    numero: string;
    interior: string;
    lote: string;
    departamento: string;
    manzana: string;
    kilometro: string;
  };
}

export interface TipoCambioResponse {
  success: boolean;
  data: {
    compra: number;
    venta: number;
    origen: string;
    fecha: string;
  };
}

// Cronograma SUNAT
export interface CronogramaSunatApi {
  IdCronograma: number;
  Año: number;
  Mes: number;
  DigitoRUC: string;
  Dia: number;
  MesVencimiento: number;
}

export interface CronogramaSunatResponse {
  success: boolean;
  cronograma?: Record<string, CronogramaSunatApi[]>;
  años?: number[];
  estadisticas?: unknown;
  año?: number;
  totalRegistros?: number;
}

// Clasificación automática
export interface ClasificacionAutomaticaApi {
  id: number;
  nombre: string;
  clasificacion_actual: string;
  nueva_clasificacion: string;
  requiere_cambio: boolean;
  meses_deuda: number;
  razon: string;
}

export interface ClasificacionesAutomaticasResponse {
  success: boolean;
  message?: string;
  cambios_aplicados?: number;
  clasificaciones?: ClasificacionAutomaticaApi[];
  resumen?: {
    total_clientes: number;
    requieren_cambio: number;
    por_clasificacion: Record<string, number>;
    cambios_pendientes: Record<string, number>;
  };
  historial?: Array<{
    id: number;
    cliente_id: number;
    fecha_cambio: string;
    clasificacion_anterior: string;
    clasificacion_nueva: string;
    razon: string;
    usuario: string;
  }>;
}

// Recibos
export interface ReciboApi {
  id: number;
  numeroRecibo: string;
  clienteNombre: string;
  pagoMonto: number;
  pagoConcepto: string;
  estado: "ENVIADO" | "ERROR";
  fechaEnvio: string;
  emailDestinatario: string;
}

export interface RecibosResponse {
  success: boolean;
  recibos: ReciboApi[];
  pagination: PaginationInfo;
}

export interface ReciboResponse {
  success: boolean;
  reciboId: number;
  numeroRecibo: string;
}

export interface EstadisticasRecibosResponse {
  success: boolean;
  estadisticas: {
    totalRecibos: number;
    enviados: number;
    errores: number;
    hoy: number;
    mesActual: number;
    montoTotalRecibos: number;
  };
}

// Autenticación
export interface LoginResponse {
  success: boolean;
  user: {
    id: number;
    email: string;
    nombre: string;
    NombreRol: string;
  };
}

export interface UserResponse {
  success: boolean;
  user: {
    id: number;
    email: string;
    nombre: string;
    rol: string;
  };
}

// Usuarios
export interface UsuarioResponse {
  success: boolean;
  usuario: UsuarioApi;
}

export interface UsuariosResponse {
  success: boolean;
  usuarios: UsuarioApi[];
  pagination: PaginationInfo;
}

export interface CreateUsuarioResponse {
  success: boolean;
  message: string;
  userId: number;
}

export interface UpdateUsuarioResponse {
  success: boolean;
  message: string;
}

// Tipos de datos para crear recursos
export interface CreateClienteData {
  razonSocial: string;
  nombreContacto?: string;
  rucDni: string;
  idClasificacion?: number;
  idCartera?: number;
  idEncargado?: number;
  idServicio?: number;
  montoFijoMensual?: number;
  aplicaMontoFijo?: boolean;
  idCategoriaEmpresa?: number;
  email?: string;
  telefono?: string;
}

export interface CreatePagoData {
  idCliente: number;
  monto: number;
  concepto: string;
  medioPago: string;
  idBanco?: number;
  mesServicio?: string;
  observaciones?: string;
  urlComprobante?: string;
  estado?: string;
  mesesServicios?: unknown[];
}

export interface CreateNotificacionData {
  idCliente: number;
  idTipoNotificacion: number;
  contenido: string;
  asunto?: string;
}

export interface CreateCompromisoData {
  idCliente: number;
  fechaCompromiso: string;
  montoCompromiso: number;
  observaciones?: string;
  idResponsable?: number;
}

export interface CreatePlantillaData {
  nombre: string;
  idClasificacion: number;
  contenido: string;
}

export interface CreateUsuarioData {
  email: string;
  nombre: string;
  password: string;
  idRol: number;
  idCliente?: number;
}

export interface UpdateUsuarioData {
  email?: string;
  nombre?: string;
  password?: string;
  idRol?: number;
  idCliente?: number;
  activo?: boolean;
}

// Interfaces adicionales para servicios
export interface ServicioAdicionalApi {
  idservicioadicional: number;
  nombreservicio: string;
  descripcion: string;
  monto: number;
  fecha: string;
  estado: string;
  idcliente: number;
}

export interface ServiciosAdicionalesResponse {
  success: boolean;
  servicios: ServicioAdicionalApi[];
}

export interface PagoDetallesApi extends PagoApi {
  cliente: {
    razonsocial: string;
    email: string;
    rucdni: string;
    montofijomensual: number;
  };
  servicio?: {
    nombre: string;
  };
}

export interface PagoDetallesResponse {
  success: boolean;
  pago: PagoDetallesApi;
}

export interface ReciboEnviadoApi {
  id: number;
  numeroRecibo: string;
  clienteNombre: string;
  emailDestinatario: string;
  pagoMonto: number;
  pagoConcepto: string;
  estado: "ENVIADO" | "ERROR" | "GENERADO";
  fechaEnvio: string;
  errorMensaje?: string;
  messageId?: string;
  serviciosIncluidos: ServicioFacturadoApi[];
}

export interface ServicioFacturadoApi {
  nombre: string;
  descripcion: string;
  monto: number;
  periodo?: string;
  tipo: "FIJO" | "ADICIONAL";
}

export interface RecibosEnviadosResponse {
  success: boolean;
  recibos: ReciboEnviadoApi[];
  total: number;
  hasMore: boolean;
}

export interface EnviarReciboAutomaticoData {
  pagoId: number;
  clienteId: number;
  monto: number;
  concepto: string;
  metodoPago: string;
  numeroOperacion?: string;
  observaciones?: string;
}

export interface EnviarReciboAutomaticoResponse {
  success: boolean;
  numeroRecibo?: string;
  error?: string;
}