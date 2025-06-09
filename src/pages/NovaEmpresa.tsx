import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmpresa } from '../hooks/useEmpresa'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card'
import { Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function NovaEmpresa() {
  const navigate = useNavigate()
  const { criarEmpresa } = useEmpresa()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: ''
  })

  const formatarCNPJ = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    return numericValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      toast.error('Nome da empresa é obrigatório')
      return
    }

    if (!formData.cnpj.trim()) {
      toast.error('CNPJ é obrigatório')
      return
    }

    setLoading(true)

    try {
      const { error } = await criarEmpresa(formData.nome, formData.cnpj)
      
      if (error) {
        toast.error('Erro ao criar empresa. Tente novamente.')
      } else {
        toast.success('Empresa criada com sucesso!')
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Nova Empresa</h1>
        <p className="text-gray-600 mt-2">
          Adicione uma nova empresa para começar a gerenciar seus dados
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span>Informações da Empresa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nome da Empresa"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Minha Loja Ltda"
              required
            />

            <Input
              label="CNPJ"
              value={formData.cnpj}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                cnpj: formatarCNPJ(e.target.value) 
              }))}
              placeholder="00.000.000/0000-00"
              required
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
              >
                Criar Empresa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}