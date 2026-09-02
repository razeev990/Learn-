import {
  MAX_PLAYERS,
  MIN_PLAYERS,
} from '../constants/gameConstants';

import {
  PLAYER_COLORS,
  PLAYER_NAMES,
} from '../constants/boardConstants';

import {
  createPlayer,
} from '../utils/playerUtils';

export const createGamePlayers = (
  playerCount = MIN_PLAYERS
) => {
  const validPlayerCount = Math.min(
    Math.max(
      playerCount,
      MIN_PLAYERS
    ),
    MAX_PLAYERS
  );

  const playerKeys = [
    'RED',
    'GREEN',
    'YELLOW',
    'BLUE',
  ];

  return playerKeys
    .slice(0, validPlayerCount)
    .map((colorKey, index) =>
      createPlayer(
        `player-${index + 1}`,
        PLAYER_NAMES[colorKey],
        PLAYER_COLORS[colorKey]
      )
    );
};

export const getPlayerById = (
  players,
  playerId
) => {
  return players.find(
    (player) => player.id === playerId
  );
};

export const getNextPlayerIndex = (
  currentPlayerIndex,
  totalPlayers
) => {
  if (!totalPlayers) {
    return 0;
  }

  return (
    currentPlayerIndex + 1
  ) % totalPlayers;
};
