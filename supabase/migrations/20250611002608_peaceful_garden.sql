/*
  # Corrigir schema da tabela produtos e adicionar funcionalidades faltantes

  1. Correções na tabela produtos
    - Adicionar coluna quantidade_estoque se não existir
    - Adicionar coluna estoque_minimo para alertas
    - Corrigir tipos de dados

  2. Novas tabelas necessárias
    - entradas_estoque para controle de entrada de produtos
    - alertas para sistema de notificações
    - previsoes para análises futuras
    - configuracoes_usuario para preferências

  3. Segurança
    - Habilitar RLS em todas as novas tabelas
    - Criar políticas apropriadas
*/

-- Corrigir tabela produtos
DO $$
BEGIN
  -- Adicionar quantidade_estoque se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'quantidade_estoque'
  ) THEN
    ALTER TABLE produtos ADD COLUMN quantidade_estoque integer DEFAULT 0;
  END IF;

  -- Adicionar estoque_minimo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'estoque_minimo'
  ) THEN
    ALTER TABLE produtos ADD COLUMN estoque_minimo integer DEFAULT 10;
  END IF;

  -- Adicionar logo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'logo'
  ) THEN
    ALTER TABLE empresas ADD COLUMN logo text;
  END IF;

  -- Adicionar ramo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'ramo'
  ) THEN
    ALTER TABLE empresas ADD COLUMN ramo text;
  END IF;
END $$;

-- Tabela de entradas de estoque
CREATE TABLE IF NOT EXISTS entradas_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE NOT NULL,
  quantidade integer NOT NULL,
  data_entrada timestamptz DEFAULT now(),
  observacoes text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de alertas
CREATE TABLE IF NOT EXISTS alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL, -- 'estoque_baixo', 'meta_atingida', 'produto_parado', etc.
  titulo text NOT NULL,
  descricao text NOT NULL,
  prioridade text DEFAULT 'media', -- 'alta', 'media', 'baixa'
  lido boolean DEFAULT false,
  data_criacao timestamptz DEFAULT now(),
  dados_extras jsonb
);

-- Tabela de previsões
CREATE TABLE IF NOT EXISTS previsoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE,
  data_previsao date NOT NULL,
  valor_estimado decimal(10,2) NOT NULL,
  tipo text NOT NULL, -- 'vendas', 'estoque', 'faturamento'
  metodo text DEFAULT 'media_movel', -- 'media_movel', 'tendencia_linear'
  created_at timestamptz DEFAULT now()
);

-- Tabela de configurações do usuário
CREATE TABLE IF NOT EXISTS configuracoes_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notificacoes_email boolean DEFAULT true,
  notificacoes_whatsapp boolean DEFAULT false,
  tema text DEFAULT 'claro',
  idioma text DEFAULT 'pt-BR',
  timezone text DEFAULT 'America/Sao_Paulo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE entradas_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE previsoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas para entradas_estoque
CREATE POLICY "Usuários podem gerenciar entradas de suas empresas"
  ON entradas_estoque
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

-- Políticas para alertas
CREATE POLICY "Usuários podem gerenciar alertas de suas empresas"
  ON alertas
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

-- Políticas para previsoes
CREATE POLICY "Usuários podem ver previsões de suas empresas"
  ON previsoes
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

-- Políticas para configuracoes_usuario
CREATE POLICY "Usuários podem gerenciar suas próprias configurações"
  ON configuracoes_usuario
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_entradas_estoque_empresa_id ON entradas_estoque(empresa_id);
CREATE INDEX IF NOT EXISTS idx_entradas_estoque_produto_id ON entradas_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_alertas_empresa_id ON alertas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alertas_lido ON alertas(lido);
CREATE INDEX IF NOT EXISTS idx_previsoes_empresa_id ON previsoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_previsoes_data ON previsoes(data_previsao);
CREATE INDEX IF NOT EXISTS idx_configuracoes_user_id ON configuracoes_usuario(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para configuracoes_usuario
CREATE TRIGGER update_configuracoes_usuario_updated_at 
    BEFORE UPDATE ON configuracoes_usuario 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();