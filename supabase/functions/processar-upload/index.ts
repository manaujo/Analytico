import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UploadData {
  empresa_id: string
  file_content: string
  file_type: string
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

    const { empresa_id, file_content, file_type }: UploadData = await req.json()

    if (!empresa_id || !file_content || !file_type) {
      throw new Error('Dados obrigatórios não fornecidos')
    }

    let vendas: any[] = []

    // Processar diferentes tipos de arquivo
    if (file_type === 'csv') {
      // Simular processamento de CSV
      const lines = file_content.split('\n')
      for (let i = 1; i < lines.length; i++) {
        const [produto_nome, quantidade, preco, data] = lines[i].split(',')
        if (produto_nome && quantidade && preco) {
          // Buscar produto ou criar se não existir
          const { data: produto, error: produtoError } = await supabaseClient
            .from('produtos')
            .select('id')
            .eq('empresa_id', empresa_id)
            .eq('nome', produto_nome.trim())
            .single()

          let produto_id = produto?.id

          if (!produto_id) {
            // Criar produto
            const { data: novoProduto, error: criarProdutoError } = await supabaseClient
              .from('produtos')
              .insert({
                empresa_id,
                nome: produto_nome.trim(),
                categoria: 'Importado',
                preco_custo: parseFloat(preco) * 0.7,
                preco_venda: parseFloat(preco),
                quantidade_estoque: 100
              })
              .select('id')
              .single()

            if (criarProdutoError) throw criarProdutoError
            produto_id = novoProduto.id
          }

          vendas.push({
            empresa_id,
            produto_id,
            quantidade: parseInt(quantidade),
            data_venda: data ? new Date(data) : new Date(),
            preco_unitario: parseFloat(preco),
            total: parseInt(quantidade) * parseFloat(preco)
          })
        }
      }
    }

    // Inserir vendas processadas
    if (vendas.length > 0) {
      const { error: vendasError } = await supabaseClient
        .from('vendas')
        .insert(vendas)

      if (vendasError) throw vendasError
    }

    // Registrar upload
    const { error: uploadError } = await supabaseClient
      .from('uploads')
      .insert({
        empresa_id,
        tipo_arquivo: file_type,
        url: `processed-${Date.now()}.${file_type}`,
      })

    if (uploadError) throw uploadError

    return new Response(
      JSON.stringify({
        success: true,
        message: `${vendas.length} vendas processadas com sucesso`,
        vendas_processadas: vendas.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao processar upload:', error)
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