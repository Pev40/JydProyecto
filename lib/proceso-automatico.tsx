import { apiClient } from "./api-client";

export interface ProcesoAutomaticoResult {
  fecha: string;
  clientesProcesados: number;
  serviciosGenerados: number;
  recordatoriosEnviados: number;
  errores: string[];
  resumen: string;
}

export interface ClienteCorte {
  IdCliente: number;
  RazonSocial: string;
  Email?: string;
  Telefono?: string;
  UltimoDigitoRUC: number;
  MontoFijoMensual: number;
  Estado: string;
  ServicioNombre: string;
}

export interface RecordatorioRow {
  IdRecordatorio: number;
  IdCliente: number;
  Mensaje: string;
  TipoRecordatorio: string;
  RazonSocial: string;
  Email?: string;
  Telefono?: string;
}

export interface LogRow {
  Fecha: string;
  ClientesProcesados: number;
  ServiciosGenerados: number;
  RecordatoriosEnviados: number;
  Errores: string;
  Resumen: string;
  Estado: string;
}

export class ProcesoAutomatico {
  static async ejecutarProcesoDiario(): Promise<ProcesoAutomaticoResult> {
    try {
      console.log("🔄 Iniciando proceso automático diario...");

      const response = await fetch('/api/proceso-automatico/ejecutar-diario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resultado = await response.json();

      if (resultado.success) {
        console.log("✅ Proceso automático completado exitosamente");
        return resultado.data;
      } else {
        throw new Error(resultado.error || 'Error desconocido en el proceso automático');
      }
    } catch (error) {
      console.error("❌ Error ejecutando proceso automático:", error);
      
      const errorResult: ProcesoAutomaticoResult = {
        fecha: new Date().toISOString(),
        clientesProcesados: 0,
        serviciosGenerados: 0,
        recordatoriosEnviados: 0,
        errores: [error instanceof Error ? error.message : String(error)],
        resumen: "Error ejecutando proceso automático"
      };

      return errorResult;
    }
  }

  static async obtenerClientesParaCorte(): Promise<ClienteCorte[]> {
    try {
      const response = await fetch('/api/proceso-automatico/clientes-corte', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resultado = await response.json();

      if (resultado.success) {
        return resultado.clientes;
      } else {
        console.error("Error obteniendo clientes para corte:", resultado.error);
        return [];
      }
    } catch (error) {
      console.error("Error obteniendo clientes para corte:", error);
      return [];
    }
  }

  static async obtenerHistorial(limite = 30): Promise<LogRow[]> {
    try {
      const response = await fetch(`/api/proceso-automatico/historial?limite=${limite}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resultado = await response.json();

      if (resultado.success) {
        return resultado.historial;
      } else {
        console.error("Error obteniendo historial:", resultado.error);
        return [];
      }
    } catch (error) {
      console.error("Error obteniendo historial:", error);
      return [];
    }
  }

  static async ejecutarProceso(): Promise<ProcesoAutomaticoResult> {
    try {
      console.log("🔄 Ejecutando proceso automático manualmente...");

      const response = await fetch('/api/proceso-automatico/ejecutar-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resultado = await response.json();

      if (resultado.success) {
        console.log("✅ Proceso manual completado exitosamente");
        return resultado.data;
      } else {
        throw new Error(resultado.error || 'Error desconocido en el proceso manual');
      }
    } catch (error) {
      console.error("❌ Error ejecutando proceso manual:", error);
      
      const errorResult: ProcesoAutomaticoResult = {
        fecha: new Date().toISOString(),
        clientesProcesados: 0,
        serviciosGenerados: 0,
        recordatoriosEnviados: 0,
        errores: [error instanceof Error ? error.message : String(error)],
        resumen: "Error ejecutando proceso manual"
      };

      return errorResult;
    }
  }

  static async esDiaDeCorte(): Promise<boolean> {
    try {
      const hoy = new Date();
      const año = hoy.getFullYear();
      
      const cronogramaResponse = await apiClient.getCronogramaSunat(año);
      
      if (cronogramaResponse.success && cronogramaResponse.cronograma) {
        const mesActual = hoy.getMonth() + 1;
        const diaActual = hoy.getDate();
        
        for (const [, fechas] of Object.entries(cronogramaResponse.cronograma)) {
          const fechaCorte = fechas.find(f => f.Mes === mesActual && f.Dia === diaActual);
          if (fechaCorte) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error verificando día de corte:", error);
      return false;
    }
  }

  static async aplicarClasificacionAutomatica(): Promise<{ aplicados: number; errores: string[] }> {
    try {
      const resultado = await apiClient.aplicarClasificacionesAutomaticas({
        accion: 'aplicar'
      });

      if (resultado.success) {
        return {
          aplicados: resultado.cambios_aplicados || 0,
          errores: []
        };
      } else {
        return {
          aplicados: 0,
          errores: [resultado.message || 'Error aplicando clasificación automática']
        };
      }
    } catch (error) {
      console.error("Error aplicando clasificación automática:", error);
      return {
        aplicados: 0,
        errores: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  static async obtenerHistorialProceso(limit = 30): Promise<LogRow[]> {
    return this.obtenerHistorial(limit);
  }

  static async ejecutarProcesoManual(): Promise<ProcesoAutomaticoResult> {
    return this.ejecutarProceso();
  }
}

export const ejecutarProcesoDiario = ProcesoAutomatico.ejecutarProcesoDiario.bind(ProcesoAutomatico);
export const ejecutarProcesoManual = ProcesoAutomatico.ejecutarProcesoManual.bind(ProcesoAutomatico);