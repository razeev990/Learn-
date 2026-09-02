import Sound from 'react-native-sound';

Sound.setCategory('Playback');

const sounds = {
  cut: new Sound(
    require('../../assets/sounds/cut.mp3'),
    error => {
      if (error) {
        console.log('Cut sound load error:', error);
      }
    }
  ),

  diceRoll: new Sound(
    require('../../assets/sounds/dice-roll.mp3'),
    error => {
      if (error) {
        console.log('Dice sound load error:', error);
      }
    }
  ),

  move: new Sound(
    require('../../assets/sounds/move.mp3'),
    error => {
      if (error) {
        console.log('Move sound load error:', error);
      }
    }
  ),

  win: new Sound(
    require('../../assets/sounds/win.mp3'),
    error => {
      if (error) {
        console.log('Win sound load error:', error);
      }
    }
  ),
};

const playSound = sound => {
  if (!sound) {
    return;
  }

  sound.stop(() => {
    sound.play(success => {
      if (!success) {
        console.log('Sound playback failed');
      }
    });
  });
};

export const playCutSound = () => {
  playSound(sounds.cut);
};

export const playDiceSound = () => {
  playSound(sounds.diceRoll);
};

export const playMoveSound = () => {
  playSound(sounds.move);
};

export const playWinSound = () => {
  playSound(sounds.win);
};

export const stopAllSounds = () => {
  Object.values(sounds).forEach(sound => {
    if (sound) {
      sound.stop();
    }
  });
};
