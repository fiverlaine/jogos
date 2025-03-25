{games.map((game) => (
  <GameCard 
    key={game.id}
    title={game.title}
    description={game.description}
    image={game.image}
    url={game.id === 'memory' ? '#' : game.url}
    disabled={game.id === 'memory'}
    comingSoon={game.id === 'memory'}
  />
))} 