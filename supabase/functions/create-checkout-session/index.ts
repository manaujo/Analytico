import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'

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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, email, plan_id, success_url, cancel_url } = await req.json()

    if (!user_id || !email || !plan_id) {
      throw new Error('Dados obrigatórios não fornecidos')
    }

    // Mapear planos para price IDs do Stripe
    const priceIds = {
      monthly: Deno.env.get('VITE_STRIPE_MONTHLY_PRICE_ID') ?? 'price_1234567890',
      yearly: Deno.env.get('VITE_STRIPE_YEARLY_PRICE_ID') ?? 'price_0987654321'
    }

    const priceId = priceIds[plan_id as keyof typeof priceIds]
    if (!priceId) {
      throw new Error('Plano inválido')
    }

    // Verificar se o usuário já tem um customer no Stripe
    let customerId: string | undefined

    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user_id)
      .single()

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
    } else {
      // Criar novo customer no Stripe
      const customer = await stripe.customers.create({
        email,
        metadata: {
          user_id
        }
      })
      customerId = customer.id
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancel_url,
      metadata: {
        user_id,
        plan_id
      },
      subscription_data: {
        metadata: {
          user_id,
          plan_id
        }
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id
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