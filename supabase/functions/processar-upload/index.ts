import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface UploadData {
  empresa_id: string;
  file_content: string;
  file_type: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    if (file_type === "csv") {
      const lines = file_content.trim().split("\n");

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");

        if (cols.length < 3) continue; // Linha incompleta

        const [produto_nome, quantidadeStr, precoStr, dataStr] = cols.map((c) =>
          c.trim()
        );

        if (!produto_nome || !quantidadeStr || !precoStr) continue;

        const quantidade = parseInt(quantidadeStr);
        const preco = parseFloat(precoStr);

        if (isNaN(quantidade) || isNaN(preco)) continue;

        // 🔍 Buscar produto existente
        const { data: produto, error: produtoError } = await supabaseClient
          .from("produtos")
          .select("id")
          .eq("empresa_id", empresa_id)
          .eq("nome", produto_nome)
          .limit(1)
          .single();

        if (produtoError && produtoError.code !== "PGRST116") {
          throw produtoError;
        }

        let produto_id = produto?.id;

        if (!produto_id) {
          // ➕ Criar novo produto se não existir
          const { data: novoProduto, error: criarProdutoError } =
            await supabaseClient
              .from("produtos")
              .insert({
                empresa_id,
                nome: produto_nome,
                categoria: "Importado",
                preco_custo: preco * 0.7,
                preco_venda: preco,
                quantidade_estoque: 100
              })
              .select("id")
              .single();

          if (criarProdutoError) throw criarProdutoError;

          produto_id = novoProduto.id;
        }

        // 📅 Processar data
        let data_venda = new Date();
        if (dataStr) {
          const d = new Date(dataStr);
          if (!isNaN(d.getTime())) {
            data_venda = d;
          }
        }

        vendas.push({
          empresa_id,
          produto_id,
          quantidade,
          data_venda: data_venda.toISOString(),
          preco_unitario: preco,
          total: quantidade * preco,
          created_at: new Date().toISOString()
        });
      }
    } else {
      throw new Error(`Tipo de arquivo não suportado: ${file_type}`);
    }

    // 💾 Inserir vendas
    if (vendas.length > 0) {
      const { error: vendasError } = await supabaseClient
        .from("vendas")
        .insert(vendas);

      if (vendasError) throw vendasError;
    }

    // 🗒️ Registrar upload
    const { error: uploadError } = await supabaseClient.from("uploads").insert({
      empresa_id,
      tipo_arquivo: file_type,
      url: `processed-${Date.now()}.${file_type}`,
      data_envio: new Date().toISOString(),
      quantidade_registros: vendas.length
    });

    if (uploadError) throw uploadError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `${vendas.length} vendas processadas com sucesso.`,
        vendas_processadas: vendas.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Erro ao processar upload:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message ?? "Erro desconhecido"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
