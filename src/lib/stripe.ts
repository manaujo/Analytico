import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  console.warn('Missing Stripe publishable key - Stripe features will be disabled')
}

export const stripe = stripePublishableKey ? loadStripe(stripePublishableKey) : null

export const STRIPE_PLANS = {
  monthly: {
    priceId: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_default',
    name: 'Plano Mensal',
    price: 12000, // R$ 120.00 em centavos
    interval: 'month' as const,
    description: 'Acesso completo ao Analytico por mês'
  },
  yearly: {
    priceId: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || 'price_yearly_default',
    name: 'Plano Anual',
    price: 122400, // R$ 1,224.00 em centavos (15% desconto)
    interval: 'year' as const,
    description: 'Acesso completo ao Analytico por ano (15% desconto)'
  }
} as const

export type StripePlan = keyof typeof STRIPE_PLANS

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
    import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID &&
    import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID
  )
}