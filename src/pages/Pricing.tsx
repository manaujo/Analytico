import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { Button } from '../components/UI/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { 
  Check, 
  Star, 
  CreditCard,
  Shield,
  Zap,
  Users,
  BarChart3,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import { STRIPE_PRODUCTS, formatPrice } from '../stripe-config'
import toast from 'react-hot-toast'

export function Pricing() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { createCheckoutSession, isActive, isStripeEnabled } = useSubscription()
  const [loading, setLoading] = useState<string | null>(null)

  const canceled = searchParams.get('canceled')
  const success = searchParams.get('success')

  React.useEffect(() => {
    if (canceled) {
      toast.error('Pagamento cancelado')
    }
    if (success) {
      toast.success('Assinatura ativada com sucesso!')
    }
  }, [canceled, success])

  const handleSubscribe = async (productKey: string) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!isStripeEnabled) {
      toast.error('Sistema de pagamentos não está configurado')
      return
    }

    if (isActive) {
      toast.info('Você já possui uma assinatura ativa')
      return
    }

    const product = STRIPE_PRODUCTS[productKey as keyof typeof STRIPE_PRODUCTS]
    if (!product) {
      toast.error('Produto não encontrado')
      return
    }

    setLoading(productKey)
    try {
      const result = await createCheckoutSession(product.priceId, product.mode)
      
      if ('url' in result) {
        window.location.href = result.url
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao processar pagamento')
    } finally {
      setLoading(null)
    }
  }

  const features = [
    'Dashboard completo com analytics',
    'Controle de estoque em tempo real',
    'Previsões de vendas com IA',
    'Alertas inteligentes automáticos',
    'Relatórios em PDF',
    'Múltiplas empresas',
    'Importação de dados (CSV/Excel)',
    'Suporte por email',
    'Backup automático dos dados',
    'Acesso via web e mobile'
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar
              </Link>
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-primary" />
                <span className="ml-2 text-2xl font-bold text-text">Analytico</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link to="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-800 font-medium">
                    Entrar
                  </Link>
                  <Link to="/cadastro">
                    <Button>Criar Conta</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary-light to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-6">
            Escolha o plano ideal para seu negócio
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transforme seus dados em insights poderosos e maximize seus lucros
          </p>
          
          {!isStripeEnabled && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">
                  Sistema de pagamentos em configuração. Entre em contato para assinar.
                </span>
              </div>
            </div>
          )}
          
          {isActive && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Você já possui uma assinatura ativa!
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
            {/* Plano Analytico */}
            <Card className="relative border-2 border-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Recomendado
                </div>
              </div>
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-bold text-text mb-4">
                  {STRIPE_PRODUCTS['plano-analytico'].name}
                </CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary">
                    {formatPrice(STRIPE_PRODUCTS['plano-analytico'].price)}
                  </span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <p className="text-gray-600">{STRIPE_PRODUCTS['plano-analytico'].description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-secondary mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleSubscribe('plano-analytico')}
                  loading={loading === 'plano-analytico'}
                  disabled={isActive || !isStripeEnabled}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {isActive ? 'Plano Ativo' : !isStripeEnabled ? 'Em Breve' : 'Assinar Agora'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-4">
              Por que escolher o Analytico?
            </h2>
            <p className="text-xl text-gray-600">
              A solução completa para gestão inteligente do seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-light p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">Rápido e Fácil</h3>
              <p className="text-gray-600">
                Configure em minutos e comece a usar imediatamente. Interface intuitiva e amigável.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-light p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">Seguro e Confiável</h3>
              <p className="text-gray-600">
                Seus dados protegidos com criptografia de ponta e backup automático na nuvem.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-light p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">Suporte Dedicado</h3>
              <p className="text-gray-600">
                Equipe especializada pronta para ajudar você a maximizar seus resultados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-4">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-text mb-2">
                Posso cancelar minha assinatura a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim, você pode cancelar sua assinatura a qualquer momento. Você continuará tendo acesso até o final do período pago.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-text mb-2">
                Existe período de teste gratuito?
              </h3>
              <p className="text-gray-600">
                Oferecemos 7 dias de teste gratuito para você conhecer todas as funcionalidades do sistema.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-text mb-2">
                Meus dados ficam seguros?
              </h3>
              <p className="text-gray-600">
                Sim, utilizamos criptografia de ponta e fazemos backup automático. Seus dados são armazenados em servidores seguros na nuvem.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-text mb-2">
                Posso gerenciar múltiplas empresas?
              </h3>
              <p className="text-gray-600">
                Sim, você pode cadastrar e gerenciar quantas empresas quiser em uma única conta, com dados totalmente segregados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a centenas de empresas que já otimizaram suas operações
          </p>
          {!user && (
            <Link to="/cadastro">
              <Button variant="secondary" size="lg">
                Começar Agora - 7 Dias Grátis
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="ml-2 text-xl font-bold text-white">Analytico</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 Analytico. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}