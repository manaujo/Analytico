// supabase/functions/processar-upload/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info"
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // ou 'http://localhost:5173'
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Content-Length": "0"
      }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { empresa_id, file_content, file_type } = await req.json();

    if (!empresa_id || !file_content || !file_type) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Decodifica o base64
    const base64Data = file_content.split(",").pop(); // remove prefixo tipo data:
    const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Gera nome único
    const fileName = `empresa_${empresa_id}_${Date.now()}.csv`;

    // Envia para o Storage (bucket: "uploads")
    const { data, error } = await supabase.storage
      .from("subscriptions")
      .select("*")
      .eq("user_id", empresa_id)
      .headers({ Accept: "application/json" });

    if (error) {
      throw new Error("Erro ao enviar para o Storage: " + error.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Arquivo enviado com sucesso!",
        path: data?.path
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
