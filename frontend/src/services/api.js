// Configuração da API do HMCelular
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Classe para gerenciar requisições da API
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('hmcelular_token');
  }

  // Método para fazer requisições HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Adicionar token se existir
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Se não autorizado, limpar token e redirecionar
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/';
        return null;
      }

      // Se erro de servidor
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Tentar fazer parse do JSON
      const data = await response.json();
      return data;

    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Métodos HTTP convenientes
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Gerenciamento de token
  setToken(token) {
    this.token = token;
    localStorage.setItem('hmcelular_token', token);
  }

  getToken() {
    return this.token || localStorage.getItem('hmcelular_token');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('hmcelular_token');
  }

  // Verificar se está autenticado
  isAuthenticated() {
    return !!this.getToken();
  }
}

// Instância da API
const api = new ApiService();

// Serviços específicos
export const authService = {
  // Login
  async login(usuario, senha) {
    const response = await api.post('/auth/login', { usuario, senha });
    if (response.success && response.token) {
      api.setToken(response.token);
    }
    return response;
  },

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Erro no logout:', error.message);
    } finally {
      api.clearToken();
    }
  },

  // Verificar usuário atual
  async me() {
    return api.get('/auth/me');
  },

  // Validar token
  async validateToken() {
    if (!api.isAuthenticated()) {
      return false;
    }
    
    try {
      const response = await this.me();
      return response.success;
    } catch (error) {
      api.clearToken();
      return false;
    }
  }
};

export const healthService = {
  // Verificar saúde da API
  async check() {
    return api.get('/health');
  },

  // Informações da API
  async info() {
    return api.get('/');
  }
};

// Serviços para futuras funcionalidades
export const productService = {
  // Placeholder para Fase 2
  async getAll() {
    throw new Error('Funcionalidade será implementada na Fase 2');
  },

  async getById(id) {
    throw new Error('Funcionalidade será implementada na Fase 2');
  },

  async create(product) {
    throw new Error('Funcionalidade será implementada na Fase 2');
  },

  async update(id, product) {
    throw new Error('Funcionalidade será implementada na Fase 2');
  },

  async delete(id) {
    throw new Error('Funcionalidade será implementada na Fase 2');
  }
};

export const stockService = {
  // Placeholder para Fase 2
  async getByStore(storeId) {
    throw new Error('Funcionalidade será implementada na Fase 2');
  },

  async transfer(fromStoreId, toStoreId, productId, quantity) {
    throw new Error('Funcionalidade será implementada na Fase 2');
  },

  async adjust(storeId, productId, quantity, reason) {
    throw new Error('Funcionalidade será implementada na Fase 2');
  }
};

export const reportService = {
  // Placeholder para futuras funcionalidades
  async getSales(filters) {
    throw new Error('Funcionalidade será implementada em breve');
  },

  async getStock(filters) {
    throw new Error('Funcionalidade será implementada em breve');
  },

  async getAudit(filters) {
    throw new Error('Funcionalidade será implementada em breve');
  }
};

// Utilitários
export const apiUtils = {
  // Formatar erros da API
  formatError(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'Erro desconhecido na API';
  },

  // Verificar se é erro de rede
  isNetworkError(error) {
    return error.message.includes('fetch') || 
           error.message.includes('Network') ||
           error.message.includes('Failed to fetch');
  },

  // Retry automático para requisições
  async withRetry(apiCall, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Se não é erro de rede, não tentar novamente
        if (!this.isNetworkError(error)) {
          throw error;
        }
        
        // Aguardar antes de tentar novamente
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw lastError;
  }
};

// Interceptor global para logs (desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  const originalRequest = api.request.bind(api);
  api.request = async function(endpoint, options) {
    const start = Date.now();
    console.log(`🔄 API Request: ${options?.method || 'GET'} ${endpoint}`);
    
    try {
      const result = await originalRequest(endpoint, options);
      const duration = Date.now() - start;
      console.log(`✅ API Success: ${endpoint} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`❌ API Error: ${endpoint} (${duration}ms)`, error.message);
      throw error;
    }
  };
}

export default api;