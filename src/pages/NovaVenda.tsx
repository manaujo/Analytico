import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmpresa } from '../hooks/useEmpresa'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { 
  ShoppingCart, 
  Package,
  Plus,
  Minus,
  Trash2,
  Calculator
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Produto {
  id: string
  nome: string
  preco_venda: number
  quantidade_estoque: number
}

interface ItemVenda {
  produto: Produto
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export function NovaVenda() {
  const navigate = useNavigate()
  const { empresaAtual } = useEmpresa()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [quantidadeItem, setQuantidadeItem] = useState(1)
  const [precoPersonalizado, setPrecoPersonalizado] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (empresaAtual) {
      carregarProdutos()
    }
  }, [empresaAtual])

  const carregarProdutos = async () => {
    if (!empresaAtual) return

    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, preco_venda, quantidade_estoque')
        .eq('empresa_id', empresaAtual.id)
        .gt('quantidade_estoque', 0)
        .order('nome')

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast.error('Erro ao carregar produtos')
    }
  }

  const adicionarItem = () => {
    if (!produtoSelecionado) {
      toast.error('Selecione um produto')
      return
    }

    const produto = produtos.find(p => p.id === produtoSelecionado)
    if (!produto) return

    if (quantidadeItem > produto.quantidade_estoque) {
      toast.error('Quantidade maior que o estoque disponível')
      return
    }

    const precoUnitario = precoPersonalizado 
      ? parseFloat(precoPersonalizado) 
      : produto.preco_venda

    if (precoUnitario <= 0) {
      toast.error('Preço deve ser maior que zero')
      return
    }

    const itemExistente = itensVenda.find(item => item.produto.id === produto.id)
    
    if (itemExistente) {
      const novaQuantidade = itemExistente.quantidade + quantidadeItem
      if (novaQuantidade > produto.quantidade_estoque) {
        toast.error('Quantidade total maior que o estoque disponível')
        return
      }
      
      setItensVenda(prev => prev.map(item => 
        item.produto.id === produto.id 
          ? {
              ...item,
              quantidade: novaQuantidade,
              subtotal: novaQuantidade * item.preco_unitario
            }
          : item
      ))
    } else {
      const novoItem: ItemVenda = {
        produto,
        quantidade: quantidadeItem,
        preco_unitario: precoUnitario,
        subtotal: quantidadeItem * precoUnitario
      }
      setItensVenda(prev => [...prev, novoItem])
    }

    // Resetar formulário
    setProdutoSelecionado('')
    setQuantidadeItem(1)
    setPrecoPersonalizado('')
    toast.success('Item adicionado à venda')
  }

  const removerItem = (produtoId: string) => {
    setItensVenda(prev => prev.filter(item => item.produto.id !== produtoId))
    toast.success('Item removido da venda')
  }

  const alterarQuantidade = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItem(produtoId)
      return
    }

    const produto = produtos.find(p => p.id === produtoId)
    if (!produto) return

    if (novaQuantidade > produto.quantidade_estoque) {
      toast.error('Quantidade maior que o estoque disponível')
      return
    }

    setItensVenda(prev => prev.map(item => 
      item.produto.id === produtoId 
        ? {
            ...item,
            quantidade: novaQuantidade,
            subtotal: novaQuantidade * item.preco_unitario
          }
        : item
    ))
  }

  const calcularTotal = () => {
    return itensVenda.reduce((total, item) => total + item.subtotal, 0)
  }

  const finalizarVenda = async () => {
    if (itensVenda.length === 0) {
      toast.error('Adicione pelo menos um item à venda')
      return
    }

    setLoading(true)
    try {
      // Inserir vendas
      const vendasData = itensVenda.map(item => ({
        empresa_id: empresaAtual!.id,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        data_venda: new Date(dataVenda).toISOString(),
        preco_unitario: item.preco_unitario,
        total: item.subtotal
      }))

      const { error: vendasError } = await supabase
        .from('vendas')
        .insert(vendasData)

      if (vendasError) throw vendasError

      // Atualizar estoque dos produtos
      for (const item of itensVenda) {
        const novoEstoque = item.produto.quantidade_estoque - item.quantidade
        
        const { error: estoqueError } = await supabase
          .from('produtos')
          .update({ quantidade_estoque: novoEstoque })
          .eq('id', item.produto.id)

        if (estoqueError) throw estoqueError
      }

      toast.success('Venda registrada com sucesso!')
      navigate('/vendas')
    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      toast.error('Erro ao registrar venda')
    } finally {
      setLoading(false)
    }
  }

  if (!empresaAtual) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma empresa selecionada
        </h2>
        <p className="text-gray-600">
          Selecione uma empresa para registrar vendas.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text">Nova Venda</h1>
        <p className="text-gray-600 mt-2">
          Registre uma nova venda para {empresaAtual.nome}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Adição */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Adicionar Produto</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Venda
              </label>
              <Input
                type="date"
                value={dataVenda}
                onChange={(e) => setDataVenda(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produto
              </label>
              <select
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Selecione um produto</option>
                {produtos.map(produto => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} - R$ {produto.preco_venda.toFixed(2)} (Estoque: {produto.quantidade_estoque})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantidade"
                type="number"
                min="1"
                value={quantidadeItem}
                onChange={(e) => setQuantidadeItem(parseInt(e.target.value) || 1)}
              />
              <Input
                label="Preço Personalizado (opcional)"
                type="number"
                step="0.01"
                value={precoPersonalizado}
                onChange={(e) => setPrecoPersonalizado(e.target.value)}
                placeholder="Deixe vazio para usar preço padrão"
              />
            </div>

            <Button 
              onClick={adicionarItem} 
              className="w-full flex items-center justify-center space-x-2"
              disabled={!produtoSelecionado}
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar à Venda</span>
            </Button>
          </CardContent>
        </Card>

        {/* Resumo da Venda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Resumo da Venda</span>
              </div>
              <span className="text-lg font-bold text-primary">
                R$ {calcularTotal().toFixed(2)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {itensVenda.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum item adicionado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itensVenda.map((item) => (
                  <div key={item.produto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-text">{item.produto.nome}</p>
                      <p className="text-sm text-gray-600">
                        R$ {item.preco_unitario.toFixed(2)} x {item.quantidade}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantidade}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removerItem(item.produto.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-text">R$ {item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">R$ {calcularTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/vendas')}
        >
          Cancelar
        </Button>
        <Button 
          onClick={finalizarVenda}
          loading={loading}
          disabled={itensVenda.length === 0}
          className="flex items-center space-x-2"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Finalizar Venda</span>
        </Button>
      </div>
    </div>
  )
}