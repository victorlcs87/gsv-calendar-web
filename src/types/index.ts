/**
 * Tipos principais do GSV Calendar
 * Definições TypeScript para escalas, usuário e filtros
 */

/** Tipo de escala de trabalho */
export type TipoEscala = 'Ordinária' | 'Extra'

/** Status de sincronização com Google Calendar */
export type SyncStatus = 'pending' | 'synced' | 'error'

/** Escala de trabalho do CBMDF */
export interface Scale {
  id: string
  user_id: string
  data: string // ISO date string (YYYY-MM-DD)
  tipo: TipoEscala
  local: string
  horaInicio: number // 0-23
  horaFim: number // 0-23
  horas: number // Calculated
  valorBruto: number // horas * 50
  valorLiquido: number // valorBruto * 0.725 (desconto 27.5%)
  observacoes?: string
  sincronizado: boolean
  syncStatus: SyncStatus
  calendar_event_id?: string
  created_at: string
  updated_at: string
}

/** Dados para criar/editar escala */
export interface ScaleInput {
  data: string
  tipo: TipoEscala
  local: string
  horaInicio: number
  horaFim: number
  observacoes?: string
}

/** Filtros de busca */
export interface ScaleFilters {
  dataInicio?: string
  dataFim?: string
  tipo?: TipoEscala
  local?: string
}

/** Usuário autenticado */
export interface User {
  id: string
  email: string
  nome: string
  created_at: string
}

/** Relatório mensal */
export interface MonthlyReport {
  mes: string // YYYY-MM
  totalEscalas: number
  totalHoras: number
  valorBrutoTotal: number
  valorLiquidoTotal: number
  escalasOrdinarias: number
  escalasExtras: number
}

/** Resposta padrão de API */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

/** Estado de loading/error */
export interface AsyncState {
  isLoading: boolean
  error: string | null
}
