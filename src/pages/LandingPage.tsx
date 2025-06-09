import React from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, Target, Shield, Clock, Users } from 'lucide-react'
import { Button } from '../components/UI/Button'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-text">Analytico</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Entrar
              </Link>
              <Link to="/cadastro">
                <Button>Criar Conta</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary-light to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-text mb-6">
              Transforme seus dados em
              <span className="text-primary"> insights poderosos</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Sistema completo de analytics empresarial para otimizar suas vendas, 
              controlar estoque e maximizar seus lucros com inteligência artificial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro">
                <Button size="lg" className="w-full sm:w-auto">
                  Começar Agora - Grátis
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Funcionalidades Poderosas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar e otimizar seu negócio em uma única plataforma
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="bg-primary-light p-3 rounded-lg w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">Analytics Avançado</h3>
              <p className="text-gray-600">
                Dashboard completo com métricas de vendas, ticket médio, produtos mais lucrativos e tendências.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="bg-primary-light p-3 rounded-lg w-fit mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">Controle de Metas</h3>
              <p className="text-gray-600">
                Defina metas de faturamento e acompanhe seu progresso com gráficos em tempo real.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="bg-primary-light p-3 rounded-lg w-fit mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">Alertas Inteligentes</h3>
              <p className="text-gray-600">
                Receba notificações automáticas sobre mudanças importantes no seu negócio.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="bg-primary-light p-3 rounded-lg w-fit mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">Previsão de Vendas</h3>
              <p className="text-gray-600">
                IA avançada para prever tendências e sugerir estratégias de reposição de estoque.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="bg-primary-light p-3 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">Multi-empresas</h3>
              <p className="text-gray-600">
                Gerencie múltiplas empresas ou lojas em uma única conta com dados segregados.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="bg-primary-light p-3 rounded-lg w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">Relatórios Automáticos</h3>
              <p className="text-gray-600">
                Relatórios em PDF gerados automaticamente e enviados por email semanalmente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Planos Simples e Transparentes
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o plano ideal para o seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <h3 className="text-2xl font-bold text-text mb-4">Plano Mensal</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary">R$ 120</span>
                <span className="text-gray-600">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-secondary mr-2">✓</span>
                  Dashboard completo
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">✓</span>
                  Múltiplas empresas
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">✓</span>
                  Relatórios automáticos
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">✓</span>
                  Alertas inteligentes
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">✓</span>
                  Suporte por email
                </li>
              </ul>
              <Button className="w-full" size="lg">
                Escolher Plano Mensal
              </Button>
            </div>

            <div className="bg-white p-8 rounded-xl border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                  15% de desconto
                </span>
              </div>
              <h3 className="text-2xl font-bold text-text mb-4">Plano Anual</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary">R$ 1.224</span>
                <span className="text-gray-600">/ano</span>
                <div className="text-sm text-gray-500">
                  <s>R$ 1.440</s> - Economia de R$ 216
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-secondary mr-2">✓</span>
                  Dashboard completo
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">✓</span>
                  Múltiplas empresas
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">✓</span>
                  Relatórios automáticos
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">✓</span>
                  Alertas inteligentes
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">✓</span>
                  Suporte prioritário
                </li>
              </ul>
              <Button className="w-full" size="lg">
                Escolher Plano Anual
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já otimizaram suas operações com o Analytico
          </p>
          <Link to="/cadastro">
            <Button variant="secondary" size="lg">
              Começar Agora - 7 Dias Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="ml-2 text-xl font-bold text-white">Analytico</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 Analytico. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}