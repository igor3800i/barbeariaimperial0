import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Barbearia Imperial'

interface Props {
  clientName?: string
  serviceName?: string
  barberName?: string
  scheduledAt?: string
}

const AppointmentReminder = ({ clientName, serviceName, barberName, scheduledAt }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Lembrete: seu horário na {SITE_NAME} está chegando</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Lembrete do seu horário ⏰</Heading>
        <Text style={text}>
          {clientName ? `Olá, ${clientName}!` : 'Olá!'} Passando para lembrar do seu próximo atendimento.
        </Text>
        <Section style={card}>
          {serviceName && <Text style={row}><strong>Serviço:</strong> {serviceName}</Text>}
          {barberName && <Text style={row}><strong>Barbeiro:</strong> {barberName}</Text>}
          {scheduledAt && <Text style={row}><strong>Data:</strong> {scheduledAt}</Text>}
        </Section>
        <Text style={text}>
          Te esperamos! Caso não consiga comparecer, cancele com antecedência em "Minha conta".
        </Text>
        <Text style={footer}>Equipe {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AppointmentReminder,
  subject: (d: Record<string, any>) => `Lembrete: seu horário ${d?.scheduledAt ?? ''}`.trim(),
  displayName: 'Lembrete de agendamento',
  previewData: { clientName: 'João', serviceName: 'Corte Clássico', barberName: 'Igor', scheduledAt: 'amanhã às 14:00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0a0a0a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 14px' }
const card = { background: '#f7f4ee', border: '1px solid #e6dfd1', borderRadius: '8px', padding: '14px 18px', margin: '8px 0 18px' }
const row = { fontSize: '14px', color: '#222', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#999', marginTop: '24px' }
