# ⚙️ Guia de Configuração e Instalação

Este guia contém todas as instruções necessárias para baixar, configurar e rodar o projeto **Pokédex Fullstack MVC** localmente.

---

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

1.  **Node.js** (Versão 18 ou superior recomendada)
    - [Baixar Node.js](https://nodejs.org/)
2.  **MySQL** (Versão 8.0 ou superior)
    - [Baixar MySQL](https://dev.mysql.com/downloads/installer/)
3.  **Git** (Para clonar o repositório)
    - [Baixar Git](https://git-scm.com/)

---

## 🚀 Passo a Passo

### 1. Clonar o Repositório

Abra o terminal e execute:
```bash
git clone https://github.com/SeuUsuario/POK-DEX-FULL-STACK-MVC-.git
cd POK-DEX-FULL-STACK-MVC-
```

### 2. Instalar Dependências

O projeto possui dependências na raiz e no backend. Execute os comandos abaixo na ordem:

```powershell
# Instalar dependências da raiz
npm install

# Instalar dependências do backend
cd backend
npm install
cd ..
```

### 3. Configurar Variáveis de Ambiente

1.  Na raiz do projeto, você encontrará um arquivo chamado `.env.example`.
2.  Crie uma cópia deste arquivo e renomeie para `.env`.
3.  Abra o arquivo `.env` e preencha as credenciais do seu MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=pokedex_db
DB_PORT=3306

JWT_SECRET=f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8
PORT=3000
```

### 4. Configurar o Banco de Dados

1.  Certifique-se de que o seu serviço MySQL está rodando.
2.  Crie o banco de dados `pokedex_db`.
3.  Execute o script de migração para criar as tabelas necessárias:

```bash
node backend/scripts/migrate.js
```

---

## 🛠️ Como Rodar o Projeto

### Rodar o Backend (Servidor)

Na raiz do projeto, execute:
```bash
npm run dev
```
O servidor estará rodando em `http://localhost:3000`.

### Rodar o Frontend (Interface)

Você pode abrir o arquivo `frontend/index.html` diretamente no navegador ou usar uma extensão como **Live Server** no VS Code para uma melhor experiência.

Se você tiver o `live-server` instalado globalmente, pode rodar:
```bash
npm run start:frontend
```

---

## 🔐 Requisitos de Senha no Cadastro

Ao criar uma conta, certifique-se de que sua senha atenda aos seguintes critérios:
- Pelo menos **8 caracteres**.
- Pelo menos **uma letra maiúscula**.
- Pelo menos **um caractere especial** (ex: `@`, `!`, `#`).

---

## 🐞 Solução de Problemas Comuns

- **Erro de Permissão no PowerShell (Windows):**
  Se o comando `npm` falhar por erro de segurança, abra o PowerShell como Administrador e execute:
  `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

- **Erro de Conexão com Banco de Dados:**
  Verifique se o usuário e a senha no arquivo `.env` estão corretos e se o MySQL está rodando na porta 3306.
