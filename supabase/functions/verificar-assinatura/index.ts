import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, session_id } = await req.json()

    if (!user_id) {
      throw new Error('ID do usuário é obrigatório')
    }

    // Simular verificação de assinatura no Stripe
    // Em uma implementação real, você consultaria a API do Stripe
    const isActive = Math.random() > 0.3 // 70% chance de estar ativa (simulação)
    
    const assinaturaStatus = {
      ativa: isActive,
      plano: isActive ? (Math.random() > 0.5 ? 'mensal' : 'anual') : null,
      proxima_cobranca: isActive ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      valor: isActive ? (Math.random() > 0.5 ? 12000 : 122400) : null,
      session_id: session_id || `cs_${Date.now()}`
    }

    // Em uma aplicação real, você salvaria o status da assinatura no banco
    // Por ora, apenas retornamos o status simulado

    return new Response(
      JSON.stringify({
        success: true,
        assinatura: assinaturaStatus,
        message: assinaturaStatus.ativa ? 'Assinatura ativa' : 'Assinatura inativa'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao verificar assinatura:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})