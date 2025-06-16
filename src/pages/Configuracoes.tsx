import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useEmpresa } from '../hooks/useEmpresa'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { 
  Settings, 
  Building2, 
  CreditCard, 
  Bell, 
  Shield,
  Plus,
  Edit,
  LogOut,
  Check,
  X,
  ExternalLink
} from 'lucide-react'
import { formatPrice } from '../stripe-config'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

export function Configuracoes() {
  const { user, signOut } = useAuth()
  const { empresas, empresaAtual, setEmpresaAtual, criarEmpresa } = useEmpresa()
  const { subscription, isActive, isStripeEnabled } = useSubscription()
  const [loading, setLoading] = useState(false)

  // Estados para edição
  const [editandoEmpresa, setEditandoEmpresa] = useState(false)
  const [dadosEmpresa, setDadosEmpresa] = useState({
    nome: '',
    cnpj: ''
  })

  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '',
    cnpj: ''
  })

  const [novaSenha, setNovaSenha] = useState({
    atual: '',
    nova: '',
    confirmar: ''
  })

  const [notificacoes, setNotificacoes] = useState({
    email: true,
    whatsapp: false
  })

  useEffect(() => {
    if (empresaAtual) {
      setDadosEmpresa({
        nome: empresaAtual.nome,
        cnpj: empresaAtual.cnpj || ''
      })
    }
  }, [empresaAtual])

  const salvarDadosEmpresa = async () => {
    if (!empresaAtual) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          nome: dadosEmpresa.nome,
          cnpj: dadosEmpresa.cnpj
        })
        .eq('id', empresaAtual.id)

      if (error) throw error

      toast.success('Dados da empresa atualizados!')
      setEditandoEmpresa(false)
      
      // Atualizar empresa atual
      setEmpresaAtual({
        ...empresaAtual,
        nome: dadosEmpresa.nome,
        cnpj: dadosEmpresa.cnpj
      })
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error)
      toast.error('Erro ao atualizar dados da empresa')
    } finally {
      setLoading(false)
    }
  }

  const criarNovaEmpresa = async () => {
    if (!novaEmpresa.nome.trim()) {
      toast.error('Nome da empresa é obrigatório')
      return
    }

    setLoading(true)
    try {
      const { error } = await criarEmpresa(novaEmpresa.nome, novaEmpresa.cnpj)
      
      if (error) {
        toast.error('Erro ao criar empresa')
      } else {
        toast.success('Empresa criada com sucesso!')
        setNovaEmpresa({ nome: '', cnpj: '' })
      }
    } catch (error) {
      console.error('Erro ao criar empresa:', error)
      toast.error('Erro ao criar empresa')
    } finally {
      setLoading(false)
    }
  }

  const alterarSenha = async () => {
    if (novaSenha.nova !== novaSenha.confirmar) {
      toast.error('As senhas não coincidem')
      return
    }

    if (novaSenha.nova.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha.nova
      })

      if (error) throw error

      toast.success('Senha alterada com sucesso!')
      setNovaSenha({ atual: '', nova: '', confirmar: '' })
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error('Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  const formatarCNPJ = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    return numericValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text">Configurações da Conta</h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas preferências e dados da conta
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Dados da Empresa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {empresaAtual ? (
              <div className="space-y-4">
                {editandoEmpresa ? (
                  <>
                    <Input
                      label="Nome da Empresa"
                      value={dadosEmpresa.nome}
                      onChange={(e) => setDadosEmpresa(prev => ({ ...prev, nome: e.target.value }))}
                    />
                    <Input
                      label="CNPJ"
                      value={dadosEmpresa.cnpj}
                      onChange={(e) => setDadosEmpresa(prev => ({ 
                        ...prev, 
                        cnpj: formatarCNPJ(e.target.value) 
                      }))}
                      placeholder="00.000.000/0000-00"
                    />
                    <div className="flex space-x-3">
                      <Button onClick={salvarDadosEmpresa} loading={loading} size="sm">
                        <Check className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditandoEmpresa(false)}
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nome</label>
                      <p className="text-text">{empresaAtual.nome}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">CNPJ</label>
                      <p className="text-text">{empresaAtual.cnpj || 'Não informado'}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditandoEmpresa(true)}
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma empresa selecionada</p>
            )}
          </CardContent>
        </Card>

        {/* Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Assinatura</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isStripeEnabled ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">Sistema de pagamentos não configurado</p>
                <p className="text-sm text-gray-400">
                  Entre em contato para informações sobre assinatura
                </p>
              </div>
            ) : subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isActive ? 'Ativa' : subscription.subscription_status}
                  </span>
                </div>
                
                {subscription.current_period_end && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Próxima cobrança</label>
                    <p className="text-text">
                      {format(new Date(subscription.current_period_end * 1000), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
                
                {subscription.payment_method_brand && subscription.payment_method_last4 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Método de pagamento</label>
                    <p className="text-text">
                      {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">Nenhuma assinatura ativa</p>
                <Button size="sm">
                  Assinar Agora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notificações</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">Alertas por E-mail</p>
                  <p className="text-sm text-gray-600">Receber notificações importantes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificacoes.email}
                    onChange={(e) => setNotificacoes(prev => ({ ...prev, email: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">Alertas por WhatsApp</p>
                  <p className="text-sm text-gray-600">Notificações via WhatsApp</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificacoes.whatsapp}
                    onChange={(e) => setNotificacoes(prev => ({ ...prev, whatsapp: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <Button size="sm" onClick={() => toast.success('Preferências salvas!')}>
                Salvar Preferências
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Multi-empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Empresas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Lista de empresas */}
              <div className="space-y-2">
                {empresas.map((empresa) => (
                  <div key={empresa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-text">{empresa.nome}</p>
                      <p className="text-sm text-gray-600">{empresa.cnpj}</p>
                    </div>
                    {empresa.id === empresaAtual?.id && (
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                        Atual
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Nova empresa */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-text mb-3">Adicionar Nova Empresa</h4>
                <div className="space-y-3">
                  <Input
                    placeholder="Nome da empresa"
                    value={novaEmpresa.nome}
                    onChange={(e) => setNovaEmpresa(prev => ({ ...prev, nome: e.target.value }))}
                  />
                  <Input
                    placeholder="CNPJ (opcional)"
                    value={novaEmpresa.cnpj}
                    onChange={(e) => setNovaEmpresa(prev => ({ 
                      ...prev, 
                      cnpj: formatarCNPJ(e.target.value) 
                    }))}
                  />
                  <Button 
                    onClick={criarNovaEmpresa} 
                    loading={loading}
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Empresa
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Segurança</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-text mb-3">Alterar Senha</h4>
                <div className="space-y-3">
                  <Input
                    label="Senha Atual"
                    type="password"
                    value={novaSenha.atual}
                    onChange={(e) => setNovaSenha(prev => ({ ...prev, atual: e.target.value }))}
                  />
                  <Input
                    label="Nova Senha"
                    type="password"
                    value={novaSenha.nova}
                    onChange={(e) => setNovaSenha(prev => ({ ...prev, nova: e.target.value }))}
                  />
                  <Input
                    label="Confirmar Nova Senha"
                    type="password"
                    value={novaSenha.confirmar}
                    onChange={(e) => setNovaSenha(prev => ({ ...prev, confirmar: e.target.value }))}
                  />
                  <Button onClick={alterarSenha} loading={loading} size="sm">
                    Alterar Senha
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Button 
                  variant="outline" 
                  onClick={signOut}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair da Conta</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}