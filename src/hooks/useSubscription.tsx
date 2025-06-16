import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { isStripeConfigured } from '../stripe-config'

interface Subscription {
  customer_id: string
  subscription_id: string | null
  subscription_status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
  price_id: string | null
  current_period_start: number | null
  current_period_end: number | null
  cancel_at_period_end: boolean
  payment_method_brand: string | null
  payment_method_last4: string | null
}

interface SubscriptionContextType {
  subscription: Subscription | null
  loading: boolean
  isActive: boolean
  isStripeEnabled: boolean
  createCheckoutSession: (priceId: string, mode: 'payment' | 'subscription') => Promise<{ url: string } | { error: string }>
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const isActive = subscription?.subscription_status === 'active' || subscription?.subscription_status === 'trialing'
  const isStripeEnabled = isStripeConfigured()

  useEffect(() => {
    if (user && isStripeEnabled) {
      refreshSubscription()
    } else {
      setSubscription(null)
      setLoading(false)
    }
  }, [user, isStripeEnabled])

  const refreshSubscription = async () => {
    if (!user || !isStripeEnabled) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setSubscription(data || null)
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCheckoutSession = async (priceId: string, mode: 'payment' | 'subscription') => {
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    if (!isStripeEnabled) {
      return { error: 'Stripe não está configurado' }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        return { error: 'Token de acesso não encontrado' }
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          mode,
          success_url: `${window.location.origin}/subscription-success`,
          cancel_url: `${window.location.origin}/pricing?canceled=true`
        })
      })

      const result = await response.json()

      if (response.ok && result.url) {
        return { url: result.url }
      } else {
        return { error: result.error || 'Erro ao criar sessão de checkout' }
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
      return { error: 'Erro inesperado ao processar pagamento' }
    }
  }

  const value = {
    subscription,
    loading,
    isActive,
    isStripeEnabled,
    createCheckoutSession,
    refreshSubscription
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}