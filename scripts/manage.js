/**
 * Sitema Nutricionista - Management CLI
 * Use: node scripts/manage.js [command]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const command = process.argv[2];

const help = () => {
  console.log(`
🚀 Ecossistema de Gerenciamento - Sitema Nutricionista

Comandos disponíveis:
  check-env   - Verifica se as variáveis de ambiente estão configuradas.
  db-schema   - Exibe o caminho do arquivo de esquema SQL atual.
  deploy      - Atalho para instruções de deploy (Vercel).
  help        - Mostra esta mensagem.
  `);
};

const checkEnv = () => {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  let missing = false;

  console.log('🔍 Verificando variáveis de ambiente...');
  required.forEach(key => {
    if (!process.env[key]) {
      console.error(`❌ [ERRO] ${key} não encontrada no arquivo .env`);
      missing = true;
    } else {
      console.log(`✅ ${key} está configurada.`);
    }
  });

  if (missing) {
    console.log('\n💡 Dica: Copie o arquivo .env.example para .env e preencha seus dados do Supabase.');
  } else {
    console.log('\n✨ Tudo pronto para conectar ao banco de dados!');
  }
};

const dbSchema = () => {
  const schemaPath = path.resolve('supabase/migrations/00_initial_schema.sql');
  console.log(`📜 O esquema atual do banco de dados está em:\n${schemaPath}`);
};

const deploy = () => {
  console.log(`
🌍 Instruções de Deploy:

1. Build do projeto:
   npm run build

2. Deploy via Vercel:
   npx vercel --prod

Certifique-se de configurar as variáveis de ambiente no painel da Vercel!
  `);
};

switch (command) {
  case 'check-env':
    checkEnv();
    break;
  case 'db-schema':
    dbSchema();
    break;
  case 'deploy':
    deploy();
    break;
  case 'help':
  default:
    help();
}
