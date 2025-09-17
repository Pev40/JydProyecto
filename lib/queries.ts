import { apiClient } from "@/lib/api-client"

export interface Cliente {
  IdCliente: number
  RazonSocial: string
  NombreContacto: string
  RucDni: string
  UltimoDigitoRUC: number
  IdClasificacion: number
  ClasificacionCodigo: string
  ClasificacionDescripcion: string
  ClasificacionColor: string
  IdCartera: number
  CarteraNombre: string
  IdEncargado: number
  EncargadoNombre: string
  IdServicio: number
  ServicioNombre: string
  MontoFijoMensual: number
  AplicaMontoFijo: boolean
  IdCategoriaEmpresa: number
  CategoriaEmpresa: string
  FechaRegistro: string
  FechaVencimiento: string
  Email: string
  Telefono: string
  Estado: string
  SaldoPendiente?: number
}

export interface Pago {
  IdPago: number
  IdCliente: number
  ClienteRazonSocial: string
  Fecha: string
  IdBanco: number
  BancoNombre: string
  Monto: number
  Concepto: string
  MedioPago: string
  UrlComprobante: string
  MesServicio: string
  Estado: string
}

interface ClientesFiltros {
  ultimoDigito?: number
  clasificacion?: string
  cartera?: number
}

export async function getClientes(filtros?: ClientesFiltros): Promise<Cliente[]> {
  try {
    const response = await apiClient.getClientes({
      ultimoDigito: filtros?.ultimoDigito,
      clasificacion: filtros?.clasificacion,
      cartera: filtros?.cartera,
      limit: 100 // Límite razonable para la consulta
    });

    if (!response.success) {
      throw new Error("Error al obtener clientes del backend");
    }

    // Transformar los datos del backend al formato esperado por el frontend
    return response.clientes.map((cliente: any) => ({
      IdCliente: cliente.idcliente,
      RazonSocial: cliente.razonsocial,
      NombreContacto: cliente.nombrecontacto || '',
      RucDni: cliente.rucdni,
      UltimoDigitoRUC: cliente.ultimodigitoruc,
      IdClasificacion: cliente.idclasificacion,
      ClasificacionCodigo: cliente.clasificacion?.codigo || '',
      ClasificacionDescripcion: cliente.clasificacion?.descripcion || '',
      ClasificacionColor: cliente.clasificacion?.color || '',
      IdCartera: cliente.idcartera,
      CarteraNombre: cliente.cartera?.nombre || '',
      IdEncargado: cliente.idencargado,
      EncargadoNombre: cliente.encargado?.nombrecompleto || '',
      IdServicio: cliente.idservicio,
      ServicioNombre: cliente.servicio?.nombre || '',
      MontoFijoMensual: cliente.montofijomensual,
      AplicaMontoFijo: cliente.aplicamontofijo,
      IdCategoriaEmpresa: cliente.idcategoriaempresa,
      CategoriaEmpresa: cliente.categoriaempresa?.nombre || '',
      FechaRegistro: cliente.fecharegistro,
      FechaVencimiento: cliente.fechavencimiento || '',
      Email: cliente.email || '',
      Telefono: cliente.telefono || '',
      Estado: cliente.estado,
      SaldoPendiente: cliente.saldopendiente || 0
    }));
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new Error("Error al obtener clientes");
  }
}

export async function getPagos(): Promise<Pago[]> {
  try {
    const response = await apiClient.getPagos({
      limit: 100 // Límite razonable
    });

    if (!response.success) {
      throw new Error("Error al obtener pagos del backend");
    }

    // Transformar los datos del backend al formato esperado por el frontend
    return response.pagos.map((pago: any) => ({
      IdPago: pago.idpago,
      IdCliente: pago.idcliente,
      ClienteRazonSocial: pago.cliente?.razonsocial || '',
      Fecha: pago.fecha,
      IdBanco: pago.idbanco,
      BancoNombre: pago.banco?.nombre || '',
      Monto: pago.monto,
      Concepto: pago.concepto,
      MedioPago: pago.mediopago,
      UrlComprobante: pago.urlcomprobante,
      MesServicio: pago.messervicio,
      Estado: pago.estado
    }));
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw new Error("Error al obtener pagos");
  }
}

