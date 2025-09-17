import { apiClient } from "./api-client";
import type { ClasificacionAutomaticaApi } from "./types/api";

export interface ClienteClasificacion {
  IdCliente: number;
  RazonSocial: string;
  ClasificacionActual: "A" | "B" | "C";
  MesesDeuda: number;
  NuevaClasificacion: "A" | "B" | "C";
  RequiereCambio: boolean;
  MontoMensual: number;
  TotalPagado: number;
  MontoEsperado: number;
  UltimoDigitoRUC: number;
  ProximoVencimiento: Date | null;
  ServiciosAdicionales: number;
}

export class ClasificacionAutomatica {
  static async ejecutarClasificacionAutomatica(): Promise<ClienteClasificacion[]> {
    try {
      console.log(" Iniciando clasificación automática...");

      const response = await apiClient.aplicarClasificacionesAutomaticas({
        accion: 'calcular'
      });

      if (response.success && response.clasificaciones) {
        console.log(" Clasificación automática completada");
        
        return response.clasificaciones.map((item: ClasificacionAutomaticaApi): ClienteClasificacion => ({
          IdCliente: item.id,
          RazonSocial: item.nombre,
          ClasificacionActual: item.clasificacion_actual as "A" | "B" | "C",
          MesesDeuda: item.meses_deuda,
          NuevaClasificacion: item.nueva_clasificacion as "A" | "B" | "C",
          RequiereCambio: item.requiere_cambio,
          MontoMensual: 0,
          TotalPagado: 0,
          MontoEsperado: 0,
          UltimoDigitoRUC: 0,
          ProximoVencimiento: null,
          ServiciosAdicionales: 0,
        }));
      } else {
        throw new Error(response.message || 'Error en clasificación automática');
      }
    } catch (error) {
      console.error(" Error en clasificación automática:", error);
      throw error;
    }
  }

  static async aplicarCambiosClasificacion(cambios: ClienteClasificacion[]): Promise<void> {
    try {
      const cambiosRequeridos = cambios.filter((c) => c.RequiereCambio);

      if (cambiosRequeridos.length === 0) {
        console.log("ℹ No hay cambios de clasificación que aplicar");
        return;
      }

      console.log(` Aplicando ${cambiosRequeridos.length} cambios de clasificación...`);

      const clienteIds = cambiosRequeridos.map(c => c.IdCliente);
      
      const response = await apiClient.aplicarClasificacionesAutomaticas({
        accion: 'aplicar',
        cliente_ids: clienteIds
      });

      if (response.success) {
        console.log(` Se aplicaron ${response.cambios_aplicados || 0} cambios de clasificación`);
      } else {
        throw new Error(response.message || 'Error aplicando cambios de clasificación');
      }
    } catch (error) {
      console.error(" Error aplicando cambios de clasificación:", error);
      throw error;
    }
  }
}
