import React, { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSubscription } from '../hooks/useSubscription'
import { Button } from '../components/UI/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { CheckCircle, ArrowRight, BarChart3 } from 'lucide-react'

export function SubscriptionSuccess() {
  const [searchParams] = useSearchParams()
  const { refreshSubscription } = useSubscription()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Atualizar dados da assinatura após pagamento bem-sucedido
    const timer = setTimeout(() => {
      refreshSubscription()
    }, 2000) // Aguardar 2 segundos para o webhook processar

    return () => clearTimeout(timer)
  }, [refreshSubscription])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-text">
            Pagamento Confirmado!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Sua assinatura foi ativada com sucesso. Agora você tem acesso completo a todas as funcionalidades do Analytico.
          </p>
          
          {sessionId && (
            <p className="text-sm text-gray-500">
              ID da sessão: {sessionId}
            </p>
          )}

          <div className="space-y-3 pt-4">
            <Link to="/dashboard">
              <Button className="w-full">
                Ir para o Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            
            <Link to="/configuracoes">
              <Button variant="outline" className="w-full">
                Gerenciar Assinatura
              </Button>
            </Link>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mt-6">
            <h4 className="font-medium text-blue-900 mb-2">Próximos passos:</h4>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Configure sua primeira empresa</li>
              <li>• Cadastre seus produtos</li>
              <li>• Importe seus dados de vendas</li>
              <li>• Explore o dashboard de analytics</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <Link to="/" className="flex items-center justify-center text-gray-600 hover:text-gray-800">
              <BarChart3 className="h-5 w-5 mr-2" />
              <span className="font-medium">Analytico</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}