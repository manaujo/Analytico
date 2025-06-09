import React, { useState, useEffect } from 'react'
import { useEmpresa } from '../hooks/useEmpresa'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Meta {
  id: string
  tipo: string
  valor: number
  periodo: string
  inicio: string
  fim: string
}

export function Metas() {
  const { empresaAtual } = useEmpresa()
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editandoMeta, setEditandoMeta] = useState<Meta | null>(null)
  const [formData, setFormData] = useState({
    tipo: 'vendas',
    valor: '',
    periodo: 'mensal',
    inicio: '',
    fim: ''
  })

  useEffect(() => {
    if (empresaAtual) {
      carregarMetas()
    }
  }, [empresaAtual])

  const carregarMetas = async () => {
    if (!empresaAtual) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('empresa_id', empresaAtual.id)
        .order('inicio', { ascending: false })

      if (error) throw error
      setMetas(data || [])
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
      toast.error('Erro ao carregar metas')
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = (meta?: Meta) => {
    if (meta) {
      setEditandoMeta(meta)
      setFormData({
        tipo: meta.tipo,
        valor: meta.valor.toString(),
        periodo: meta.periodo,
        inicio: meta.inicio.split('T')[0],
        fim: meta.fim.split('T')[0]
      })
    } else {
      setEditandoMeta(null)
      setFormData({
        tipo: 'vendas',
        valor: '',
        periodo: 'mensal',
        inicio: '',
        fim: ''
      })
    }
    setShowModal(true)
  }

  const fecharModal = () => {
    setShowModal(false)
    setEditandoMeta(null)
    setFormData({
      tipo: 'vendas',
      valor: '',
      periodo: 'mensal',
      inicio: '',
      fim: ''
    })
  }

  const salvarMeta = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.valor || !formData.inicio || !formData.fim) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (new Date(formData.inicio) >= new Date(formData.fim)) {
      toast.error('A data de início deve ser anterior à data de fim')
      return
    }

    try {
      const metaData = {
        empresa_id: empresaAtual!.id,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        periodo: formData.periodo,
        inicio: new Date(formData.inicio).toISOString(),
        fim: new Date(formData.fim).toISOString()
      }

      if (editandoMeta) {
        const { error } = await supabase
          .from('metas')
          .update(metaData)
          .eq('id', editandoMeta.id)

        if (error) throw error
        toast.success('Meta atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('metas')
          .insert(metaData)

        if (error) throw error
        toast.success('Meta criada com sucesso!')
      }

      carregarMetas()
      fecharModal()
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
      toast.error('Erro ao salvar meta')
    }
  }

  const excluirMeta = async (metaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return

    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', metaId)

      if (error) throw error
      toast.success('Meta excluída com sucesso!')
      carregarMetas()
    } catch (error) {
      console.error('Erro ao excluir meta:', error)
      toast.error('Erro ao excluir meta')
    }
  }

  const calcularProgresso = async (meta: Meta) => {
    try {
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select('total')
        .eq('empresa_id', empresaAtual!.id)
        .gte('data_venda', meta.inicio)
        .lte('data_venda', meta.fim)

      if (error) throw error

      const totalVendas = vendas?.reduce((acc, venda) => acc + venda.total, 0) || 0
      return (totalVendas / meta.valor) * 100
    } catch (error) {
      console.error('Erro ao calcular progresso:', error)
      return 0
    }
  }

  if (!empresaAtual) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma empresa selecionada
        </h2>
        <p className="text-gray-600">
          Selecione uma empresa para gerenciar metas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Controle de Metas</h1>
          <p className="text-gray-600 mt-2">
            Defina e acompanhe suas metas de vendas
          </p>
        </div>
        <Button onClick={() => abrirModal()} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nova Meta</span>
        </Button>
      </div>

      {/* Lista de Metas */}
      <div className="grid gap-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : metas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma meta definida
              </h3>
              <p className="text-gray-600 mb-4">
                Crie sua primeira meta para começar a acompanhar seu progresso
              </p>
              <Button onClick={() => abrirModal()}>
                Criar Primera Meta
              </Button>
            </CardContent>
          </Card>
        ) : (
          metas.map((meta) => (
            <MetaCard 
              key={meta.id} 
              meta={meta} 
              onEdit={() => abrirModal(meta)}
              onDelete={() => excluirMeta(meta.id)}
              calcularProgresso={calcularProgresso}
            />
          ))
        )}
      </div>

      {/* Modal de Nova/Editar Meta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">
              {editandoMeta ? 'Editar Meta' : 'Nova Meta'}
            </h3>
            
            <form onSubmit={salvarMeta} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="vendas">Vendas</option>
                  <option value="lucro">Lucro</option>
                </select>
              </div>

              <Input
                label="Valor da Meta (R$)"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                placeholder="0.00"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  value={formData.periodo}
                  onChange={(e) => setFormData(prev => ({ ...prev, periodo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Data de Início"
                  type="date"
                  value={formData.inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, inicio: e.target.value }))}
                  required
                />
                <Input
                  label="Data de Fim"
                  type="date"
                  value={formData.fim}
                  onChange={(e) => setFormData(prev => ({ ...prev, fim: e.target.value }))}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button type="button" variant="outline" onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editandoMeta ? 'Atualizar' : 'Criar'} Meta
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

interface MetaCardProps {
  meta: Meta
  onEdit: () => void
  onDelete: () => void
  calcularProgresso: (meta: Meta) => Promise<number>
}

function MetaCard({ meta, onEdit, onDelete, calcularProgresso }: MetaCardProps) {
  const [progresso, setProgresso] = useState(0)

  useEffect(() => {
    calcularProgresso(meta).then(setProgresso)
  }, [meta])

  const isAtiva = new Date() >= new Date(meta.inicio) && new Date() <= new Date(meta.fim)
  const isVencida = new Date() > new Date(meta.fim)

  return (
    <Card className={`${isAtiva ? 'border-primary' : isVencida ? 'border-red-300' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center space-x-2">
              {meta.tipo === 'vendas' ? (
                <TrendingUp className="h-5 w-5 text-primary" />
              ) : (
                <DollarSign className="h-5 w-5 text-secondary" />
              )}
              <span>Meta de {meta.tipo}</span>
              {isAtiva && (
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                  Ativa
                </span>
              )}
              {isVencida && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  Vencida
                </span>
              )}
            </CardTitle>
            <p className="text-gray-600 text-sm mt-1">
              {meta.periodo} • {format(new Date(meta.inicio), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(meta.fim), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Progresso</span>
              <span className="text-sm font-medium text-gray-900">
                {progresso.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  progresso >= 100 ? 'bg-secondary' : 
                  progresso >= 75 ? 'bg-primary' : 
                  progresso >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(progresso, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Meta</p>
              <p className="text-lg font-bold text-text">
                R$ {meta.valor.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Alcançado</p>
              <p className="text-lg font-bold text-primary">
                R$ {((meta.valor * progresso) / 100).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}