export async function getClienteById(id: number): Promise<Cliente | null> {
  try {
    const response = await apiClient.getClienteById(id);

    if (!response.success) {
      throw new Error("Error al obtener cliente del backend");
    }

    if (!response.cliente) {
      return null;
    }

    const cliente = response.cliente;

    // Transformar los datos del backend al formato esperado por el frontend
    return {
      IdCliente: cliente.idcliente,
      RazonSocial: cliente.razonsocial,
      NombreContacto: cliente.nombrecontacto || '',
      RucDni: cliente.rucdni,
      UltimoDigitoRUC: cliente.ultimodigitoruc,
      IdClasificacion: cliente.idclasificacion,
      ClasificacionCodigo: cliente.clasificacion?.codigo || '',
      ClasificacionDescripcion: cliente.clasificacion?.descripcion || '',
      ClasificacionColor: cliente.clasificacion?.color || '',
      IdCartera: cliente.idcartera,
      CarteraNombre: cliente.cartera?.nombre || '',
      IdEncargado: cliente.idencargado,
      EncargadoNombre: cliente.encargado?.nombrecompleto || '',
      IdServicio: cliente.idservicio,
      ServicioNombre: cliente.servicio?.nombre || '',
      MontoFijoMensual: cliente.montofijomensual,
      AplicaMontoFijo: cliente.aplicamontofijo,
      IdCategoriaEmpresa: cliente.idcategoriaempresa,
      CategoriaEmpresa: cliente.categoriaempresa?.nombre || '',
      FechaRegistro: cliente.fecharegistro,
      FechaVencimiento: cliente.fechavencimiento || '',
      Email: cliente.email || '',
      Telefono: cliente.telefono || '',
      Estado: cliente.estado,
      SaldoPendiente: cliente.saldopendiente || 0
    };
  } catch (error) {
    console.error("Error fetching client:", error);
    throw new Error("Error al obtener cliente");
  }
}

export async function getPagosByClienteId(clienteId: number): Promise<Pago[]> {
  try {
    const response = await apiClient.getPagos({
      cliente_id: clienteId,
      limit: 100
    });

    if (!response.success) {
      throw new Error("Error al obtener pagos del cliente del backend");
    }

    // Transformar los datos del backend al formato esperado por el frontend
    return response.pagos.map((pago: any) => ({
      IdPago: pago.idpago,
      IdCliente: pago.idcliente,
      ClienteRazonSocial: pago.cliente?.razonsocial || '',
      Fecha: pago.fecha,
      IdBanco: pago.idbanco,
      BancoNombre: pago.banco?.nombre || '',
      Monto: pago.monto,
      Concepto: pago.concepto,
      MedioPago: pago.mediopago,
      UrlComprobante: pago.urlcomprobante,
      MesServicio: pago.messervicio,
      Estado: pago.estado
    }));
  } catch (error) {
    console.error("Error fetching client payments:", error);
    throw new Error("Error al obtener pagos del cliente");
  }
}

export async function getCatalogos() {
  try {
    const response = await apiClient.getCatalogos();

    if (!response.success) {
      throw new Error("Error al obtener catálogos del backend");
    }

    // Transformar los datos del backend al formato esperado por el frontend
    return {
      clasificaciones: response.clasificaciones?.map((c: any) => ({
        IdClasificacion: c.idclasificacion,
        Codigo: c.codigo,
        Descripcion: c.descripcion,
        Color: c.color
      })) || [],
      carteras: response.carteras?.map((c: any) => ({
        IdCartera: c.idcartera,
        Nombre: c.nombre
      })) || [],
      categorias: response.categorias?.map((c: any) => ({
        IdCategoriaEmpresa: c.idcategoriaempresa,
        Nombre: c.nombre,
        Descripcion: c.descripcion
      })) || [],
      servicios: response.servicios?.map((s: any) => ({
        IdServicio: s.idservicio,
        Nombre: s.nombre,
        Descripcion: s.descripcion
      })) || [],
      bancos: response.bancos?.map((b: any) => ({
        IdBanco: b.idbanco,
        Nombre: b.nombre
      })) || [],
      usuarios: response.usuarios?.map((u: any) => ({
        IdUsuario: u.idusuario,
        NombreCompleto: u.nombrecompleto,
        Email: u.email
      })) || []
    };
  } catch (error) {
    console.error("Error al obtener catálogos:", error);
    throw error;
  }
}

