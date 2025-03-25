router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    websocket: io.engine.clientsCount,
    matches: MatchModel.countDocuments(),
    memory: process.memoryUsage()
  });
}); 