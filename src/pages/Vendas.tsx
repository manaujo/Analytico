import React, { useState, useEffect } from 'react'
import { useEmpresa } from '../hooks/useEmpresa'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Calendar,
  Package,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

interface Venda {
  id: string
  quantidade: number
  preco_unitario: number
  total: number
  data_venda: string
  produtos: {
    nome: string
    categoria: string
  }
}

interface VendaDetalhes extends Venda {
  empresa_id: string
}

export function Vendas() {
  const { empresaAtual } = useEmpresa()
  const [vendas, setVendas] = useState<Venda[]>([])
  const [vendasFiltradas, setVendasFiltradas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    produto: ''
  })
  const [produtos, setProdutos] = useState<any[]>([])
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaDetalhes | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (empresaAtual) {
      carregarVendas()
      carregarProdutos()
    }
  }, [empresaAtual])

  useEffect(() => {
    aplicarFiltros()
  }, [vendas, filtros])

  const carregarVendas = async () => {
    if (!empresaAtual) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          id,
          quantidade,
          preco_unitario,
          total,
          data_venda,
          produtos (
            nome,
            categoria
          )
        `)
        .eq('empresa_id', empresaAtual.id)
        .order('data_venda', { ascending: false })

      if (error) throw error
      setVendas(data || [])
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
      toast.error('Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  const carregarProdutos = async () => {
    if (!empresaAtual) return

    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome')
        .eq('empresa_id', empresaAtual.id)
        .order('nome')

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const aplicarFiltros = () => {
    let resultado = [...vendas]

    if (filtros.dataInicio) {
      resultado = resultado.filter(venda => 
        new Date(venda.data_venda) >= new Date(filtros.dataInicio)
      )
    }

    if (filtros.dataFim) {
      resultado = resultado.filter(venda => 
        new Date(venda.data_venda) <= new Date(filtros.dataFim)
      )
    }

    if (filtros.produto) {
      resultado = resultado.filter(venda => 
        venda.produtos.nome.toLowerCase().includes(filtros.produto.toLowerCase())
      )
    }

    setVendasFiltradas(resultado)
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('Relatório de Vendas', 20, 20)
    
    doc.setFontSize(12)
    doc.text(`Empresa: ${empresaAtual?.nome}`, 20, 35)
    doc.text(`Período: ${filtros.dataInicio || 'Início'} até ${filtros.dataFim || 'Hoje'}`, 20, 45)
    doc.text(`Total de vendas: ${vendasFiltradas.length}`, 20, 55)
    
    let y = 75
    doc.setFontSize(10)
    doc.text('Produto', 20, y)
    doc.text('Qtd', 80, y)
    doc.text('Preço Unit.', 110, y)
    doc.text('Total', 150, y)
    doc.text('Data', 180, y)
    
    y += 10
    vendasFiltradas.forEach((venda) => {
      if (y > 280) {
        doc.addPage()
        y = 20
      }
      
      doc.text(venda.produtos.nome.substring(0, 20), 20, y)
      doc.text(venda.quantidade.toString(), 80, y)
      doc.text(`R$ ${venda.preco_unitario.toFixed(2)}`, 110, y)
      doc.text(`R$ ${venda.total.toFixed(2)}`, 150, y)
      doc.text(format(new Date(venda.data_venda), 'dd/MM/yyyy', { locale: ptBR }), 180, y)
      y += 8
    })
    
    const totalGeral = vendasFiltradas.reduce((acc, venda) => acc + venda.total, 0)
    y += 10
    doc.setFontSize(12)
    doc.text(`Total Geral: R$ ${totalGeral.toFixed(2)}`, 150, y)
    
    doc.save(`vendas-${empresaAtual?.nome}-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF exportado com sucesso!')
  }

  const abrirDetalhes = async (vendaId: string) => {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          produtos (
            nome,
            categoria,
            preco_custo
          )
        `)
        .eq('id', vendaId)
        .single()

      if (error) throw error
      setVendaSelecionada(data)
      setShowModal(true)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      toast.error('Erro ao carregar detalhes da venda')
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
          Selecione uma empresa para ver as vendas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Histórico de Vendas</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe todas as vendas da {empresaAtual.nome}
          </p>
        </div>
        <Button onClick={exportarPDF} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Exportar PDF</span>
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
              label="Data Início"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
            />
            <Input
              label="Data Fim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
            />
            <Input
              label="Produto"
              placeholder="Buscar produto..."
              value={filtros.produto}
              onChange={(e) => setFiltros(prev => ({ ...prev, produto: e.target.value }))}
            />
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFiltros({ dataInicio: '', dataFim: '', produto: '' })}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-text">{vendasFiltradas.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento</p>
                <p className="text-2xl font-bold text-text">
                  R$ {vendasFiltradas.reduce((acc, venda) => acc + venda.total, 0).toLocaleString('pt-BR')}
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
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-text">
                  R$ {vendasFiltradas.length > 0 
                    ? (vendasFiltradas.reduce((acc, venda) => acc + venda.total, 0) / vendasFiltradas.length).toFixed(2)
                    : '0.00'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas ({vendasFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : vendasFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma venda encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Produto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Quantidade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Preço Unitário</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasFiltradas.map((venda) => (
                    <tr key={venda.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-text">{venda.produtos.nome}</p>
                          <p className="text-sm text-gray-500">{venda.produtos.categoria}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text">{venda.quantidade}</td>
                      <td className="py-3 px-4 text-text">R$ {venda.preco_unitario.toFixed(2)}</td>
                      <td className="py-3 px-4 font-medium text-text">R$ {venda.total.toFixed(2)}</td>
                      <td className="py-3 px-4 text-text">
                        {format(new Date(venda.data_venda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirDetalhes(venda.id)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Ver</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {showModal && vendaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">Detalhes da Venda</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Produto</label>
                <p className="text-text">{vendaSelecionada.produtos.nome}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Categoria</label>
                <p className="text-text">{vendaSelecionada.produtos.categoria}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantidade</label>
                  <p className="text-text">{vendaSelecionada.quantidade}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Preço Unitário</label>
                  <p className="text-text">R$ {vendaSelecionada.preco_unitario.toFixed(2)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Total</label>
                <p className="text-xl font-bold text-primary">R$ {vendaSelecionada.total.toFixed(2)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Data da Venda</label>
                <p className="text-text">
                  {format(new Date(vendaSelecionada.data_venda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}