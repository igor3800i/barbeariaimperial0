import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
})

function UnsubscribePage() {
  const [state, setState] = useState<'loading' | 'valid' | 'already' | 'invalid' | 'done' | 'error'>('loading')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = new URL(window.location.href).searchParams.get('token')
    setToken(t)
    if (!t) { setState('invalid'); return }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) setState('valid')
        else if (d.reason === 'already_unsubscribed') setState('already')
        else setState('invalid')
      })
      .catch(() => setState('error'))
  }, [])

  const confirm = async () => {
    if (!token) return
    const res = await fetch('/email/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const d = await res.json()
    if (d.success) setState('done')
    else if (d.reason === 'already_unsubscribed') setState('already')
    else setState('error')
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-serif text-3xl text-foreground mb-4">Cancelar inscrição</h1>
      {state === 'loading' && <p className="text-muted-foreground">Verificando…</p>}
      {state === 'valid' && (
        <>
          <p className="text-muted-foreground mb-6">Confirme para parar de receber e-mails da Barbearia Imperial.</p>
          <Button onClick={confirm}>Confirmar cancelamento</Button>
        </>
      )}
      {state === 'already' && <p className="text-muted-foreground">Você já havia cancelado a inscrição.</p>}
      {state === 'done' && <p className="text-muted-foreground">Pronto! Você não receberá mais e-mails.</p>}
      {state === 'invalid' && <p className="text-muted-foreground">Link inválido ou expirado.</p>}
      {state === 'error' && <p className="text-destructive">Algo deu errado. Tente novamente.</p>}
    </main>
  )
}
