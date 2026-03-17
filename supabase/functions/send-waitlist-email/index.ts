import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, q1, q2, q3, q4, q5, q6, q7, q7b, q8 } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    const { error: dbError } = await supabase.from('waitlist').insert([{
      name, email, q1, q2, q3, q4, q5, q6, q7, q7b,
      q8: Array.isArray(q8) ? q8.join(', ') : q8
    }])

    if (dbError) throw dbError

    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Kudimi <onboarding@resend.dev>'

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: '¡Ya estás en la lista de espera de Kudimi! 🎉',
        html: `
          <meta charset="utf-8">
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FFF8F0;border-radius:16px;">
            <h1 style="color:#2D1B69;font-size:26px;margin-bottom:8px;">¡Hola, ${name}! 🎉</h1>
            <p style="color:#5a4a8a;font-size:16px;line-height:1.7;margin-bottom:16px;">
              Gracias por anotarte en la lista de espera de <strong>Kudimi</strong> — cuentos animados con IA para tu hijo/a.
            </p>
            <div style="background:#2D1B69;color:white;border-radius:16px;padding:22px 24px;margin:24px 0;">
              <p style="margin:0 0 8px;font-size:13px;opacity:0.6;text-transform:uppercase;letter-spacing:1px;">Tu lugar está reservado</p>
              <p style="margin:0;font-size:16px;line-height:1.6;">
                Te avisamos en cuanto abramos los <strong style="color:#FFD447;">50 cupos de acceso anticipado a $9</strong>.
                Vas a ser de los primeros en crear un cuento animado personalizado.
              </p>
            </div>
            <p style="color:#9a8aba;font-size:13px;margin-top:24px;">— El equipo de Kudimi ✨</p>
          </div>
        `
      })
    })

    if (!emailRes.ok) {
      const err = await emailRes.text()
      console.error('Resend error (waitlist):', err)
      // Don't throw — DB insert succeeded, email failure is non-fatal
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
