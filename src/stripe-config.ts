import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  console.warn('Missing Stripe publishable key - Stripe features will be disabled')
}

export const stripe = stripePublishableKey ? loadStripe(stripePublishableKey) : null

export const STRIPE_PRODUCTS = {
  'plano-analytico': {
    priceId: 'price_1RaaoZB4if3rE1yXPgEvT5ZK',
    name: 'Plano Analytico',
    price: 9900, // R$ 99.00 em centavos
    mode: 'subscription' as const,
    description: 'Acesso completo ao Analytico'
  }
} as const

export type StripeProduct = keyof typeof STRIPE_PRODUCTS

// Helper function to format price
export const formatPrice = (priceInCents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(priceInCents / 100)
}

// Helper function to check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  return !!(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
    import.meta.env.VITE_SUPABASE_URL
  )
}