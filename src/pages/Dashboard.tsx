import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useEmpresa } from '../hooks/useEmpresa'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Target,
  Plus
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface DashboardData {
  vendasTotais: number
  ticketMedio: number
  produtosMaisLucrativos: any[]
  produtosMenosLucrativos: any[]
  produtosEncalhados: any[]
  tendenciaVendas: any[]
  metasProgresso: any[]
}

export function Dashboard() {
  const { empresaAtual } = useEmpresa()
  const [data, setData] = useState<DashboardData>({
    vendasTotais: 0,
    ticketMedio: 0,
    produtosMaisLucrativos: [],
    produtosMenosLucrativos: [],
    produtosEncalhados: [],
    tendenciaVendas: [],
    metasProgresso: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (empresaAtual) {
      carregarDadosDashboard()
    }
  }, [empresaAtual])

  const carregarDadosDashboard = async () => {
    if (!empresaAtual) return

    setLoading(true)
    try {
      // Carregar vendas totais e ticket médio
      const { data: vendas } = await supabase
        .from('vendas')
        .select('total, quantidade')
        .eq('empresa_id', empresaAtual.id)

      const vendasTotais = vendas?.reduce((acc, venda) => acc + venda.total, 0) || 0
      const ticketMedio = vendas && vendas.length > 0 
        ? vendasTotais / vendas.length 
        : 0

      // Carregar produtos mais lucrativos (baseado na margem)
      const { data: produtos } = await supabase
        .from('produtos')
        .select('*, vendas(*)')
        .eq('empresa_id', empresaAtual.id)

      const produtosComLucro = produtos?.map(produto => ({
        ...produto,
        margem: produto.preco_venda - produto.preco_custo,
        totalVendido: produto.vendas?.reduce((acc: number, venda: any) => acc + (venda.total || 0), 0) || 0
      })) || []

      const produtosMaisLucrativos = produtosComLucro
        .sort((a, b) => b.margem - a.margem)
        .slice(0, 5)

      const produtosMenosLucrativos = produtosComLucro
        .sort((a, b) => a.margem - b.margem)
        .slice(0, 5)

      // Produtos encalhados (baixo estoque ou sem vendas recentes)
      const produtosEncalhados = produtos?.filter(produto => 
        produto.quantidade_estoque < 10 || 
        !produto.vendas || 
        produto.vendas.length === 0
      ).slice(0, 5) || []

      // Tendência de vendas (últimos 7 dias)
      const diasAtras = 7
      const tendenciaVendas = Array.from({ length: diasAtras }, (_, i) => {
        const data = new Date()
        data.setDate(data.getDate() - (diasAtras - 1 - i))
        return {
          data: data.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
          vendas: Math.floor(Math.random() * 1000) + 500 // Dados simulados
        }
      })

      // Carregar metas
      const { data: metas } = await supabase
        .from('metas')
        .select('*')
        .eq('empresa_id', empresaAtual.id)

      const metasProgresso = metas?.map(meta => ({
        ...meta,
        progresso: Math.min((vendasTotais / meta.valor) * 100, 100)
      })) || []

      setData({
        vendasTotais,
        ticketMedio,
        produtosMaisLucrativos,
        produtosMenosLucrativos,
        produtosEncalhados,
        tendenciaVendas,
        metasProgresso
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!empresaAtual) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma empresa selecionada
        </h2>
        <p className="text-gray-600 mb-4">
          Você precisa criar ou selecionar uma empresa para ver o dashboard.
        </p>
        <Link to="/empresas/nova">
          <Button>Criar Primera Empresa</Button>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Visão geral do desempenho da {empresaAtual.nome}
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas Totais</p>
                <p className="text-2xl font-bold text-text">
                  R$ {data.vendasTotais.toLocaleString('pt-BR')}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-secondary font-medium">+12.5%</span>
                </div>
              </div>
              <div className="bg-primary-light p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-text">
                  R$ {data.ticketMedio.toFixed(2)}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-secondary font-medium">+8.2%</span>
                </div>
              </div>
              <div className="bg-primary-light p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
                <p className="text-2xl font-bold text-text">
                  {data.produtosMaisLucrativos.length + data.produtosMenosLucrativos.length}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500 font-medium">-2.1%</span>
                </div>
              </div>
              <div className="bg-primary-light p-3 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas</p>
                <p className="text-2xl font-bold text-text">{data.produtosEncalhados.length}</p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-500 font-medium">Atenção</span>
                </div>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.tendenciaVendas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Line 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Lucrativos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.produtosMaisLucrativos.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Bar dataKey="margem" fill="#4ADE80" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Listas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Produtos Encalhados
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.produtosEncalhados.length > 0 ? (
                data.produtosEncalhados.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{produto.nome}</p>
                      <p className="text-xs text-gray-600">
                        Estoque: {produto.quantidade_estoque}
                      </p>
                    </div>
                    <Link to="/produtos">
                      <Button size="sm" variant="outline">
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum produto encalhado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.metasProgresso.length > 0 ? (
                data.metasProgresso.map((meta) => (
                  <div key={meta.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{meta.tipo}</span>
                      <span className="text-sm text-gray-600">
                        {meta.progresso.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(meta.progresso, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      Meta: R$ {meta.valor.toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Nenhuma meta definida</p>
                  <Link to="/metas">
                    <Button size="sm" className="mt-2">
                      Criar Meta
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/produtos">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Gerenciar Produtos
                </Button>
              </Link>
              <Link to="/vendas/nova">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Venda
                </Button>
              </Link>
              <Link to="/upload">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Importar Dados
                </Button>
              </Link>
              <Link to="/relatorios">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Ver Relatórios
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}