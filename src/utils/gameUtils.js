import {
  WINNING_POSITION,
} from '../constants/gameConstants';

export const canMoveToken = (
  currentPosition,
  diceValue
) => {
  const nextPosition =
    currentPosition + diceValue;

  return nextPosition <= WINNING_POSITION;
};

export const getNextPosition = (
  currentPosition,
  diceValue
) => {
  if (
    !canMoveToken(
      currentPosition,
      diceValue
    )
  ) {
    return currentPosition;
  }

  return currentPosition + diceValue;
};

export const isWinner = (
  position
) => {
  return position >= WINNING_POSITION;
};
