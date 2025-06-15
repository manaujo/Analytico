import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          cnpj: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          cnpj: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          cnpj?: string;
          created_at?: string;
        };
      };
      produtos: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          categoria: string;
          preco_custo: number;
          preco_venda: number;
          quantidade_estoque: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          categoria: string;
          preco_custo: number;
          preco_venda: number;
          quantidade_estoque: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          categoria?: string;
          preco_custo?: number;
          preco_venda?: number;
          quantidade_estoque?: number;
          created_at?: string;
        };
      };
      vendas: {
        Row: {
          id: string;
          empresa_id: string;
          produto_id: string;
          quantidade: number;
          data_venda: string;
          preco_unitario: number;
          total: number;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          produto_id: string;
          quantidade: number;
          data_venda: string;
          preco_unitario: number;
          total: number;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          produto_id?: string;
          quantidade?: number;
          data_venda?: string;
          preco_unitario?: number;
          total?: number;
        };
      };
      metas: {
        Row: {
          id: string;
          empresa_id: string;
          tipo: string;
          valor: number;
          periodo: string;
          inicio: string;
          fim: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          tipo: string;
          valor: number;
          periodo: string;
          inicio: string;
          fim: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          tipo?: string;
          valor?: number;
          periodo?: string;
          inicio?: string;
          fim?: string;
        };
      };
      uploads: {
        Row: {
          id: string;
          empresa_id: string;
          tipo_arquivo: string;
          url: string;
          data_envio: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          tipo_arquivo: string;
          url: string;
          data_envio?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          tipo_arquivo?: string;
          url?: string;
          data_envio?: string;
        };
      };
      relatorios: {
        Row: {
          id: string;
          empresa_id: string;
          url_pdf: string;
          periodo_referencia: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          url_pdf: string;
          periodo_referencia: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          url_pdf?: string;
          periodo_referencia?: string;
          criado_em?: string;
        };
      };
    };
  };
};
