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

    const { empresa_id } = await req.json()

    if (!empresa_id) {
      throw new Error('ID da empresa é obrigatório')
    }

    // Buscar vendas dos últimos 30 dias
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - 30)

    const { data: vendas, error: vendasError } = await supabaseClient
      .from('vendas')
      .select(`
        total,
        data_venda,
        produtos (
          nome,
          quantidade_estoque
        )
      `)
      .eq('empresa_id', empresa_id)
      .gte('data_venda', dataInicio.toISOString())
      .order('data_venda', { ascending: true })

    if (vendasError) throw vendasError

    // Calcular média móvel de 7 dias
    const mediaMovel = []
    for (let i = 6; i < vendas.length; i++) {
      const slice = vendas.slice(i - 6, i + 1)
      const media = slice.reduce((acc, venda) => acc + venda.total, 0) / 7
      mediaMovel.push({
        data: vendas[i].data_venda,
        media_movel: media
      })
    }

    // Calcular tendência (simples regressão linear)
    const n = mediaMovel.length
    let somaX = 0, somaY = 0, somaXY = 0, somaX2 = 0

    mediaMovel.forEach((item, index) => {
      somaX += index
      somaY += item.media_movel
      somaXY += index * item.media_movel
      somaX2 += index * index
    })

    const inclinacao = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX)
    const intercepto = (somaY - inclinacao * somaX) / n

    // Prever próximos 7 dias
    const previsoes = []
    for (let i = 1; i <= 7; i++) {
      const dataPrevisao = new Date()
      dataPrevisao.setDate(dataPrevisao.getDate() + i)
      
      const valorPrevisto = intercepto + inclinacao * (n + i)
      previsoes.push({
        data: dataPrevisao.toISOString().split('T')[0],
        valor_previsto: Math.max(0, valorPrevisto)
      })
    }

    // Analisar produtos que precisam de reposição
    const { data: produtos, error: produtosError } = await supabaseClient
      .from('produtos')
      .select(`
        id,
        nome,
        quantidade_estoque,
        vendas!inner (
          quantidade,
          data_venda
        )
      `)
      .eq('empresa_id', empresa_id)
      .gte('vendas.data_venda', dataInicio.toISOString())

    if (produtosError) throw produtosError

    const sugestoesReposicao = produtos
      .map(produto => {
        const vendasProduto = produto.vendas
        const totalVendido = vendasProduto.reduce((acc: number, venda: any) => acc + venda.quantidade, 0)
        const mediaVendasDia = totalVendido / 30
        const diasRestantes = produto.quantidade_estoque / mediaVendasDia
        
        return {
          produto: produto.nome,
          estoque_atual: produto.quantidade_estoque,
          media_vendas_dia: Math.round(mediaVendasDia * 100) / 100,
          dias_restantes: Math.round(diasRestantes),
          necessita_reposicao: diasRestantes < 7
        }
      })
      .filter(item => item.necessita_reposicao)
      .sort((a, b) => a.dias_restantes - b.dias_restantes)

    return new Response(
      JSON.stringify({
        success: true,
        previsao_vendas: previsoes,
        tendencia: {
          inclinacao: Math.round(inclinacao * 100) / 100,
          crescimento: inclinacao > 0 ? 'crescimento' : 'declínio'
        },
        sugestoes_reposicao: sugestoesReposicao
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao calcular previsão:', error)
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