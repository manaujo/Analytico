import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  Target, 
  Upload, 
  FileText,
  Bell,
  Settings,
  Home
} from 'lucide-react'

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/produtos', label: 'Produtos', icon: Package },
  { path: '/vendas', label: 'Vendas', icon: TrendingUp },
  { path: '/metas', label: 'Metas', icon: Target },
  { path: '/upload', label: 'Importar Dados', icon: Upload },
  { path: '/relatorios', label: 'Relatórios', icon: FileText },
  { path: '/alertas', label: 'Alertas', icon: Bell },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}