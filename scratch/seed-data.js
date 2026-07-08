const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Parser manual do arquivo .env
const envPath = path.join(__dirname, '..', '.env');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
}

const host = env.DB_HOST || 'localhost';
const port = 5432; // Porta do PostgreSQL local ativa
const user = env.DB_USERNAME || 'postgres';
const password = env.DB_PASSWORD || '98653211';
const dbName = env.DB_DATABASE || 'votacao';

async function ensureDatabaseExists() {
  const adminClient = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`Banco de dados "${dbName}" não encontrado. Criando...`);
      // CREATE DATABASE não aceita parâmetros normais, então concatenamos com segurança já que é local
      await adminClient.query(`CREATE DATABASE ${dbName};`);
      console.log(`Banco de dados "${dbName}" criado com sucesso.`);
    } else {
      console.log(`Banco de dados "${dbName}" já existe.`);
    }
  } catch (err) {
    console.error('Erro ao verificar/criar o banco de dados:', err);
    throw err;
  } finally {
    await adminClient.end();
  }
}

async function seed() {
  const client = new Client({
    host,
    port,
    user,
    password,
    database: dbName,
  });

  await client.connect();
  console.log(`Conectado ao banco de dados "${dbName}" para seeding!`);

  // Verificar se a tabela de concursos já existe
  const checkTable = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'contests'
    );
  `);

  if (!checkTable.rows[0].exists) {
    console.log('\n[AVISO] A estrutura de tabelas ainda não foi criada no banco de dados.');
    console.log('Inicie o servidor backend (NestJS) pelo menos uma vez para que o TypeORM crie as tabelas automaticamente.');
    console.log('Depois, execute este script de seed novamente.\n');
    await client.end();
    return;
  }

  // 1. Limpar dados anteriores
  console.log('Limpando dados de votações, candidatas e concursos antigos...');
  await client.query('DELETE FROM votes;');
  // Deletar da tabela results_summary se ela existir
  try {
    await client.query('DELETE FROM results_summary;');
  } catch (e) {
    // Ignora se a tabela não existir
  }
  await client.query('DELETE FROM candidates;');
  await client.query('DELETE FROM categories;');
  await client.query('DELETE FROM contests;');

  // 2. Definir datas (início em 2 minutos a partir de agora, encerramento em 1 hora)
  const now = new Date();
  const inicio = new Date(now.getTime() + 2 * 60 * 1000); // +2 minutos
  const encerramento = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora

  console.log(`Definindo período do concurso:`);
  console.log(` - Início: ${inicio.toISOString()}`);
  console.log(` - Fim: ${encerramento.toISOString()}`);

  // 3. Cadastrar o Concurso
  const contestResult = await client.query(`
    INSERT INTO contests (nome, descricao, cidade, ano, inicio, encerramento, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING id;
  `, [
    'Rainha da Festa do Peão 2026',
    'Concurso para eleger a Rainha da Festa do Peão de Barretos 2026. A votação oficial começará em breve!',
    'Barretos',
    2026,
    inicio,
    encerramento,
    'open' // Votação "aberta" na liberação administrativa, mas com horário de início no futuro.
  ]);
  const contestId = contestResult.rows[0].id;
  console.log(`Concurso cadastrado com ID: ${contestId}`);

  // 4. Cadastrar Categorias
  const catInfantilResult = await client.query(`
    INSERT INTO categories (contest_id, nome, tipo, ativo, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING id;
  `, [contestId, 'Categoria Infantil', 'infantil', true]);
  const catInfantilId = catInfantilResult.rows[0].id;

  const catAdultaResult = await client.query(`
    INSERT INTO categories (contest_id, nome, tipo, ativo, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING id;
  `, [contestId, 'Categoria Adulta', 'adulta', true]);
  const catAdultaId = catAdultaResult.rows[0].id;

  console.log('Categorias cadastradas com sucesso!');

  // 5. Cadastrar Candidatas
  // Categoria Infantil
  await client.query(`
    INSERT INTO candidates (category_id, nome, foto, descricao, numero, ativo, created_at, updated_at)
    VALUES 
      ($1, 'Maria Eduarda', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', 'Maria tem 8 anos e adora dançar.', 10, true, NOW(), NOW()),
      ($1, 'Sofia Ramos', 'https://images.unsplash.com/photo-1517841905240-472988babdf9', 'Sofia tem 9 anos e pratica ginástica artística.', 11, true, NOW(), NOW());
  `, [catInfantilId]);

  // Categoria Adulta
  await client.query(`
    INSERT INTO candidates (category_id, nome, foto, descricao, numero, ativo, created_at, updated_at)
    VALUES 
      ($1, 'Amanda Silva', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'Amanda tem 21 anos e estuda Agronomia.', 20, true, NOW(), NOW()),
      ($1, 'Leticia Santos', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'Leticia tem 23 anos e pratica montaria.', 21, true, NOW(), NOW());
  `, [catAdultaId]);

  console.log('Candidatas cadastradas com sucesso!');
  console.log('\n--- PRONTO PARA TESTES ---');
  console.log(`O concurso iniciará em exatamente 2 minutos (às ${inicio.toLocaleTimeString('pt-BR')})`);

  await client.end();
}

async function main() {
  await ensureDatabaseExists();
  await seed();
}

main().catch(err => {
  console.error('Erro geral no script de seed:', err);
});
