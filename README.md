# Maratona App Wrapper

Um wrapper Node.js para a API do maratona.app que permite buscar informações de usuários e status de leitura atual.

## Instalação

```bash
npm install maratona-app-wrapper
```

## Dependências

- `axios` - Para requisições HTTP
- `cheerio` - Para análise de HTML

## Uso

### Usando a instância padrão

```javascript
const maratonaAppWrapper = require('maratona-app-wrapper');

async function obterInfoUsuario() {
    try {
        const usuario = await maratonaAppWrapper.getUser('luisgbr1el');
        console.log(usuario);
        
        const leituraAtual = await maratonaAppWrapper.getCurrentReading('luisgbr1el');
        console.log(leituraAtual);
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

obterInfoUsuario();
```

### Criando uma instância personalizada

```javascript
const { MaratonaAppWrapper } = require('maratona-app-wrapper');

const wrapper = new MaratonaAppWrapper('https://custom-url.com');

async function obterInfoUsuario() {
    try {
        const usuario = await wrapper.getUser('luisgbr1el');
        console.log(usuario);
        
        const leituraAtual = await wrapper.getCurrentReading('luisgbr1el');
        console.log(leituraAtual);
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

obterInfoUsuario();
```

## API

### `getUser(username)`

Busca informações do usuário no maratona.app.

**Parâmetros:**
- `username` (string): O nome de usuário a ser buscado

**Retorna:**
Uma Promise que resolve para um objeto contendo:
- `username` (string): O nome de usuário
- `url` (string): A URL do perfil do usuário
- `avatar` (string|null): A URL do avatar do usuário, ou null se não encontrado
- `pronouns` (string|null): Os pronomes do usuário, ou null se não especificado

**Exemplo:**
```javascript
const usuario = await maratonaAppWrapper.getUser('luisgbr1el');
// {
//   username: 'luisgbr1el',
//   url: 'https://maratona.app/@luisgbr1el',
//   avatar: 'https://cdn.maratona.app/avatar.jpg',
//   pronouns: 'ele/dele'
// }
```

**Lança:**
- Erro se o usuário não for encontrado ou foi renomeado

### `getCurrentReading(username)`

Busca as informações de leitura atual de um usuário no maratona.app.

**Parâmetros:**
- `username` (string): O nome de usuário para buscar a leitura atual

**Retorna:**
Uma Promise que resolve para um objeto contendo:
- `title` (string): O título do livro sendo lido atualmente
- `percentage` (number): Porcentagem do progresso de leitura
- `cover` (string|null): A URL da imagem da capa do livro, ou null se não encontrada

**Exemplo:**
```javascript
const leituraAtual = await maratonaAppWrapper.getCurrentReading('luisgbr1el');
// {
//   title: 'O Programador Pragmático',
//   percentage: 45,
//   cover: 'https://cdn.maratona.app/book-cover.jpeg'
// }
```

**Lança:**
- Erro se o usuário não for encontrado
- Erro se o usuário não estiver lendo nada atualmente ou se sua estante de leitura for privada

## Testes

Execute a suíte de testes:

```bash
npm test
```

## Licença

ISC
