# Instruções para Limpeza do Jogo da Memória

Este documento contém instruções para remover completamente todos os arquivos relacionados ao jogo da memória do projeto, mantendo apenas o card na página inicial para desenvolvimento futuro.

## Como Usar o Script de Limpeza

1. Abra o terminal
2. Navegue até a pasta raiz do projeto:
   ```
   cd /path/para/seu/projeto
   ```

3. Dê permissão de execução ao script:
   ```
   chmod +x cleanup-memory-game.sh
   ```

4. Execute o script:
   ```
   ./cleanup-memory-game.sh
   ```

5. Verifique a saída do script para garantir que tudo foi removido corretamente

## O que o Script Remove

- `/components/memory-game.tsx`
- `/components/online-game/memory/` (pasta inteira)
- `/lib/memory-supabase.ts`
- Todos os arquivos e pastas em `/src/app/games/memory/` exceto o README.md
- Hooks relacionados ao jogo da memória em `/lib/hooks/`

## Verificação Manual

Após executar o script, é recomendável verificar manualmente:

1. Arquivo `/lib/types.d.ts` para remover qualquer tipo relacionado ao jogo da memória
2. Qualquer outro arquivo que possa importar ou referenciar componentes do jogo da memória
3. Confirmar que o card na página inicial está funcionando corretamente como placeholder

## Restauração

Um backup não é criado automaticamente. Se necessário, use o controle de versão (git) para recuperar arquivos removidos acidentalmente. 