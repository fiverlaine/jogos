// Versão simplificada do serviço de jogo da memória para compatibilidade com o socket.io

/**
 * Simulação da função subscribeToGameUpdates para compatibilidade
 * Esta implementação é um stub que permite que o servidor inicie
 * sem depender de um servidor Redis
 */
const subscribeToGameUpdates = (callback) => {
  console.log('Sistema de memória: Inicializando assinatura de atualizações (modo simulado)');
  
  // Em uma implementação real, estaríamos assinando eventos de um servidor Redis
  // Nesta versão simplificada, apenas registramos o callback e retornamos uma função de limpeza
  
  // Simulação de eventos de jogo (descomente para testes)
  /*
  setInterval(() => {
    callback?.({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    });
  }, 30000);
  */
  
  // Retorna uma função de limpeza que seria chamada quando a aplicação é encerrada
  return () => {
    console.log('Sistema de memória: Encerrando assinatura de atualizações');
  };
};

module.exports = {
  subscribeToGameUpdates
};