import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

import { template as appointmentConfirmation } from './appointment-confirmation'
import { template as appointmentCancellation } from './appointment-cancellation'
import { template as appointmentReminder } from './appointment-reminder'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'appointment-confirmation': appointmentConfirmation,
  'appointment-cancellation': appointmentCancellation,
  'appointment-reminder': appointmentReminder,
}
