import React, { useState, useEffect } from 'react'
import { useEmpresa } from '../hooks/useEmpresa'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { 
  Bell, 
  AlertTriangle, 
  TrendingDown,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  CheckCircle,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Alerta {
  id: string
  tipo: 'estoque_baixo' | 'ticket_medio' | 'meta_atingida' | 'produto_parado'
  titulo: string
  descricao: string
  prioridade: 'alta' | 'media' | 'baixa'
  data: string
  lido: boolean
  dados?: any
}

export function Alertas() {
  const { empresaAtual } = useEmpresa()
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroLido, setFiltroLido] = useState<string>('todos')

  useEffect(() => {
    if (empresaAtual) {
      gerarAlertas()
    }
  }, [empresaAtual])

  const gerarAlertas = async () => {
    if (!empresaAtual) return

    setLoading(true)
    try {
      const alertasGerados: Alerta[] = []

      // Verificar produtos com estoque baixo
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('*')
        .eq('empresa_id', empresaAtual.id)
        .lt('quantidade_estoque', 10)

      if (!produtosError && produtos) {
        produtos.forEach(produto => {
          alertasGerados.push({
            id: `estoque_${produto.id}`,
            tipo: 'estoque_baixo',
            titulo: 'Estoque Baixo',
            descricao: `${produto.nome} está com apenas ${produto.quantidade_estoque} unidades em estoque`,
            prioridade: produto.quantidade_estoque < 5 ? 'alta' : 'media',
            data: new Date().toISOString(),
            lido: false,
            dados: { produto }
          })
        })
      }

      // Verificar mudanças no ticket médio
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('total, data_venda')
        .eq('empresa_id', empresaAtual.id)
        .order('data_venda', { ascending: false })
        .limit(50)

      if (!vendasError && vendas && vendas.length > 10) {
        const vendasRecentes = vendas.slice(0, 10)
        const vendasAnteriores = vendas.slice(10, 20)
        
        const ticketMedioRecente = vendasRecentes.reduce((acc, v) => acc + v.total, 0) / vendasRecentes.length
        const ticketMedioAnterior = vendasAnteriores.reduce((acc, v) => acc + v.total, 0) / vendasAnteriores.length
        
        const variacao = ((ticketMedioRecente - ticketMedioAnterior) / ticketMedioAnterior) * 100

        if (Math.abs(variacao) > 15) {
          alertasGerados.push({
            id: 'ticket_medio',
            tipo: 'ticket_medio',
            titulo: variacao > 0 ? 'Ticket Médio Aumentou' : 'Ticket Médio Diminuiu',
            descricao: `O ticket médio ${variacao > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(variacao).toFixed(1)}% nas últimas vendas`,
            prioridade: Math.abs(variacao) > 25 ? 'alta' : 'media',
            data: new Date().toISOString(),
            lido: false,
            dados: { variacao, ticketMedioRecente, ticketMedioAnterior }
          })
        }
      }

      // Verificar metas atingidas
      const { data: metas, error: metasError } = await supabase
        .from('metas')
        .select('*')
        .eq('empresa_id', empresaAtual.id)
        .lte('inicio', new Date().toISOString())
        .gte('fim', new Date().toISOString())

      if (!metasError && metas) {
        for (const meta of metas) {
          const { data: vendasMeta } = await supabase
            .from('vendas')
            .select('total')
            .eq('empresa_id', empresaAtual.id)
            .gte('data_venda', meta.inicio)
            .lte('data_venda', meta.fim)

          const totalVendas = vendasMeta?.reduce((acc, v) => acc + v.total, 0) || 0
          const progresso = (totalVendas / meta.valor) * 100

          if (progresso >= 100) {
            alertasGerados.push({
              id: `meta_${meta.id}`,
              tipo: 'meta_atingida',
              titulo: 'Meta Atingida!',
              descricao: `Parabéns! A meta de ${meta.tipo} foi atingida com ${progresso.toFixed(1)}%`,
              prioridade: 'baixa',
              data: new Date().toISOString(),
              lido: false,
              dados: { meta, progresso }
            })
          }
        }
      }

      // Verificar produtos parados (sem vendas nos últimos 30 dias)
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - 30)

      const { data: produtosSemVenda, error: produtosSemVendaError } = await supabase
        .from('produtos')
        .select(`
          *,
          vendas!left (
            data_venda
          )
        `)
        .eq('empresa_id', empresaAtual.id)

      if (!produtosSemVendaError && produtosSemVenda) {
        produtosSemVenda.forEach(produto => {
          const temVendaRecente = produto.vendas?.some((venda: any) => 
            new Date(venda.data_venda) > dataLimite
          )

          if (!temVendaRecente && produto.quantidade_estoque > 0) {
            alertasGerados.push({
              id: `parado_${produto.id}`,
              tipo: 'produto_parado',
              titulo: 'Produto Parado',
              descricao: `${produto.nome} não teve vendas nos últimos 30 dias`,
              prioridade: 'media',
              data: new Date().toISOString(),
              lido: false,
              dados: { produto }
            })
          }
        })
      }

      setAlertas(alertasGerados)
    } catch (error) {
      console.error('Erro ao gerar alertas:', error)
      toast.error('Erro ao carregar alertas')
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLido = (alertaId: string) => {
    setAlertas(prev => prev.map(alerta => 
      alerta.id === alertaId ? { ...alerta, lido: true } : alerta
    ))
    toast.success('Alerta marcado como lido')
  }

  const removerAlerta = (alertaId: string) => {
    setAlertas(prev => prev.filter(alerta => alerta.id !== alertaId))
    toast.success('Alerta removido')
  }

  const marcarTodosComoLidos = () => {
    setAlertas(prev => prev.map(alerta => ({ ...alerta, lido: true })))
    toast.success('Todos os alertas foram marcados como lidos')
  }

  const getIconeAlerta = (tipo: string) => {
    switch (tipo) {
      case 'estoque_baixo':
        return <Package className="h-5 w-5" />
      case 'ticket_medio':
        return <DollarSign className="h-5 w-5" />
      case 'meta_atingida':
        return <TrendingUp className="h-5 w-5" />
      case 'produto_parado':
        return <TrendingDown className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getCorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'border-red-200 bg-red-50'
      case 'media':
        return 'border-yellow-200 bg-yellow-50'
      case 'baixa':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const alertasFiltrados = alertas.filter(alerta => {
    const filtroTipoOk = filtroTipo === 'todos' || alerta.tipo === filtroTipo
    const filtroLidoOk = filtroLido === 'todos' || 
      (filtroLido === 'lidos' && alerta.lido) ||
      (filtroLido === 'nao_lidos' && !alerta.lido)
    
    return filtroTipoOk && filtroLidoOk
  })

  const alertasNaoLidos = alertas.filter(a => !a.lido).length

  if (!empresaAtual) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma empresa selecionada
        </h2>
        <p className="text-gray-600">
          Selecione uma empresa para ver os alertas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Alertas Inteligentes</h1>
          <p className="text-gray-600 mt-2">
            Monitore automaticamente mudanças importantes no seu negócio
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={gerarAlertas} variant="outline">
            Atualizar Alertas
          </Button>
          {alertasNaoLidos > 0 && (
            <Button onClick={marcarTodosComoLidos}>
              Marcar Todos como Lidos
            </Button>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Alertas</p>
                <p className="text-2xl font-bold text-text">{alertas.length}</p>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Não Lidos</p>
                <p className="text-2xl font-bold text-text">{alertasNaoLidos}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alta Prioridade</p>
                <p className="text-2xl font-bold text-text">
                  {alertas.filter(a => a.prioridade === 'alta').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-text">
                  {alertas.filter(a => a.tipo === 'estoque_baixo').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Alerta
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="todos">Todos os tipos</option>
                <option value="estoque_baixo">Estoque Baixo</option>
                <option value="ticket_medio">Ticket Médio</option>
                <option value="meta_atingida">Meta Atingida</option>
                <option value="produto_parado">Produto Parado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filtroLido}
                onChange={(e) => setFiltroLido(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="todos">Todos</option>
                <option value="nao_lidos">Não lidos</option>
                <option value="lidos">Lidos</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas ({alertasFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : alertasFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">
                {alertas.length === 0 
                  ? 'Nenhum alerta no momento. Seu negócio está funcionando bem!' 
                  : 'Nenhum alerta corresponde aos filtros selecionados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertasFiltrados.map((alerta) => (
                <div 
                  key={alerta.id} 
                  className={`p-4 rounded-lg border-2 ${getCorPrioridade(alerta.prioridade)} ${
                    alerta.lido ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        alerta.prioridade === 'alta' ? 'bg-red-100 text-red-600' :
                        alerta.prioridade === 'media' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {getIconeAlerta(alerta.tipo)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-text">{alerta.titulo}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alerta.prioridade === 'alta' ? 'bg-red-100 text-red-800' :
                            alerta.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {alerta.prioridade}
                          </span>
                          {!alerta.lido && (
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{alerta.descricao}</p>
                        <p className="text-sm text-gray-500 mt-2 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(alerta.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!alerta.lido && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => marcarComoLido(alerta.id)}
                          className="flex items-center space-x-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Marcar como Lido</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removerAlerta(alerta.id)}
                        className="flex items-center space-x-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}