# 🚀 E-Commerce & SaaS Event-Driven em Tempo Real

Aplicação Full-Stack de E-Commerce/SaaS com arquitetura **orientada a eventos (Event-Driven)**, processamento assíncrono de pagamentos/pedidos via filas em segundo plano e notificações em tempo real bidirecionais através de WebSockets.

Projetada com foco em alta performance, resiliência e escalabilidade horizontal.

---

## 🛠️ Tecnologias Utilizadas

### **Backend (API)**
- **Runtime & Framework:** Node.js, Fastify, TypeScript
- **Banco de Dados Relacional:** PostgreSQL 16 (via Docker)
- **ORM:** Drizzle ORM + Drizzle Kit (Migrations e Introspection)
- **Mensageria & Filas:** Redis, BullMQ
- **Comunicação em Tempo Real:** Fastify WebSocket (`@fastify/websocket`, `ws`)
- **Autenticação & Segurança:** JWT (`@fastify/jwt`), Bcryptjs, Zod (Validação de Schemas)

### **Frontend (Web App)**
- **Framework:** Next.js 14+ (App Router)
- **Estilização:** Tailwind CSS
- **Ícones:** Lucide React
- **Cliente HTTP:** Axios

---

## 📐 Arquitetura da Aplicação

```
[ Cliente Next.js ] ──(HTTP POST /checkout)──> [ API Fastify ] ──(202 Accepted <50ms)
        │                                             │
        │ (Escuta WebSocket)                          │ (Adiciona Job)
        ▼                                             ▼
  [ WebSocket ] <─── (Broadcast & Notify) ──── [ Redis / BullMQ Queue ]
                                                      │
                                                      │ (Worker Processa)
                                                      ▼
                                           [ PostgreSQL / Drizzle ]
```

1. **Fast-Response Pattern:** Ao realizar o checkout, a API grava o pedido com status `pending` no PostgreSQL e delega o processamento ao **BullMQ/Redis**, retornando `202 Accepted` em menos de 50ms.
2. **Background Processing:** O Worker do BullMQ consome o evento da fila, simula a verificação no gateway de pagamento e atualiza o estoque e status do pedido no PostgreSQL.
3. **Real-time Synchronization:** O Worker aciona o módulo de WebSockets do Fastify para emitir notificações individuais para o cliente e fazer broadcast global da atualização de estoque.

---

## ⚡ Pré-requisitos

Certifique-se de ter instalado na sua máquina:
- **Node.js** (v18.x ou superior)
- **npm** ou **pnpm**
- **Docker** e **Docker Compose**

---

## 📂 Estrutura das Variáveis de Ambiente (.env)

### Backend (`apps/api/.env`)
Crie o arquivo `.env` dentro da pasta `apps/api` com as seguintes configurações:

```env
PORT=3333
NODE_ENV=development

# Conexão com o PostgreSQL
DATABASE_URL="postgres://postgres:postgres@localhost:5433/saas_db"

# Conexão com o Redis
REDIS_HOST="localhost"
REDIS_PORT=6380

# Autenticação
JWT_SECRET="sua-chave-secreta-super-segura-e-longa-para-jwt"
```

### Frontend (`apps/web/.env.local`) - *Opcional*
```env
NEXT_PUBLIC_API_URL="http://localhost:3333"
NEXT_PUBLIC_WS_URL="ws://localhost:3333"
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/saas-ecommerce-realtime.git
cd saas-ecommerce-realtime
```

### 2. Subir os Containers do Docker (PostgreSQL & Redis)
Inicie o PostgreSQL (porta `5433`) e o Redis (porta `6380`):
```bash
docker-compose up -d
```

### 3. Configurar e Iniciar o Backend (API)
Navegue até a pasta da API, instale as dependências e rode as migrações do banco de dados:
```bash
cd apps/api
npm install

# Executar as migrações do Drizzle ORM
npx drizzle-kit push

# Iniciar o servidor de desenvolvimento
npm run dev
```
O servidor estará rodando em `http://localhost:3333`.

### 4. Configurar e Iniciar o Frontend (Next.js)
Em um novo terminal, navegue até a pasta do aplicativo web:
```bash
cd apps/web
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```
Acesse a aplicação no seu navegador: `http://localhost:3000`.

---

## 🧪 Testando o Fluxo Completo (E2E)

1. Acesse `http://localhost:3000`.
2. Faça login com as credenciais padrão:
   - **E-mail:** `vinicius@email.com`
   - **Senha:** `senha123secura`
3. O status do topo mudará para **Conectado** e a conexão WebSocket será estabelecida.
4. Clique no botão **Comprar Agora** em um produto.
5. Note a resposta imediata da API (`202 Accepted`) e o toast do worker processando.
6. Após 2 segundos, veja a notificação verde de **Pedido Aprovado!** surgir em tempo real e a contagem de estoque decrementar automaticamente.

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usá-lo e adaptá-lo para seus próprios estudos e projetos.