import React, { useState } from 'react'
import { useEmpresa } from '../hooks/useEmpresa'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Download,
  Package,
  Loader2
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface ProdutoImportado {
  produto_nome?: string
  nome?: string
  quantidade?: number
  preco?: number
  preco_venda?: number
  categoria?: string
  preco_custo?: number
}

interface ResultadoImportacao {
  sucessos: number
  erros: string[]
  produtos: any[]
}

export function ImportarDados() {
  const { empresaAtual } = useEmpresa()
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)

  const processarArquivo = async (file: File) => {
    if (!empresaAtual) {
      toast.error('Nenhuma empresa selecionada')
      return
    }

    setLoading(true)
    setResultado(null)

    try {
      let dados: any[] = []

      // Processar arquivo baseado na extensão
      if (file.name.endsWith('.csv')) {
        const texto = await file.text()
        const resultado = Papa.parse(texto, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.toLowerCase().trim()
        })
        dados = resultado.data
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // Converter para formato com headers
        if (jsonData.length > 0) {
          const headers = (jsonData[0] as string[]).map(h => h.toLowerCase().trim())
          dados = (jsonData.slice(1) as any[][]).map(row => {
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = row[index]
            })
            return obj
          })
        }
      } else {
        throw new Error('Formato de arquivo não suportado. Use CSV, XLS ou XLSX.')
      }

      if (dados.length === 0) {
        throw new Error('Arquivo vazio ou sem dados válidos')
      }

      // Processar e validar dados
      const produtosParaInserir: any[] = []
      const erros: string[] = []

      dados.forEach((linha: ProdutoImportado, index: number) => {
        const numeroLinha = index + 2 // +2 porque começamos da linha 2 (header é linha 1)
        
        try {
          // Obter nome do produto
          const nome = linha.produto_nome || linha.nome
          if (!nome || nome.toString().trim() === '') {
            erros.push(`Linha ${numeroLinha}: Nome do produto é obrigatório`)
            return
          }

          // Obter preço de venda
          const precoVenda = parseFloat(linha.preco?.toString() || linha.preco_venda?.toString() || '0')
          if (precoVenda <= 0) {
            erros.push(`Linha ${numeroLinha}: Preço de venda deve ser maior que zero`)
            return
          }

          // Obter quantidade
          const quantidade = parseInt(linha.quantidade?.toString() || '0')
          if (quantidade < 0) {
            erros.push(`Linha ${numeroLinha}: Quantidade não pode ser negativa`)
            return
          }

          // Calcular preço de custo (70% do preço de venda se não informado)
          const precoCusto = linha.preco_custo 
            ? parseFloat(linha.preco_custo.toString())
            : precoVenda * 0.7

          // Categoria padrão
          const categoria = linha.categoria?.toString().trim() || 'Importado'

          produtosParaInserir.push({
            empresa_id: empresaAtual.id,
            nome: nome.toString().trim(),
            categoria,
            preco_custo: precoCusto,
            preco_venda: precoVenda,
            quantidade_estoque: quantidade
          })
        } catch (error) {
          erros.push(`Linha ${numeroLinha}: Erro ao processar dados - ${error}`)
        }
      })

      if (produtosParaInserir.length === 0) {
        throw new Error('Nenhum produto válido encontrado no arquivo')
      }

      // Inserir produtos no Supabase
      const { data: produtosInseridos, error } = await supabase
        .from('produtos')
        .insert(produtosParaInserir)
        .select()

      if (error) {
        throw new Error(`Erro ao inserir produtos: ${error.message}`)
      }

      const resultadoFinal: ResultadoImportacao = {
        sucessos: produtosInseridos?.length || 0,
        erros,
        produtos: produtosInseridos || []
      }

      setResultado(resultadoFinal)

      if (resultadoFinal.sucessos > 0) {
        toast.success(`${resultadoFinal.sucessos} produtos importados com sucesso!`)
      }

      if (resultadoFinal.erros.length > 0) {
        toast.error(`${resultadoFinal.erros.length} erros encontrados. Verifique os detalhes.`)
      }

    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      toast.error(error instanceof Error ? error.message : 'Erro desconhecido ao processar arquivo')
    } finally {
      setLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processarArquivo(acceptedFiles[0])
      }
    },
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: loading
  })

  const baixarTemplate = () => {
    const csvContent = 'produto_nome,quantidade,preco\nProduto Exemplo,10,25.50\nOutro Produto,5,15.00\nTerceiro Produto,20,30.00'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-produtos.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Template baixado com sucesso!')
  }

  if (!empresaAtual) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma empresa selecionada
        </h2>
        <p className="text-gray-600">
          Selecione uma empresa para importar produtos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Importar Produtos</h1>
          <p className="text-gray-600 mt-2">
            Importe produtos em lote via CSV ou Excel
          </p>
        </div>
        <Button 
          onClick={baixarTemplate} 
          variant="outline" 
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Baixar Template</span>
        </Button>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como importar seus produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>1. Prepare seu arquivo CSV ou Excel com as seguintes colunas:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>produto_nome:</strong> Nome do produto (obrigatório)</li>
              <li><strong>quantidade:</strong> Quantidade em estoque (obrigatório)</li>
              <li><strong>preco:</strong> Preço de venda (obrigatório, use ponto como separador decimal)</li>
              <li><strong>categoria:</strong> Categoria do produto (opcional, padrão: "Importado")</li>
              <li><strong>preco_custo:</strong> Preço de custo (opcional, padrão: 70% do preço de venda)</li>
            </ul>
            <p><strong>2.</strong> Arraste o arquivo para a área abaixo ou clique para selecionar</p>
            <p><strong>3.</strong> Aguarde o processamento e verifique os resultados</p>
            <div className="bg-blue-50 p-3 rounded-lg mt-4">
              <p className="text-blue-800 text-sm">
                <strong>💡 Dica:</strong> Baixe o template para ver um exemplo de como estruturar seus dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload de Arquivo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary-light' 
                : loading 
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            
            {loading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                <p className="text-gray-600">Processando arquivo...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                {isDragActive ? (
                  <p className="text-primary font-medium">Solte o arquivo aqui...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Arraste um arquivo CSV ou Excel aqui, ou clique para selecionar
                    </p>
                    <p className="text-sm text-gray-500">
                      Formatos aceitos: .csv, .xlsx, .xls (máximo 1 arquivo)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultado da Importação */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {resultado.sucessos > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Resultado da Importação</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Sucessos</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {resultado.sucessos}
                  </p>
                  <p className="text-sm text-green-700">produtos importados</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Erros</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {resultado.erros.length}
                  </p>
                  <p className="text-sm text-red-700">linhas com problemas</p>
                </div>
              </div>

              {/* Lista de Erros */}
              {resultado.erros.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Erros encontrados:</h4>
                  <ul className="space-y-1 text-sm text-red-700">
                    {resultado.erros.map((erro, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{erro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Produtos Importados */}
              {resultado.produtos.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">
                    Produtos importados com sucesso:
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="space-y-1 text-sm text-green-700">
                      {resultado.produtos.slice(0, 10).map((produto, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>
                            {produto.nome} - R$ {produto.preco_venda.toFixed(2)} 
                            ({produto.quantidade_estoque} unidades)
                          </span>
                        </li>
                      ))}
                      {resultado.produtos.length > 10 && (
                        <li className="text-green-600 font-medium">
                          ... e mais {resultado.produtos.length - 10} produtos
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}