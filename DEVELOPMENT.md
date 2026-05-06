# 🛠️ Ecossistema de Desenvolvimento

Este documento descreve as ferramentas e processos configurados para gerenciar o projeto **Sitema Nutricionista** e sua conexão com o banco de dados.

## 🏗️ Estrutura do Ecossistema

O projeto utiliza uma abordagem centrada no **Supabase** para backend e **Vite/React** para frontend, com ferramentas de suporte para automação.

### 1. Gerenciamento de Banco de Dados
O esquema do banco de dados está versionado na pasta `supabase/migrations`. Isso permite que você:
- Tenha um histórico de alterações.
- Replique o banco de dados em novos ambientes rapidamente.
- Arquivo Principal: `supabase/migrations/00_initial_schema.sql`.

### 2. Scripts de Utilidade (CLI)
Criamos um pequeno "CLI de Gestão" para centralizar tarefas comuns.
Comandos disponíveis via `npm`:
- `npm run check-env`: Verifica se as chaves do Supabase estão configuradas corretamente no seu `.env`.
- `npm run manage help`: Mostra todos os comandos de gestão disponíveis.

### 3. Conectividade
A conexão é feita através do cliente Supabase em `src/lib/supabase.js`, utilizando variáveis de ambiente para segurança.
- **Produção**: Conecta ao projeto `nutricionista_sistema` no Supabase.
- **Local**: Utiliza o servidor de desenvolvimento do Vite com hot-reload.

## 🔄 Fluxo de Trabalho Recomendado

1.  **Sincronização**: Sempre que houver uma mudança estrutural no banco (via dashboard do Supabase), documente-a no arquivo de migração.
2.  **Verificação**: Use `npm run check-env` ao iniciar o desenvolvimento em uma nova máquina.
3.  **Segurança**: Nunca suba o arquivo `.env` para o GitHub. Use o `.env.example` como referência.
4.  **Deploy**: Utilize o comando `npm run build` seguido de `npx vercel --prod` para publicar alterações.

## 📈 Evolução do Ecossistema
Para o futuro, este ecossistema pode ser expandido com:
- **Testes Automatizados**: Inclusão de Vitest para testar a lógica de negócio.
- **Supabase CLI**: Integração total com migrações locais e edge functions via CLI oficial.
- **Docker**: Containerização do ambiente frontend para paridade total entre desenvolvedores.
