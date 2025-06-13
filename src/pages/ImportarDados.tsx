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
import Papa from "papaparse"; // ajuste conforme sua estrutura
import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";

interface UploadHistorico {
  id: string;
  tipo_arquivo: string;
  url: string;
  data_envio: string;
}

export function ImportarDados() {
  const { empresaAtual } = useEmpresa();
  const [uploads, setUploads] = useState<UploadHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    if (empresaAtual) {
      carregarHistoricoUploads();
    }
  }, [empresaAtual]);

  const carregarHistoricoUploads = async () => {
    console.log(empresaAtual);
    if (!empresaAtual) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("empresa_id", empresaAtual.id)
        .order("data_envio", { ascending: false });

      if (error) throw error;
      console.log("Uploads carregados:", data);
      setUploads(data || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast.error("Erro ao carregar histórico de uploads");
    } finally {
      setLoading(false);
    }
  };

  const processarArquivo = async (file: File) => {
    setUploading(true);
    setUploadStatus(null);

    try {
      // Verifica tipo de arquivo
      let fileType = "";
      if (file.name.endsWith(".csv")) {
        fileType = "csv";
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        fileType = "xlsx";
      } else {
        throw new Error("Formato de arquivo não suportado. Use CSV ou XLSX.");
      }

      // Nome único para o arquivo
      const fileName = `${empresaAtual!.id}/${uuidv4()}_${file.name}`;

      // Upload para Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("uploads") // Nome do bucket
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        throw new Error(
          `Erro ao enviar para o storage: ${uploadError.message}`
        );
      }

      if (!uploadError) {
        setUploadStatus({
          success: true,
          message: "Arquivo processado com sucesso!",
          details: uploadError
        });
        toast.success("Arquivo processado com sucesso!");
        carregarHistoricoUploads();
      } else {
        throw new Error(uploadError || "Erro ao processar arquivo");
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      setUploadStatus({
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
      toast.error("Erro ao processar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processarArquivo(acceptedFiles[0]);
      }
    },
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx"
      ],
      "application/vnd.ms-excel": [".xls"]
    },
    maxFiles: 1,
    disabled: uploading
  });

  const baixarTemplate = () => {
    const csvContent =
      "produto,quantidade,preco,data\nProduto Exemplo,10,25.50,2024-01-15\nOutro Produto,5,15.00,2024-01-16";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-vendas.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template baixado com sucesso!");
  };

  if (!empresaAtual) {
    return (
      <div className="text-center py-12">
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma empresa selecionada
        </h2>
        <p className="text-gray-600">
          Selecione uma empresa para importar dados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Importar Vendas</h1>
          <p className="text-gray-600 mt-2">
            Importe seus dados de vendas via CSV ou Excel
          </p>
        </div>
        <Button
          onClick={baixarTemplate}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Baixar Template</span>
        </Button>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como importar seus dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. Prepare seu arquivo CSV ou Excel com as seguintes colunas:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                <strong>produto:</strong> Nome do produto
              </li>
              <li>
                <strong>quantidade:</strong> Quantidade vendida
              </li>
              <li>
                <strong>preco:</strong> Preço unitário (use ponto como separador
                decimal)
              </li>
              <li>
                <strong>data:</strong> Data da venda (formato: YYYY-MM-DD)
              </li>
            </ul>
            <p>
              2. Arraste o arquivo para a área abaixo ou clique para selecionar
            </p>
            <p>3. Aguarde o processamento e verifique os resultados</p>
          </div>
        </CardContent>
      </Card>

      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload de Arquivo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary-light"
                : uploading
                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                : "border-gray-300 hover:border-primary hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />

            {uploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-600">Processando arquivo...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                {isDragActive ? (
                  <p className="text-primary font-medium">
                    Solte o arquivo aqui...
                  </p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Arraste um arquivo CSV ou Excel aqui, ou clique para
                      selecionar
                    </p>
                    <p className="text-sm text-gray-500">
                      Formatos aceitos: .csv, .xlsx, .xls (máximo 1 arquivo)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status do Upload */}
          {uploadStatus && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                uploadStatus.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                {uploadStatus.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <p
                  className={`font-medium ${
                    uploadStatus.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {uploadStatus.message}
                </p>
              </div>
              {uploadStatus.success && uploadStatus.details && (
                <p className="text-sm text-green-700 mt-2">
                  {uploadStatus.details.vendas_processadas} vendas foram
                  importadas com sucesso.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Histórico de Uploads</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum arquivo enviado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-light p-2 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text">{upload.url}</p>
                      <p className="text-sm text-gray-600">
                        Tipo: {upload.tipo_arquivo.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(
                          new Date(upload.data_envio),
                          "dd/MM/yyyy HH:mm",
                          { locale: ptBR }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
