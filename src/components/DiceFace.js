import React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

const DOTS = {
  1: [
    [1, 1],
  ],

  2: [
    [0, 0],
    [2, 2],
  ],

  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],

  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],

  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],

  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

export default function DiceFace({
  value = 1,
  size = 80,
}) {
  const dots =
    DOTS[value] ||
    DOTS[1];

  return (
    <View
      style={[
        styles.dice,
        {
          width: size,
          height: size,
        },
      ]}
    >
      {dots.map(
        (
          position,
          index
        ) => {
          const row =
            position[0];

          const column =
            position[1];

          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width:
                    size * 0.16,

                  height:
                    size * 0.16,

                  borderRadius:
                    size * 0.08,

                  top:
                    `${row * 36 + 12}%`,

                  left:
                    `${column * 36 + 12}%`,
                },
              ]}
            />
          );
        }
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    dice: {
      backgroundColor:
        '#FFFFFF',

      borderRadius: 14,

      borderWidth: 3,

      borderColor:
        '#CBD5E1',

      elevation: 7,
    },

    dot: {
      position:
        'absolute',

      backgroundColor:
        '#111827',
    },
  });
