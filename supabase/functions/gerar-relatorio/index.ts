import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { empresa_id, periodo, email } = await req.json()

    if (!empresa_id || !periodo) {
      throw new Error('ID da empresa e período são obrigatórios')
    }

    // Calcular datas do período
    let dataInicio: Date, dataFim: Date
    const hoje = new Date()

    if (periodo === 'semanal') {
      dataInicio = new Date(hoje)
      dataInicio.setDate(hoje.getDate() - 7)
      dataFim = hoje
    } else if (periodo === 'mensal') {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    } else {
      throw new Error('Período deve ser "semanal" ou "mensal"')
    }

    // Buscar dados para o relatório
    const { data: empresa, error: empresaError } = await supabaseClient
      .from('empresas')
      .select('nome')
      .eq('id', empresa_id)
      .single()

    if (empresaError) throw empresaError

    const { data: vendas, error: vendasError } = await supabaseClient
      .from('vendas')
      .select(`
        total,
        quantidade,
        data_venda,
        produtos (
          nome,
          categoria
        )
      `)
      .eq('empresa_id', empresa_id)
      .gte('data_venda', dataInicio.toISOString())
      .lte('data_venda', dataFim.toISOString())

    if (vendasError) throw vendasError

    // Calcular métricas
    const totalVendas = vendas.reduce((acc, venda) => acc + venda.total, 0)
    const totalQuantidade = vendas.reduce((acc, venda) => acc + venda.quantidade, 0)
    const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0

    // Produtos mais vendidos
    const produtosVendidos = vendas.reduce((acc: any, venda) => {
      const nomeProduto = venda.produtos.nome
      if (!acc[nomeProduto]) {
        acc[nomeProduto] = { quantidade: 0, total: 0 }
      }
      acc[nomeProduto].quantidade += venda.quantidade
      acc[nomeProduto].total += venda.total
      return acc
    }, {})

    const topProdutos = Object.entries(produtosVendidos)
      .map(([nome, dados]: [string, any]) => ({ nome, ...dados }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Gerar conteúdo do relatório (simulado)
    const relatorioData = {
      empresa: empresa.nome,
      periodo: `${dataInicio.toLocaleDateString('pt-BR')} - ${dataFim.toLocaleDateString('pt-BR')}`,
      resumo: {
        total_vendas: totalVendas,
        ticket_medio: ticketMedio,
        total_quantidade: totalQuantidade,
        numero_vendas: vendas.length
      },
      top_produtos: topProdutos,
      gerado_em: new Date().toISOString()
    }

    // Simular geração de PDF (em uma implementação real, você usaria uma biblioteca como Puppeteer)
    const urlPdf = `relatorio-${empresa_id}-${Date.now()}.pdf`

    // Salvar registro do relatório
    const { data: relatorio, error: relatorioError } = await supabaseClient
      .from('relatorios')
      .insert({
        empresa_id,
        url_pdf: urlPdf,
        periodo_referencia: periodo,
      })
      .select()
      .single()

    if (relatorioError) throw relatorioError

    // Se email fornecido, simular envio
    if (email) {
      console.log(`Enviando relatório para ${email}`)
      // Aqui você integraria com um serviço de email como SendGrid, Resend, etc.
    }

    return new Response(
      JSON.stringify({
        success: true,
        relatorio_id: relatorio.id,
        url_pdf: urlPdf,
        dados: relatorioData,
        message: email ? 'Relatório gerado e enviado por email' : 'Relatório gerado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})