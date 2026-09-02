import React from 'react';

import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  canMoveToken,
} from '../utils/gameUtils';

const BOARD_SIZE = 15;

const HOME_POSITIONS = {
  Red: [
    [1, 1],
    [1, 4],
    [4, 1],
    [4, 4],
  ],

  Green: [
    [1, 10],
    [1, 13],
    [4, 10],
    [4, 13],
  ],

  Yellow: [
    [10, 1],
    [10, 4],
    [13, 1],
    [13, 4],
  ],

  Blue: [
    [10, 10],
    [10, 13],
    [13, 10],
    [13, 13],
  ],
};

const MAIN_PATH = [
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],

  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],
  [1, 6],
  [0, 6],

  [0, 7],
  [0, 8],

  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],

  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14],

  [7, 14],
  [8, 14],

  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],

  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8],

  [14, 7],
  [14, 6],

  [13, 6],
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],

  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0],

  [7, 0],
  [6, 0],
];

const PLAYER_START_INDEX = {
  Red: 0,
  Green: 13,
  Blue: 26,
  Yellow: 39,
};

const PLAYER_HOME_PATHS = {
  Red: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
  ],

  Green: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
  ],

  Blue: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
  ],

  Yellow: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
  ],
};

const isPosition = (
  row,
  column,
  positions
) => {
  return positions.some(
    position =>
      position[0] === row &&
      position[1] === column
  );
};

const getCellColor = (
  row,
  column
) => {
  // Red home
  if (
    row < 6 &&
    column < 6
  ) {
    return '#F87171';
  }

  // Green home
  if (
    row < 6 &&
    column > 8
  ) {
    return '#4ADE80';
  }

  // Yellow home
  if (
    row > 8 &&
    column < 6
  ) {
    return '#FACC15';
  }

  // Blue home
  if (
    row > 8 &&
    column > 8
  ) {
    return '#60A5FA';
  }

  // Center
  if (
    row >= 6 &&
    row <= 8 &&
    column >= 6 &&
    column <= 8
  ) {
    if (
      row === 7 &&
      column === 7
    ) {
      return '#FFFFFF';
    }

    if (
      row <= 7 &&
      column <= 7
    ) {
      return '#EF4444';
    }

    if (
      row <= 7 &&
      column >= 8
    ) {
      return '#22C55E';
    }

    if (
      row >= 8 &&
      column <= 7
    ) {
      return '#EAB308';
    }

    return '#3B82F6';
  }

  if (
    isPosition(
      row,
      column,
      PLAYER_HOME_PATHS.Red
    )
  ) {
    return '#FCA5A5';
  }

  if (
    isPosition(
      row,
      column,
      PLAYER_HOME_PATHS.Green
    )
  ) {
    return '#86EFAC';
  }

  if (
    isPosition(
      row,
      column,
      PLAYER_HOME_PATHS.Yellow
    )
  ) {
    return '#FDE047';
  }

  if (
    isPosition(
      row,
      column,
      PLAYER_HOME_PATHS.Blue
    )
  ) {
    return '#93C5FD';
  }

  return '#FFFFFF';
};

const getTokenBoardPosition = (
  playerName,
  tokenPosition
) => {
  if (
    tokenPosition === 0 ||
    tokenPosition === 56
  ) {
    return null;
  }

  if (
    tokenPosition <= 51
  ) {
    const startIndex =
      PLAYER_START_INDEX[
        playerName
      ];

    const pathIndex =
      (
        startIndex +
        tokenPosition -
        1
      ) %
      MAIN_PATH.length;

    return MAIN_PATH[
      pathIndex
    ];
  }

  const homePathIndex =
    tokenPosition - 52;

  return (
    PLAYER_HOME_PATHS[
      playerName
    ]?.[
      homePathIndex
    ] || null
  );
};

const getTokensAtPosition = (
  players,
  row,
  column
) => {
  const foundTokens = [];

  players.forEach(
    player => {
      player.tokens.forEach(
        (
          token,
          tokenIndex
        ) => {
          if (
            token.position === 0
          ) {
            const homePosition =
              HOME_POSITIONS[
                player.name
              ]?.[
                tokenIndex
              ];

            if (
              homePosition &&
              homePosition[0] === row &&
              homePosition[1] === column
            ) {
              foundTokens.push({
                id:
                  `${player.name}-${token.id}`,

                playerName:
                  player.name,

                tokenIndex,

                position:
                  token.position,

                color:
                  player.color,
              });
            }

            return;
          }

          const boardPosition =
            getTokenBoardPosition(
              player.name,
              token.position
            );

          if (
            boardPosition &&
            boardPosition[0] === row &&
            boardPosition[1] === column
          ) {
            foundTokens.push({
              id:
                `${player.name}-${token.id}`,

              playerName:
                player.name,

              tokenIndex,

              position:
                token.position,

              color:
                player.color,
            });
          }
        }
      );
    }
  );

  return foundTokens;
};

export default function LudoBoard({
  players = [],
  currentPlayerName,
  diceValue,
  onTokenPress,
  disabled = false,
}) {
  const cells = [];

  for (
    let row = 0;
    row < BOARD_SIZE;
    row++
  ) {
    for (
      let column = 0;
      column < BOARD_SIZE;
      column++
    ) {
      const tokens =
        getTokensAtPosition(
          players,
          row,
          column
        );

      cells.push(
        <View
          key={`${row}-${column}`}
          style={[
            styles.cell,
            {
              backgroundColor:
                getCellColor(
                  row,
                  column
                ),
            },
          ]}
        >
          {tokens.map(
            token => {
              const isCurrentPlayer =
                token.playerName ===
                currentPlayerName;

              const isMovable =
                isCurrentPlayer &&
                diceValue !== null &&
                canMoveToken(
                  token.position,
                  diceValue
                );

              return (
                <TouchableOpacity
                  key={token.id}
                  disabled={
                    !isMovable ||
                    disabled
                  }
                  onPress={() => {
                    if (
                      isMovable &&
                      !disabled &&
                      onTokenPress
                    ) {
                      onTokenPress(
                        token.tokenIndex
                      );
                    }
                  }}
                  style={[
                    styles.token,
                    {
                      backgroundColor:
                        token.color,
                    },
                    isMovable &&
                      !disabled &&
                      styles.activeToken,
                  ]}
                />
              );
            }
          )}
        </View>
      );
    }
  }

  return (
    <View
      style={styles.board}
    >
      {cells}
    </View>
  );
}

const styles =
  StyleSheet.create({
    board: {
      width: '100%',

      aspectRatio: 1,

      flexDirection:
        'row',

      flexWrap:
        'wrap',

      borderWidth: 3,

      borderColor:
        '#0F172A',

      borderRadius: 8,

      overflow:
        'hidden',
    },

    cell: {
      width: '6.6667%',

      height: '6.6667%',

      borderWidth: 0.5,

      borderColor:
        '#CBD5E1',

      justifyContent:
        'center',

      alignItems:
        'center',

      flexDirection:
        'row',

      flexWrap:
        'wrap',
    },

    token: {
      width: '55%',

      aspectRatio: 1,

      borderRadius: 999,

      borderWidth: 2,

      borderColor:
        '#FFFFFF',

      elevation: 5,
    },

    activeToken: {
      borderWidth: 3,

      borderColor:
        '#111827',

      transform: [
        {
          scale: 1.12,
        },
      ],

      elevation: 10,
    },
  });
