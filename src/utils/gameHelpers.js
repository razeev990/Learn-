import {
  BASE_SPOTS,
  HOME_PATHS,
  TRACK_COORDINATES,
  START_INDEX,
} from '../constants/boardConstants';


// ============================================
// PAWN SCREEN COORDINATES
// ============================================

export const getPawnScreenCoords = (
  color,
  stepCount,
  idx,
) => {
  if (stepCount === -1) {
    return BASE_SPOTS[color][idx];
  }

  if (stepCount === 56) {
    return [7, 7];
  }

  if (stepCount >= 51) {
    return HOME_PATHS[color][stepCount - 51];
  }

  return TRACK_COORDINATES[
    (START_INDEX[color] + stepCount) % 52
  ];
};


// ============================================
// SLEEP / DELAY HELPER
// ============================================

export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));
