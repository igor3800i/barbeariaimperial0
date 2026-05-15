import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Barbearia Imperial'

interface Props {
  clientName?: string
  serviceName?: string
  barberName?: string
  scheduledAt?: string
  price?: string
}

const AppointmentConfirmation = ({ clientName, serviceName, barberName, scheduledAt, price }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu agendamento na {SITE_NAME} foi confirmado</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Agendamento confirmado ✂️</Heading>
        <Text style={text}>
          {clientName ? `Olá, ${clientName}!` : 'Olá!'} Recebemos seu agendamento na {SITE_NAME}.
        </Text>
        <Section style={card}>
          {serviceName && <Text style={row}><strong>Serviço:</strong> {serviceName}</Text>}
          {barberName && <Text style={row}><strong>Barbeiro:</strong> {barberName}</Text>}
          {scheduledAt && <Text style={row}><strong>Data:</strong> {scheduledAt}</Text>}
          {price && <Text style={row}><strong>Valor:</strong> {price}</Text>}
        </Section>
        <Text style={text}>
          Caso precise reagendar ou cancelar, acesse "Minha conta" no nosso site.
        </Text>
        <Text style={footer}>Até breve, equipe {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AppointmentConfirmation,
  subject: (d: Record<string, any>) => `Agendamento confirmado — ${d?.scheduledAt ?? SITE_NAME}`,
  displayName: 'Confirmação de agendamento',
  previewData: { clientName: 'João', serviceName: 'Corte Clássico', barberName: 'Igor', scheduledAt: '20/05 às 14:00', price: 'R$ 60,00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0a0a0a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 14px' }
const card = { background: '#f7f4ee', border: '1px solid #e6dfd1', borderRadius: '8px', padding: '14px 18px', margin: '8px 0 18px' }
const row = { fontSize: '14px', color: '#222', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#999', marginTop: '24px' }
