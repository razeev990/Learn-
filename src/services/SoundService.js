import { Audio } from 'expo-av';

const soundFiles = {
  cut: require('../../assets/sounds/cut.mp3'),

  diceRoll: require(
    '../../assets/sounds/dice-roll.mp3'
  ),

  move: require(
    '../../assets/sounds/move.mp3'
  ),

  win: require(
    '../../assets/sounds/win.mp3'
  ),
};

const playSound = async (soundFile) => {
  try {
    const { sound } =
      await Audio.Sound.createAsync(
        soundFile,
        {
          shouldPlay: true,
        }
      );

    sound.setOnPlaybackStatusUpdate(
      (status) => {
        if (
          status.didJustFinish
        ) {
          sound.unloadAsync();
        }
      }
    );
  } catch (error) {
    console.log(
      'Sound error:',
      error
    );
  }
};

export const playCutSound = () => {
  playSound(soundFiles.cut);
};

export const playDiceSound = () => {
  playSound(soundFiles.diceRoll);
};

export const playMoveSound = () => {
  playSound(soundFiles.move);
};

export const playWinSound = () => {
  playSound(soundFiles.win);
};
