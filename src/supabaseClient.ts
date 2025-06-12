// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://<SEU_SUPABASE_URL>.supabase.co";
const supabaseAnonKey = "<SUA_CHAVE_ANONIMA>";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
