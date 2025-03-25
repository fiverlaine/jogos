# Jogos Clássicos
# Teste de commit

Uma coleção de jogos clássicos com design moderno e recursos avançados.

## Jogos Disponíveis

- **Jogo da Velha**: Versão local e online do tradicional jogo da velha.
- **Jogo da Memória**: Teste sua capacidade de memorização.

## Em Breve

- **Ludo**: Jogo de tabuleiro estratégico.
- **Snake**: Jogo da cobrinha clássico.
- **Jogo da Forca**: Adivinhe a palavra oculta.

## Tecnologias Utilizadas

- Next.js
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase (para o modo online)
- Shadcn/ui (componentes)

## Recursos

- Interface de usuário moderna e responsiva
- Efeitos visuais e animações
- Modo online para o Jogo da Velha
- Sistema de autenticação

## Configuração do Modo Online

Para configurar o modo online do Jogo da Velha, você precisa:

1. Criar uma conta no [Supabase](https://supabase.com/)
2. Criar um novo projeto no Supabase
3. Configurar as variáveis de ambiente:

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=seu-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key-do-supabase
```

4. Configure o banco de dados executando o arquivo SQL:
   - Navegue até o Editor SQL no painel de controle do Supabase
   - Cole o conteúdo do arquivo `supabase/schema.sql`
   - Execute o SQL para criar as tabelas necessárias

5. Configure a autenticação no Supabase:
   - Habilite o método de autenticação por Email/Senha
   - Configure redirecionamentos conforme necessário
   - Você também pode habilitar provedores OAuth (Google, GitHub, etc.)

## Instalação e Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Iniciar em modo de produção
npm start
```

## Estrutura do Projeto

- `app/`: Contém as páginas e rotas do Next.js
- `components/`: Componentes reutilizáveis
- `lib/`: Utilitários e configurações (incluindo cliente Supabase)
- `context/`: Contextos React (autenticação)
- `styles/`: Estilos globais
- `public/`: Arquivos estáticos

## Funcionalidades do Modo Online

O modo online do Jogo da Velha oferece:

- Autenticação de usuários
- Criação de salas de jogo
- Lista de jogos disponíveis
- Jogo em tempo real
- Histórico de jogadas
- Notificações e feedback visual

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir um issue ou enviar um pull request. 