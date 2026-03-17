import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEmail(resendKey: string, to: string, subject: string, html: string, fromEmail: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromEmail, to: [to], subject, html })
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error sending to ${to}: ${err}`)
  }
  return res.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { child_name, child_age, story_idea, contact, payment_method } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    const { error: dbError } = await supabase.from('briefs').insert([{
      child_name, child_age, story_idea, contact, payment_method
    }])
    if (dbError) throw dbError

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
    // Set FROM_EMAIL secret in Supabase once you verify a domain in resend.com/domains
    // e.g. "Kudimi <hola@kudimi.com>" — until then only emails to your own address work
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Kudimi <onboarding@resend.dev>'
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
    const errors: string[] = []

    // Confirmation email to customer (only if they gave an email address)
    if (isEmail) {
      try {
        await sendEmail(RESEND_KEY, contact, '¡Tu cuento está en producción! 🎬', `
          <meta charset="utf-8">
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FFF8F0;border-radius:16px;">
            <h1 style="color:#2D1B69;font-size:26px;margin-bottom:8px;">¡Recibimos tu pedido! 🎬</h1>
            <p style="color:#5a4a8a;font-size:16px;line-height:1.7;">
              Estamos produciendo el cuento de <strong>${child_name}</strong>.
            </p>
            <div style="background:#2D1B69;color:white;border-radius:16px;padding:22px 24px;margin:24px 0;">
              <p style="margin:0 0 12px;font-size:13px;opacity:0.6;text-transform:uppercase;letter-spacing:1px;">Resumen de tu pedido</p>
              <p style="margin:0 0 6px;font-size:15px;"><strong>Nombre:</strong> ${child_name}</p>
              <p style="margin:0 0 6px;font-size:15px;"><strong>Edad:</strong> ${child_age} años</p>
              <p style="margin:0;font-size:15px;"><strong>Idea:</strong> ${story_idea}</p>
            </div>
            <p style="color:#5a4a8a;font-size:16px;line-height:1.7;">
              En menos de <strong>48 horas</strong> te enviamos el cuento terminado. ✨
            </p>
            <p style="color:#9a8aba;font-size:13px;margin-top:24px;">— El equipo de Kudimi</p>
          </div>
        `, FROM_EMAIL)
      } catch (e) {
        errors.push(e.message)
        console.error(e.message)
      }
    }

    // Notification email to Victoria (always)
    try {
      await sendEmail(RESEND_KEY, 'victoriadutraamarilla@gmail.com', '🎬 Nuevo pedido de cuento — Kudimi', `
        <meta charset="utf-8">
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FFF8F0;border-radius:16px;">
          <h1 style="color:#2D1B69;font-size:24px;">Nuevo pedido recibido 🎉</h1>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr style="border-bottom:1px solid #e0d8f0;">
              <td style="padding:10px 0;color:#9a8aba;font-size:14px;width:40%;">Nombre del hijo/a</td>
              <td style="padding:10px 0;font-weight:bold;color:#2D1B69;">${child_name}</td>
            </tr>
            <tr style="border-bottom:1px solid #e0d8f0;">
              <td style="padding:10px 0;color:#9a8aba;font-size:14px;">Edad</td>
              <td style="padding:10px 0;font-weight:bold;color:#2D1B69;">${child_age} años</td>
            </tr>
            <tr style="border-bottom:1px solid #e0d8f0;">
              <td style="padding:10px 0;color:#9a8aba;font-size:14px;">Idea del cuento</td>
              <td style="padding:10px 0;font-weight:bold;color:#2D1B69;">${story_idea}</td>
            </tr>
            <tr style="border-bottom:1px solid #e0d8f0;">
              <td style="padding:10px 0;color:#9a8aba;font-size:14px;">Contacto</td>
              <td style="padding:10px 0;font-weight:bold;color:#2D1B69;">${contact}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#9a8aba;font-size:14px;">Pago vía</td>
              <td style="padding:10px 0;font-weight:bold;color:#2D1B69;">${payment_method ?? '—'}</td>
            </tr>
          </table>
        </div>
      `, FROM_EMAIL)
    } catch (e) {
      errors.push(e.message)
      console.error(e.message)
    }

    return new Response(JSON.stringify({ success: true, warnings: errors.length ? errors : undefined }), {
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
