export const createPlayer = (
  id,
  name,
  color
) => {
  return {
    id,
    name,
    color,

    tokens: [
      {
        id: `${id}-token-1`,
        position: 0,
      },
      {
        id: `${id}-token-2`,
        position: 0,
      },
      {
        id: `${id}-token-3`,
        position: 0,
      },
      {
        id: `${id}-token-4`,
        position: 0,
      },
    ],
  };
};

export const resetPlayerTokens = (
  player
) => {
  return {
    ...player,

    tokens: player.tokens.map(
      (token) => ({
        ...token,
        position: 0,
      })
    ),
  };
};
