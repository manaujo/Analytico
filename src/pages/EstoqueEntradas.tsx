import React, { useState, useEffect } from 'react'
import { useEmpresa } from '../hooks/useEmpresa'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { 
  Package, 
  Plus, 
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Produto {
  id: string
  nome: string
  quantidade_estoque: number
}

interface EntradaEstoque {
  id: string
  quantidade: number
  data_entrada: string
  observacoes: string
  produtos: {
    nome: string
  }
}

export function EstoqueEntradas() {
  const { empresaAtual } = useEmpresa()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [entradas, setEntradas] = useState<EntradaEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    produto_id: '',
    quantidade: '',
    observacoes: ''
  })

  useEffect(() => {
    if (empresaAtual) {
      carregarDados()
    }
  }, [empresaAtual])

  const carregarDados = async () => {
    if (!empresaAtual) return

    setLoading(true)
    try {
      // Carregar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome, quantidade_estoque')
        .eq('empresa_id', empresaAtual.id)
        .order('nome')

      if (produtosError) throw produtosError
      setProdutos(produtosData || [])

      // Carregar entradas
      const { data: entradasData, error: entradasError } = await supabase
        .from('entradas_estoque')
        .select(`
          id,
          quantidade,
          data_entrada,
          observacoes,
          produtos (
            nome
          )
        `)
        .eq('empresa_id', empresaAtual.id)
        .order('data_entrada', { ascending: false })
        .limit(50)

      if (entradasError) throw entradasError
      setEntradas(entradasData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const registrarEntrada = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.produto_id || !formData.quantidade) {
      toast.error('Produto e quantidade são obrigatórios')
      return
    }

    try {
      const quantidade = parseInt(formData.quantidade)
      
      // Registrar entrada
      const { error: entradaError } = await supabase
        .from('entradas_estoque')
        .insert({
          empresa_id: empresaAtual!.id,
          produto_id: formData.produto_id,
          quantidade,
          observacoes: formData.observacoes
        })

      if (entradaError) throw entradaError

      // Atualizar estoque do produto
      const produto = produtos.find(p => p.id === formData.produto_id)
      if (produto) {
        const novoEstoque = produto.quantidade_estoque + quantidade
        
        const { error: estoqueError } = await supabase
          .from('produtos')
          .update({ quantidade_estoque: novoEstoque })
          .eq('id', formData.produto_id)

        if (estoqueError) throw estoqueError
      }

      toast.success('Entrada registrada com sucesso!')
      setFormData({ produto_id: '', quantidade: '', observacoes: '' })
      setShowModal(false)
      carregarDados()
    } catch (error) {
      console.error('Erro ao registrar entrada:', error)
      toast.error('Erro ao registrar entrada')
    }
  }

  if (!empresaAtual) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma empresa selecionada
        </h2>
        <p className="text-gray-600">
          Selecione uma empresa para gerenciar entradas de estoque.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Entradas de Estoque</h1>
          <p className="text-gray-600 mt-2">
            Registre entradas de produtos no estoque
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nova Entrada</span>
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold text-text">{produtos.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entradas Hoje</p>
                <p className="text-2xl font-bold text-text">
                  {entradas.filter(e => 
                    new Date(e.data_entrada).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entradas</p>
                <p className="text-2xl font-bold text-text">{entradas.length}</p>
              </div>
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Entradas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Entradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : entradas.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma entrada registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Produto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Quantidade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {entradas.map((entrada) => (
                    <tr key={entrada.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-text">{entrada.produtos.nome}</td>
                      <td className="py-3 px-4 text-text">+{entrada.quantidade}</td>
                      <td className="py-3 px-4 text-text">
                        {format(new Date(entrada.data_entrada), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{entrada.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Nova Entrada */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">Nova Entrada de Estoque</h3>
            
            <form onSubmit={registrarEntrada} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto
                </label>
                <select
                  value={formData.produto_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, produto_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map(produto => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} (Estoque atual: {produto.quantidade_estoque})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Quantidade"
                type="number"
                min="1"
                value={formData.quantidade}
                onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
                placeholder="Quantidade a adicionar"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={3}
                  placeholder="Observações sobre a entrada..."
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Entrada
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}