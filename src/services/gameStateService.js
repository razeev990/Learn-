import {
  GAME_STATUS,
} from '../constants/gameConstants';

import {
  createGamePlayers,
} from './gameService';

export const createInitialGameState = (
  playerCount = 2
) => {
  return {
    status: GAME_STATUS.WAITING,

    players: createGamePlayers(
      playerCount
    ),

    currentPlayerIndex: 0,

    diceValue: 1,

    winner: null,
  };
};

export const startGame = (
  gameState
) => {
  return {
    ...gameState,

    status: GAME_STATUS.PLAYING,

    currentPlayerIndex: 0,

    diceValue: 1,

    winner: null,
  };
};

export const resetGame = (
  playerCount = 2
) => {
  return createInitialGameState(
    playerCount
  );
};

export const finishGame = (
  gameState,
  winner
) => {
  return {
    ...gameState,

    status: GAME_STATUS.FINISHED,

    winner,
  };
};
