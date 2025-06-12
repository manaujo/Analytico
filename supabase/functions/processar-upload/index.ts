import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://analytioficial.netlify.app",
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    // Responde à requisição CORS preflight
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { empresa_id, file_content, file_type } = await req.json();

    if (!empresa_id || !file_content || !file_type) {
      throw new Error("Dados obrigatórios não fornecidos");
    }

    // Aqui você processa o CSV, por exemplo, inserindo vendas no banco.
    // Exemplo fictício (deve ser substituído pelo seu código real):
    // await supabase.from("vendas").insert([{ empresa_id, dados: file_content }]);

    return new Response(
      JSON.stringify({ success: true, message: "Processado com sucesso" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
