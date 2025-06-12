import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Substitua pelo seu domínio de frontend
const allowedOrigin = "https://analytioficial.netlify.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

interface UploadData {
  empresa_id: string;
  file_content: string;
  file_type: string;
}

serve(async (req) => {
  // Preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { empresa_id, file_content, file_type }: UploadData =
      await req.json();

    if (!empresa_id || !file_content || !file_type) {
      throw new Error("Dados obrigatórios não fornecidos");
    }

    let vendas: any[] = [];

    // Processar CSV
    if (file_type === "csv") {
      const lines = file_content.split("\n");
      for (let i = 1; i < lines.length; i++) {
        const [produto_nome, quantidade, preco, data] = lines[i].split(",");
        if (produto_nome && quantidade && preco) {
          const { data: produto, error: produtoError } = await supabaseClient
            .from("produtos")
            .select("id")
            .eq("empresa_id", empresa_id)
            .eq("nome", produto_nome.trim())
            .single();

          let produto_id = produto?.id;

          if (!produto_id) {
            const { data: novoProduto, error: criarProdutoError } =
              await supabaseClient
                .from("produtos")
                .insert({
                  empresa_id,
                  nome: produto_nome.trim(),
                  categoria: "Importado",
                  preco_custo: parseFloat(preco) * 0.7,
                  preco_venda: parseFloat(preco),
                  quantidade_estoque: 100
                })
                .select("id")
                .single();

            if (criarProdutoError) throw criarProdutoError;
            produto_id = novoProduto.id;
          }

          vendas.push({
            empresa_id,
            produto_id,
            quantidade: parseInt(quantidade),
            data_venda: data ? new Date(data) : new Date(),
            preco_unitario: parseFloat(preco),
            total: parseInt(quantidade) * parseFloat(preco)
          });
        }
      }
    }

    if (vendas.length > 0) {
      const { error: vendasError } = await supabaseClient
        .from("vendas")
        .insert(vendas);

      if (vendasError) throw vendasError;
    }

    const { error: uploadError } = await supabaseClient.from("uploads").insert({
      empresa_id,
      tipo_arquivo: file_type,
      url: `processed-${Date.now()}.${file_type}`
    });

    if (uploadError) throw uploadError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `${vendas.length} vendas processadas com sucesso`,
        vendas_processadas: vendas.length
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Erro ao processar upload:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message ?? "Erro desconhecido"
      }),
      {
        status: 400,
        headers: corsHeaders
      }
    );
  }
});
