# SELPE - Backend API

API REST construída com Fastify, TypeScript, Zod, Firebase Admin (Auth & Firestore) e motor nativo de PDFs para o sistema da **Secretaria de Esportes e Lazer de Peruíbe (SELPE)**.

---

## 🚀 Como Executar com Docker Compose (Recomendado)

O projeto está configurado para rodar 100% isolado via Docker, incluindo os emuladores locais do Firebase (Auth e Firestore) e a API Fastify com hot-reload ativo.

```bash
# Na raiz do repositório
docker compose up -d
```

### Portas e Serviços:
* **API Fastify:** `http://localhost:3334`
* **Swagger / OpenAPI (Documentação Interativa):** `http://localhost:3334/docs`
* **Painel do Firebase Emulator Suite:** `http://localhost:4005`
* **Firestore Emulator:** `localhost:8085` (ou `firebase-emulator:8080` dentro da rede docker)
* **Firebase Auth Emulator:** `localhost:9095` (ou `firebase-emulator:9099` dentro da rede docker)

---

## 💻 Como Executar Localmente (Sem Docker)

```bash
cd backend
npm install
npm run dev
```

---

## 📚 Módulos e Endpoints Principais

### Autenticação (`/auth`)
* `POST /auth/login`: Autentica com CPF ou E-mail e Senha (retorna JWT com custom claims).
* `POST /auth/register-aluno`: Inscrição pública de atleta via QR Code com validação de CPF e emissão imediata de Carteirinha Digital.
* `GET /auth/me`: Retorna dados do usuário autenticado.

### Usuários & RBAC (`/users`)
* `POST /users`: Cadastro de profissionais (`monitor`, `coordenador`, `secretaria`).
* `GET /users`: Listagem de usuários com filtros por perfil e associação.
* `GET /users/:id`: Consulta de detalhes de usuário.

### Associações & Modalidades (`/associacoes`, `/modalidades`)
* `POST /associacoes` e `GET /associacoes`: Gestão de associações parceiras.
* `POST /modalidades` e `GET /modalidades`: Gestão de modalidades esportivas (Futsal, Surf, Vôlei, etc.).

### Turmas & Matrículas (`/turmas`, `/matriculas`)
* `POST /turmas` e `GET /turmas`: Cadastro de turmas, dias de aula, horários e capacidade.
* `POST /matriculas`: Enturmação de alunos.
* `GET /matriculas/carteirinha/:alunoId`: Retorna dados completos para exibição da Carteirinha Digital e QR Code.

### Operação de Campo & Sync Offline (`/chamadas`, `/checkins`)
* `POST /chamadas`: Registro de chamada em tempo real pelo monitor.
* `POST /chamadas/sync`: **Sincronização em lote** de chamadas salvas no IndexedDB (idempotente com `clientSyncId`).
* `POST /checkins`: Check-in do profissional com captura de geolocalização e data/hora oficial.
* `POST /checkins/sync`: **Sincronização em lote** de check-ins capturados offline.

### Relatórios Oficiais (`/relatorios`)
* `GET /relatorios/frequencia`: Cálculo da métrica percentual de frequência e assiduidade:
  $$\text{Frequência (\%)} = \left( \frac{\text{Total de Presenças}}{\text{Total de Aulas}} \right) \times 100$$
* `GET /relatorios/frequencia/pdf`: Gera e transmite em *stream* o PDF oficial padronizado com cabeçalho da Prefeitura de Peruíbe e assinaturas.
