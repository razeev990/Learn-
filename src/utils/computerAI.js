import {
  getNewTokenPosition,
  shouldCaptureToken,
} from './gameUtils';

export const chooseBestComputerMove = (
  computerPlayer,
  allPlayers,
  diceValue
) => {
  const movableTokens =
    computerPlayer.tokens
      .map(
        (token, index) => ({
          token,
          index,
        })
      )
      .filter(
        item => {
          const newPosition =
            getNewTokenPosition(
              item.token.position,
              diceValue
            );

          return (
            newPosition !==
            item.token.position
          );
        }
      );

  if (
    movableTokens.length === 0
  ) {
    return null;
  }

  // Priority 1:
  // Check if computer can capture an opponent.
  for (
    const item of movableTokens
  ) {
    const newPosition =
      getNewTokenPosition(
        item.token.position,
        diceValue
      );

    for (
      const opponent of allPlayers
    ) {
      if (
        opponent.name ===
        computerPlayer.name
      ) {
        continue;
      }

      for (
        const opponentToken of
        opponent.tokens
      ) {
        const canCapture =
          shouldCaptureToken(
            computerPlayer,
            newPosition,
            opponent,
            opponentToken
          );

        if (canCapture) {
          return item.index;
        }
      }
    }
  }

  // Priority 2:
  // Move a token that can finish.
  for (
    const item of movableTokens
  ) {
    const newPosition =
      getNewTokenPosition(
        item.token.position,
        diceValue
      );

    if (newPosition === 56) {
      return item.index;
    }
  }

  // Priority 3:
  // Bring a token out of home.
  for (
    const item of movableTokens
  ) {
    if (
      item.token.position === 0 &&
      diceValue === 6
    ) {
      return item.index;
    }
  }

  // Priority 4:
  // Move the token closest to winning.
  const sortedTokens =
    [...movableTokens].sort(
      (a, b) =>
        b.token.position -
        a.token.position
    );

  return sortedTokens[0].index;
};
