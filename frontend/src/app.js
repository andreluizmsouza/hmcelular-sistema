import React, { useState, useEffect } from 'react';
import { 
  Lock, User, Eye, EyeOff, Package, Users, BarChart3, Settings, LogOut, 
  Store, ShoppingCart, FileText, AlertCircle, Loader, Menu, X, 
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { authService, healthService, apiUtils } from './services/api';

const SistemaHMCelular = () => {
  // Estados principais
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ usuario: '', senha: '' });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  // Verificar token existente ao carregar
  useEffect(() => {
    validateExistingSession();
    checkApiHealth();
  }, []);

  // Validar sessão existente
  const validateExistingSession = async () => {
    try {
      const isValid = await authService.validateToken();
      if (isValid) {
        const userData = await authService.me();
        if (userData.success) {
          setCurrentUser(userData.user);
        }
      }
    } catch (error) {
      console.log('Nenhuma sessão válida encontrada');
    }
  };

  // Verificar saúde da API
  const checkApiHealth = async () => {
    try {
      await healthService.check();
      setApiStatus('online');
    } catch (error) {
      setApiStatus('offline');
      console.error('API offline:', error.message);
    }
  };

  // Função de login
  const handleLogin = async () => {
    if (!loginData.usuario || !loginData.senha) {
      setError('Usuário e senha são obrigatórios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.login(loginData.usuario, loginData.senha);
      
      if (response.success) {
        setCurrentUser(response.user);
        setLoginData({ usuario: '', senha: '' });
        console.log('Login bem-sucedido:', response.user.nome);
      } else {
        setError(response.error || 'Erro ao fazer login');
      }
    } catch (error) {
      setError(apiUtils.formatError(error));
      console.error('Erro no login:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Erro no logout:', error);
    } finally {
      setCurrentUser(null);
      setCurrentPage('dashboard');
      setSidebarOpen(false);
    }
  };

  // Verificar permissões
  const temPermissao = (permissao) => {
    if (!currentUser) return false;
    return currentUser.permissoes.includes('todas') || currentUser.permissoes.includes(permissao);
  };

  // Handle Enter key no login
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  // Tela de Login
  const TelaLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fadeIn">
        {/* Logo HMCelular */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="text-4xl font-black tracking-tight">
                <span className="text-black font-sans">HM</span>
                <span className="text-blue-500 font-sans">Celular</span>
              </div>
              <div className="ml-3">
                <div className="relative">
                  <div className="w-8 h-14 bg-black rounded-lg transform rotate-12"></div>
                  <div className="absolute top-1 left-1 w-6 h-12 bg-gray-100 rounded-md"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-14 bg-black rounded-lg transform -rotate-12 opacity-60"></div>
                </div>
              </div>
            </div>
            <div className="text-blue-500 text-sm font-semibold tracking-wide">
              ACESSÓRIOS PARA CELULAR E SERVIÇOS
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Sistema de Gestão</h1>
        </div>

        {/* Status da API */}
        <div className={`mb-4 p-3 rounded-lg text-center text-sm ${
          apiStatus === 'online' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : apiStatus === 'offline'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {apiStatus === 'online' && '🟢 Sistema Online'}
          {apiStatus === 'offline' && '🔴 Sistema Offline'}
          {apiStatus === 'checking' && '🟡 Verificando conexão...'}
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2 animate-fadeIn">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuário
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={loginData.usuario}
                onChange={(e) => setLoginData({...loginData, usuario: e.target.value})}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Digite seu usuário"
                disabled={loading || apiStatus === 'offline'}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                value={loginData.senha}
                onChange={(e) => setLoginData({...loginData, senha: e.target.value})}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Digite sua senha"
                disabled={loading || apiStatus === 'offline'}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition duration-200"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || apiStatus === 'offline' || !loginData.usuario || !loginData.senha}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Entrando...
              </>
            ) : (
              <>
                <Lock size={20} />
                Entrar
              </>
            )}
          </button>
        </div>

        {/* Credenciais de teste */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Usuários para teste:</p>
          <div className="text-xs space-y-1">
            <div><strong>Admin:</strong> admin / 123456</div>
            <div><strong>Gerente:</strong> gerente1 / 123456</div>
            <div><strong>Vendedor:</strong> vendedor1 / 123456</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Menu Lateral
  const MenuLateral = () => {
    const menuItems = [
      { id: 'dashboard', icon: BarChart3, label: 'Dashboard', permissao: null },
      { id: 'produtos', icon: Package, label: 'Produtos', permissao: 'produtos' },
      { id: 'vendas', icon: ShoppingCart, label: 'Vendas', permissao: 'vendas' },
      { id: 'clientes', icon: Users, label: 'Clientes', permissao: 'clientes' },
      { id: 'relatorios', icon: FileText, label: 'Relatórios', permissao: 'relatorios' },
      { id: 'configuracoes', icon: Settings, label: 'Configurações', permissao: 'todas' },
    ];

    return (
      <>
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`bg-gray-800 text-white w-64 min-h-screen p-4 fixed lg:relative z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Header do menu */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="text-2xl font-black">
                <span className="text-white">HM</span>
                <span className="text-blue-400">Celular</span>
              </div>
              <div className="ml-2">
                <div className="relative">
                  <div className="w-6 h-10 bg-white rounded transform rotate-12"></div>
                  <div className="absolute top-0 left-0 w-5 h-9 bg-gray-800 rounded transform rotate-12"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-10 bg-white rounded transform -rotate-12 opacity-60"></div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="text-xs text-blue-400 mb-1">ACESSÓRIOS PARA CELULAR E SERVIÇOS</div>
          <div className="text-xs text-gray-400 mb-8">Sistema de Gestão v1.0</div>

          {/* Menu de navegação */}
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => {
              const isVisible = !item.permissao || temPermissao(item.permissao);
              const isActive = currentPage === item.id;
              
              if (!isVisible) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Informações do usuário */}
          <div className="mt-auto">
            <div className="bg-gray-700 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium truncate">{currentUser?.nome}</p>
              <p className="text-xs text-gray-400 capitalize">{currentUser?.tipo}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser?.loja_nome}</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-400">Online</span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition duration-200"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </>
    );
  };

  // Dashboard Principal
  const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState({
      vendas_hoje: 'R$ 0,00',
      produtos_cadastrados: 0,
      clientes_ativos: 0,
      estoque_baixo: 0,
      loading: true
    });

    useEffect(() => {
      // Simular carregamento de dados
      setTimeout(() => {
        setDashboardData({
          vendas_hoje: 'R$ 2.450,00',
          produtos_cadastrados: 347,
          clientes_ativos: 1203,
          estoque_baixo: 23,
          loading: false
        });
      }, 1000);
    }, []);

    const cards = [
      {
        titulo: 'Vendas Hoje',
        valor: dashboardData.vendas_hoje,
        variacao: '+12%',
        tipo: 'positivo',
        icone: ShoppingCart,
        cor: 'green'
      },
      {
        titulo: 'Produtos Cadastrados',
        valor: dashboardData.produtos_cadastrados,
        variacao: 'Sistema integrado',
        tipo: 'neutro',
        icone: Package,
        cor: 'blue'
      },
      {
        titulo: 'Clientes Ativos',
        valor: dashboardData.clientes_ativos,
        variacao: 'Base crescendo',
        tipo: 'positivo',
        icone: Users,
        cor: 'purple'
      },
      {
        titulo: 'Estoque Baixo',
        valor: dashboardData.estoque_baixo,
        variacao: 'Requer atenção',
        tipo: 'negativo',
        icone: Package,
        cor: 'red'
      }
    ];

    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">HMCelular</span> - Sistema de Gestão
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-800">{currentUser?.nome}</div>
            <div className="text-xs text-gray-600 capitalize">{currentUser?.tipo} | {currentUser?.loja_nome}</div>
            <div className="text-xs text-green-600 flex items-center justify-end gap-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Conectado ao servidor
            </div>
          </div>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.titulo}</p>
                  {dashboardData.loading ? (
                    <div className="skeleton h-8 w-24 mt-1"></div>
                  ) : (
                    <p className={`text-2xl font-bold text-${card.cor}-600`}>
                      {card.valor}
                    </p>
                  )}
                  <div className="flex items-center mt-1">
                    {card.tipo === 'positivo' && <TrendingUp size={12} className="text-green-500 mr-1" />}
                    {card.tipo === 'negativo' && <TrendingDown size={12} className="text-red-500 mr-1" />}
                    {card.tipo === 'neutro' && <Minus size={12} className="text-gray-500 mr-1" />}
                    <p className={`text-xs ${
                      card.tipo === 'positivo' ? 'text-green-600' : 
                      card.tipo === 'negativo' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {card.variacao}
                    </p>
                  </div>
                </div>
                <div className={`bg-${card.cor}-100 rounded-full p-3`}>
                  <card.icone className={`text-${card.cor}-600`} size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Seção inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Permissões do usuário */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Suas Permissões</h3>
            <div className="space-y-2">
              {currentUser?.permissoes.includes('todas') ? (
                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  🔓 Acesso Completo (Administrador)
                </span>
              ) : (
                <div className="space-y-2">
                  {currentUser?.permissoes.map((permissao, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 capitalize">
                        {permissao.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-800">
                <strong>Tipo:</strong> {currentUser?.tipo}
              </div>
              <div className="text-xs text-blue-800">
                <strong>Loja:</strong> {currentUser?.loja_nome}
              </div>
              {currentUser?.ultimo_login && (
                <div className="text-xs text-blue-800">
                  <strong>Último login:</strong> {new Date(currentUser.ultimo_login).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          </div>

          {/* Produtos em destaque */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Produtos em Destaque</h3>
            <div className="space-y-3">
              {[
                { nome: 'Películas de Vidro', trend: '+15%', tipo: 'positivo' },
                { nome: 'Capinhas Transparentes', trend: '+8%', tipo: 'positivo' },
                { nome: 'Carregadores Tipo-C', trend: 'Estável', tipo: 'neutro' },
                { nome: 'Fones Bluetooth', trend: '-5%', tipo: 'negativo' }
              ].map((produto, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition duration-200">
                  <span className="text-sm font-medium">{produto.nome}</span>
                  <div className="flex items-center gap-1">
                    {produto.tipo === 'positivo' && <TrendingUp size={14} className="text-green-500" />}
                    {produto.tipo === 'negativo' && <TrendingDown size={14} className="text-red-500" />}
                    {produto.tipo === 'neutro' && <Minus size={14} className="text-gray-500" />}
                    <span className={`text-sm ${
                      produto.tipo === 'positivo' ? 'text-green-600' : 
                      produto.tipo === 'negativo' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {produto.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status do sistema */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status do Sistema</h3>
            <div className="space-y-3">
              {[
                { item: 'Backend Online', status: 'online' },
                { item: 'Banco de Dados', status: 'online' },
                { item: 'Autenticação JWT', status: 'online' },
                { item: 'Etapa 2: Produtos', status: 'desenvolvimento' },
                { item: 'Etapa 3: Clientes', status: 'planejado' }
              ].map((status, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status.status === 'online' ? 'bg-green-500' :
                    status.status === 'desenvolvimento' ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    {status.status === 'online' && '✅'}
                    {status.status === 'desenvolvimento' && '🚧'}
                    {status.status === 'planejado' && '⏳'}
                    {' '}{status.item}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">
                <strong>Versão:</strong> 1.0.0<br />
                <strong>Ambiente:</strong> {process.env.NODE_ENV || 'Produção'}<br />
                <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Páginas em desenvolvimento
  const PaginaEmDesenvolvimento = ({ titulo }) => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{titulo}</h2>
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          <Menu size={20} />
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Settings className="text-yellow-600" size={32} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Módulo em Desenvolvimento</h3>
        <p className="text-gray-600 mb-4">
          Esta funcionalidade será implementada na próxima etapa do projeto.
        </p>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Próxima Etapa:</strong> Sistema completo de {titulo.toLowerCase()} integrado ao backend MySQL
          </p>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <p>📋 <strong>Fase 2:</strong> Produtos e Estoque</p>
          <p>🛒 <strong>Fase 3:</strong> Vendas e Clientes</p>
          <p>📊 <strong>Fase 4:</strong> Relatórios Avançados</p>
        </div>
      </div>
    </div>
  );

  // Renderização de páginas
  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'produtos':
        return <PaginaEmDesenvolvimento titulo="Produtos" />;
      case 'vendas':
        return <PaginaEmDesenvolvimento titulo="Vendas" />;
      case 'clientes':
        return <PaginaEmDesenvolvimento titulo="Clientes" />;
      case 'relatorios':
        return <PaginaEmDesenvolvimento titulo="Relatórios" />;
      case 'configuracoes':
        return <PaginaEmDesenvolvimento titulo="Configurações" />;
      default:
        return <Dashboard />;
    }
  };

  // Renderização principal
  if (!currentUser) {
    return <TelaLogin />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <MenuLateral />
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header mobile */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <Menu size={20} />
          </button>
          <div className="text-lg font-bold">
            <span className="text-black">HM</span>
            <span className="text-blue-600">Celular</span>
          </div>
          <div className="w-10"></div>
        </div>
        
        {/* Conteúdo principal */}
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default SistemaHMCelular;