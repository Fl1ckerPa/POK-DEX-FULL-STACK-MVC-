# Guia de Testes Automatizados 🧪

Este guia contém as instruções para configurar e executar os testes automatizados do backend utilizando Jest e Supertest.

## 1. Pré-requisitos

Certifique-se de estar na pasta `backend` do projeto:

```bash
cd backend
```

## 2. Instalação do Jest e Supertest

Para que o usuário realize os testes, ele deve primeiro instalar as ferramentas necessárias. Execute o comando abaixo dentro da pasta `backend`:

```bash
npm install --save-dev jest supertest
```

*Caso prefira instalar o Jest globalmente para usar o comando `jest` diretamente em qualquer lugar do sistema (opcional):*
```bash
npm install -g jest
```

## 3. Configuração do Script de Teste

Para facilitar a execução, adicione o script de teste ao seu arquivo `package.json` na pasta `backend`:

```json
"scripts": {
  "test": "jest --config ../tests/jest.config.js"
}
```

*Nota: O comando acima aponta para o arquivo de configuração que movemos para a pasta de testes.*

## 4. Executando os Testes

Após a instalação e configuração do script, basta rodar:

```bash
npm test
```

## 5. Estrutura de Arquivos de Teste

- **Configuração:** `tests/jest.config.js`
- **Testes de Pokémon:** `tests/pokemon.test.js`

Os testes cobrem:
- Busca de Pokémon via PokéAPI.
- Funcionamento do Cache local.
- Tratamento de IDs inexistentes (404).
- Validação de entradas inválidas (400).
