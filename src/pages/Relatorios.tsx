import React, { useState, useEffect } from 'react'
import { useEmpresa } from '../hooks/useEmpresa'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { 
  FileText, 
  Download, 
  Calendar,
  Mail,
  Plus,
  Eye,
  Trash2,
  BarChart3
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Relatorio {
  id: string
  url_pdf: string
  periodo_referencia: string
  criado_em: string
}

export function Relatorios() {
  const { empresaAtual } = useEmpresa()
  const { user } = useAuth()
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [loading, setLoading] = useState(true)
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    periodo: 'mensal',
    enviarEmail: false,
    email: ''
  })

  useEffect(() => {
    if (empresaAtual) {
      carregarRelatorios()
    }
  }, [empresaAtual])

  const carregarRelatorios = async () => {
    if (!empresaAtual) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('relatorios')
        .select('*')
        .eq('empresa_id', empresaAtual.id)
        .order('criado_em', { ascending: false })

      if (error) throw error
      setRelatorios(data || [])
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
      toast.error('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }

  const gerarRelatorio = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!empresaAtual) return

    setGerandoRelatorio(true)
    try {
      const response = await fetch(`https://aybzimoorwpimtyzuepe.supabase.co/functions/v1/gerar-relatorio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaAtual.id,
          periodo: formData.periodo,
          email: formData.enviarEmail ? (formData.email || user?.email) : null
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        carregarRelatorios()
        setShowModal(false)
        setFormData({
          periodo: 'mensal',
          enviarEmail: false,
          email: ''
        })
      } else {
        throw new Error(result.error || 'Erro ao gerar relatório')
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório')
    } finally {
      setGerandoRelatorio(false)
    }
  }

  const excluirRelatorio = async (relatorioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) return

    try {
      const { error } = await supabase
        .from('relatorios')
        .delete()
        .eq('id', relatorioId)

      if (error) throw error
      toast.success('Relatório excluído com sucesso!')
      carregarRelatorios()
    } catch (error) {
      console.error('Erro ao excluir relatório:', error)
      toast.error('Erro ao excluir relatório')
    }
  }

  const baixarRelatorio = (relatorio: Relatorio) => {
    // Simular download do PDF
    toast.success('Download iniciado!')
    // Em uma implementação real, você faria o download do arquivo do storage
  }

  const visualizarRelatorio = (relatorio: Relatorio) => {
    // Simular visualização do PDF
    toast.info('Abrindo relatório...')
    // Em uma implementação real, você abriria o PDF em uma nova aba
  }

  if (!empresaAtual) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma empresa selecionada
        </h2>
        <p className="text-gray-600">
          Selecione uma empresa para gerar relatórios.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Gere e gerencie relatórios da {empresaAtual.nome}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Gerar Relatório</span>
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Relatórios</p>
                <p className="text-2xl font-bold text-text">{relatorios.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Último Relatório</p>
                <p className="text-2xl font-bold text-text">
                  {relatorios.length > 0 
                    ? format(new Date(relatorios[0].criado_em), 'dd/MM', { locale: ptBR })
                    : '--'
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Relatórios Mensais</p>
                <p className="text-2xl font-bold text-text">
                  {relatorios.filter(r => r.periodo_referencia === 'mensal').length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerados ({relatorios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : relatorios.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum relatório gerado ainda</p>
              <Button onClick={() => setShowModal(true)}>
                Gerar Primeiro Relatório
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {relatorios.map((relatorio) => (
                <div key={relatorio.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-light p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text">
                        Relatório {relatorio.periodo_referencia}
                      </p>
                      <p className="text-sm text-gray-600">
                        Gerado em {format(new Date(relatorio.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => visualizarRelatorio(relatorio)}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Ver</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => baixarRelatorio(relatorio)}
                      className="flex items-center space-x-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>Baixar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => excluirRelatorio(relatorio.id)}
                      className="flex items-center space-x-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Gerar Relatório */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">Gerar Novo Relatório</h3>
            
            <form onSubmit={gerarRelatorio} className="space-y-4">
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enviarEmail"
                  checked={formData.enviarEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, enviarEmail: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="enviarEmail" className="text-sm font-medium text-gray-700">
                  Enviar por e-mail
                </label>
              </div>

              {formData.enviarEmail && (
                <Input
                  label="E-mail (opcional)"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={user?.email || "seu@email.com"}
                />
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">O relatório incluirá:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Resumo de vendas do período</li>
                  <li>• Produtos mais vendidos</li>
                  <li>• Análise de margem de lucro</li>
                  <li>• Gráficos de tendências</li>
                  <li>• Sugestões de reposição</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  disabled={gerandoRelatorio}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={gerandoRelatorio}>
                  Gerar Relatório
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}