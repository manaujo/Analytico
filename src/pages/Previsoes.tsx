import React, { useState, useEffect } from 'react'
import { useEmpresa } from '../hooks/useEmpresa'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { 
  TrendingUp, 
  BarChart3, 
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Tooltip, Legend } from 'recharts'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Previsao {
  id: string
  data_previsao: string
  valor_estimado: number
  tipo: string
  metodo: string
  produtos?: {
    nome: string
  }
}

interface DadosGrafico {
  data: string
  vendas_reais?: number
  previsao: number
}

export function Previsoes() {
  const { empresaAtual } = useEmpresa()
  const [previsoes, setPrevisoes] = useState<Previsao[]>([])
  const [dadosGrafico, setDadosGrafico] = useState<DadosGrafico[]>([])
  const [loading, setLoading] = useState(true)
  const [gerandoPrevisoes, setGerandoPrevisoes] = useState(false)
  const [sugestoesReposicao, setSugestoesReposicao] = useState<any[]>([])

  useEffect(() => {
    if (empresaAtual) {
      carregarPrevisoes()
      gerarPrevisoes()
    }
  }, [empresaAtual])

  const carregarPrevisoes = async () => {
    if (!empresaAtual) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('previsoes')
        .select(`
          *,
          produtos (
            nome
          )
        `)
        .eq('empresa_id', empresaAtual.id)
        .eq('tipo', 'vendas')
        .gte('data_previsao', new Date().toISOString().split('T')[0])
        .order('data_previsao')

      if (error) throw error
      setPrevisoes(data || [])

      // Preparar dados para o gráfico
      const dadosChart = data?.map(previsao => ({
        data: format(new Date(previsao.data_previsao), 'dd/MM', { locale: ptBR }),
        previsao: previsao.valor_estimado
      })) || []

      setDadosGrafico(dadosChart)
    } catch (error) {
      console.error('Erro ao carregar previsões:', error)
      toast.error('Erro ao carregar previsões')
    } finally {
      setLoading(false)
    }
  }

  const gerarPrevisoes = async () => {
    if (!empresaAtual) return

    setGerandoPrevisoes(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/previsao-vendas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaAtual.id
        })
      })

      const result = await response.json()

      if (result.success) {
        // Salvar previsões no banco
        const previsoesPara7Dias = result.previsao_vendas.map((previsao: any) => ({
          empresa_id: empresaAtual.id,
          data_previsao: previsao.data,
          valor_estimado: previsao.valor_previsto,
          tipo: 'vendas',
          metodo: 'media_movel'
        }))

        // Limpar previsões antigas
        await supabase
          .from('previsoes')
          .delete()
          .eq('empresa_id', empresaAtual.id)
          .eq('tipo', 'vendas')

        // Inserir novas previsões
        const { error } = await supabase
          .from('previsoes')
          .insert(previsoesPara7Dias)

        if (error) throw error

        setSugestoesReposicao(result.sugestoes_reposicao || [])
        toast.success('Previsões atualizadas com sucesso!')
        carregarPrevisoes()
      } else {
        throw new Error(result.error || 'Erro ao gerar previsões')
      }
    } catch (error) {
      console.error('Erro ao gerar previsões:', error)
      toast.error('Erro ao gerar previsões')
    } finally {
      setGerandoPrevisoes(false)
    }
  }

  const calcularTotalPrevisao = () => {
    return previsoes.reduce((acc, previsao) => acc + previsao.valor_estimado, 0)
  }

  if (!empresaAtual) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma empresa selecionada
        </h2>
        <p className="text-gray-600">
          Selecione uma empresa para ver previsões.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Previsões de Vendas</h1>
          <p className="text-gray-600 mt-2">
            Análise preditiva baseada em dados históricos
          </p>
        </div>
        <Button 
          onClick={gerarPrevisoes} 
          loading={gerandoPrevisoes}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Atualizar Previsões</span>
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Previsão 7 Dias</p>
                <p className="text-2xl font-bold text-text">
                  R$ {calcularTotalPrevisao().toLocaleString('pt-BR')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produtos p/ Repor</p>
                <p className="text-2xl font-bold text-text">{sugestoesReposicao.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Última Atualização</p>
                <p className="text-2xl font-bold text-text">
                  {format(new Date(), 'dd/MM', { locale: ptBR })}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Previsões */}
      <Card>
        <CardHeader>
          <CardTitle>Previsão de Vendas - Próximos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : dadosGrafico.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Dados insuficientes para gerar previsões</p>
              <p className="text-sm text-gray-400 mt-2">
                Registre mais vendas para obter previsões precisas
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Previsão']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="previsao" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  name="Previsão de Vendas"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Sugestões de Reposição */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <span>Sugestões de Reposição</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sugestoesReposicao.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">Todos os produtos estão com estoque adequado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sugestoesReposicao.map((sugestao, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-text">{sugestao.produto}</p>
                    <p className="text-sm text-gray-600">
                      Estoque atual: {sugestao.estoque_atual} | 
                      Média diária: {sugestao.media_vendas_dia} | 
                      Dias restantes: {sugestao.dias_restantes}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      sugestao.dias_restantes <= 3 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {sugestao.dias_restantes <= 3 ? 'Urgente' : 'Atenção'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes das Previsões */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes das Previsões</CardTitle>
        </CardHeader>
        <CardContent>
          {previsoes.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma previsão disponível</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Valor Previsto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Método</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {previsoes.map((previsao) => (
                    <tr key={previsao.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-text">
                        {format(new Date(previsao.data_previsao), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 font-medium text-text">
                        R$ {previsao.valor_estimado.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-text capitalize">
                        {previsao.metodo.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-text capitalize">{previsao.tipo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}