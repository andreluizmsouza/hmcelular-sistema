const mysql = require('mysql2');

// Configuração da conexão
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'hmcelular',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hmcelular_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4'
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

// Função de teste de conexão com retry
const testConnection = async () => {
    const maxRetries = 5;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            const connection = await promisePool.getConnection();
            console.log('✅ Conectado ao MySQL com sucesso');
            console.log(`📊 Host: ${dbConfig.host}:${dbConfig.port}`);
            console.log(`📊 Database: ${dbConfig.database}`);
            connection.release();
            return true;
        } catch (error) {
            retries++;
            console.log(`❌ Tentativa ${retries}/${maxRetries} falhou:`, error.message);
            
            if (retries === maxRetries) {
                console.error('❌ Não foi possível conectar ao MySQL após', maxRetries, 'tentativas');
                console.error('💡 Verifique:');
                console.error('   - Se o MySQL está rodando');
                console.error('   - Se as credenciais estão corretas');
                console.error('   - Se o banco de dados existe');
                console.error('   - Se as variáveis de ambiente estão configuradas');
                process.exit(1);
            }
            
            // Aguardar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

// Testar conexão na inicialização
testConnection();

// Função helper para executar queries com log
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await promisePool.execute(query, params);
        return results;
    } catch (error) {
        console.error('❌ Erro na query:', error.message);
        console.error('📝 Query:', query);
        console.error('📝 Params:', params);
        throw error;
    }
};

module.exports = {
    pool: promisePool,
    executeQuery,
    testConnection
};