// Interfaces para el dashboard
export interface DashboardStats {
  clientesActivos: number
  pagosMesActual: number
  ingresosTotales: number
  clientesMorosos: number
  variacionClientesActivos: number
  variacionPagosMes: number
  variacionIngresosTotales: number
  variacionClientesMorosos: number
}

export interface ActividadReciente {
  id: number
  tipo: 'pago' | 'cliente' | 'notificacion' | 'compromiso'
  descripcion: string
  monto?: string
  fecha: string
  estado: string
}

// Función para obtener estadísticas del dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await apiClient.getDashboardStats();

    if (!response.success) {
      throw new Error("Error al obtener estadísticas del dashboard del backend");
    }

    const stats = response.estadisticas;

    return {
      clientesActivos: stats.clientesActivos || 0,
      pagosMesActual: stats.pagosMesActual || 0,
      ingresosTotales: stats.ingresosTotales || 0,
      clientesMorosos: stats.clientesMorosos || 0,
      variacionClientesActivos: stats.variacionClientesActivos || 0,
      variacionPagosMes: stats.variacionPagosMes || 0,
      variacionIngresosTotales: stats.variacionIngresosTotales || 0,
      variacionClientesMorosos: stats.variacionClientesMorosos || 0
    };
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    throw new Error("Error al obtener estadísticas del dashboard");
  }
}

// Función para obtener actividades recientes
export async function getActividadesRecientes(): Promise<ActividadReciente[]> {
  try {
    const response = await apiClient.getActividadReciente();

    if (!response.success) {
      throw new Error("Error al obtener actividades recientes del backend");
    }

    // Transformar los datos del backend al formato esperado por el frontend
    return response.actividad.map((actividad: any) => ({
      id: actividad.id,
      tipo: actividad.tipo as 'pago' | 'cliente' | 'notificacion' | 'compromiso',
      descripcion: actividad.descripcion,
      monto: actividad.monto,
      fecha: actividad.fecha,
      estado: actividad.estado
    }));
  } catch (error) {
    console.error("Error al obtener actividades recientes:", error);
    throw new Error("Error al obtener actividades recientes");
  }
}

// Función auxiliar para formatear fechas relativas
function formatearFechaRelativa(fecha: string | Date): string {
  const ahora = new Date()
  const fechaObj = new Date(fecha)
  const diferencia = ahora.getTime() - fechaObj.getTime()
  
  const minutos = Math.floor(diferencia / (1000 * 60))
  const horas = Math.floor(diferencia / (1000 * 60 * 60))
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))
  
  if (minutos < 60) {
    return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`
  } else if (horas < 24) {
    return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`
  } else if (dias < 7) {
    return `Hace ${dias} día${dias !== 1 ? 's' : ''}`
  } else {
    return fechaObj.toLocaleDateString('es-PE', { 
      day: 'numeric', 
      month: 'short',
      year: fechaObj.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined
    })
  }
}

// Interfaces adicionales
export interface Notificacion {
  IdNotificacion: number
  IdCliente: number
  ClienteRazonSocial: string
  FechaEnvio: string
  IdTipoNotificacion: number
  TipoNotificacion: string
  Contenido: string
  IdResponsable: number
  ResponsableNombre: string
  Estado: string
}

export interface CompromisoPago {
  IdCompromisoPago: number
  IdCliente: number
  ClienteRazonSocial: string
  FechaCompromiso: string
  MontoCompromiso: number
  FechaRegistro: string
  IdResponsable: number
  ResponsableNombre: string
  Estado: string
  Observaciones: string
}

