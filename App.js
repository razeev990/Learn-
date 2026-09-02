import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Image,
  View,
} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
      />

      <View style={styles.content}>
        <Image
          source={require('./assets/images/ludo-supreme-menu.png')}
          style={styles.menuImage}
          resizeMode="contain"
        />

        <View style={styles.homeOverlay}>
          <HomeScreen
            onStartGame={() => {
              console.log('Game Started');
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  content: {
    flex: 1,
  },

  menuImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  homeOverlay: {
    flex: 1,
  },
});
