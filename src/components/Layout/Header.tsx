import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useSubscription } from '../../hooks/useSubscription'
import { LogOut, Building2, ChevronDown, Plus, Crown } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()
  const { empresas, empresaAtual, setEmpresaAtual } = useEmpresa()
  const { subscription, isActive } = useSubscription()
  const [showEmpresaDropdown, setShowEmpresaDropdown] = useState(false)

  if (!user) return null

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-2xl font-bold text-primary">
            Analytico
          </Link>
          
          {empresaAtual && (
            <div className="relative">
              <button
                onClick={() => setShowEmpresaDropdown(!showEmpresaDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">{empresaAtual.nome}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showEmpresaDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    {empresas.map((empresa) => (
                      <button
                        key={empresa.id}
                        onClick={() => {
                          setEmpresaAtual(empresa)
                          setShowEmpresaDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                          empresa.id === empresaAtual?.id ? 'bg-primary-light text-primary' : ''
                        }`}
                      >
                        <div className="font-medium">{empresa.nome}</div>
                        <div className="text-xs text-gray-500">{empresa.cnpj}</div>
                      </button>
                    ))}
                    <hr className="my-2" />
                    <Link
                      to="/empresas/nova"
                      className="flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-primary"
                      onClick={() => setShowEmpresaDropdown(false)}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nova Empresa</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Subscription Status */}
          {subscription && (
            <div className="flex items-center space-x-2">
              <Crown className={`w-4 h-4 ${isActive ? 'text-yellow-500' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${isActive ? 'text-yellow-600' : 'text-gray-500'}`}>
                {isActive ? 'Premium' : 'Inativo'}
              </span>
            </div>
          )}
          
          <span className="text-sm text-gray-600">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  )
}