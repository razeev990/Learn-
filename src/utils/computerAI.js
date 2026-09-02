import {
  canMoveToken,
} from './gameUtils';

export const chooseBestComputerMove = (
  player,
  players,
  diceValue
) => {
  const tokens =
    player.tokens;

  // Pehle winning token
  const winningIndex =
    tokens.findIndex(
      token =>
        token.position +
          diceValue ===
        56
    );

  if (
    winningIndex !== -1 &&
    canMoveToken(
      tokens[
        winningIndex
      ].position,
      diceValue
    )
  ) {
    return winningIndex;
  }

  // Ghar se token nikalna
  if (
    diceValue === 6
  ) {
    const homeIndex =
      tokens.findIndex(
        token =>
          token.position === 0
      );

    if (
      homeIndex !== -1
    ) {
      return homeIndex;
    }
  }

  // Sabse aage wala token
  let bestIndex =
    null;

  let bestPosition =
    -1;

  tokens.forEach(
    (
      token,
      index
    ) => {
      if (
        canMoveToken(
          token.position,
          diceValue
        )
      ) {
        if (
          token.position >
          bestPosition
        ) {
          bestPosition =
            token.position;

          bestIndex =
            index;
        }
      }
    }
  );

  return bestIndex;
};
