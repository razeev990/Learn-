import {
  MAX_DICE_VALUE,
  MIN_DICE_VALUE,
} from '../constants/gameConstants';

export const rollDice = () => {
  return (
    Math.floor(
      Math.random() *
        (MAX_DICE_VALUE - MIN_DICE_VALUE + 1)
    ) + MIN_DICE_VALUE
  );
};

export const isValidDiceValue = (value) => {
  return (
    Number.isInteger(value) &&
    value >= MIN_DICE_VALUE &&
    value <= MAX_DICE_VALUE
  );
};
