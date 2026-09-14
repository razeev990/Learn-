import {
  BASE_SPOTS,
  HOME_PATHS,
  START_INDEX,
  TRACK_COORDINATES
} from '../constants';

export const getBoardRotationAngle = (myColor) => {
  const map = {
    RED: '-90deg',
    GREEN: '180deg',
    YELLOW: '90deg',
    BLUE: '0deg'
  };
  return map[myColor] || '0deg';
};

export const getInverseRotationAngle = (myColor) => {
  const map = {
    RED: '90deg',
    GREEN: '180deg',
    YELLOW: '-90deg',
    BLUE: '0deg'
  };
  return map[myColor] || '0deg';
};

export const getPerspectiveLayout = (myColor) => {
  const layouts = {
    RED: {
      leftColor: 'GREEN',
      topColor: 'YELLOW',
      bottomColor: 'RED',
      rightColor: 'BLUE'
    },
    GREEN: {
      leftColor: 'YELLOW',
      topColor: 'BLUE',
      bottomColor: 'GREEN',
      rightColor: 'RED'
    },
    YELLOW: {
      leftColor: 'BLUE',
      topColor: 'RED',
      bottomColor: 'YELLOW',
      rightColor: 'GREEN'
    },
    BLUE: {
      leftColor: 'RED',
      topColor: 'GREEN',
      bottomColor: 'BLUE',
      rightColor: 'YELLOW'
    }
  };
  return layouts[myColor] || layouts.BLUE;
};

export const getPlayerLabelPositionStyle = (color, myColor) => {
  const perspective = getPerspectiveLayout(myColor);
  if (
    color === perspective.topColor ||
    color === perspective.leftColor
  ) {
    return 'playerLabelTop';
  }
  return 'playerLabelBottom';
};

export const getPawnScreenCoords = (color, stepCount, idx) => {
  if (stepCount === -1) return BASE_SPOTS[color][idx];
  if (stepCount === 56) return [7,7];
  if (stepCount >= 51) return HOME_PATHS[color][stepCount - 51];
  return TRACK_COORDINATES[(START_INDEX[color] + stepCount) % 52];
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fast deep clone for pawns object (avoids JSON.parse(JSON.stringify(...)))
export const clonePawns = (p) => ({
  BLUE:   [p.BLUE[0],   p.BLUE[1],   p.BLUE[2],   p.BLUE[3]],
  RED:    [p.RED[0],    p.RED[1],    p.RED[2],    p.RED[3]],
  GREEN:  [p.GREEN[0],  p.GREEN[1],  p.GREEN[2],  p.GREEN[3]],
  YELLOW: [p.YELLOW[0], p.YELLOW[1], p.YELLOW[2], p.YELLOW[3]],
});

// Fast color hex lookup via object
const COLOR_HEX_MAP = {
  RED: '#ef4444',
  GREEN: '#16a34a',
  YELLOW: '#eab308',
  BLUE: '#2563eb'
};
export const getTurnColorHex = (col) => COLOR_HEX_MAP[col] || '#2563eb';
