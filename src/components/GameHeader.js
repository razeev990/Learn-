import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function GameHeader({
  title = 'Ludo Supreme',
  subtitle = '',
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: '#9CA3AF',
  },
});
