import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';

const DiceFace = ({ value }) => {
  const dot = <View style={styles.diceDot} />;
  const empty = (
    <View
      style={[
        styles.diceDot,
        { opacity: 0 },
      ]}
    />
  );

  const getDots = () => {
    switch (value) {
      case 1:
        return (
          <View style={styles.diceCenter}>
            {dot}
          </View>
        );

      case 2:
        return (
          <View style={styles.diceRowSpace}>
            <View style={styles.diceCol}>
              {dot}
              {empty}
            </View>

            <View style={styles.diceCol}>
              {empty}
              {dot}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.diceRowSpace}>
            <View style={styles.diceCol}>
              {dot}
              {empty}
              {empty}
            </View>

            <View style={styles.diceCol}>
              {empty}
              {dot}
              {empty}
            </View>

            <View style={styles.diceCol}>
              {empty}
              {empty}
              {dot}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.diceRowSpace}>
            <View style={styles.diceCol}>
              {dot}
              {dot}
            </View>

            <View style={styles.diceCol}>
              {dot}
              {dot}
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.diceRowSpace}>
            <View style={styles.diceCol}>
              {dot}
              {empty}
              {dot}
            </View>

            <View style={styles.diceCol}>
              {empty}
              {dot}
              {empty}
            </View>

            <View style={styles.diceCol}>
              {dot}
              {empty}
              {dot}
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.diceRowSpace}>
            <View style={styles.diceCol}>
              {dot}
              {dot}
              {dot}
            </View>

            <View style={styles.diceCol}>
              {dot}
              {dot}
              {dot}
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.diceCenter}>
            {dot}
          </View>
        );
    }
  };

  return (
    <View style={styles.diceBox}>
      {getDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  diceBox: {
    width: 42,
    height: 42,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },

  diceDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    backgroundColor: '#0f172a',
    margin: 1.5,
  },

  diceCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  diceRowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
  },

  diceCol: {
    justifyContent: 'space-between',
  },
});

export default DiceFace;
