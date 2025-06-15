import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect
} from "react";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";
import { isStripeConfigured } from "../lib/stripe";

interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: "active" | "canceled" | "past_due" | "unpaid" | "incomplete";
  plan_id: string;
  plan_name: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isActive: boolean;
  isStripeEnabled: boolean;
  createCheckoutSession: (
    planId: string
  ) => Promise<{ url: string } | { error: string }>;
  createPortalSession: () => Promise<{ url: string } | { error: string }>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const isActive = subscription?.status === "active";
  const isStripeEnabled = isStripeConfigured();

  useEffect(() => {
    if (user && isStripeEnabled) {
      refreshSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user, isStripeEnabled]);

  const refreshSubscription = async () => {
    if (!user || !isStripeEnabled) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setSubscription(data || null);
    } catch (error) {
      console.error("Erro ao carregar assinatura:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (planId: string) => {
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    if (!isStripeEnabled) {
      return { error: "Stripe não está configurado" };
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: user.id,
            email: user.email,
            plan_id: planId,
            success_url: `${window.location.origin}/subscription-success`,
            cancel_url: `${window.location.origin}/pricing?canceled=true`
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        return { url: result.checkout_url };
      } else {
        return { error: result.error || "Erro ao criar sessão de checkout" };
      }
    } catch (error) {
      console.error("Erro ao criar checkout:", error);
      return { error: "Erro inesperado ao processar pagamento" };
    }
  };

  const createPortalSession = async () => {
    if (!user || !subscription) {
      return { error: "Usuário não autenticado ou sem assinatura" };
    }

    if (!isStripeEnabled) {
      return { error: "Stripe não está configurado" };
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/create-portal-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            customer_id: subscription.stripe_customer_id,
            return_url: `${window.location.origin}/configuracoes`
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        return { url: result.portal_url };
      } else {
        return { error: result.error || "Erro ao criar sessão do portal" };
      }
    } catch (error) {
      console.error("Erro ao criar portal:", error);
      return { error: "Erro inesperado ao acessar portal" };
    }
  };

  const value = {
    subscription,
    loading,
    isActive,
    isStripeEnabled,
    createCheckoutSession,
    createPortalSession,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
