import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

const BOARD_SIZE = 15;

const getCellColor = (
  row,
  column
) => {
  // Red home
  if (
    row < 6 &&
    column < 6
  ) {
    return '#EF4444';
  }

  // Green home
  if (
    row < 6 &&
    column > 8
  ) {
    return '#22C55E';
  }

  // Yellow home
  if (
    row > 8 &&
    column < 6
  ) {
    return '#EAB308';
  }

  // Blue home
  if (
    row > 8 &&
    column > 8
  ) {
    return '#3B82F6';
  }

  // Center
  if (
    row >= 6 &&
    row <= 8 &&
    column >= 6 &&
    column <= 8
  ) {
    return '#FFFFFF';
  }

  return '#F8FAFC';
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
          {row === 7 &&
          column === 7 ? (
            <Text
              style={
                styles.centerText
              }
            >
              ★
            </Text>
          ) : null}
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

      flexDirection: 'row',
      flexWrap: 'wrap',

      backgroundColor: '#020617',

      borderWidth: 3,
      borderColor: '#FFFFFF',
    },

    cell: {
      width: '6.6667%',
      height: '6.6667%',

      borderWidth: 0.5,
      borderColor: '#CBD5E1',

      justifyContent: 'center',
      alignItems: 'center',
    },

    centerText: {
      fontSize: 18,
      color: '#111827',
    },
  });
