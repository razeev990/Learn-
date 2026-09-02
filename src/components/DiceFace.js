import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function DiceFace({
  value = 1,
  size = 60,
}) {
  const dots = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };

  const activeDots = dots[value] || dots[1];

  return (
    <View
      style={[
        styles.dice,
        {
          width: size,
          height: size,
          borderRadius: size * 0.15,
        },
      ]}
    >
      <View style={styles.grid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((position) => (
          <View
            key={position}
            style={styles.dotContainer}
          >
            {activeDots.includes(position) && (
              <View
                style={[
                  styles.dot,
                  {
                    width: size * 0.12,
                    height: size * 0.12,
                    borderRadius: size * 0.06,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dice: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  grid: {
    width: '80%',
    height: '80%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dotContainer: {
    width: '33.33%',
    height: '33.33%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dot: {
    backgroundColor: '#111827',
  },
});
