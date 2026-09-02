import React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

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

const getCellColor = (
  row,
  column
) => {
  if (
    row < 6 &&
    column < 6
  ) {
    return '#FCA5A5';
  }

  if (
    row < 6 &&
    column > 8
  ) {
    return '#86EFAC';
  }

  if (
    row > 8 &&
    column < 6
  ) {
    return '#FDE047';
  }

  if (
    row > 8 &&
    column > 8
  ) {
    return '#93C5FD';
  }

  return '#FFFFFF';
};

const getTokenAtPosition = (
  players,
  row,
  column
) => {
  for (const player of players) {
    const homePositions =
      HOME_POSITIONS[player.name] || [];

    for (
      let index = 0;
      index < player.tokens.length;
      index++
    ) {
      const token =
        player.tokens[index];

      if (token.position === 0) {
        const homePosition =
          homePositions[index];

        if (
          homePosition &&
          homePosition[0] === row &&
          homePosition[1] === column
        ) {
          return {
            ...token,
            color: player.color,
          };
        }
      }
    }
  }

  return null;
};

export default function LudoBoard({
  players = [],
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
      const token =
        getTokenAtPosition(
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
          {token ? (
            <View
              style={[
                styles.token,
                {
                  backgroundColor:
                    token.color,
                },
              ]}
            />
          ) : null}
        </View>
      );
    }
  }

  return (
    <View style={styles.board}>
      {cells}
    </View>
  );
}

const styles =
  StyleSheet.create({
    board: {
      width: '100%',
      aspectRatio: 1,

      flexDirection: 'row',
      flexWrap: 'wrap',

      backgroundColor: '#FFFFFF',

      borderWidth: 3,
      borderColor: '#111827',
    },

    cell: {
      width: '6.6667%',
      height: '6.6667%',

      borderWidth: 0.5,
      borderColor: '#CBD5E1',

      justifyContent: 'center',
      alignItems: 'center',
    },

    token: {
      width: '65%',
      height: '65%',

      borderRadius: 999,

      borderWidth: 1.5,
      borderColor: '#FFFFFF',

      elevation: 3,
    },
  });
