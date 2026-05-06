# 🥗 Sistema Nutricionista

Um sistema moderno e intuitivo desenvolvido para auxiliar nutricionistas na gestão de seus pacientes, planos alimentares e acompanhamento de progresso.

## 🚀 Funcionalidades Principais

- **🔐 Autenticação Segura**: Sistema de login e registro integrado com Supabase.
- **📊 Dashboard Estratégico**: Visão geral de pacientes, consultas e métricas rápidas com gráficos interativos.
- **👥 Gestão de Pacientes**: Cadastro completo incluindo:
  - Dados Pessoais e Contato.
  - **Anamnese Detalhada**: Histórico médico, estilo de vida e objetivos.
  - **Antropometria**: Registro de peso, altura, circunferências e dobras cutâneas.
  - **Preferências Alimentares**: Registro de gostos, aversões e rotina alimentar.
- **📱 Design Responsivo**: Interface premium otimizada para desktops e tablets.
- **🎨 Experiência do Usuário**: Navegação fluida com Sidebar e Layout estruturado.

## 📸 Screenshots

| Login | Cadastro |
|-------|----------|
| ![Login](./screenshots/login.png) | ![Cadastro](./screenshots/cadastro.png) |

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Backend/Banco de Dados**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Roteamento**: [React Router DOM](https://reactrouter.com/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Estilização**: CSS Vanilla (Design System Proprietário)

## 📁 Estrutura do Projeto

```text
src/
├── components/   # Componentes reutilizáveis (Sidebar, Layout, etc)
├── context/      # Gerenciamento de estado global (Auth)
├── lib/          # Configurações de bibliotecas externas (Supabase client)
├── pages/        # Telas principais da aplicação
├── assets/       # Imagens e recursos estáticos
└── index.css     # Sistema de design e estilos globais
```

## ⚙️ Configuração e Instalação

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Conta no [Supabase](https://supabase.com/)

### Passo a Passo

1.  **Clonar o repositório**
    ```bash
    git clone https://github.com/seu-usuario/sistema-nutricionista.git
    cd sistema-nutricionista
    ```

2.  **Instalar dependências**
    ```bash
    npm install
    ```

3.  **Configurar Variáveis de Ambiente**
    Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
    ```env
    VITE_SUPABASE_URL=sua_url_do_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
    ```

4.  **Executar o projeto**
    ```bash
    npm run dev
    ```

---

## 📝 Processo de Desenvolvimento

Este projeto foi desenvolvido com foco em robustez e escalabilidade. O processo seguiu as seguintes etapas:

1.  **Definição de Requisitos**: Identificamos as dores reais de um nutricionista, priorizando a centralização dos dados do paciente (desde a primeira consulta até a dieta).
2.  **Arquitetura de Dados**: O banco de dados foi estruturado no Supabase para garantir segurança e facilidade na gestão de relacionamentos complexos (Pacientes -> Consultas -> Medidas).
3.  **Design System**: Optamos por não utilizar frameworks CSS (como Tailwind) para ter controle total sobre a estética "Premium". Criamos um sistema de cores baseado em tons de Esmeralda e Slate, transmitindo saúde e profissionalismo.
4.  **Componentização**: A aplicação foi construída de forma modular, facilitando a manutenção e a adição de futuras funcionalidades como "Gerador de Dietas por IA".
5.  **Segurança**: Implementamos guards de rotas para garantir que apenas usuários autenticados acessem os dados sensíveis dos pacientes.

---

Desenvolvido com ❤️ para profissionais da saúde.
