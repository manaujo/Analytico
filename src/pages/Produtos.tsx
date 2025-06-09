import React, { useState, useEffect } from 'react'
import { useEmpresa } from '../hooks/useEmpresa'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Produto {
  id: string
  nome: string
  categoria: string
  preco_custo: number
  preco_venda: number
  quantidade_estoque: number
  created_at: string
}

export function Produtos() {
  const { empresaAtual } = useEmpresa()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editandoProduto, setEditandoProduto] = useState<Produto | null>(null)
  const [filtros, setFiltros] = useState({
    busca: '',
    categoria: '',
    estoqueMinimo: ''
  })
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    preco_custo: '',
    preco_venda: '',
    quantidade_estoque: ''
  })

  useEffect(() => {
    if (empresaAtual) {
      carregarProdutos()
    }
  }, [empresaAtual])

  useEffect(() => {
    aplicarFiltros()
  }, [produtos, filtros])

  const carregarProdutos = async () => {
    if (!empresaAtual) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('empresa_id', empresaAtual.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let resultado = [...produtos]

    if (filtros.busca) {
      resultado = resultado.filter(produto => 
        produto.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        produto.categoria.toLowerCase().includes(filtros.busca.toLowerCase())
      )
    }

    if (filtros.categoria) {
      resultado = resultado.filter(produto => 
        produto.categoria.toLowerCase().includes(filtros.categoria.toLowerCase())
      )
    }

    if (filtros.estoqueMinimo) {
      const minimo = parseInt(filtros.estoqueMinimo)
      resultado = resultado.filter(produto => produto.quantidade_estoque <= minimo)
    }

    setProdutosFiltrados(resultado)
  }

  const abrirModal = (produto?: Produto) => {
    if (produto) {
      setEditandoProduto(produto)
      setFormData({
        nome: produto.nome,
        categoria: produto.categoria,
        preco_custo: produto.preco_custo.toString(),
        preco_venda: produto.preco_venda.toString(),
        quantidade_estoque: produto.quantidade_estoque.toString()
      })
    } else {
      setEditandoProduto(null)
      setFormData({
        nome: '',
        categoria: '',
        preco_custo: '',
        preco_venda: '',
        quantidade_estoque: ''
      })
    }
    setShowModal(true)
  }

  const fecharModal = () => {
    setShowModal(false)
    setEditandoProduto(null)
    setFormData({
      nome: '',
      categoria: '',
      preco_custo: '',
      preco_venda: '',
      quantidade_estoque: ''
    })
  }

  const salvarProduto = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome || !formData.preco_venda) {
      toast.error('Nome e preço de venda são obrigatórios')
      return
    }

    try {
      const produtoData = {
        empresa_id: empresaAtual!.id,
        nome: formData.nome,
        categoria: formData.categoria || 'Geral',
        preco_custo: parseFloat(formData.preco_custo) || 0,
        preco_venda: parseFloat(formData.preco_venda),
        quantidade_estoque: parseInt(formData.quantidade_estoque) || 0
      }

      if (editandoProduto) {
        const { error } = await supabase
          .from('produtos')
          .update(produtoData)
          .eq('id', editandoProduto.id)

        if (error) throw error
        toast.success('Produto atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert(produtoData)

        if (error) throw error
        toast.success('Produto criado com sucesso!')
      }

      carregarProdutos()
      fecharModal()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      toast.error('Erro ao salvar produto')
    }
  }

  const excluirProduto = async (produtoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produtoId)

      if (error) throw error
      toast.success('Produto excluído com sucesso!')
      carregarProdutos()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir produto')
    }
  }

  const calcularMargem = (precoCusto: number, precoVenda: number) => {
    if (precoCusto === 0) return 0
    return ((precoVenda - precoCusto) / precoVenda) * 100
  }

  const categorias = [...new Set(produtos.map(p => p.categoria))].filter(Boolean)

  if (!empresaAtual) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma empresa selecionada
        </h2>
        <p className="text-gray-600">
          Selecione uma empresa para gerenciar produtos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Produtos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie o catálogo de produtos da {empresaAtual.nome}
          </p>
        </div>
        <Button onClick={() => abrirModal()} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Novo Produto</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar produto..."
              value={filtros.busca}
              onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
            />
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
            <Input
              placeholder="Estoque mínimo"
              type="number"
              value={filtros.estoqueMinimo}
              onChange={(e) => setFiltros(prev => ({ ...prev, estoqueMinimo: e.target.value }))}
            />
            <Button 
              variant="outline" 
              onClick={() => setFiltros({ busca: '', categoria: '', estoqueMinimo: '' })}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold text-text">{produtosFiltrados.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-text">
                  {produtosFiltrados.filter(p => p.quantidade_estoque < 10).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total Estoque</p>
                <p className="text-2xl font-bold text-text">
                  R$ {produtosFiltrados.reduce((acc, p) => acc + (p.preco_venda * p.quantidade_estoque), 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Margem Média</p>
                <p className="text-2xl font-bold text-text">
                  {produtosFiltrados.length > 0 
                    ? (produtosFiltrados.reduce((acc, p) => acc + calcularMargem(p.preco_custo, p.preco_venda), 0) / produtosFiltrados.length).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos ({produtosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
              <Button onClick={() => abrirModal()} className="mt-4">
                Criar Primeiro Produto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Produto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Preço Custo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Preço Venda</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Margem</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Estoque</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((produto) => (
                    <tr key={produto.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-text">{produto.nome}</p>
                          <p className="text-sm text-gray-500">
                            Criado em {format(new Date(produto.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text">{produto.categoria}</td>
                      <td className="py-3 px-4 text-text">R$ {produto.preco_custo.toFixed(2)}</td>
                      <td className="py-3 px-4 text-text">R$ {produto.preco_venda.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          calcularMargem(produto.preco_custo, produto.preco_venda) > 30 
                            ? 'text-secondary' 
                            : calcularMargem(produto.preco_custo, produto.preco_venda) > 15 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                        }`}>
                          {calcularMargem(produto.preco_custo, produto.preco_venda).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          produto.quantidade_estoque < 10 ? 'text-red-600' : 'text-text'
                        }`}>
                          {produto.quantidade_estoque}
                        </span>
                        {produto.quantidade_estoque < 10 && (
                          <AlertTriangle className="inline h-4 w-4 text-orange-500 ml-1" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModal(produto)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => excluirProduto(produto.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Novo/Editar Produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">
              {editandoProduto ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            
            <form onSubmit={salvarProduto} className="space-y-4">
              <Input
                label="Nome do Produto"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Produto A"
                required
              />

              <Input
                label="Categoria"
                value={formData.categoria}
                onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                placeholder="Ex: Eletrônicos"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Preço de Custo (R$)"
                  type="number"
                  step="0.01"
                  value={formData.preco_custo}
                  onChange={(e) => setFormData(prev => ({ ...prev, preco_custo: e.target.value }))}
                  placeholder="0.00"
                />
                <Input
                  label="Preço de Venda (R$)"
                  type="number"
                  step="0.01"
                  value={formData.preco_venda}
                  onChange={(e) => setFormData(prev => ({ ...prev, preco_venda: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <Input
                label="Quantidade em Estoque"
                type="number"
                value={formData.quantidade_estoque}
                onChange={(e) => setFormData(prev => ({ ...prev, quantidade_estoque: e.target.value }))}
                placeholder="0"
              />

              <div className="flex justify-end space-x-3 mt-6">
                <Button type="button" variant="outline" onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editandoProduto ? 'Atualizar' : 'Criar'} Produto
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}