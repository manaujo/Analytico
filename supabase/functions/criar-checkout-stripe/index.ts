import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { plano, success_url, cancel_url } = await req.json()

    if (!plano || !success_url || !cancel_url) {
      throw new Error('Plano, success_url e cancel_url são obrigatórios')
    }

    // Configurar preços baseado no plano
    let priceData
    if (plano === 'mensal') {
      priceData = {
        currency: 'brl',
        product_data: {
          name: 'Analytico - Plano Mensal',
          description: 'Sistema completo de analytics empresarial'
        },
        unit_amount: 12000, // R$ 120.00 em centavos
        recurring: {
          interval: 'month'
        }
      }
    } else if (plano === 'anual') {
      priceData = {
        currency: 'brl',
        product_data: {
          name: 'Analytico - Plano Anual',
          description: 'Sistema completo de analytics empresarial (15% desconto)'
        },
        unit_amount: 122400, // R$ 1,224.00 em centavos
        recurring: {
          interval: 'year'
        }
      }
    } else {
      throw new Error('Plano deve ser "mensal" ou "anual"')
    }

    // Simular criação de sessão do Stripe
    // Em uma implementação real, você usaria a API do Stripe
    const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`

    return new Response(
      JSON.stringify({
        success: true,
        session_id: sessionId,
        checkout_url: checkoutUrl,
        message: 'Sessão de checkout criada com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao criar checkout:', error)
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