import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Barbearia Imperial'

interface Props {
  clientName?: string
  serviceName?: string
  barberName?: string
  scheduledAt?: string
}

const AppointmentCancellation = ({ clientName, serviceName, barberName, scheduledAt }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu agendamento na {SITE_NAME} foi cancelado</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Agendamento cancelado</Heading>
        <Text style={text}>
          {clientName ? `Olá, ${clientName}.` : 'Olá.'} Confirmamos o cancelamento do seu agendamento.
        </Text>
        <Section style={card}>
          {serviceName && <Text style={row}><strong>Serviço:</strong> {serviceName}</Text>}
          {barberName && <Text style={row}><strong>Barbeiro:</strong> {barberName}</Text>}
          {scheduledAt && <Text style={row}><strong>Data:</strong> {scheduledAt}</Text>}
        </Section>
        <Text style={text}>
          Quer remarcar? É só acessar nosso site e escolher um novo horário.
        </Text>
        <Text style={footer}>Equipe {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AppointmentCancellation,
  subject: 'Agendamento cancelado',
  displayName: 'Cancelamento de agendamento',
  previewData: { clientName: 'João', serviceName: 'Corte Clássico', barberName: 'Igor', scheduledAt: '20/05 às 14:00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0a0a0a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 14px' }
const card = { background: '#f7f4ee', border: '1px solid #e6dfd1', borderRadius: '8px', padding: '14px 18px', margin: '8px 0 18px' }
const row = { fontSize: '14px', color: '#222', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#999', marginTop: '24px' }
