import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./hooks/useAuth";
import { EmpresaProvider } from "./hooks/useEmpresa";
import { SubscriptionProvider } from "./hooks/useSubscription";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/Layout/AppLayout";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Cadastro } from "./pages/Cadastro";
import { Dashboard } from "./pages/Dashboard";
import { NovaEmpresa } from "./pages/NovaEmpresa";
import { Vendas } from "./pages/Vendas";
import { NovaVenda } from "./pages/NovaVenda";
import { Metas } from "./pages/Metas";
import { ImportarDados } from "./pages/ImportarDados";
import { Configuracoes } from "./pages/Configuracoes";
import { Produtos } from "./pages/Produtos";
import { Relatorios } from "./pages/Relatorios";
import { Alertas } from "./pages/Alertas";
import { EstoqueEntradas } from "./pages/EstoqueEntradas";
import { Previsoes } from "./pages/Previsoes";
import { Pricing } from "./pages/Pricing";
import { SubscriptionSuccess } from "./pages/SubscriptionSuccess";

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <EmpresaProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route
                  path="/subscription-success"
                  element={<SubscriptionSuccess />}
                />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/empresas/nova"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <NovaEmpresa />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/produtos"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Produtos />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendas"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Vendas />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vendas/nova"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <NovaVenda />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/estoque/entradas"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <EstoqueEntradas />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/previsoes"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Previsoes />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/metas"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Metas />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ImportarDados />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/relatorios"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Relatorios />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/alertas"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Alertas />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/configuracoes"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Configuracoes />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff"
                  }
                }}
              />
            </div>
          </Router>
        </EmpresaProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
