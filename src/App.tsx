import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth'
import { EmpresaProvider } from './hooks/useEmpresa'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/Layout/AppLayout'

// Pages
import { LandingPage } from './pages/LandingPage'
import { Login } from './pages/Login'
import { Cadastro } from './pages/Cadastro'
import { Dashboard } from './pages/Dashboard'
import { NovaEmpresa } from './pages/NovaEmpresa'

function App() {
  return (
    <AuthProvider>
      <EmpresaProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/empresas/nova" element={
                <ProtectedRoute>
                  <AppLayout>
                    <NovaEmpresa />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Placeholder routes for other pages */}
              <Route path="/produtos" element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
                      <p className="text-gray-600">Página em desenvolvimento</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/vendas" element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900">Vendas</h2>
                      <p className="text-gray-600">Página em desenvolvimento</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/metas" element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900">Metas</h2>
                      <p className="text-gray-600">Página em desenvolvimento</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/upload" element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900">Importar Dados</h2>
                      <p className="text-gray-600">Página em desenvolvimento</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/relatorios" element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
                      <p className="text-gray-600">Página em desenvolvimento</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/alertas" element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900">Alertas</h2>
                      <p className="text-gray-600">Página em desenvolvimento</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
                      <p className="text-gray-600">Página em desenvolvimento</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Redirect */}
              <Route path="*" element={<Navigate to="/\" replace />} />
            </Routes>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </EmpresaProvider>
    </AuthProvider>
  )
}

export default App