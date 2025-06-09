/*
  # Criação do Schema Inicial do Analytico

  1. Novas Tabelas
    - `empresas` - Armazena informações das empresas dos usuários
    - `produtos` - Catálogo de produtos por empresa
    - `vendas` - Registro de vendas realizadas
    - `metas` - Metas definidas pelos usuários
    - `uploads` - Histórico de arquivos enviados
    - `relatorios` - Relatórios gerados pelo sistema

  2. Segurança
    - Habilitação de RLS em todas as tabelas
    - Políticas para isolamento de dados por usuário/empresa
    - Acesso restrito aos dados próprios de cada usuário

  3. Funcionalidades
    - Suporte a múltiplas empresas por usuário
    - Controle completo de estoque e vendas
    - Sistema de metas e acompanhamento
    - Histórico de uploads e relatórios
*/

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  cnpj text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  categoria text DEFAULT '',
  preco_custo decimal(10,2) DEFAULT 0.00,
  preco_venda decimal(10,2) DEFAULT 0.00,
  quantidade_estoque integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  data_venda timestamptz DEFAULT now(),
  preco_unitario decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL
);

-- Tabela de metas
CREATE TABLE IF NOT EXISTS metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL,
  valor decimal(10,2) NOT NULL,
  periodo text NOT NULL,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL
);

-- Tabela de uploads
CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  tipo_arquivo text NOT NULL,
  url text NOT NULL,
  data_envio timestamptz DEFAULT now()
);

-- Tabela de relatórios
CREATE TABLE IF NOT EXISTS relatorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  url_pdf text NOT NULL,
  periodo_referencia text NOT NULL,
  criado_em timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas
CREATE POLICY "Usuários podem gerenciar suas próprias empresas"
  ON empresas
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para produtos
CREATE POLICY "Usuários podem gerenciar produtos de suas empresas"
  ON produtos
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Políticas para vendas
CREATE POLICY "Usuários podem gerenciar vendas de suas empresas"
  ON vendas
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Políticas para metas
CREATE POLICY "Usuários podem gerenciar metas de suas empresas"
  ON metas
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Políticas para uploads
CREATE POLICY "Usuários podem gerenciar uploads de suas empresas"
  ON uploads
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Políticas para relatórios
CREATE POLICY "Usuários podem gerenciar relatórios de suas empresas"
  ON relatorios
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_empresas_user_id ON empresas(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_id ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_empresa_id ON vendas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_produto_id ON vendas(produto_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_metas_empresa_id ON metas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_uploads_empresa_id ON uploads(empresa_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_empresa_id ON relatorios(empresa_id);