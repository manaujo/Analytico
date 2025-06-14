import React, { useState, useEffect } from "react";
import { useEmpresa } from "../hooks/useEmpresa";
import { supabase } from "../lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../components/UI/Card";
import { Button } from "../components/UI/Button";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  File
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

interface Upload {
  id: string;
  tipo_arquivo: string;
  url: string;
  data_envio: string;
  quantidade_registros: number;
}

interface Props {
  empresaId: string;
  supabaseClient: any; // Passe seu cliente Supabase aqui
}

const UploadVendas: React.FC<Props> = ({ empresaId, supabaseClient }) => {
  const [historicoUploads, setHistoricoUploads] = useState<Upload[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean | null;
    message: string;
  }>({ success: null, message: "" });
  const [uploading, setUploading] = useState(false);

  // Carrega histórico de uploads da empresa
  async function carregarHistoricoUploads() {
    try {
      const { data, error } = await supabaseClient
        .from("uploads")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("data_envio", { ascending: false });

      if (error) throw error;

      if (data) {
        setHistoricoUploads(data);
      }
    } catch (error: any) {
      console.error("Erro ao carregar uploads:", error.message);
      setUploadStatus({ success: false, message: "Erro ao carregar uploads" });
    }
  }

  // Carrega histórico ao montar componente e quando empresaId muda
  useEffect(() => {
    carregarHistoricoUploads();
  }, [empresaId]);

  // Processa o arquivo selecionado
  async function processarArquivo(file: File) {
    setUploading(true);
    setUploadStatus({ success: null, message: "Processando arquivo..." });

    try {
      let fileContent: string;
      let fileType = "";

      if (file.name.toLowerCase().endsWith(".csv")) {
        fileType = "csv";
        fileContent = await file.text();
      } else if (
        file.name.toLowerCase().endsWith(".xls") ||
        file.name.toLowerCase().endsWith(".xlsx")
      ) {
        fileType = "csv";
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        fileContent = XLSX.utils.sheet_to_csv(worksheet);
      } else {
        throw new Error("Tipo de arquivo não suportado. Use CSV ou Excel.");
      }

      // Ajuste a URL e a autorização da sua edge function aqui:
      const response = await fetch(
        "https://<seu-projeto>.supabase.co/functions/v1/processar-upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            empresa_id: empresaId,
            file_content: fileContent,
            file_type: fileType
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro desconhecido no upload");
      }

      setUploadStatus({
        success: true,
        message: result.message || "Upload realizado com sucesso!"
      });

      // Atualiza histórico após upload
      carregarHistoricoUploads();
    } catch (error: any) {
      setUploadStatus({
        success: false,
        message: error.message || "Erro ao processar arquivo"
      });
    } finally {
      setUploading(false);
    }
  }

  // Evento ao mudar arquivo input
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processarArquivo(e.target.files[0]);
    }
  }

  // Template CSV para download
  const templateCSV = `produto_nome,quantidade,preco,data
Produto A,10,25.5,2025-06-14
Produto B,5,15.0,2025-06-13`;

  return (
    <div>
      <h2>Upload de Vendas</h2>

      <input
        type="file"
        accept=".csv,.xls,.xlsx"
        onChange={onFileChange}
        disabled={uploading}
      />

      {uploadStatus.message && (
        <p
          style={{
            color: uploadStatus.success === true ? "green" : "red",
            marginTop: 10
          }}
        >
          {uploadStatus.message}
        </p>
      )}

      <a
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(templateCSV)}`}
        download="template_vendas.csv"
        style={{ display: "inline-block", marginTop: 10 }}
      >
        Baixar template CSV
      </a>

      <h3>Histórico de Uploads</h3>
      {historicoUploads.length === 0 && <p>Nenhum upload encontrado.</p>}

      <ul>
        {historicoUploads.map((upload) => (
          <li key={upload.id}>
            {upload.tipo_arquivo.toUpperCase()} - {upload.url} -{" "}
            {new Date(upload.data_envio).toLocaleString()} - Registros:{" "}
            {upload.quantidade_registros}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UploadVendas;
