# Documentação: Jogo da Forca

## Visão Geral

O Jogo da Forca é uma implementação moderna e interativa do clássico jogo de adivinhação de palavras. O jogo apresenta uma interface gráfica atraente com animações fluidas e efeitos visuais que seguem o mesmo estilo dos outros jogos da plataforma. O objetivo é adivinhar a palavra oculta antes que o boneco seja completamente desenhado (6 erros).

## Componentes Principais

### 1. Componente `Hangman`

O componente principal do jogo, responsável por toda a lógica e interface do usuário.

**Localização**: `components/hangman.tsx`

**Principais funcionalidades**:
- Seleção aleatória de palavras em português
- Sistema de dicas com penalidade
- Animação do boneco da forca
- Sistema de tempo de jogo
- Efeitos visuais e sonoros
- Teclado virtual interativo

### 2. Página do Jogo

**Localização**: `app/jogo-da-forca/page.tsx`

A página que integra o componente Hangman no layout principal da aplicação, mantendo a consistência com os outros jogos.

## Implementação Técnica

### Estrutura de Dados

1. **Palavras e Dicas**
   - Arrays e objetos para armazenar palavras em português e suas respectivas dicas
   - Cada palavra possui uma dica contextual que pode ser solicitada durante o jogo

2. **Estados do React**
   - `palavra`: A palavra selecionada para o jogo atual
   - `letrasAdivinhadas`: Array contendo as letras já tentadas pelo jogador
   - `erros`: Contador de erros (0-6)
   - `gameTime`: Tempo de jogo em segundos
   - `status`: Estado do jogo ("jogando", "venceu", "perdeu")

### Animações e Efeitos Visuais

1. **Framer Motion**
   - Animações de entrada e saída para componentes UI
   - Animações do boneco da forca (utilizando SVG animado)
   - Efeitos de transição para mensagens de vitória/derrota

2. **Confetti**
   - Efeito de confete ao vencer o jogo
   - Partículas coloridas animadas

### Sistema de Controle

1. **Inicialização**
   - Seleção aleatória de uma palavra
   - Resetar estados do jogo

2. **Verificações**
   - Verificação de vitória: todas as letras da palavra foram adivinhadas
   - Verificação de derrota: atingiu o máximo de erros permitidos

3. **Interatividade**
   - Teclado virtual para entrada de letras
   - Botão de dica com penalidade (adiciona um erro)
   - Botão para reiniciar o jogo

## Integração com o Projeto

O Jogo da Forca foi integrado ao restante da aplicação de maneira coesa:

1. **Design Consistente**
   - Gradientes, animações e componentes de UI seguindo o mesmo padrão dos outros jogos
   - Paleta de cores personalizadas (vermelho/rosa) para identidade visual própria

2. **Navegação**
   - Adicionado à página principal na seção de jogos populares
   - Botões de navegação no rodapé da página principal
   - Botão "Voltar para Jogos" na página do jogo

## Recursos

1. **Efeitos Sonoros**
   - Som de erro ao tentar letra incorreta
   - Som de acerto ao tentar letra correta
   - Som de vitória ao completar a palavra

2. **Animações SVG**
   - Desenho progressivo das partes do boneco
   - Animações de linha usando a propriedade `pathLength`

## Funcionalidades Especiais

1. **Sistema de Dicas**
   - O jogador pode solicitar uma dica sobre a palavra
   - Solicitar uma dica adiciona um erro ao contador (estratégia de risco)

2. **Cronômetro**
   - Tempo de jogo registrado e exibido
   - Ao vencer, o tempo é mostrado na mensagem de vitória

3. **Design Responsivo**
   - Interface adaptável para diferentes tamanhos de tela
   - Layout em coluna em dispositivos móveis e em grade em telas maiores

## Melhoria Contínua

Possíveis melhorias futuras para o jogo:

1. **Modos de Dificuldade**
   - Adicionar diferentes níveis de dificuldade com palavras mais complexas
   - Limitar o tempo disponível para adivinhar

2. **Categorias de Palavras**
   - Implementar seleção de categorias (animais, países, profissões)
   - Permitir ao jogador escolher a categoria

3. **Multiplayer**
   - Adicionar modo de jogo para dois jogadores
   - Implementar tabela de pontuação online

## Conclusão

O Jogo da Forca é uma adição valiosa à coleção de jogos clássicos da plataforma, oferecendo uma experiência interativa e visualmente atraente enquanto mantém a essência do jogo tradicional. A implementação utiliza tecnologias modernas como React, TypeScript, Framer Motion e Tailwind CSS para criar uma experiência de usuário fluida e agradável. 