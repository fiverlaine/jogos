## Fluxo de Sincronização de Partidas

1. Sequência de Criação:
   Usuário → POST /matches → DB → Socket.IO Broadcast → Todos os clientes

2. Estrutura de Eventos:
   - match_updated: Enviado para todos os clientes
   - Payload: Match JSON completo

3. Tratamento de Erros:
   - Reconexão automática do WebSocket
   - Fallback para polling a cada 30s se WebSocket falhar
   - Cache local de última sincronização

4. Monitoramento:
   - Logs de conexões WebSocket
   - Métricas de eventos por minuto
   - Alertas para falhas consecutivas 