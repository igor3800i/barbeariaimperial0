import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import * as React from 'react'
import { render } from '@react-email/components'
import { TEMPLATES } from '@/lib/email-templates/registry'

export const Route = createFileRoute('/api/public/hooks/send-reminders')({
  server: {
    handlers: {
      POST: async () => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }
        const supabase = createClient(supabaseUrl, serviceKey)

        // Window: appointments scheduled between 23h and 25h from now, not cancelled, no reminder sent yet
        const now = new Date()
        const start = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString()
        const end = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString()

        const { data: appts, error } = await supabase
          .from('appointments')
          .select('id, scheduled_at, client_id, service_id, barber_id, status')
          .gte('scheduled_at', start)
          .lte('scheduled_at', end)
          .neq('status', 'cancelled')

        if (error) {
          console.error('reminder query failed', error)
          return Response.json({ error: 'query failed' }, { status: 500 })
        }

        let sent = 0
        let skipped = 0

        for (const a of appts ?? []) {
          const idempotencyKey = `appointment-reminder-${a.id}`

          // Skip if already attempted (look at email_send_log metadata)
          const { data: existing } = await supabase
            .from('email_send_log')
            .select('id')
            .contains('metadata', { idempotencyKey })
            .limit(1)
          if (existing && existing.length > 0) {
            skipped++
            continue
          }

          const [{ data: profile }, { data: service }, { data: barber }] = await Promise.all([
            supabase.from('profiles').select('full_name, email').eq('id', a.client_id!).maybeSingle(),
            supabase.from('services').select('name').eq('id', a.service_id!).maybeSingle(),
            supabase.from('barbers').select('display_name').eq('id', a.barber_id!).maybeSingle(),
          ])

          if (!profile?.email) {
            skipped++
            continue
          }

          // Suppression check
          const { data: suppressed } = await supabase
            .from('suppressed_emails')
            .select('email')
            .eq('email', profile.email.toLowerCase())
            .maybeSingle()
          if (suppressed) {
            skipped++
            continue
          }

          const scheduledAt = new Date(a.scheduled_at).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
          })

          const templateData = {
            clientName: profile.full_name,
            serviceName: service?.name,
            barberName: barber?.display_name,
            scheduledAt,
          }

          const entry = TEMPLATES['appointment-reminder']
          const html = await render(React.createElement(entry.component, templateData))
          const subject = typeof entry.subject === 'function' ? entry.subject(templateData) : entry.subject

          const { error: enqErr } = await supabase.rpc('enqueue_email', {
            queue_name: 'transactional_emails',
            payload: {
              templateName: 'appointment-reminder',
              recipientEmail: profile.email,
              subject,
              html,
              idempotencyKey,
            } as any,
          })

          if (enqErr) {
            console.error('enqueue failed', enqErr)
            skipped++
            continue
          }

          await supabase.from('email_send_log').insert({
            template_name: 'appointment-reminder',
            recipient_email: profile.email,
            status: 'pending',
            metadata: { idempotencyKey, appointmentId: a.id } as any,
          })

          sent++
        }

        return Response.json({ ok: true, candidates: appts?.length ?? 0, enqueued: sent, skipped })
      },
    },
  },
})
