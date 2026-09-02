export const canMoveToken = (
  position,
  diceValue
) => {
  if (
    position === 0
  ) {
    return (
      diceValue === 6
    );
  }

  return (
    position + diceValue <= 56
  );
};

export const getNewTokenPosition = (
  position,
  diceValue
) => {
  if (
    position === 0
  ) {
    if (
      diceValue === 6
    ) {
      return 1;
    }

    return 0;
  }

  const newPosition =
    position + diceValue;

  if (
    newPosition > 56
  ) {
    return position;
  }

  return newPosition;
};

export const getNextPlayerIndex = (
  currentIndex,
  totalPlayers
) => {
  return (
    currentIndex + 1
  ) % totalPlayers;
};

export const shouldGetExtraTurn = (
  diceValue
) => {
  return (
    diceValue === 6
  );
};

export const canPlayerMoveAnyToken = (
  tokens,
  diceValue
) => {
  return tokens.some(
    token =>
      canMoveToken(
        token.position,
        diceValue
      )
  );
};

export const checkWinner = (
  player
) => {
  return (
    player.tokens.every(
      token =>
        token.position === 56
    )
  );
};

export const shouldCaptureToken = (
  currentPlayer,
  newPosition,
  otherPlayer,
  otherToken
) => {
  if (
    currentPlayer.name ===
    otherPlayer.name
  ) {
    return false;
  }

  if (
    newPosition === 0 ||
    newPosition > 51
  ) {
    return false;
  }

  return (
    otherToken.position ===
    newPosition
  );
};
