import React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

const BOARD_SIZE = 15;

const getCellColor = (
  row,
  column
) => {
  // Red area
  if (
    row < 6 &&
    column < 6
  ) {
    return '#FCA5A5';
  }

  // Green area
  if (
    row < 6 &&
    column > 8
  ) {
    return '#86EFAC';
  }

  // Yellow area
  if (
    row > 8 &&
    column < 6
  ) {
    return '#FDE047';
  }

  // Blue area
  if (
    row > 8 &&
    column > 8
  ) {
    return '#93C5FD';
  }

  return '#FFFFFF';
};

const getTokenColor = (
  row,
  column
) => {
  // Red tokens
  if (
    (row === 1 || row === 4) &&
    (column === 1 || column === 4)
  ) {
    return '#EF4444';
  }

  // Green tokens
  if (
    (row === 1 || row === 4) &&
    (column === 10 || column === 13)
  ) {
    return '#22C55E';
  }

  // Yellow tokens
  if (
    (row === 10 || row === 13) &&
    (column === 1 || column === 4)
  ) {
    return '#EAB308';
  }

  // Blue tokens
  if (
    (row === 10 || row === 13) &&
    (column === 10 || column === 13)
  ) {
    return '#3B82F6';
  }

  return null;
};

export default function LudoBoard() {
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
      const cellColor =
        getCellColor(
          row,
          column
        );

      const tokenColor =
        getTokenColor(
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
                cellColor,
            },
          ]}
        >
          {tokenColor ? (
            <View
              style={[
                styles.token,
                {
                  backgroundColor:
                    tokenColor,
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
