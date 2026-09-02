import React, {
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LudoBoard from '../components/LudoBoard';

import DiceFace from '../components/DiceFace';

import PrimaryButton from '../components/PrimaryButton';

import {
  rollDice,
} from '../utils/diceUtils';

import {
  canMoveToken,
  getNewTokenPosition,
  getNextPlayerIndex,
  shouldGetExtraTurn,
  canPlayerMoveAnyToken,
  shouldCaptureToken,
  checkWinner,
} from '../utils/gameUtils';

import {
  chooseBestComputerMove,
} from '../utils/computerAI';

import {
  playCutSound,
  playDiceSound,
  playMoveSound,
  playWinSound,
} from '../services/SoundService';

const createPlayers = (
  gameMode
) => {
  const redPlayer = {
    name: 'Red',
    color: '#EF4444',
    tokens: [
      {
        id: 1,
        position: 0,
      },
      {
        id: 2,
        position: 0,
      },
      {
        id: 3,
        position: 0,
      },
      {
        id: 4,
        position: 0,
      },
    ],
  };

  const greenPlayer = {
    name:
      gameMode === 'computer'
        ? 'Computer'
        : 'Green',

    boardName: 'Green',

    color: '#22C55E',

    tokens: [
      {
        id: 1,
        position: 0,
      },
      {
        id: 2,
        position: 0,
      },
      {
        id: 3,
        position: 0,
      },
      {
        id: 4,
        position: 0,
      },
    ],
  };

  return [
    redPlayer,
    greenPlayer,
  ];
};

export default function GameScreen({
  gameMode,
  onBack,
}) {
  const [
    gamePlayers,
    setGamePlayers,
  ] = useState(
    () =>
      createPlayers(
        gameMode
      )
  );

  const [
    currentPlayerIndex,
    setCurrentPlayerIndex,
  ] = useState(0);

  const [
    diceValue,
    setDiceValue,
  ] = useState(null);

  const [
    isComputerThinking,
    setIsComputerThinking,
  ] = useState(false);

  const currentPlayer =
    gamePlayers[
      currentPlayerIndex
    ];

  const isComputerTurn =
    gameMode ===
      'computer' &&
    currentPlayerIndex === 1;

  const changeTurn = (
    playersData =
      gamePlayers
  ) => {
    const nextIndex =
      getNextPlayerIndex(
        currentPlayerIndex,
        playersData.length
      );

    setCurrentPlayerIndex(
      nextIndex
    );

    setDiceValue(null);
  };

  const finishMove = (
    tokenIndex,
    moveValue
  ) => {
    const player =
      gamePlayers[
        currentPlayerIndex
      ];

    const selectedToken =
      player.tokens[
        tokenIndex
      ];

    if (
      !canMoveToken(
        selectedToken.position,
        moveValue
      )
    ) {
      return;
    }

    const newPosition =
      getNewTokenPosition(
        selectedToken.position,
        moveValue
      );

    let captured = false;

    const updatedPlayers =
      gamePlayers.map(
        (
          gamePlayer,
          playerIndex
        ) => {
          if (
            playerIndex ===
            currentPlayerIndex
          ) {
            return {
              ...gamePlayer,

              tokens:
                gamePlayer.tokens.map(
                  (
                    token,
                    index
                  ) => {
                    if (
                      index ===
                      tokenIndex
                    ) {
                      return {
                        ...token,

                        position:
                          newPosition,
                      };
                    }

                    return token;
                  }
                ),
            };
          }

          return gamePlayer;
        }
      );

    setGamePlayers(
      updatedPlayers
    );

    if (captured) {
      playCutSound();
    } else {
      playMoveSound();
    }

    const updatedPlayer =
      updatedPlayers[
        currentPlayerIndex
      ];

    if (
      checkWinner(
        updatedPlayer
      )
    ) {
      playWinSound();

      setTimeout(() => {
        Alert.alert(
          '🏆 Winner!',
          `${updatedPlayer.name} wins the game!`,
          [
            {
              text:
                'Back to Menu',

              onPress:
                onBack,
            },
          ]
        );
      }, 200);

      return;
    }

    if (
      shouldGetExtraTurn(
        moveValue
      )
    ) {
      setDiceValue(null);

      setIsComputerThinking(
        false
      );

      return;
    }

    changeTurn(
      updatedPlayers
    );

    setIsComputerThinking(
      false
    );
  };

  const handleRollDice = () => {
    if (
      diceValue !== null ||
      isComputerTurn ||
      isComputerThinking
    ) {
      return;
    }

    const newValue =
      rollDice();

    setDiceValue(
      newValue
    );

    playDiceSound();

    if (
      !canPlayerMoveAnyToken(
        currentPlayer.tokens,
        newValue
      )
    ) {
      setTimeout(() => {
        changeTurn();
      }, 700);
    }
  };

  const handleTokenPress = (
    tokenIndex
  ) => {
    if (
      diceValue === null ||
      isComputerTurn
    ) {
      return;
    }

    finishMove(
      tokenIndex,
      diceValue
    );
  };

  useEffect(() => {
    if (
      !isComputerTurn ||
      diceValue !== null
    ) {
      return;
    }

    setIsComputerThinking(
      true
    );

    const timer =
      setTimeout(() => {
        const value =
          rollDice();

        setDiceValue(
          value
        );

        playDiceSound();

        const computer =
          gamePlayers[
            currentPlayerIndex
          ];

        if (
          !canPlayerMoveAnyToken(
            computer.tokens,
            value
          )
        ) {
          setTimeout(() => {
            changeTurn();

            setIsComputerThinking(
              false
            );
          }, 700);

          return;
        }

        setTimeout(() => {
          const tokenIndex =
            chooseBestComputerMove(
              computer,
              gamePlayers,
              value
            );

          if (
            tokenIndex !== null
          ) {
            finishMove(
              tokenIndex,
              value
            );
          }
        }, 700);
      }, 700);

    return () => {
      clearTimeout(
        timer
      );
    };
  }, [
    isComputerTurn,
    currentPlayerIndex,
    diceValue,
  ]);

  return (
    <View
      style={styles.container}
    >
      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          LUDO SUPREME
        </Text>

        <Text
          style={[
            styles.turnText,
            {
              color:
                currentPlayer.color,
            },
          ]}
        >
          {isComputerTurn
            ? '🤖 Computer Turn'
            : `${currentPlayer.name} Turn`}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={
            styles.boardContainer
          }
        >
          <LudoBoard
            players={
              gamePlayers
            }
            currentPlayerName={
              isComputerTurn
                ? null
                : currentPlayer.name
            }
            diceValue={
              diceValue
            }
            onTokenPress={
              handleTokenPress
            }
            disabled={
              isComputerThinking
            }
          />
        </View>

        <Text
          style={styles.message}
        >
          {isComputerThinking
            ? 'Computer is thinking...'
            : diceValue === null
            ? 'Roll the dice 🎲'
            : 'Tap highlighted token'}
        </Text>

        <View
          style={
            styles.diceArea
          }
        >
          <DiceFace
            value={
              diceValue || 1
            }
            size={80}
          />
        </View>

        <View
          style={
            styles.buttonArea
          }
        >
          <PrimaryButton
            title={
              isComputerTurn
                ? 'Computer Playing 🤖'
                : 'Roll Dice 🎲'
            }
            onPress={
              handleRollDice
            }
            disabled={
              diceValue !== null ||
              isComputerTurn ||
              isComputerThinking
            }
          />
        </View>

        <View
          style={
            styles.backArea
          }
        >
          <PrimaryButton
            title="← Back to Menu"
            onPress={
              onBack
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        '#020617',
    },

    header: {
      paddingVertical: 15,

      alignItems:
        'center',
    },

    title: {
      fontSize: 26,

      fontWeight:
        'bold',

      color:
        '#FFFFFF',
    },

    turnText: {
      marginTop: 8,

      fontSize: 18,

      fontWeight:
        'bold',
    },

    content: {
      alignItems:
        'center',

      paddingBottom: 30,
    },

    boardContainer: {
      width: '94%',
    },

    message: {
      marginTop: 18,

      fontSize: 16,

      fontWeight:
        'bold',

      color:
        '#FFFFFF',
    },

    diceArea: {
      marginVertical: 18,
    },

    buttonArea: {
      width: '80%',
    },

    backArea: {
      width: '80%',

      marginTop: 20,
    },
  });