// Función para obtener notificaciones
export async function getNotificaciones(clienteId?: number): Promise<Notificacion[]> {
  try {
    const response = await apiClient.getNotificaciones(clienteId);

    if (!response.success) {
      throw new Error("Error al obtener notificaciones del backend");
    }

    // Transformar los datos del backend al formato esperado por el frontend
    return response.notificaciones.map((notif: any) => ({
      IdNotificacion: notif.idNotificacion,
      IdCliente: notif.idCliente,
      ClienteRazonSocial: notif.clienteRazonSocial,
      FechaEnvio: notif.fechaEnvio,
      IdTipoNotificacion: notif.idTipoNotificacion,
      TipoNotificacion: notif.tipoNotificacion,
      Contenido: notif.contenido,
      IdResponsable: notif.idResponsable,
      ResponsableNombre: notif.responsableNombre,
      Estado: notif.estado
    }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Error al obtener notificaciones");
  }
}

// Función para obtener compromisos de pago
export async function getCompromisosPago(clienteId?: number): Promise<CompromisoPago[]> {
  try {
    const response = await apiClient.getCompromisos(clienteId ? { cliente_id: clienteId } : {});

    if (!response.success) {
      throw new Error("Error al obtener compromisos del backend");
    }

    // Transformar los datos del backend al formato esperado por el frontend
    return response.compromisos.map((compromiso: any) => ({
      IdCompromisoPago: compromiso.idCompromisoPago,
      IdCliente: compromiso.idCliente,
      ClienteRazonSocial: compromiso.clienteRazonSocial,
      FechaCompromiso: compromiso.fechaCompromiso,
      MontoCompromiso: compromiso.montoCompromiso,
      FechaRegistro: compromiso.fechaRegistro,
      IdResponsable: compromiso.idResponsable,
      ResponsableNombre: compromiso.responsableNombre,
      Estado: compromiso.estado,
      Observaciones: compromiso.observaciones
    }));
  } catch (error) {
    console.error("Error fetching payment commitments:", error);
    throw new Error("Error al obtener compromisos de pago");
  }
}

interface PlantillaMensaje {
  IdPlantillaMensaje: number;
  Nombre: string;
  Contenido: string;
  IdClasificacion: number;
  ClasificacionNombre: string;
}

// Función para obtener plantillas de mensajes
export async function getPlantillasMensajes(): Promise<PlantillaMensaje[]> {
  try {
    const response = await apiClient.getPlantillas();

    if (!response.success) {
      throw new Error("Error al obtener plantillas del backend");
    }

    // Transformar los datos del backend al formato esperado por el frontend
    return response.plantillas.map((plantilla: any) => ({
      IdPlantillaMensaje: plantilla.idPlantillaMensaje,
      Nombre: plantilla.nombre,
      Contenido: plantilla.contenido,
      IdClasificacion: plantilla.idClasificacion,
      ClasificacionNombre: plantilla.clasificacionNombre
    }));
  } catch (error) {
    console.error("Error fetching message templates:", error);
    throw new Error("Error al obtener plantillas de mensajes");
  }
}

interface CronogramaSunat {
  IdCronograma: number;
  Año: number;
  Mes: number;
  DigitoRUC: string;
  Dia: number;
  MesVencimiento: number;
}

// Función para obtener cronograma SUNAT por año
export async function getCronogramaSunatPorAño(año: number): Promise<CronogramaSunat[]> {
  try {
    const response = await apiClient.getCronogramaSunat(año);

    if (!response.success) {
      throw new Error("Error al obtener cronograma SUNAT del backend");
    }

    // Transformar los datos del backend al formato esperado por el frontend
    if (response.cronograma) {
      // Si viene como objeto agrupado por mes, aplanarlo
      const cronogramaAplanado: any[] = [];
      Object.values(response.cronograma).forEach((mesItems: any) => {
        if (Array.isArray(mesItems)) {
          cronogramaAplanado.push(...mesItems);
        }
      });

      return cronogramaAplanado.map((item: any) => ({
        IdCronograma: item.IdCronograma,
        Año: item.Año,
        Mes: item.Mes,
        DigitoRUC: item.DigitoRUC,
        Dia: item.Dia,
        MesVencimiento: item.MesVencimiento
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching SUNAT cronograma:", error);
    throw new Error("Error al obtener cronograma SUNAT");
  }
}
