export type Locale = 'zh-CN' | 'en-US'
export type QuestionType = 'single_choice' | 'true_false'
export type ActivityStatus = 'draft' | 'published' | 'paused' | 'ended'

export interface ApiResponse<T> {
  data: T | null
  error: { code: string; message: string } | null
  meta: Record<string, unknown>
}

export interface PublicQuestion {
  id: string
  type: QuestionType
  stem: string
  options: Array<{ value: string; label: string }>
  points: number
}
