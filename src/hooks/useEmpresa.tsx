import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Empresa {
  id: string
  nome: string
  cnpj: string
  created_at: string
}

interface EmpresaContextType {
  empresas: Empresa[]
  empresaAtual: Empresa | null
  setEmpresaAtual: (empresa: Empresa | null) => void
  carregarEmpresas: () => Promise<void>
  criarEmpresa: (nome: string, cnpj: string) => Promise<{ error: any }>
  loading: boolean
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined)

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaAtual, setEmpresaAtual] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const carregarEmpresas = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setEmpresas(data)
        if (data.length > 0 && !empresaAtual) {
          setEmpresaAtual(data[0])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  const criarEmpresa = async (nome: string, cnpj: string) => {
    if (!user) return { error: 'Usuário não autenticado' }

    const { data, error } = await supabase
      .from('empresas')
      .insert({
        user_id: user.id,
        nome,
        cnpj,
      })
      .select()
      .single()

    if (!error && data) {
      setEmpresas(prev => [data, ...prev])
      setEmpresaAtual(data)
    }

    return { error }
  }

  useEffect(() => {
    if (user) {
      carregarEmpresas()
    }
  }, [user])

  const value = {
    empresas,
    empresaAtual,
    setEmpresaAtual,
    carregarEmpresas,
    criarEmpresa,
    loading,
  }

  return (
    <EmpresaContext.Provider value={value}>
      {children}
    </EmpresaContext.Provider>
  )
}

export function useEmpresa() {
  const context = useContext(EmpresaContext)
  if (context === undefined) {
    throw new Error('useEmpresa must be used within an EmpresaProvider')
  }
  return context
}