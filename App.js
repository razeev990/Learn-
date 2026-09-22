import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, Dimensions, SafeAreaView,
  Alert, Animated, Easing, StatusBar, ScrollView, Modal, Image, Switch, Share,
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, BackHandler,
  PermissionsAndroid, AppState
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

import {
  SUPABASE_PROJECT_REF,
  SUPABASE_ANON_KEY,
  SUPABASE_REST_URL,
  supabaseHeaders,
  BOARD_SIZE,
  CELL_SIZE,
  ENTRY_FEE_OPTIONS,
  TRACK_COORDINATES,
  HOME_PATHS,
  BASE_SPOTS,
  START_INDEX,
  SAFE_INDEXES,
  ALL_COLORS,
  AVATAR_DATA,
  QUICK_EMOJIS
} from './src/constants';

import {
  getBoardRotationAngle,
  getInverseRotationAngle,
  getPlayerLabelPositionStyle,
  getPerspectiveLayout,
  getPawnScreenCoords,
  sleep,
  clonePawns,
  getTurnColorHex
} from './src/utils';

import { styles } from './src/styles';
import { DiceFace } from './src/components/DiceFace';
import { PinToken } from './src/components/PinToken';
import BoardCells from './src/components/BoardCells';
import { TurnTimer } from './src/components/TurnTimer';
import { haptics, setHapticsEnabled as setHapticsGlobal } from './src/utils/haptics';

export default function App() {
  // ========== STATE ==========
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('LOGIN');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  const [settingsModal, setSettingsModal] = useState(false);
  const [profileStatsModal, setProfileStatsModal] = useState(false);
  const [leaderboardModal, setLeaderboardModal] = useState(false);
  const [dailyBonusModal, setDailyBonusModal] = useState(false);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [cloudLeaderboardData, setCloudLeaderboardData] = useState([]);
  const [avatarModal, setAvatarModal] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState('FEMALE');
  const [userAvatar, setUserAvatar] = useState('👸');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const [chatModal, setChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');

  const [selectedEntryFee, setSelectedEntryFee] = useState(50);
  const [matchPrizePool, setMatchPrizePool] = useState(0);

  const [userStats, setUserStats] = useState({ totalPlayed:0, totalWon:0, totalLost:0 });
  const [playerMissCount, setPlayerMissCount] = useState({ BLUE:0, RED:0, GREEN:0, YELLOW:0 });
  const [finishedRankings, setFinishedRankings] = useState([]);
  const [showPodiumBoard, setShowPodiumBoard] = useState(false);

  const [friendsModal, setFriendsModal] = useState(false);
  const [friendsTab, setFriendsTab] = useState('LIST');
  const [friendsList, setFriendsList] = useState([]);
  const [recentPlayersList, setRecentPlayersList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [incomingInvitesList, setIncomingInvitesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUserResult, setSearchedUserResult] = useState(null);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState(null);

  const [gameMode, setGameMode] = useState(null);
  const [botSelectModal, setBotSelectModal] = useState(false);
  const [botPlayerCount, setBotPlayerCount] = useState(2);
  const [passPlayModal, setPassPlayModal] = useState(false);
  const [hybridTeamModal, setHybridTeamModal] = useState(false);
  const [onlineScreen, setOnlineScreen] = useState(false);
  const [onlineLobbyModal, setOnlineLobbyModal] = useState(false);

  const [playType, setPlayType] = useState('SOLO');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(2);
  const [onlinePlayType, setOnlinePlayType] = useState('SOLO');
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(2);
  const [friendlyKill, setFriendlyKill] = useState(false);
  const [activeColors, setActiveColors] = useState(['BLUE','GREEN']);

  const [roomPlayers, setRoomPlayers] = useState({});
  const [playerSlots, setPlayerSlots] = useState({ BLUE:'LOCAL', GREEN:'BOT', RED:'BOT', YELLOW:'BOT' });
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [teamJoinCode, setTeamJoinCode] = useState('');
  const [myColor, setMyColor] = useState('BLUE');
  const [isHost, setIsHost] = useState(false);
  const [isVerifyingRoom, setIsVerifyingRoom] = useState(false);
  const joinTimeoutRef = useRef(null);

  const [playerDices, setPlayerDices] = useState({ BLUE:1, RED:3, GREEN:6, YELLOW:2 });
  const playerDicesRef = useRef({ BLUE:1, RED:3, GREEN:6, YELLOW:2 });
  const updatePlayerDice = (color, value) => {
    setPlayerDices(prev => {
      const next = { ...prev, [color]: value };
      playerDicesRef.current = next;
      return next;
    });
  };
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);
  // Online recovery refs: keep the latest game state available even while the socket is reconnecting.
  const turnIndexRef = useRef(0);
  const hasRolledRef = useRef(false);
  const finishedRankingsRef = useRef([]);
  const gameModeRef = useRef(null);
  // Lobby must stay locked until the HOST explicitly broadcasts START_MATCH.
  // This prevents a normal SYNC_GAME packet from opening the game for a joiner.
  const matchStartedRef = useRef(false);
  const pendingGameSyncRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const intentionalSocketCloseRef = useRef(false);
  const remoteDiceAnimationRef = useRef(Promise.resolve());
  const remoteMoveAnimationRef = useRef(Promise.resolve());

  // Sound cache — preloaded once to avoid per-play disk I/O
  const soundCacheRef = useRef({});

  const spinAnim = useRef(new Animated.Value(0)).current;
  const diceBounceAnim = useRef(new Animated.Value(1)).current;
  const arrowBounceAnim = useRef(new Animated.Value(0)).current;
  const arrowBlinkAnim = useRef(new Animated.Value(1)).current;

  const [pawns, setPawns] = useState({
    BLUE: [-1,-1,-1,-1],
    RED: [-1,-1,-1,-1],
    GREEN: [-1,-1,-1,-1],
    YELLOW: [-1,-1,-1,-1]
  });

  // 🔄 Reconnecting indicator state
  const [reconnectingPlayers, setReconnectingPlayers] = useState({});

  // 📳 Haptic ref — for "your turn" notification
  const prevTurnForHapticRef = useRef(null);

  // ========== REFS ==========
  const pawnsRef = useRef(pawns);
  pawnsRef.current = pawns;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const myColorRef = useRef(myColor);
  useEffect(() => { myColorRef.current = myColor; }, [myColor]);

  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;
  const userAvatarRef = useRef(userAvatar);
  userAvatarRef.current = userAvatar;
  const playTypeRef = useRef(playType);
  playTypeRef.current = playType;
  const selectedEntryFeeRef = useRef(selectedEntryFee);
  selectedEntryFeeRef.current = selectedEntryFee;
  const isHostRef = useRef(isHost);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  const roomPlayersRef = useRef(roomPlayers);
  useEffect(() => { roomPlayersRef.current = roomPlayers; }, [roomPlayers]);
  const activeColorsRef = useRef(activeColors);
  useEffect(() => { activeColorsRef.current = activeColors; }, [activeColors]);
  const playerSlotsRef = useRef(playerSlots);
  useEffect(() => { playerSlotsRef.current = playerSlots; }, [playerSlots]);

  useEffect(() => { turnIndexRef.current = turnIndex; }, [turnIndex]);
  useEffect(() => { hasRolledRef.current = hasRolled; }, [hasRolled]);
  useEffect(() => { finishedRankingsRef.current = finishedRankings; }, [finishedRankings]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  const ws = useRef(null);

  // 🔄 Heartbeat tracking refs
  const playerHeartbeatRef = useRef({});
  const reconnectingPlayersRef = useRef({});
  const heartbeatSendIntervalRef = useRef(null);
  const heartbeatWatchdogRef = useRef(null);

  // ========== SOUND PRELOAD (ONCE) ==========
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const soundAssets = {
          dice: require('./assets/sounds/dice.mp3'),
          move: require('./assets/sounds/move.mp3'),
          cut: require('./assets/sounds/cut.mp3'),
          win: require('./assets/sounds/win.mp3'),
        };
        for (const key of Object.keys(soundAssets)) {
          try {
            const { sound } = await Audio.Sound.createAsync(soundAssets[key], { shouldPlay: false });
            if (cancelled) {
              sound.unloadAsync().catch(() => {});
            } else {
              soundCacheRef.current[key] = sound;
            }
          } catch (e) {
            console.log(`Sound preload failed for ${key}:`, e);
          }
        }
      } catch (e) {
        console.log('Sound preload error:', e);
      }
    })();

    return () => {
      cancelled = true;
      Object.values(soundCacheRef.current).forEach((s) => {
        if (s) s.unloadAsync().catch(() => {});
      });
      soundCacheRef.current = {};
    };
  }, []);

  // ========== BACK HANDLER ==========
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // 1. Close any open modal (priority order)
      if (avatarModal) { setAvatarModal(false); return true; }
      if (chatModal) { setChatModal(false); return true; }
      if (dailyBonusModal) { setDailyBonusModal(false); return true; }
      if (leaderboardModal) { setLeaderboardModal(false); return true; }
      if (profileStatsModal) { setProfileStatsModal(false); return true; }
      if (friendsModal) { setFriendsModal(false); return true; }
      if (onlineLobbyModal) { setOnlineLobbyModal(false); return true; }
      if (botSelectModal) { setBotSelectModal(false); return true; }
      if (passPlayModal) { setPassPlayModal(false); return true; }
      if (hybridTeamModal) { setHybridTeamModal(false); return true; }
      if (onlineScreen) { setOnlineScreen(false); return true; }
      if (showPodiumBoard) { setShowPodiumBoard(false); return true; }
      if (settingsModal) { setSettingsModal(false); return true; }
      if (incomingInvite) { setIncomingInvite(null); return true; }

      // 2. Game in progress -> exit confirmation
      if (gameMode) {
        Alert.alert(
          'Exit Game',
          'Return to Main Lobby?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Quit Match',
              style: 'destructive',
              onPress: () => {
                // Notify online players
                if (
                  (gameMode === 'ONLINE' || gameMode === 'HYBRID') &&
                  ws.current &&
                  ws.current.readyState === WebSocket.OPEN
                ) {
                  ws.current.send(
                    JSON.stringify({
                      topic: `realtime:room_${roomCode}`,
                      event: 'broadcast',
                      payload: {
                        type: 'PLAYER_LEFT_MATCH',
                        data: { color: myColor, name: currentUser?.name },
                      },
                      ref: 'exit_match',
                    })
                  );
                }
                resetGame();
              },
            },
          ]
        );
        return true;
      }

      // 3. Lobby (dashboard) -> exit app
      Alert.alert(
        'Exit App',
        'Are you sure you want to exit?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, [
    avatarModal,
    chatModal,
    dailyBonusModal,
    leaderboardModal,
    profileStatsModal,
    friendsModal,
    onlineLobbyModal,
    botSelectModal,
    passPlayModal,
    hybridTeamModal,
    onlineScreen,
    showPodiumBoard,
    settingsModal,
    incomingInvite,
    gameMode,
  ]);

  const currentTurn = activeColors[turnIndex] || activeColors[0] || 'BLUE';

  // ========== YOUR TURN HAPTIC NOTIFICATION ==========
  useEffect(() => {
    if (!gameMode) return;
    if (gameMode === 'BOT') return; // No notification for bot games
    if (currentTurn === myColor && prevTurnForHapticRef.current !== myColor) {
      haptics.medium();
    }
    prevTurnForHapticRef.current = currentTurn;
  }, [currentTurn, gameMode, myColor]);
  
  // ========== SUPABASE USER UPSERT & HEARTBEAT ==========
  const syncUserToCloud = async (userObj) => {
    if (!userObj?.playerId) return;
    try {
      await fetch(`${SUPABASE_REST_URL}/ludo_users`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          player_id: String(userObj.playerId),
          name: userObj.name || 'Player',
          email: userObj.email,
          coins: Number(userObj.coins || 2000),
          avatar: userObj.avatar || '👸',
          last_seen: new Date().toISOString()
        })
      });
    } catch (e) {
      console.log('Error syncing user to Supabase:', e);
    }
  };

  const updateLastSeen = async () => {
    if (!currentUserRef.current?.playerId) return;
    try {
      await fetch(
        `${SUPABASE_REST_URL}/ludo_users?player_id=eq.${encodeURIComponent(currentUserRef.current.playerId)}`,
        {
          method: 'PATCH',
          headers: {
            ...supabaseHeaders,
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            last_seen: new Date().toISOString()
          })
        }
      );
    } catch (e) {}
  };

  // Auto Load User on App Launch
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@ludo_supreme_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
          if (parsed.avatar) setUserAvatar(parsed.avatar);
          await syncUserToCloud(parsed);
        }
      } catch (err) {}
    })();
  }, []);

  // Load Sound & Haptics settings from storage on launch
  useEffect(() => {
    (async () => {
      try {
        const savedSound = await AsyncStorage.getItem('@ludo_sound_setting');
        if (savedSound !== null) {
          setSoundEnabled(JSON.parse(savedSound));
        }
        const savedHaptics = await AsyncStorage.getItem('@ludo_haptics_setting');
        if (savedHaptics !== null) {
          const hv = JSON.parse(savedHaptics);
          setHapticsEnabled(hv);
          setHapticsGlobal(hv);
        } else {
          setHapticsGlobal(true);
        }
      } catch (e) {}
    })();
  }, []);

  // Background Sync Interval (Every 10 seconds, skipped during online game)
  useEffect(() => {
    if (!currentUser?.playerId) return;
    if (gameMode === 'ONLINE' || gameMode === 'HYBRID') return;

    const runSync = () => {
      if (AppState.currentState !== 'active') return;
      updateLastSeen();
      checkCloudFriendRequests();
      checkCloudGameInvites();
      fetchCloudFriendList(currentUser.playerId);
    };

    runSync();
    const interval = setInterval(runSync, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.playerId, gameMode]);

  // ========== AUTH FUNCTIONS (UPDATED WITH CLOUD LOGIN/SIGNUP) ==========
  const handleAuthSubmit = async () => {
    try {
      const email = emailInput.trim().toLowerCase();
      const password = passwordInput.trim();
      const username = usernameInput.trim();

      if (!email) {
        Alert.alert('Error', 'Please enter your email.');
        return;
      }

      if (authMode === 'SIGNUP') {
        if (!username) {
          Alert.alert('Error', 'Please enter a username.');
          return;
        }
        if (password.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters.');
          return;
        }

        const checkResponse = await fetch(
          `${SUPABASE_REST_URL}/ludo_users?email=eq.${encodeURIComponent(email)}&limit=1`,
          { headers: supabaseHeaders }
        );
        const existingUsers = await checkResponse.json();
        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          Alert.alert('Error', 'Account already exists. Please login.');
          return;
        }

        const newUser = {
          playerId: `player_${Date.now()}`,
          name: username,
          email,
          password,
          coins: 2000,
          avatar: '👸'
        };

        const response = await fetch(
          `${SUPABASE_REST_URL}/ludo_users`,
          {
            method: 'POST',
            headers: {
              ...supabaseHeaders,
              Prefer: 'return=representation'
            },
            body: JSON.stringify({
              player_id: newUser.playerId,
              name: newUser.name,
              email: newUser.email,
              password: newUser.password,
              coins: newUser.coins,
              avatar: newUser.avatar,
              last_seen: new Date().toISOString()
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Signup database error:', errorText);
          Alert.alert('Error', 'Could not create account.');
          return;
        }

        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(newUser));
        setCurrentUser(newUser);
        Alert.alert('Success', 'Account created successfully!');
        return;
      }

      // ========== CLOUD LOGIN ==========
      if (authMode === 'LOGIN') {
        if (!password) {
          Alert.alert('Error', 'Please enter your password.');
          return;
        }

        const response = await fetch(
          `${SUPABASE_REST_URL}/ludo_users?email=eq.${encodeURIComponent(email)}&limit=1`,
          { headers: supabaseHeaders }
        );

        if (!response.ok) {
          Alert.alert('Login Failed', 'Could not connect to server.');
          return;
        }

        const users = await response.json();
        if (!Array.isArray(users) || users.length === 0) {
          Alert.alert('Login Failed', 'No account found with this email.');
          return;
        }

        const cloudUser = users[0];
        if (cloudUser.password !== password) {
          Alert.alert('Login Failed', 'Incorrect password.');
          return;
        }

        const user = {
          playerId: cloudUser.player_id,
          name: cloudUser.name || 'Player',
          email: cloudUser.email,
          password: cloudUser.password,
          coins: Number(cloudUser.coins || 0),
          avatar: cloudUser.avatar || '👤'
        };

        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(user));
        setCurrentUser(user);
        if (user.avatar) setUserAvatar(user.avatar);

        await fetch(
          `${SUPABASE_REST_URL}/ludo_users?player_id=eq.${encodeURIComponent(user.playerId)}`,
          {
            method: 'PATCH',
            headers: {
              ...supabaseHeaders,
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({ last_seen: new Date().toISOString() })
          }
        );

        Alert.alert('Success', `Welcome back, ${user.name}!`);
        return;
      }

      // ========== FORGOT PASSWORD ==========
      if (authMode === 'FORGOT') {
        if (!newPasswordInput || newPasswordInput.length < 6) {
          Alert.alert('Error', 'New password must be at least 6 characters.');
          return;
        }

        const checkResponse = await fetch(
          `${SUPABASE_REST_URL}/ludo_users?email=eq.${encodeURIComponent(email)}&limit=1`,
          { headers: supabaseHeaders }
        );
        const users = await checkResponse.json();
        if (!Array.isArray(users) || users.length === 0) {
          Alert.alert('Error', 'No account found with this email.');
          return;
        }

        const cloudUser = users[0];
        const updateResponse = await fetch(
          `${SUPABASE_REST_URL}/ludo_users?id=eq.${cloudUser.id}`,
          {
            method: 'PATCH',
            headers: {
              ...supabaseHeaders,
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({ password: newPasswordInput })
          }
        );

        if (!updateResponse.ok) {
          Alert.alert('Error', 'Password could not be updated.');
          return;
        }

        Alert.alert('Success', 'Password updated successfully!');
        setAuthMode('LOGIN');
        setPasswordInput('');
        setNewPasswordInput('');
      }
    } catch (error) {
      console.log('Auth Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleGuestLogin = async () => {
    const guestUser = {
      playerId: `guest_${Date.now()}`,
      name: 'Guest Player',
      email: `guest_${Date.now()}@ludo.app`,
      coins: 2000,
      isGuest: true,
      avatar: '👤'
    };

    setCurrentUser(guestUser);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(guestUser));
    await syncUserToCloud(guestUser);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@ludo_supreme_user');
    setCurrentUser(null);
    setSettingsModal(false);
    resetGame();
  };

  // ========== HELPER FUNCTIONS ==========
  const deductUserCoins = async (amount) => {
    if (!currentUserRef.current) return false;
    if (currentUserRef.current.coins < amount) {
      Alert.alert('Low Coins', `You need at least 🪙 ${amount} coins.`);
      return false;
    }
    const updatedUser = { ...currentUserRef.current, coins: currentUserRef.current.coins - amount };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updatedUser));
    syncUserCoinsToCloud(updatedUser.playerId, updatedUser.coins);
    return true;
  };

  const addWinnerCoins = async (amount) => {
    if (!currentUserRef.current) return;
    const updatedUser = { ...currentUserRef.current, coins: currentUserRef.current.coins + amount };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updatedUser));
    syncUserCoinsToCloud(updatedUser.playerId, updatedUser.coins);
  };

  const syncUserCoinsToCloud = async (playerId, coins) => {
    try {
      await fetch(`${SUPABASE_REST_URL}/ludo_users?player_id=eq.${playerId}`, {
        method: 'PATCH',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ coins })
      });
    } catch (e) {}
  };
  // ========== DAILY BONUS ==========
  const claimDailyBonus = async () => {
    if (!currentUserRef.current?.playerId) return;
    const playerId = currentUserRef.current.playerId;
    const bonusKey = `@ludo_daily_bonus_${playerId}`;
    const today = new Date().toDateString();

    try {
      const lastClaimDate = await AsyncStorage.getItem(bonusKey);
      if (lastClaimDate === today) {
        setDailyBonusClaimed(true);
        Alert.alert(
          'Daily Bonus Already Claimed',
          '🎁 Aaj ka Daily Bonus already claim ho chuka hai. Kal phir se claim karna!'
        );
        return;
      }
      const reward = 200;
      const updatedUser = {
        ...currentUserRef.current,
        coins: Number(currentUserRef.current.coins || 0) + reward
      };
      currentUserRef.current = updatedUser;
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem(
        '@ludo_supreme_user',
        JSON.stringify(updatedUser)
      );
      await AsyncStorage.setItem(bonusKey, today);
      setDailyBonusClaimed(true);
      await syncUserCoinsToCloud(
        updatedUser.playerId,
        updatedUser.coins
      );
      haptics.success();
      Alert.alert(
        '🎉 Daily Bonus Claimed!',
        `🪙 ${reward} Coins aapke account mein add kar diye gaye hain!`
      );
    } catch (error) {
      console.log('Daily Bonus Error:', error);
      Alert.alert(
        'Error',
        'Daily Bonus claim nahi ho saka. Please try again.'
      );
    }
  };
  // ========== LOAD GLOBAL LEADERBOARD ==========
  const loadGlobalLeaderboard = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_REST_URL}/ludo_users?select=player_id,name,coins&order=coins.desc`,
        {
          headers: supabaseHeaders
        }
      );
      if (!response.ok) {
        console.log('Leaderboard load failed:', response.status);
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setCloudLeaderboardData(
          [...data].sort(
            (a, b) => Number(b.coins || 0) - Number(a.coins || 0)
          )
        );
      }
    } catch (error) {
      console.log('Leaderboard error:', error);
    }
  };
  const recordRecentPlayer = async (playerObj) => {
    if (!currentUserRef.current || !playerObj?.id || playerObj.id === currentUserRef.current.playerId) return;
    try {
      const stored = await AsyncStorage.getItem(`@ludo_recent_${currentUserRef.current.playerId}`);
      let currentList = stored ? JSON.parse(stored) : [];
      currentList = [
        {
          id: playerObj.id,
          name: playerObj.name || 'Player',
          avatar: playerObj.avatar || '👦',
          playedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        },
        ...currentList.filter(p => p.id !== playerObj.id)
      ].slice(0, 15);
      setRecentPlayersList(currentList);
      await AsyncStorage.setItem(`@ludo_recent_${currentUserRef.current.playerId}`, JSON.stringify(currentList));
    } catch (e) {}
  };

  const updateUserGameStats = async (didWin) => {
    if (!currentUserRef.current) return;
    try {
      const updated = {
        totalPlayed: (userStats.totalPlayed || 0) + 1,
        totalWon: didWin ? (userStats.totalWon || 0) + 1 : (userStats.totalWon || 0),
        totalLost: !didWin ? (userStats.totalLost || 0) + 1 : (userStats.totalLost || 0),
      };
      setUserStats(updated);
      await AsyncStorage.setItem(`@ludo_stats_${currentUserRef.current.playerId}`, JSON.stringify(updated));
    } catch (e) {}
  };

  // Fast sound playback via cached Audio.Sound objects (no disk I/O)
  const playSound = async (type) => {
    if (!soundEnabled) return;
    try {
      const s = soundCacheRef.current[type];
      if (!s) return;
      await s.replayAsync();
    } catch (e) {}
  };

  const sendChatMessage = (textToSend = null) => {
    const msg = (textToSend || chatInputText).trim();
    if (!msg) return;
    const newMsgObj = {
      id: Date.now().toString(),
      senderName: currentUserRef.current?.name,
      senderColor: myColorRef.current,
      avatar: userAvatarRef.current,
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsgObj]);
    setChatInputText('');
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCodeRef.current}`,
        event: 'broadcast',
        payload: { type: 'CHAT_MESSAGE', data: newMsgObj },
        ref: 'chat_1'
      }));
    }
  };

  const handleExitGame = () => {
    Alert.alert('Exit Game', 'Return to Main Lobby?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Quit Match', style: 'destructive', onPress: () => {
        if ((gameMode === 'ONLINE' || gameMode === 'HYBRID') && ws.current && ws.current.readyState === WebSocket.OPEN) {
          // 🔄 Send disconnecting signal first
          ws.current.send(JSON.stringify({
            topic: `realtime:room_${roomCode}`,
            event: 'broadcast',
            payload: { type: 'PLAYER_DISCONNECTING', data: { color: myColor, name: currentUser?.name } },
            ref: 'disconnecting_sig'
          }));
          // Then final leave signal
          ws.current.send(JSON.stringify({
            topic: `realtime:room_${roomCode}`,
            event: 'broadcast',
            payload: { type: 'PLAYER_LEFT_MATCH', data: { color: myColor, name: currentUser?.name } },
            ref: 'exit_match'
          }));
        }
        resetGame();
      }},
    ]);
  };

  // ========== HEARTBEAT SYSTEM (Reconnect Detection) ==========
  useEffect(() => {
    if (gameMode !== 'ONLINE' && gameMode !== 'HYBRID') {
      if (heartbeatSendIntervalRef.current) {
        clearInterval(heartbeatSendIntervalRef.current);
        heartbeatSendIntervalRef.current = null;
      }
      if (heartbeatWatchdogRef.current) {
        clearInterval(heartbeatWatchdogRef.current);
        heartbeatWatchdogRef.current = null;
      }
      playerHeartbeatRef.current = {};
      reconnectingPlayersRef.current = {};
      setReconnectingPlayers({});
      return;
    }

    // ---------- SENDER: Broadcast heartbeat every 3 seconds ----------
    heartbeatSendIntervalRef.current = setInterval(() => {
      if (
        ws.current &&
        ws.current.readyState === WebSocket.OPEN &&
        myColorRef.current &&
        currentUserRef.current?.playerId
      ) {
        try {
          ws.current.send(JSON.stringify({
            topic: `realtime:room_${roomCodeRef.current}`,
            event: 'broadcast',
            payload: {
              type: 'PLAYER_HEARTBEAT',
              data: {
                color: myColorRef.current,
                id: currentUserRef.current.playerId
              }
            },
            ref: `hb_${Date.now()}`
          }));
        } catch (e) {}
      }
    }, 3000);

    // ---------- WATCHDOG: Check for stale players every 2 seconds ----------
    heartbeatWatchdogRef.current = setInterval(() => {
      const now = Date.now();
      const updatedReconnecting = { ...reconnectingPlayersRef.current };
      let changed = false;

      Object.keys(playerHeartbeatRef.current).forEach((color) => {
        if (color === myColorRef.current) return;
        if (!activeColorsRef.current.includes(color)) return;
        const lastSeen = playerHeartbeatRef.current[color];
        if (lastSeen && now - lastSeen > 8000) {
          if (!updatedReconnecting[color]) {
            updatedReconnecting[color] = true;
            changed = true;
          }
        }
      });

      if (changed) {
        reconnectingPlayersRef.current = updatedReconnecting;
        setReconnectingPlayers(updatedReconnecting);
      }
    }, 2000);

    return () => {
      if (heartbeatSendIntervalRef.current) clearInterval(heartbeatSendIntervalRef.current);
      if (heartbeatWatchdogRef.current) clearInterval(heartbeatWatchdogRef.current);
      heartbeatSendIntervalRef.current = null;
      heartbeatWatchdogRef.current = null;
    };
  }, [gameMode, roomCode]);

  const resetGame = () => {
    setPawns({ BLUE:[-1,-1,-1,-1], RED:[-1,-1,-1,-1], GREEN:[-1,-1,-1,-1], YELLOW:[-1,-1,-1,-1] });
    setPlayerMissCount({ BLUE:0, RED:0, GREEN:0, YELLOW:0 });
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setIsRolling(false);
    setIsHost(false);
    setChatMessages([]);
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    matchStartedRef.current = false;
    setGameMode(null);
    setBotSelectModal(false);
    setPassPlayModal(false);
    setHybridTeamModal(false);
    setOnlineScreen(false);
    setOnlineLobbyModal(false);
    setRoomPlayers({});

    // 🔄 Clear reconnect state
    playerHeartbeatRef.current = {};
    reconnectingPlayersRef.current = {};
    setReconnectingPlayers({});
    if (heartbeatSendIntervalRef.current) {
      clearInterval(heartbeatSendIntervalRef.current);
      heartbeatSendIntervalRef.current = null;
    }
    if (heartbeatWatchdogRef.current) {
      clearInterval(heartbeatWatchdogRef.current);
      heartbeatWatchdogRef.current = null;
    }

    if (ws.current) ws.current.close();
  };

  const isTeammate = (c1, c2) => {
    if (playType !== 'TEAM') return false;
    return ( (c1 === 'BLUE' && c2 === 'GREEN') || (c1 === 'GREEN' && c2 === 'BLUE') ||
             (c1 === 'RED' && c2 === 'YELLOW') || (c1 === 'YELLOW' && c2 === 'RED') );
  };

  // ========== GAME LOGIC FUNCTIONS ==========
  const getValidMoves = (color, diceVal) => {
    const playerPawns = pawnsRef.current[color];
    if (!playerPawns) return [];
    const validIndexes = [];
    playerPawns.forEach((stepCount, idx) => {
      if (stepCount === -1 && diceVal === 6) validIndexes.push(idx);
      else if (stepCount >= 0 && stepCount + diceVal <= 56) validIndexes.push(idx);
    });
    return validIndexes;
  };


  const getStrategicMoveIndex = (color, diceVal, validMoves) => {
  if (!validMoves || validMoves.length === 0) return null;
  if (validMoves.length === 1) return validMoves[0];

  const playerPawns = pawnsRef.current[color];

  // ==========================================
  // EXTREME HARD COMPUTER AI
  // ==========================================

  const getEnemyThreat = (targetTrack, movingColor) => {
    let threatScore = 0;

    for (const enemy of activeColorsRef.current) {
      if (enemy === movingColor) continue;
      if (isTeammate(movingColor, enemy)) continue;

      for (const enemyStep of pawnsRef.current[enemy]) {
        if (enemyStep < 0 || enemyStep >= 51) continue;

        const enemyTrack =
          (START_INDEX[enemy] + enemyStep) % 52;

        // Enemy se target tak distance
        const distance =
          (targetTrack - enemyTrack + 52) % 52;

        // Enemy next dice roll mein capture kar sakta hai
        if (distance >= 1 && distance <= 6) {
          threatScore += (7 - distance) * 700;
        }
      }
    }

    return threatScore;
  };


  const canCaptureEnemy = (targetTrack, movingColor) => {
    let captureScore = 0;

    for (const enemy of activeColorsRef.current) {
      if (enemy === movingColor) continue;
      if (isTeammate(movingColor, enemy)) continue;

      for (const enemyStep of pawnsRef.current[enemy]) {
        if (enemyStep < 0 || enemyStep >= 51) continue;

        const enemyTrack =
          (START_INDEX[enemy] + enemyStep) % 52;

        if (enemyTrack === targetTrack) {
          captureScore += 10000;
        }
      }
    }

    return captureScore;
  };


  let bestMove = validMoves[0];
  let bestScore = -Infinity;


  for (const idx of validMoves) {
    const currentStep = playerPawns[idx];

    // Target position
    const targetStep =
      currentStep === -1
        ? 0
        : currentStep + diceVal;

    let score = 0;


    // ==========================================
    // 1. FINISH GOTI = VERY HIGH PRIORITY
    // ==========================================

    if (targetStep === 56) {
      score += 15000;
    }


    // ==========================================
    // 2. HOME LANE PRIORITY
    // ==========================================

    if (targetStep >= 51 && targetStep < 56) {
      score += 7000;

      // Home ke jitna paas utna better
      score += targetStep * 80;
    }


    // ==========================================
    // 3. MAIN BOARD POSITION
    // ==========================================

    if (targetStep >= 0 && targetStep < 51) {

      const targetTrack =
        (START_INDEX[color] + targetStep) % 52;


      // ======================================
      // CAPTURE ENEMY = HIGHEST ATTACK
      // ======================================

      score += canCaptureEnemy(targetTrack, color);


      // ======================================
      // SAFE CELL
      // ======================================

      if (SAFE_INDEXES.includes(targetTrack)) {
        score += 3500;
      } else {

        // Enemy attack danger check
        const danger =
          getEnemyThreat(targetTrack, color);

        score -= danger;
      }


      // ======================================
      // CURRENT PAWN DANGER CHECK
      // Agar goti already danger mein hai aur
      // move karke bach rahi hai
      // ======================================

      if (currentStep >= 0 && currentStep < 51) {

        const currentTrack =
          (START_INDEX[color] + currentStep) % 52;

        if (!SAFE_INDEXES.includes(currentTrack)) {

          const currentDanger =
            getEnemyThreat(currentTrack, color);

          const targetDanger =
            SAFE_INDEXES.includes(targetTrack)
              ? 0
              : getEnemyThreat(targetTrack, color);

          // Danger se escape karna smart move hai
          if (currentDanger > targetDanger) {
            score +=
              Math.min(
                currentDanger - targetDanger,
                5000
              );
          }
        }
      }


      // ======================================
      // FORWARD PROGRESS
      // ======================================

      score += targetStep * 35;
    }


    // ==========================================
    // 4. SIX PAR NEW GOTI NIKALNA
    // ==========================================

    if (
      diceVal === 6 &&
      currentStep === -1
    ) {
      const activePawnCount =
        playerPawns.filter(
          step => step >= 0 && step < 56
        ).length;

      // Board par kam goti ho to new goti
      // nikalna useful hai
      if (activePawnCount < 2) {
        score += 2800;
      } else if (activePawnCount < 3) {
        score += 1400;
      }
    }


    // ==========================================
    // 5. LAST PART OF JOURNEY PRIORITY
    // ==========================================

    if (
      currentStep >= 35 &&
      currentStep < 51
    ) {
      score += 1000;
    }


    // ==========================================
    // 6. RANDOM TIE BREAKER
    // Same score par har baar same move na ho
    // ==========================================

    score += Math.random() * 10;


    // ==========================================
    // BEST MOVE SELECT
    // ==========================================

    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }


  return bestMove;
};
    
  const handleTimeoutMiss = () => {
    const timedOutColor = currentTurn;
    const newMissCount = (playerMissCount[timedOutColor] || 0) + 1;

    setPlayerMissCount(prev => ({
      ...prev,
      [timedOutColor]: newMissCount
    }));

    // 3 chances khatam → player exit
    if (newMissCount >= 3) {
      const remainingColors = activeColors.filter(
        color => color !== timedOutColor
      );

      // ===== ONLY 2 PLAYERS THE =====
      if (remainingColors.length === 1) {
        const winnerColor = remainingColors[0];
        const finalRankings = [winnerColor, timedOutColor];

        setActiveColors(remainingColors);
        setFinishedRankings(finalRankings);
        setShowPodiumBoard(true);
        setHasRolled(false);
        setIsMoving(false);
        setIsRolling(false);
        haptics.warning();

        if (winnerColor === myColorRef.current) {
          addWinnerCoins(matchPrizePool);
        }

        updateUserGameStats(
          winnerColor === myColorRef.current
        );

        Alert.alert(
          'PLAYER EXITED',
          `${getBaseDynamicLabel(timedOutColor)} missed 3 turns and has been removed. ${getBaseDynamicLabel(winnerColor)} wins!`
        );

        sendMultiplayerSync(
          pawnsRef.current,
          0,
          playerDices,
          false,
          finalRankings
        );

        return;
      }

      // ===== 3 YA 4 PLAYERS THE =====
      const nextIdx = turnIndex % remainingColors.length;

      setActiveColors(remainingColors);
      setTurnIndex(nextIdx);
      setHasRolled(false);
      setIsMoving(false);
      setIsRolling(false);
      haptics.warning();

      Alert.alert(
        'PLAYER EXITED',
        `${getBaseDynamicLabel(timedOutColor)} missed 3 turns and has been removed from the game.`
      );

      sendMultiplayerSync(
        pawnsRef.current,
        nextIdx,
        playerDices,
        false
      );

      return;
    }

    // 3 se kam miss hai → automatic dice roll
    rollDice(false, true);
  };
  const nextTurn = (currentIdx = turnIndex, customActive = activeColors) => {
    const nextIdx = (currentIdx + 1) % customActive.length;
    setTurnIndex(nextIdx);
    setHasRolled(false);
    setIsMoving(false);
    return nextIdx;
  };

  // ========== ACTION-BASED MULTIPLAYER ANIMATIONS ==========
  // Normal live gameplay is sent as actions. SYNC_GAME is kept only as a
  // legacy/recovery snapshot and must never be used for normal move animation.
  const sendMultiplayerAction = (type, data = {}) => {
    if (!(gameModeRef.current === 'ONLINE' || gameModeRef.current === 'HYBRID')) return false;
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !roomCodeRef.current) return false;
    const payload = {
      ...data,
      senderId: currentUserRef.current?.playerId || null
    };
    try {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCodeRef.current}`,
        event: 'broadcast',
        payload: { type, data: payload },
        ref: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      }));
      return true;
    } catch (err) {
      console.log(`${type} send failed; recovery snapshot will handle reconnect:`, err);
      return false;
    }
  };

  const animateRemoteDice = async (color, finalValue) => {
    const run = async () => {
      if (!color || !ALL_COLORS.includes(color) || !Number.isInteger(finalValue)) return;

      setIsRolling(true);
      spinAnim.stopAnimation();
      diceBounceAnim.stopAnimation();
      spinAnim.setValue(0);
      diceBounceAnim.setValue(1);
      playSound('dice');
      haptics.medium();

      const animation = Animated.parallel([
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(diceBounceAnim, { toValue: 1.35, duration: 180, useNativeDriver: true }),
          Animated.timing(diceBounceAnim, { toValue: 0.85, duration: 180, useNativeDriver: true }),
          Animated.timing(diceBounceAnim, { toValue: 1, duration: 290, useNativeDriver: true })
        ])
      ]);

      // Keep the visible face changing while the same animation is running.
      const shuffleValues = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        finalValue
      ];
      const shuffleDelays = [120, 120, 120, 190];
      for (let i = 0; i < shuffleValues.length; i++) {
        updatePlayerDice(color, shuffleValues[i]);
        await sleep(shuffleDelays[i]);
      }
      await new Promise(resolve => animation.start(resolve));
      updatePlayerDice(color, finalValue);
      haptics.light();
      setIsRolling(false);
      setHasRolled(true);
      hasRolledRef.current = true;
    };

    remoteDiceAnimationRef.current = remoteDiceAnimationRef.current
      .catch(() => {})
      .then(run);
    return remoteDiceAnimationRef.current;
  };

  const animateRemoteMove = async (data) => {
    const run = async () => {
      const color = data.color;
      const index = Number(data.index);
      const diceVal = Number(data.diceVal);
      const finalStep = Number(data.finalStep);
      if (!ALL_COLORS.includes(color) || !Number.isInteger(index) || index < 0 || index > 3 ||
          !Number.isInteger(diceVal) || !Number.isInteger(finalStep)) return;

      await remoteDiceAnimationRef.current.catch(() => {});
      setIsMoving(true);

      let startStep = Number.isInteger(data.startStep) ? data.startStep : (finalStep === 0 && diceVal === 6 ? -1 : finalStep - diceVal);
      let visibleStep = startStep;
      let working = clonePawns(pawnsRef.current);

      if (startStep === -1 && finalStep === 0) {
        playSound('move');
        haptics.selection();
        working[color][index] = 0;
        pawnsRef.current = working;
        setPawns(working);
        await sleep(350);
      } else {
        const steps = Math.max(0, finalStep - startStep);
        for (let step = 1; step <= steps; step++) {
          visibleStep = startStep + step;
          playSound('move');
          haptics.selection();
          working = clonePawns(working);
          working[color][index] = visibleStep;
          pawnsRef.current = working;
          setPawns(working);
          await sleep(250);
        }
      }

      // Sender is authoritative for captures, ranking, and any other pawn changes.
      if (data.finalPawns) {
        pawnsRef.current = data.finalPawns;
        setPawns(data.finalPawns);
      }
      if (data.updatedDices) {
        playerDicesRef.current = data.updatedDices;
        setPlayerDices(data.updatedDices);
      }
      if (data.activeColors) {
        activeColorsRef.current = data.activeColors;
        setActiveColors(data.activeColors);
      }
      if (Array.isArray(data.rankings)) {
        finishedRankingsRef.current = data.rankings;
        setFinishedRankings(data.rankings);
      }
      if (data.nextTurnIdx !== undefined) {
        turnIndexRef.current = data.nextTurnIdx;
        setTurnIndex(data.nextTurnIdx);
      }
      hasRolledRef.current = data.rolled === true;
      setHasRolled(data.rolled === true);
      setIsMoving(false);

      if (data.matchFinished && Array.isArray(data.rankings) && data.rankings.length) {
        setShowPodiumBoard(true);
      }
    };

    remoteMoveAnimationRef.current = remoteMoveAnimationRef.current
      .catch(() => {})
      .then(run);
    return remoteMoveAnimationRef.current;
  };

  const rollDice = async (isBot = false, isAutoTimeout = false) => {
    if (hasRolled || isMoving || isRolling || showPodiumBoard) return;

    if (!isBot && !isAutoTimeout) {
      if (gameMode === 'ONLINE' && currentTurn !== myColor) return;

      if (
        gameMode === 'HYBRID' &&
        playerSlots[currentTurn] === 'ONLINE' &&
        currentTurn !== myColor
      ) return;

      if (
        gameMode === 'HYBRID' &&
        playerSlots[currentTurn] === 'BOT'
      ) return;
    }

    setIsRolling(true);
    playSound('dice');
    haptics.medium();

    spinAnim.setValue(0);
    diceBounceAnim.setValue(1);

    Animated.parallel([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(diceBounceAnim, {
          toValue: 1.35,
          duration: 180,
          useNativeDriver: true
        }),
        Animated.timing(diceBounceAnim, {
          toValue: 0.85,
          duration: 180,
          useNativeDriver: true
        }),
        Animated.timing(diceBounceAnim, {
          toValue: 1,
          duration: 290,
          useNativeDriver: true
        }),
      ])
    ]).start();

    // FINAL VALUE animation shuru hone se pehle hi lock hoti hai.
    const lockedFinalVal = Math.floor(Math.random() * 6) + 1;

    // Broadcast the action as soon as the final value is locked so opponents
    // run their own dice animation instead of receiving a final-state jump.
    sendMultiplayerAction('ROLL_DICE', {
      color: currentTurn,
      value: lockedFinalVal
    });

    const shuffleSteps = [50, 70, 90, 110];
    for (let i = 0; i < shuffleSteps.length; i++) {
      // Last animation frame hamesha locked final value dikhayega.
      const rand = (
        i === shuffleSteps.length - 1
      )
        ? lockedFinalVal
        : Math.floor(Math.random() * 6) + 1;

      updatePlayerDice(currentTurn, rand);
      await sleep(shuffleSteps[i]);
    }

    // Animation ke baad bhi exactly wahi locked value set hogi.
    updatePlayerDice(currentTurn, lockedFinalVal);
    haptics.light();
    await sleep(200);

    setIsRolling(false);
    setHasRolled(true);

    const newDices = {
      ...playerDicesRef.current,
      [currentTurn]: lockedFinalVal
    };
    playerDicesRef.current = newDices;

    const validMoves = getValidMoves(currentTurn, lockedFinalVal);

    if (validMoves.length === 0) {
      setTimeout(() => {
        const nextIdx = nextTurn();
        sendMultiplayerAction('TURN_CHANGE', { nextTurnIdx: nextIdx, updatedDices: newDices, rolled: false, activeColors: activeColorsRef.current });
      }, 700);
    } else if (isBot || isAutoTimeout || validMoves.length === 1) {
      const bestMove = getStrategicMoveIndex(
        currentTurn,
        lockedFinalVal,
        validMoves
      );

      setTimeout(
        () => executeStepMovement(
          currentTurn,
          bestMove,
          lockedFinalVal,
          newDices
        ),
        400
      );
    } else {
      sendMultiplayerAction('TURN_CHANGE', { nextTurnIdx: turnIndex, updatedDices: newDices, rolled: true, activeColors: activeColorsRef.current });
    }
  };

  const executeStepMovement = async (color, index, diceVal, currentDices = playerDices) => {
    setIsMoving(true);
    let startStep = pawnsRef.current[color][index];

    if (startStep === -1) {
      playSound('move');
      haptics.selection();
      const updated = clonePawns(pawnsRef.current);
      updated[color][index] = 0;
      setPawns(updated);
      await sleep(350);
      finalizeMove(color, index, 0, diceVal, updated, currentDices);
      return;
    }

    let currentStep = startStep;
    let currentPawnsState = clonePawns(pawnsRef.current);

    for (let step = 1; step <= diceVal; step++) {
      currentStep += 1;
      playSound('move');
      haptics.selection();
      currentPawnsState = clonePawns(currentPawnsState);
      currentPawnsState[color][index] = currentStep;
      setPawns(currentPawnsState);
      await sleep(250);
    }

    finalizeMove(color, index, currentStep, diceVal, currentPawnsState, currentDices);
  };

  const finalizeMove = (color, index, finalStep, diceVal, finalState, currentDices) => {
    let updatedPawns = clonePawns(finalState);
    let extraTurn = diceVal === 6 || finalStep === 56;
    const startStepForBroadcast = (finalStep === 0 && diceVal === 6) ? -1 : finalStep - diceVal;

    if (finalStep >= 0 && finalStep < 51) {
      const myTrackIndex = (START_INDEX[color] + finalStep) % 52;
      const isSafeCell = SAFE_INDEXES.includes(myTrackIndex);

      if (!isSafeCell) {
        ALL_COLORS.forEach((enemyColor) => {
          if (enemyColor !== color) {
            const teammate = isTeammate(color, enemyColor);
            if (!teammate || (teammate && friendlyKill)) {
              updatedPawns[enemyColor] = updatedPawns[enemyColor].map((enemyStep) => {
                if (enemyStep >= 0 && enemyStep < 51) {
                  const enemyTrackIndex = (START_INDEX[enemyColor] + enemyStep) % 52;
                  if (enemyTrackIndex === myTrackIndex) {
                    playSound('cut');
                    haptics.heavy();
                    extraTurn = true;
                    return -1;
                  }
                }
                return enemyStep;
              });
            }
          }
        });
      }
    }

    let currentFinished = [...finishedRankings];
    let isCurrentColorWinnerNow = false;

    const hasWonMatch = updatedPawns[color].every((s) => s === 56);
    const isPawnOut = updatedPawns[color].some((s) => s > 0);

    if (!currentFinished.includes(color) && hasWonMatch && isPawnOut) {
      currentFinished.push(color);
      setFinishedRankings(currentFinished);
      isCurrentColorWinnerNow = true;
      playSound('win');
      haptics.success();
      const rankTitle = currentFinished.length === 1 ? '🥇 1st Place' : currentFinished.length === 2 ? '🥈 2nd Place' : '🥉 3rd Place';
      Alert.alert('VICTORY!', `${getBaseDynamicLabel(color)} secured ${rankTitle}!`);
    }

    const activeRemaining = activeColors.filter((c) => !currentFinished.includes(c));

    if (activeRemaining.length <= 1 && currentFinished.length > 0) {
      if (activeRemaining.length === 1) {
        currentFinished.push(activeRemaining[0]);
      }
      setFinishedRankings(currentFinished);
      setShowPodiumBoard(true);
      setPawns(updatedPawns);
      setIsMoving(false);

      if (currentFinished[0] === myColorRef.current) {
        addWinnerCoins(matchPrizePool);
      }
      updateUserGameStats(currentFinished[0] === myColorRef.current);
      sendMultiplayerAction('MOVE_TOKEN', { color, index, diceVal, startStep: startStepForBroadcast, finalStep, finalPawns: updatedPawns, nextTurnIdx: turnIndex, updatedDices: currentDices, rolled: false, activeColors: activeColors, rankings: currentFinished, matchFinished: true });
      return;
    }

    setPawns(updatedPawns);
    setIsMoving(false);

    // 📳 Small buzz if extra turn on rolling 6 (without capture)
    if (extraTurn && diceVal === 6 && finalStep !== 56) {
      haptics.light();
    }

    let newActiveColors = activeColors.filter((c) => !currentFinished.includes(c));
    if (isCurrentColorWinnerNow) {
      setActiveColors(newActiveColors);
      const nextIdx = nextTurn(turnIndex, newActiveColors);
      sendMultiplayerAction('MOVE_TOKEN', { color, index, diceVal, startStep: startStepForBroadcast, finalStep, finalPawns: updatedPawns, nextTurnIdx: nextIdx, updatedDices: currentDices, rolled: false, activeColors: newActiveColors, rankings: currentFinished, matchFinished: false });
    } else if (extraTurn) {
      setHasRolled(false);
      sendMultiplayerAction('MOVE_TOKEN', { color, index, diceVal, startStep: startStepForBroadcast, finalStep, finalPawns: updatedPawns, nextTurnIdx: turnIndex, updatedDices: currentDices, rolled: false, activeColors: activeColors, rankings: currentFinished, matchFinished: true });
    } else {
      const nextIdx = nextTurn(turnIndex, activeColors);
      sendMultiplayerAction('MOVE_TOKEN', { color, index, diceVal, startStep: startStepForBroadcast, finalStep, finalPawns: updatedPawns, nextTurnIdx: nextIdx, updatedDices: currentDices, rolled: false, activeColors: newActiveColors, rankings: currentFinished, matchFinished: false });
    }
  };

  // Send the newest state immediately when possible. If the network drops, keep only the
  // latest snapshot and flush it after reconnect so the game does not get stuck on an old move.
  const sendMultiplayerSync = (newPawns, nextTurnIdx, updatedDices, rolled, rankings = null) => {
    const payloadData = {
      newPawns,
      nextTurnIdx,
      updatedDices,
      rolled,
      rankings,
      syncedColors: activeColorsRef.current,
      syncedPlayType: playTypeRef.current,
      senderId: currentUserRef.current?.playerId || null
    };

    pendingGameSyncRef.current = payloadData;
    turnIndexRef.current = nextTurnIdx;
    hasRolledRef.current = rolled;
    if (rankings) finishedRankingsRef.current = rankings;

    if ((gameModeRef.current === 'ONLINE' || gameModeRef.current === 'HYBRID') &&
        ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({
          topic: `realtime:room_${roomCodeRef.current}`,
          event: 'broadcast',
          payload: { type: 'MATCH_STATE', data: payloadData },
          ref: `sync_${Date.now()}`
        }));
        pendingGameSyncRef.current = null;
      } catch (err) {
        console.log('SYNC queued until reconnect:', err);
      }
    }
  };

  // ========== ADVANCED WEB SOCKET AUTO-RECONNECT + STATE RECOVERY ==========
  useEffect(() => {
    if (!roomCode) return;

    let reconnectTimer = null;
    let isConnecting = false;
    let disposed = false;

    const sendBroadcast = (socket, type, data, ref) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify({
        topic: `realtime:room_${roomCodeRef.current}`,
        event: 'broadcast',
        payload: { type, data },
        ref: ref || `${type}_${Date.now()}`
      }));
      return true;
    };

    const buildGameSnapshot = () => ({
      newPawns: pawnsRef.current,
      nextTurnIdx: turnIndexRef.current,
      updatedDices: playerDicesRef.current,
      rolled: hasRolledRef.current,
      rankings: finishedRankingsRef.current,
      syncedColors: activeColorsRef.current,
      syncedPlayType: playTypeRef.current,
      roomPlayers: roomPlayersRef.current,
      playerSlots: playerSlotsRef.current,
      // Explicit match state: recovery must never infer that a TEAM lobby is already playing.
      matchStarted: matchStartedRef.current,
      gameMode: gameModeRef.current
    });

    const connectWebSocket = () => {
      if (disposed || isConnecting) return;
      isConnecting = true;

      const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        isConnecting = false;
        reconnectAttemptsRef.current = 0;
        console.log('WebSocket connected/reconnected successfully');

        socket.send(JSON.stringify({
          topic: `realtime:room_${roomCodeRef.current}`,
          event: 'phx_join',
          payload: {},
          ref: `room_join_${Date.now()}`
        }));

        // Give the channel a moment to finish joining before recovery broadcasts.
        setTimeout(() => {
          if (disposed || socket !== ws.current || socket.readyState !== WebSocket.OPEN) return;
          const me = currentUserRef.current;
          if (!me) return;

          // Re-announce the SAME color. Do not run the normal color-assignment flow during reconnect.
          sendBroadcast(socket, 'PLAYER_RECONNECTED', {
            color: myColorRef.current,
            name: me.name,
            id: me.playerId,
            avatar: userAvatarRef.current
          }, 'player_reconnected');

          // Ask the host for the latest authoritative snapshot.
          sendBroadcast(socket, 'REQUEST_GAME_STATE', {
            requesterId: me.playerId,
            requesterColor: myColorRef.current
          }, 'request_game_state');

          // Flush only the latest unsent local snapshot after the channel is alive again.
          if (pendingGameSyncRef.current) {
            sendBroadcast(socket, 'MATCH_STATE', pendingGameSyncRef.current, 'flush_pending_sync');
            pendingGameSyncRef.current = null;
          }
        }, 200);
      };

      socket.onclose = () => {
        isConnecting = false;
        if (disposed || intentionalSocketCloseRef.current) return;

        reconnectAttemptsRef.current += 1;
        const attempt = reconnectAttemptsRef.current;
        const delay = Math.min(1000 * Math.pow(2, Math.min(attempt, 4)), 8000);
        console.log(`WebSocket disconnected. Reconnecting in ${delay}ms (attempt ${attempt})...`);

        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (!disposed && roomCodeRef.current) connectWebSocket();
        }, delay);
      };

      socket.onerror = (error) => {
        console.log('WebSocket error:', error);
        try { socket.close(); } catch (e) {}
      };

      socket.onmessage = async (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.event !== 'broadcast') return;

          const type = message.payload?.type;
          const data = message.payload?.data || {};

          // -------- Advanced reconnect / state recovery --------
          if (type === 'PLAYER_RECONNECTED') {
            if (!data.id) return;
            const updatedRoster = {
              ...roomPlayersRef.current,
              [data.color]: { name: data.name, id: data.id, avatar: data.avatar }
            };
            roomPlayersRef.current = updatedRoster;
            setRoomPlayers(updatedRoster);
            if (isHostRef.current) sendBroadcast(socket, 'ROSTER_UPDATE_FULL', updatedRoster, 'roster_recovered');

            // 🔄 Clear reconnecting flag
            if (reconnectingPlayersRef.current[data.color]) {
              const updatedRC = { ...reconnectingPlayersRef.current };
              delete updatedRC[data.color];
              reconnectingPlayersRef.current = updatedRC;
              setReconnectingPlayers(updatedRC);
            }
            playerHeartbeatRef.current[data.color] = Date.now();
            return;
          }

          // ========== HEARTBEAT: Player is alive ==========
          if (type === 'PLAYER_HEARTBEAT') {
            if (data.color === myColorRef.current) return;
            playerHeartbeatRef.current[data.color] = Date.now();
            if (reconnectingPlayersRef.current[data.color]) {
              const updated = { ...reconnectingPlayersRef.current };
              delete updated[data.color];
              reconnectingPlayersRef.current = updated;
              setReconnectingPlayers(updated);
            }
            return;
          }

          // ========== Player intentionally disconnecting ==========
          if (type === 'PLAYER_DISCONNECTING') {
            if (data.color === myColorRef.current) return;
            const updated = { ...reconnectingPlayersRef.current, [data.color]: true };
            reconnectingPlayersRef.current = updated;
            setReconnectingPlayers(updated);
            return;
          }

          if (type === 'REQUEST_GAME_STATE') {
            // Host is the authoritative source for a reconnecting player's state recovery.
            if (!isHostRef.current || !data.requesterId) return;
            sendBroadcast(socket, 'GAME_STATE_RECOVERY', {
              targetId: data.requesterId,
              snapshot: buildGameSnapshot()
            }, 'game_state_recovery');
            return;
          }

          if (type === 'GAME_STATE_RECOVERY') {
            if (data.targetId !== currentUserRef.current?.playerId) return;
            const snapshot = data.snapshot || {};
            if (snapshot.newPawns) {
              pawnsRef.current = snapshot.newPawns;
              setPawns(snapshot.newPawns);
            }
            if (snapshot.nextTurnIdx !== undefined) {
              turnIndexRef.current = snapshot.nextTurnIdx;
              setTurnIndex(snapshot.nextTurnIdx);
            }
            if (snapshot.updatedDices) {
              playerDicesRef.current = snapshot.updatedDices;
              setPlayerDices(snapshot.updatedDices);
            }
            if (snapshot.rolled !== undefined) {
              hasRolledRef.current = snapshot.rolled;
              setHasRolled(snapshot.rolled);
            }
            if (snapshot.rankings) {
              finishedRankingsRef.current = snapshot.rankings;
              setFinishedRankings(snapshot.rankings);
            }
            if (snapshot.syncedColors) setActiveColors(snapshot.syncedColors);
            if (snapshot.syncedPlayType) setPlayType(snapshot.syncedPlayType);
            if (snapshot.roomPlayers) {
              roomPlayersRef.current = snapshot.roomPlayers;
              setRoomPlayers(snapshot.roomPlayers);
            }
            if (snapshot.playerSlots) {
              playerSlotsRef.current = snapshot.playerSlots;
              setPlayerSlots(snapshot.playerSlots);
            }
            // IMPORTANT: A reconnect/state-recovery packet can arrive while the
            // Team Up room is still in the lobby. Never infer HYBRID/ONLINE from
            // the play type. The guest may enter the match only after the host
            // has actually started it.
            const recoveredMatchStarted = snapshot.matchStarted === true;

            if (recoveredMatchStarted) {
              matchStartedRef.current = true;
              setOnlineLobbyModal(false);
              setGameMode(snapshot.gameMode || (snapshot.syncedPlayType === 'TEAM' ? 'HYBRID' : 'ONLINE'));
            } else {
              matchStartedRef.current = false;
              // Keep the joiner in the waiting lobby; only refresh the recovered roster/state.
              setOnlineLobbyModal(true);
              setGameMode(null);
            }

            setIsMoving(false);
            return;
          }

          // ---------- Live gameplay action handlers ----------
          if (type === 'ROLL_DICE') {
            if (data.senderId && data.senderId === currentUserRef.current?.playerId) return;
            if (!matchStartedRef.current) return;
            if (!data.color || !Number.isInteger(Number(data.value))) return;
            animateRemoteDice(data.color, Number(data.value));
            return;
          }
          else if (type === 'MOVE_TOKEN') {
            if (data.senderId && data.senderId === currentUserRef.current?.playerId) return;
            if (!matchStartedRef.current) return;
            animateRemoteMove(data);
            return;
          }
                    else if (type === 'TURN_CHANGE') {
            if (data.senderId && data.senderId === currentUserRef.current?.playerId) return;
            if (!matchStartedRef.current) return;

            // Turn change ko queue mein daalein taaki dice animation khatam hone ka wait kare
            const runTurnChange = async () => {
              await remoteDiceAnimationRef.current.catch(() => {});
              
              if (data.updatedDices) {
                playerDicesRef.current = data.updatedDices;
                setPlayerDices(data.updatedDices);
              }
              if (data.activeColors) {
                activeColorsRef.current = data.activeColors;
                setActiveColors(data.activeColors);
              }
              if (data.nextTurnIdx !== undefined) {
                turnIndexRef.current = data.nextTurnIdx;
                setTurnIndex(data.nextTurnIdx);
              }
              
              hasRolledRef.current = data.rolled === true;
              setHasRolled(data.rolled === true);
            };

            remoteMoveAnimationRef.current = remoteMoveAnimationRef.current.catch(() => {}).then(runTurnChange);
            return;
          }


          // ---------- Existing message handlers ----------
          if (type === 'CHECK_ROOM_EXISTS') {
            if (!isHostRef.current || !currentUserRef.current) return;

            const occupied = new Set([
              ...Object.keys(roomPlayersRef.current),
              myColorRef.current
            ]);
            const active = activeColorsRef.current || [];
            const slots = playerSlotsRef.current || {};
            const preferredOrder = playTypeRef.current === 'TEAM'
              ? ['GREEN', 'RED', 'YELLOW', 'BLUE']
              : active;
            const available = preferredOrder.filter(
              color => active.includes(color) && slots[color] === 'ONLINE' && !occupied.has(color)
            );
            const assignedColor = available[0];

            if (!assignedColor) {
              sendBroadcast(socket, 'ROOM_FULL', {}, 'room_full');
              return;
            }

            sendBroadcast(socket, 'ROOM_EXISTS_CONFIRMED', {
              hostName: currentUserRef.current.name,
              hostAvatar: userAvatarRef.current,
              hostColor: myColorRef.current,
              activeColors: activeColorsRef.current,
              playType: playTypeRef.current,
              entryFee: selectedEntryFeeRef.current,
              syncedPlayerSlots: playerSlotsRef.current,
              syncedRoomPlayers: roomPlayersRef.current || {},
              assignedColor
            }, 'confirm_ack');
          }
          else if (type === 'CHAT_MESSAGE') {
            setChatMessages(prev => [...prev, data]);
          }
          else if (type === 'PLAYER_JOINED') {
            const updatedRoster = {
              ...roomPlayersRef.current,
              [data.color]: { name: data.name, id: data.id, avatar: data.avatar }
            };
            roomPlayersRef.current = updatedRoster;
            setRoomPlayers(updatedRoster);
            recordRecentPlayer({ id: data.id, name: data.name, avatar: data.avatar });
            if (isHostRef.current && currentUserRef.current) {
              sendBroadcast(socket, 'ROSTER_UPDATE_FULL', updatedRoster, 'roster_full');
            }
            playerHeartbeatRef.current[data.color] = Date.now(); // 🔄 Init heartbeat
          }
          else if (type === 'ROSTER_UPDATE_FULL') {
            roomPlayersRef.current = data;
            setRoomPlayers(data);
          }
          else if (type === 'ROSTER_UPDATE') {
            const merged = { ...roomPlayersRef.current, [data.color]: { name: data.name, id: data.id, avatar: data.avatar } };
            roomPlayersRef.current = merged;
            setRoomPlayers(merged);
            recordRecentPlayer({ id: data.id, name: data.name, avatar: data.avatar });
          }
          else if (type === 'PLAYER_LEFT_MATCH') {
            const leftColor = data.color;
            const leftName = data.name || leftColor;

            // 🔄 Remove any reconnecting flag for this color
            if (reconnectingPlayersRef.current[leftColor]) {
              const updatedRC = { ...reconnectingPlayersRef.current };
              delete updatedRC[leftColor];
              reconnectingPlayersRef.current = updatedRC;
              setReconnectingPlayers(updatedRC);
            }
            delete playerHeartbeatRef.current[leftColor];

            if (activeColorsRef.current.length <= 2) {
              Alert.alert('Opponent Left', `${leftName} has left the match. You won!`);
              setShowPodiumBoard(true);
              setFinishedRankings([myColorRef.current, leftColor]);
              if (myColorRef.current === activeColorsRef.current.find(c => c !== leftColor)) addWinnerCoins(matchPrizePool);
              updateUserGameStats(true);
            } else {
              const remainingActive = activeColorsRef.current.filter(c => c !== leftColor);
              setActiveColors(remainingActive);
              Alert.alert('Player Disconnected', `${leftName} has left the match.`);
              if (currentTurn === leftColor) {
                const nextIdx = nextTurn();
                sendMultiplayerSync(pawnsRef.current, nextIdx, playerDicesRef.current, false);
              }
            }
          }
          else if (type === 'START_MATCH') {
            // Only this explicit host broadcast may open the match for guests.
            matchStartedRef.current = true;
            if (!isHostRef.current) await deductUserCoins(data.entryFee || 50);
            if (data.activeColors) setActiveColors(data.activeColors);
            if (data.playType) setPlayType(data.playType);
            if (data.prizePool) setMatchPrizePool(data.prizePool);
            if (data.syncedRoomPlayers) {
              roomPlayersRef.current = data.syncedRoomPlayers;
              setRoomPlayers(data.syncedRoomPlayers);
            }
            if (data.playerSlots) {
              playerSlotsRef.current = data.playerSlots;
              setPlayerSlots(data.playerSlots);
            }
            setOnlineLobbyModal(false);
            setGameMode(data.playType === 'TEAM' ? 'HYBRID' : 'ONLINE');
          }
          else if (type === 'MATCH_STATE') {
            // Snapshot fallback/recovery only. Normal live rolls/moves never use
            // this path, so it cannot cancel the step-by-step action animation.
            if (data.senderId && data.senderId === currentUserRef.current?.playerId) return;
            if (!matchStartedRef.current) return;

            // Diff-check to avoid unnecessary re-renders on duplicate packets
            const pawnsChanged = data.newPawns && JSON.stringify(data.newPawns) !== JSON.stringify(pawnsRef.current);
            const turnChanged = data.nextTurnIdx !== undefined && data.nextTurnIdx !== turnIndexRef.current;
            const diceChanged = data.updatedDices && JSON.stringify(data.updatedDices) !== JSON.stringify(playerDicesRef.current);
            const rolledChanged = data.rolled !== undefined && data.rolled !== hasRolledRef.current;
            const colorsChanged = data.syncedColors && JSON.stringify(data.syncedColors) !== JSON.stringify(activeColorsRef.current);
            const rankingsChanged = Array.isArray(data.rankings) && JSON.stringify(data.rankings) !== JSON.stringify(finishedRankingsRef.current);

            if (pawnsChanged) {
              pawnsRef.current = data.newPawns;
              setPawns(data.newPawns);
            }
            if (turnChanged) {
              turnIndexRef.current = data.nextTurnIdx;
              setTurnIndex(data.nextTurnIdx);
            }
            if (diceChanged) {
              playerDicesRef.current = data.updatedDices;
              setPlayerDices(data.updatedDices);
            }
            if (rolledChanged) {
              hasRolledRef.current = data.rolled;
              setHasRolled(data.rolled);
            }
            if (colorsChanged) {
              activeColorsRef.current = data.syncedColors;
              setActiveColors(data.syncedColors);
            }
            if (data.syncedPlayType) setPlayType(data.syncedPlayType);
            if (data.rankings && data.rankings.length > 0 && rankingsChanged) {
              finishedRankingsRef.current = data.rankings;
              setFinishedRankings(data.rankings);
              setShowPodiumBoard(true);
            }
            return;
          }
          else if (type === 'SYNC_GAME') {
            // Deprecated legacy packet. Intentionally ignored so an old snapshot
            // can never overwrite an opponent's animated dice/token action.
            return;
          }
          
        } catch (err) {
          console.log('WebSocket message error:', err);
        }
      };
    };

    intentionalSocketCloseRef.current = false;
    connectWebSocket();

    return () => {
      disposed = true;
      intentionalSocketCloseRef.current = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws.current) {
        try { ws.current.close(); } catch (e) {}
      }
    };
  }, [roomCode]);

  // ========== JOIN FUNCTIONS (WITH FORCED CODE SUPPORT) ==========
  const joinOnlineRoom = (forcedCode = null) => {
    const code = (forcedCode || inputRoomCode).trim();
    if (code.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid room code');
      return;
    }

    setIsVerifyingRoom(true);
    setIsHost(false);

    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    const tempWs = new WebSocket(wsUrl);
    let joined = false;

    tempWs.onopen = () => {
      tempWs.send(JSON.stringify({ topic: `realtime:room_${code}`, event: 'phx_join', payload: {}, ref: 'chk_join' }));
      tempWs.send(JSON.stringify({
        topic: `realtime:room_${code}`,
        event: 'broadcast',
        payload: { type: 'CHECK_ROOM_EXISTS', data: { guestId: currentUser?.playerId } },
        ref: 'chk_req'
      }));
    };

    tempWs.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event !== 'broadcast') return;
        if (message.payload?.type === 'ROOM_FULL') {
          Alert.alert('Room Full', 'This room already has all players.');
          tempWs.close();
          setIsVerifyingRoom(false);
          return;
        }
        if (message.payload?.type === 'ROOM_EXISTS_CONFIRMED') {
          if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
          const data = message.payload.data;
          const assignedColor = data.assignedColor;
          
          // FIX: Use the roster sent by the host as the base, then add this guest
          const basePlayers = data.syncedRoomPlayers || {};
          const updatedPlayers = {
            ...basePlayers,
            [assignedColor]: { 
              name: currentUser.name, 
              id: currentUser.playerId, 
              avatar: userAvatar 
            }
          };

          setMyColor(assignedColor);
          myColorRef.current = assignedColor;
          setRoomCode(code);
          setActiveColors(data.activeColors || ['BLUE','GREEN']);
          setPlayType(data.playType || 'SOLO');
          setSelectedEntryFee(data.entryFee || 50);
          if (data.syncedPlayerSlots) {
            playerSlotsRef.current = data.syncedPlayerSlots;
            setPlayerSlots(data.syncedPlayerSlots);
          }
          roomPlayersRef.current = updatedPlayers;
          setRoomPlayers(updatedPlayers);
          setIsVerifyingRoom(false);
          setOnlineScreen(false);
          setOnlineLobbyModal(true);

          if (currentUserRef.current) {
            tempWs.send(JSON.stringify({
              topic: `realtime:room_${code}`,
              event: 'broadcast',
              payload: {
                type: 'PLAYER_JOINED',
                data: { 
                  color: assignedColor, 
                  name: currentUserRef.current.name, 
                  id: currentUserRef.current.playerId, 
                  avatar: userAvatarRef.current 
                }
              },
              ref: 'p_join_guest'
            }));
          }
          joined = true;
          tempWs.close();
        }
      } catch (err) {}
    };

    joinTimeoutRef.current = setTimeout(() => {
      tempWs.close();
      if (!joined) {
        setIsVerifyingRoom(false);
        Alert.alert('Room Not Found', 'No active host found with this code.');
      }
    }, 4500);
  };

  const joinTeamOnlineRoom = (forcedCode = null) => {
    const code = (forcedCode || teamJoinCode).trim();
    if (code.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid room code to join');
      return;
    }

    setIsVerifyingRoom(true);
    setIsHost(false);

    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    const tempWs = new WebSocket(wsUrl);
    let joined = false;

    tempWs.onopen = () => {
      tempWs.send(JSON.stringify({ topic: `realtime:room_${code}`, event: 'phx_join', payload: {}, ref: 'chk_join_team' }));
      tempWs.send(JSON.stringify({
        topic: `realtime:room_${code}`,
        event: 'broadcast',
        payload: { type: 'CHECK_ROOM_EXISTS', data: { guestId: currentUser?.playerId } },
        ref: 'chk_req_team'
      }));
    };

    tempWs.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event !== 'broadcast') return;
        if (message.payload?.type === 'ROOM_FULL') {
          Alert.alert('Room Full', 'This team room already has all players.');
          tempWs.close();
          setIsVerifyingRoom(false);
          return;
        }
        if (message.payload?.type === 'ROOM_EXISTS_CONFIRMED') {
          if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
          const data = message.payload.data;
          const assignedColor = data.assignedColor;
          
          // FIX: Use the roster sent by the host as the base
          const basePlayers = data.syncedRoomPlayers || {};
          const updatedPlayers = {
            ...basePlayers,
            [assignedColor]: { 
              name: currentUser.name, 
              id: currentUser.playerId, 
              avatar: userAvatar 
            }
          };

          setMyColor(assignedColor);
          myColorRef.current = assignedColor;
          setRoomCode(code);
          setActiveColors(['BLUE','RED','GREEN','YELLOW']);
          setPlayType('TEAM');
          matchStartedRef.current = false;
          // IMPORTANT: Joining a room must NOT start the match locally.
          // The gameMode changes only after the HOST broadcasts START_MATCH.
          setSelectedEntryFee(data.entryFee || 50);
          if (data.syncedPlayerSlots) {
            playerSlotsRef.current = data.syncedPlayerSlots;
            setPlayerSlots(data.syncedPlayerSlots);
          }
          roomPlayersRef.current = updatedPlayers;
          setRoomPlayers(updatedPlayers);
          setIsVerifyingRoom(false);
          setHybridTeamModal(false);
          setOnlineLobbyModal(true);

          if (currentUserRef.current) {
            tempWs.send(JSON.stringify({
              topic: `realtime:room_${code}`,
              event: 'broadcast',
              payload: {
                type: 'PLAYER_JOINED',
                data: { 
                  color: assignedColor, 
                  name: currentUserRef.current.name, 
                  id: currentUserRef.current.playerId, 
                  avatar: userAvatarRef.current 
                }
              },
              ref: 'p_join_guest_team'
            }));
          }
          joined = true;
          tempWs.close();
        }
      } catch (err) {}
    };

    joinTimeoutRef.current = setTimeout(() => {
      tempWs.close();
      if (!joined) {
        setIsVerifyingRoom(false);
        Alert.alert('Room Not Found', 'No active team host found with this code.');
      }
    }, 4500);
  };

  // ========== START HOST / BOT / PASS & PLAY ==========
  const startOnlineHost = async () => {
    // IMPORTANT: Never create an Online room until the phone can actually
    // reach the multiplayer backend. This prevents an offline/half-created
    // room from opening when internet is unavailable.
    const connected = await checkInternetConnection();
    if (!connected) {
      Alert.alert(
        'Internet Connection Required',
        'Please connect to the internet before creating an Online room. The room will not be created until an internet connection is available.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => startOnlineHost() }
        ]
      );
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setMyColor('BLUE');
    myColorRef.current = 'BLUE';
    setIsHost(true);
    const initialSlots = { BLUE:'LOCAL', GREEN:'ONLINE', RED:'ONLINE', YELLOW:'ONLINE' };
    playerSlotsRef.current = initialSlots;
    setPlayerSlots(initialSlots);
    let colors = ['BLUE','GREEN'];
    if (onlinePlayType === 'SOLO') {
      if (onlinePlayerCount === 2) colors = ['BLUE','GREEN'];
      else if (onlinePlayerCount === 3) colors = ['BLUE','RED','GREEN'];
      else colors = ['BLUE','RED','GREEN','YELLOW'];
    } else {
      colors = ['BLUE','RED','GREEN','YELLOW'];
    }
    setActiveColors(colors);
    setPlayType(onlinePlayType);
    setRoomPlayers({ BLUE: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar } });
    setOnlineScreen(false);
    setOnlineLobbyModal(true);
  };

  const startBotMatch = (count) => {
    let colors = ['BLUE','GREEN'], pool = 100;
    if (count === 2) { colors = ['BLUE','GREEN']; pool = 100; setRoomPlayers({ BLUE:{name:currentUser.name}, GREEN:{name:'Computer (Green)'} }); }
    else if (count === 3) { colors = ['BLUE','RED','GREEN']; pool = 200; setRoomPlayers({ BLUE:{name:currentUser.name}, RED:{name:'Bot 1 (Red)'}, GREEN:{name:'Bot 2 (Green)'} }); }
    else { colors = ['BLUE','RED','GREEN','YELLOW']; pool = 300; setRoomPlayers({ BLUE:{name:currentUser.name}, RED:{name:'Bot 1'}, GREEN:{name:'Bot 2'}, YELLOW:{name:'Bot 3'} }); }
    setPlayerMissCount({ BLUE:0, RED:0, GREEN:0, YELLOW:0 });
    setMatchPrizePool(pool);
    setActiveColors(colors);
    setPlayType('SOLO');
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setBotSelectModal(false);
    setGameMode('BOT');
  };
  // ========== COMPUTER / TEAM BOT AUTO PLAY ==========
  useEffect(() => {

    // Normal VS COMPUTER mode
    const isNormalBotTurn =
      gameMode === 'BOT' &&
      currentTurn !== 'BLUE';

    // TEAM UP / HYBRID mode mein jis player ka slot BOT hai
    const isHybridBotTurn =
      gameMode === 'HYBRID' &&
      playerSlots[currentTurn] === 'BOT';

    // Agar current turn BOT का नहीं hai to kuch mat karo
    if (!isNormalBotTurn && !isHybridBotTurn) return;

    // Agar dice already roll ho chuka hai ya movement chal raha hai
    if (hasRolled || isMoving || isRolling || showPodiumBoard) return;

    const botTimer = setTimeout(() => {
      rollDice(true);
    }, 800);

    return () => clearTimeout(botTimer);

  }, [
    gameMode,
    currentTurn,
    turnIndex,
    playerSlots,
    hasRolled,
    isMoving,
    isRolling,
    showPodiumBoard
  ]);
  const startCustomPassPlay = () => {
    let colors, defaultRoomPlayers = {};
    if (playType === 'SOLO') {
      if (selectedPlayerCount === 2) { colors = ['BLUE','GREEN']; defaultRoomPlayers = { BLUE:{name:currentUser?.name||'Player 1'}, GREEN:{name:'Player 2'} }; }
      else if (selectedPlayerCount === 3) { colors = ['BLUE','RED','GREEN']; defaultRoomPlayers = { BLUE:{name:currentUser?.name||'Player 1'}, RED:{name:'Player 2'}, GREEN:{name:'Player 3'} }; }
      else { colors = ['BLUE','RED','GREEN','YELLOW']; defaultRoomPlayers = { BLUE:{name:currentUser?.name||'Player 1'}, RED:{name:'Player 2'}, GREEN:{name:'Player 3'}, YELLOW:{name:'Player 4'} }; }
    } else {
      colors = ['BLUE','RED','GREEN','YELLOW'];
      defaultRoomPlayers = { BLUE:{name:currentUser?.name||'Team A (1)'}, GREEN:{name:'Team A (2)'}, RED:{name:'Team B (1)'}, YELLOW:{name:'Team B (2)'} };
    }
    setRoomPlayers(defaultRoomPlayers);
    setActiveColors(colors);
    setPlayerMissCount({ BLUE:0, RED:0, GREEN:0, YELLOW:0 });
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setPassPlayModal(false);
    setGameMode('OFFLINE');
  };

  // ========== INTERNET CHECK FOR ONLINE TEAM SLOTS ==========
  // Room is never created for an ONLINE slot unless the phone can actually reach
  // the same backend used by multiplayer.
  const checkInternetConnection = async () => {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeout = setTimeout(() => controller?.abort(), 5000);
      await fetch(`${SUPABASE_REST_URL}/`, {
        method: 'HEAD',
        signal: controller?.signal,
        headers: { apikey: SUPABASE_ANON_KEY }
      });
      clearTimeout(timeout);
      return true;
    } catch (error) {
      return false;
    }
  };

  const showInternetRequiredAlert = (onRetry = null) => {
    Alert.alert(
      'Internet Connection Required',
      'Please connect to the internet to use an Online player. The online room will not be created until an internet connection is available.',
      [
        { text: 'Cancel', style: 'cancel' },
        ...(onRetry ? [{ text: 'Retry', onPress: onRetry }] : [])
      ]
    );
  };

  const handleSlotTypeChange = async (col, newType) => {
    const updatedSlots = { ...playerSlots, [col]: newType };
    const hasLocal = Object.values(updatedSlots).some(t => t === 'LOCAL');
    if (!hasLocal) {
      Alert.alert('Local Player Required', 'At least 1 player slot must remain set to Local to control your turn.');
      return;
    }

    // Selecting ONLINE first verifies internet/backend reachability. If offline,
    // keep the previous slot unchanged and show the connect-to-internet prompt.
    if (newType === 'ONLINE') {
      const connected = await checkInternetConnection();
      if (!connected) {
        showInternetRequiredAlert(() => handleSlotTypeChange(col, 'ONLINE'));
        return;
      }
    }

    playerSlotsRef.current = updatedSlots;
    setPlayerSlots(updatedSlots);
  };

  const getEffectiveReadyCount = () => {
    let count = 0;
    activeColors.forEach((colorKey) => {
      const slotType = playerSlots[colorKey];

      // Real online player joined, or this slot is a Bot/Local player.
      // Bot and Local slots are ready in the lobby itself; do not wait for
      // gameMode to become HYBRID because that happens only after START_MATCH.
      if (roomPlayers[colorKey] || slotType === 'BOT' || slotType === 'LOCAL') {
        count++;
      }
    });
    return count;
  };

  const startMatchFromLobby = async () => {
    if (!isHost) { Alert.alert('Permission Denied', 'Only the room Host can start the game!'); return; }
    const currentReady = getEffectiveReadyCount();
    if (currentReady < activeColors.length) {
      Alert.alert('Waiting for Players', `Please wait for all players to join (${currentReady}/${activeColors.length}).`);
      return;
    }
    const canPlay = await deductUserCoins(selectedEntryFee);
    if (!canPlay) return;
    const totalPool = selectedEntryFee * activeColors.length;
    matchStartedRef.current = true;
    setMatchPrizePool(totalPool);
    Object.keys(roomPlayers).forEach((col) => {
      const p = roomPlayers[col];
      if (p && p.id && p.id !== currentUser.playerId) recordRecentPlayer(p);
    });
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: { 
          type: 'START_MATCH', 
          data: { 
            activeColors, 
            playType, 
            syncedRoomPlayers: roomPlayersRef.current, // 👈 Use ref to ensure latest
            entryFee: selectedEntryFee, 
            prizePool: totalPool, 
            playerSlots: playerSlotsRef.current 
          } 
        },
        ref: 'start_1'
      }));
    }
    setOnlineLobbyModal(false);
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setGameMode(playType === 'TEAM' ? 'HYBRID' : 'ONLINE');
  };

  // ========== OTHER UI HELPERS ==========
  const copyMyPlayerId = async () => {
    if (!currentUser?.playerId) return;
    await Clipboard.setStringAsync(currentUser.playerId);
    Alert.alert('Copied!', `Your Player ID #${currentUser.playerId} copied.`);
  };

  const handleCopyAndShareRoomCode = async () => {
    if (!roomCode) return;
    try {
      await Clipboard.setStringAsync(roomCode);
      await Share.share({ message: `Join my Ludo Supreme game! Room Code: ${roomCode}` });
    } catch (error) {
      Alert.alert('Copied!', `Room Code ${roomCode} copied.`);
    }
  };

  const toggleSound = async (val) => {
    setSoundEnabled(val);
    await AsyncStorage.setItem('@ludo_sound_setting', JSON.stringify(val));
  };

  const toggleHaptics = async (val) => {
    setHapticsEnabled(val);
    setHapticsGlobal(val);
    await AsyncStorage.setItem('@ludo_haptics_setting', JSON.stringify(val));
    if (val) {
      setTimeout(() => {
        try { haptics.medium(); } catch (e) {}
      }, 100);
    }
  };

  const selectAvatar = async (avatar) => {
    setUserAvatar(avatar);
    await AsyncStorage.setItem('@ludo_user_avatar', avatar);
    if (currentUser) {
      const updated = { ...currentUser, avatar };
      setCurrentUser(updated);
      await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updated));
      await syncUserToCloud(updated);
    }
  };

  // ========== SUPABASE CLOUD FUNCTIONS ==========
  const fetchCloudFriendList = async (myPlayerId) => {
    if (!myPlayerId) return;

    try {
      const filter = `(user_a.eq.${myPlayerId},user_b.eq.${myPlayerId})`;

      const response = await fetch(
        `${SUPABASE_REST_URL}/ludo_friendships?or=${encodeURIComponent(filter)}`,
        { headers: supabaseHeaders }
      );

      const friendships = await response.json();
      if (!Array.isArray(friendships)) return;

      const friendIds = friendships.map((row) =>
        String(row.user_a) === String(myPlayerId) ? row.user_b : row.user_a
      );

      if (friendIds.length === 0) {
        setFriendsList([]);
        return;
      }

      const usersResponse = await fetch(
        `${SUPABASE_REST_URL}/ludo_users?player_id=in.(${friendIds.join(',')})`,
        { headers: supabaseHeaders }
      );

      const users = await usersResponse.json();
      if (!Array.isArray(users)) return;

      const formattedFriends = users.map((user) => ({
        id: user.player_id,
        playerId: user.player_id,
        name: user.name || 'Player',
        email: user.email,
        avatar: user.avatar || '👤',
        online: user.last_seen
          ? Date.now() - new Date(user.last_seen).getTime() < 2 * 60 * 1000
          : false
      }));

      setFriendsList(formattedFriends);
    } catch (error) {
      console.log('Friend list error:', error);
    }
  };

  const checkCloudFriendRequests = async () => {
    if (!currentUserRef.current?.playerId) return;

    try {
      const response = await fetch(
        `${SUPABASE_REST_URL}/ludo_friend_requests?to_id=eq.${encodeURIComponent(
          currentUserRef.current.playerId
        )}&status=eq.pending&order=created_at.desc`,
        { headers: supabaseHeaders }
      );

      const data = await response.json();
      if (Array.isArray(data)) {
        setPendingRequests(data);
      }
    } catch (error) {
      console.log('Friend request check error:', error);
    }
  };

  const checkCloudGameInvites = async () => {
    if (!currentUserRef.current?.playerId) return;

    try {
      const response = await fetch(
        `${SUPABASE_REST_URL}/ludo_game_invites?to_id=eq.${encodeURIComponent(
          currentUserRef.current.playerId
        )}&status=eq.pending&order=created_at.desc`,
        { headers: supabaseHeaders }
      );

      const data = await response.json();
      if (Array.isArray(data)) {
        setIncomingInvitesList(data);
        if (data.length > 0) {
          setIncomingInvite({
            inviteRowId: data[0].id,
            fromName: data[0].from_name,
            fromId: data[0].from_id,
            roomCode: data[0].room_code,
            playType: data[0].play_type,
            entryFee: data[0].entry_fee
          });
        }
      }
    } catch (error) {
      console.log('Invite check error:', error);
    }
  };

  const handleSearchUser = async () => {
    const query = searchQuery.trim();

    if (!query) {
      Alert.alert('Search', 'Please enter Player ID or Email.');
      return;
    }

    if (!currentUserRef.current?.playerId) return;

    setIsSearchingCloud(true);
    setSearchedUserResult(null);

    try {
      const filter = `(player_id.eq.${query},email.eq.${query})`;
      const response = await fetch(
        `${SUPABASE_REST_URL}/ludo_users?or=${encodeURIComponent(filter)}&limit=1`,
        { headers: supabaseHeaders }
      );

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        Alert.alert('Not Found', 'No player found with this Player ID or Email.');
        return;
      }

      const user = data[0];
      if (String(user.player_id) === String(currentUserRef.current.playerId)) {
        Alert.alert('Oops', 'You cannot add yourself.');
        return;
      }

      setSearchedUserResult({
        id: user.player_id,
        playerId: user.player_id,
        name: user.name || 'Player',
        email: user.email,
        avatar: user.avatar || '👤'
      });
    } catch (error) {
      console.log('Search user error:', error);
      Alert.alert('Error', 'Could not search player.');
    } finally {
      setIsSearchingCloud(false);
    }
  };

  const sendRealtimeFriendRequest = async (targetUser) => {
    if (!currentUserRef.current?.playerId || (!targetUser?.playerId && !targetUser?.id)) {
      return;
    }

    const targetId = targetUser.playerId || targetUser.id;
    const myId = currentUserRef.current.playerId;

    if (String(targetId) === String(myId)) {
      Alert.alert('Error', 'You cannot add yourself.');
      return;
    }

    try {
      const friendshipFilter = `(user_a.eq.${myId},user_b.eq.${targetId}),(user_a.eq.${targetId},user_b.eq.${myId})`;
      const existingFriend = await fetch(
        `${SUPABASE_REST_URL}/ludo_friendships?or=${encodeURIComponent(`(${friendshipFilter})`)}`,
        { headers: supabaseHeaders }
      );

      const friendshipData = await existingFriend.json();
      if (Array.isArray(friendshipData) && friendshipData.length > 0) {
        Alert.alert('Already Friends', 'This player is already in your friend list.');
        return;
      }

      const existingRequestResponse = await fetch(
        `${SUPABASE_REST_URL}/ludo_friend_requests?from_id=eq.${encodeURIComponent(myId)}&to_id=eq.${encodeURIComponent(targetId)}&status=eq.pending`,
        { headers: supabaseHeaders }
      );

      const existingRequests = await existingRequestResponse.json();
      if (Array.isArray(existingRequests) && existingRequests.length > 0) {
        Alert.alert('Already Sent', 'Friend request already sent.');
        return;
      }

      const response = await fetch(`${SUPABASE_REST_URL}/ludo_friend_requests`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          from_id: String(myId),
          from_name: currentUserRef.current.name || 'Player',
          to_id: String(targetId),
          status: 'pending'
        })
      });

      if (!response.ok) {
        Alert.alert('Error', 'Friend request could not be sent.');
        return;
      }

      Alert.alert('Success', 'Friend request sent successfully! 📩');
      setSearchedUserResult(null);
      setSearchQuery('');
    } catch (error) {
      console.log('Send friend request error:', error);
      Alert.alert('Error', 'Could not send friend request.');
    }
  };

  const acceptFriendRequest = async (reqUser) => {
    if (!reqUser || !currentUserRef.current?.playerId) return;
    const myId = currentUserRef.current.playerId;

    try {
      await fetch(`${SUPABASE_REST_URL}/ludo_friend_requests?id=eq.${reqUser.id}`, {
        method: 'PATCH',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ status: 'accepted' })
      });

      await fetch(`${SUPABASE_REST_URL}/ludo_friendships`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          user_a: String(reqUser.from_id),
          user_b: String(myId)
        })
      });

      Alert.alert('Friend Added! 🎉', `${reqUser.from_name || 'Player'} is now your friend.`);
      await checkCloudFriendRequests();
      await fetchCloudFriendList(myId);
    } catch (error) {
      console.log('Accept friend error:', error);
      Alert.alert('Error', 'Could not accept friend request.');
    }
  };

  const sendFriendInvite = async (friend) => {
    if (!friend || !currentUserRef.current?.playerId) return;

    if (!roomCode) {
      Alert.alert('Create Room First', 'Please create an online room first, then invite your friend.');
      return;
    }

    const friendId = friend.playerId || friend.id;

    try {
      const response = await fetch(`${SUPABASE_REST_URL}/ludo_game_invites`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          from_id: String(currentUserRef.current.playerId),
          from_name: currentUserRef.current.name || 'Player',
          to_id: String(friendId),
          room_code: String(roomCode),
          play_type: playType || 'SOLO',
          entry_fee: Number(selectedEntryFee || 50),
          status: 'pending'
        })
      });

      if (!response.ok) {
        Alert.alert('Error', 'Game invite could not be sent.');
        return;
      }

      Alert.alert('Invite Sent 🎮', `Invitation sent to ${friend.name}.`);

      setFriendsList((previous) =>
        previous.map((item) =>
          String(item.id) === String(friendId) ? { ...item, isInvited: true } : item
        )
      );
    } catch (error) {
      console.log('Send invite error:', error);
      Alert.alert('Error', 'Could not send game invite.');
    }
  };

  const acceptInvite = async (inviteObj = null) => {
    const invite = inviteObj || incomingInvite;
    if (!invite) return;

    try {
      if (invite.inviteRowId) {
        await fetch(`${SUPABASE_REST_URL}/ludo_game_invites?id=eq.${invite.inviteRowId}`, {
          method: 'PATCH',
          headers: {
            ...supabaseHeaders,
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({ status: 'accepted' })
        });
      }

      setIncomingInvite(null);
      await checkCloudGameInvites();

      const code = String(invite.roomCode);

      if (invite.playType === 'TEAM') {
        setTeamJoinCode(code);
        setHybridTeamModal(true);
        setTimeout(() => {
          joinTeamOnlineRoom(code);
        }, 500);
      } else {
        setInputRoomCode(code);
        setOnlineScreen(true);
        setTimeout(() => {
          joinOnlineRoom(code);
        }, 500);
      }
    } catch (error) {
      console.log('Accept invite error:', error);
      Alert.alert('Error', 'Could not join the invited room.');
    }
  };

  const declineInvite = async (inviteObj = null) => {
    const invite = inviteObj || incomingInvite;
    if (!invite) return;

    try {
      if (invite.inviteRowId) {
        await fetch(`${SUPABASE_REST_URL}/ludo_game_invites?id=eq.${invite.inviteRowId}`, {
          method: 'PATCH',
          headers: {
            ...supabaseHeaders,
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({ status: 'declined' })
        });
      }

      setIncomingInvite(null);
      await checkCloudGameInvites();
    } catch (error) {
      console.log('Decline invite error:', error);
    }
  };

  // ========== RENDER FUNCTIONS ==========

  // ===== FIXED: getBaseDynamicLabel – ONLY uses roomPlayers for online/team modes =====
  const getBaseDynamicLabel = (color) => {
    // 1. If we have a name in roomPlayers, it's always correct
    if (roomPlayers[color]?.name) {
      return roomPlayers[color].name;
    }

    // 2. Fallback only for offline/local games
    if (playType === 'TEAM') {
      if (color === 'BLUE') return roomPlayers['BLUE']?.name || 'Team A (Blue)';
      if (color === 'GREEN') return roomPlayers['GREEN']?.name || 'Team A (Green)';
      if (color === 'RED') return roomPlayers['RED']?.name || 'Team B (Red)';
      if (color === 'YELLOW') return roomPlayers['YELLOW']?.name || 'Team B (Yellow)';
    } else {
      if (color === myColor) return currentUser?.name || 'You';
      if (color === 'BLUE') return 'You';
      if (color === 'GREEN') return selectedPlayerCount === 2 ? 'Computer' : 'Player 3';
      if (color === 'RED') return 'Player 2';
      if (color === 'YELLOW') return 'Player 4';
    }
    return `Player (${color})`;
  };

// ========== FINAL FIXED renderBase (Uses GLOBAL BASE_SPOTS) ==========
  const renderBase = (color, posStyle, isVertical) => {
    const isRanked = finishedRankings.indexOf(color);
    const inverseRot = getInverseRotationAngle(myColor);

    // Base ke andar 4 gotiyon ko bilkul center mein 2x2 grid mein rakho.
    // BASE_SPOTS global board coordinates hain, isliye unhe local base ke
    // absolute children mein use karne se Green/Yellow/Blue ghar ki gotiyan
    // shift ho jaati hain.
    const pocketPositions = [
      [1.5, 1.5], [1.5, 3.5],
      [3.5, 1.5], [3.5, 3.5]
    ];

    const pocketSize = CELL_SIZE * 0.75; // 75% of a cell

    return (
      <View style={[styles.base, posStyle]}>
        {/* White background box (centered) */}
        <View style={styles.baseInnerWhite} />

        {/* Pockets placed at EXACT global coordinates */}
        {pocketPositions.map(([row, col], idx) => {
          const left = col * CELL_SIZE + (CELL_SIZE - pocketSize) / 2;
          const top = row * CELL_SIZE + (CELL_SIZE - pocketSize) / 2;
          return (
            <View
              key={idx}
              style={{
                position: 'absolute',
                left,
                top,
                width: pocketSize,
                height: pocketSize,
                borderRadius: pocketSize / 2,
                backgroundColor: getTurnColorHex(color),
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.5)',
                elevation: 3,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            />
          );
        })}

        {/* Ranking banner (if finished) */}
        {isRanked !== -1 && (
          <View style={[styles.baseRankBanner, { transform: [{ rotate: inverseRot }] }]}>
            <Text style={styles.baseRankBannerText}>
              {isRanked === 0 ? '🥇 1st' : isRanked === 1 ? '🥈 2nd' : isRanked === 2 ? '🥉 3rd' : '4th'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAllTokens = () => {
    const cellGroups = {};
    const inverseRot = getInverseRotationAngle(myColor);

    ALL_COLORS.forEach((color) => {
      pawns[color].forEach((stepCount, idx) => {
        if (stepCount >= 0 && stepCount < 56) {
          const coords = getPawnScreenCoords(color, stepCount, idx);
          const cellKey = `${coords[0].toFixed(1)}_${coords[1].toFixed(1)}`;
          if (!cellGroups[cellKey]) cellGroups[cellKey] = [];
          cellGroups[cellKey].push({ color, idx, stepCount, coords });
        }
      });
    });

    const rendered = [];
    ALL_COLORS.forEach((color) => {
      pawns[color].forEach((stepCount, idx) => {
        const coords = getPawnScreenCoords(color, stepCount, idx);
        const isMyTurn = currentTurn === color;
        const colorHex = getTurnColorHex(color);
        let offsetX = 0, offsetY = 0, stackCount = 1;

        if (stepCount >= 0 && stepCount < 56) {
          const cellKey = `${coords[0].toFixed(1)}_${coords[1].toFixed(1)}`;
          const group = cellGroups[cellKey] || [];
          stackCount = group.length;
          if (stackCount > 1) {
            const idxInGroup = group.findIndex(p => p.color === color && p.idx === idx);
            if (idxInGroup === 0) { offsetX = -4; offsetY = -3; }
            else if (idxInGroup === 1) { offsetX = 5; offsetY = 3; }
            else if (idxInGroup === 2) { offsetX = 0; offsetY = 5; }
            else if (idxInGroup === 3) { offsetX = -4; offsetY = 5; }
          }
        }

        // Home/base pawns use BASE_SPOTS as the CENTER point of the
        // background pocket. tokenWrapper itself is one full CELL_SIZE wide,
        // so for inactive pawns (-1) shift its top-left by half a cell.
        // This places the upper visible goti exactly on the 4 background bindu.
        const homeCenterOffset = stepCount === -1 ? CELL_SIZE / 2 : 0;
        const finalLeft = coords[1] * CELL_SIZE - homeCenterOffset + offsetX;
        const finalTop = coords[0] * CELL_SIZE - homeCenterOffset + offsetY;

        rendered.push(
          <TouchableOpacity
            key={`${color}-${idx}`}
            disabled={!hasRolled || !isMyTurn || isMoving}
            onPress={() => executeStepMovement(color, idx, playerDices[color])}
            style={[
  styles.tokenWrapper,
  {
    left: finalLeft,
    top: finalTop,
    zIndex: isMyTurn ? 25 : 10 + idx
  },
  stepCount === 56 && { opacity: 0.3 }
]}
          >
            <PinToken colorHex={colorHex} stackCount={stackCount} />
          </TouchableOpacity>
        );
      });
    });
    return rendered;
  };

  // UPDATED: renderPlayerCard – name in separate row at bottom + reconnecting indicator
  const renderPlayerCard = (color, pinHex, isLeftDice = false) => {
    const isPlayable = activeColors.includes(color) && !finishedRankings.includes(color);
    if (!isPlayable) return <View style={styles.playerCardPlaceholder} />;

    const isCurrent = currentTurn === color;
    const slotType = playerSlots[color];
    const misses = playerMissCount[color] || 0;
    const badgeText = gameMode === 'HYBRID' ? (slotType === 'LOCAL' ? '📱 Local' : slotType === 'ONLINE' ? '🌐 Online' : '🤖 Bot') : '';
    const playerName = getBaseDynamicLabel(color);

    // 🔄 Show reconnecting only for ONLINE slots (not BOT/LOCAL)
    const isOnlineSlot = slotType === 'ONLINE' || gameMode === 'ONLINE';
    const isReconnecting = isOnlineSlot && reconnectingPlayers[color] === true;

    const spinVal = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '1080deg'],
    });

    const timerActive = !!gameMode && !showPodiumBoard && !hasRolled && !isMoving && !isRolling;

    return (
      <View style={styles.cardContainerWrapper}>
        {isCurrent && (
          <Animated.View 
            style={[
              styles.floatingArrowContainer, 
              styles.arrowTopPos, 
              { transform: [{ translateY: arrowBounceAnim }], opacity: arrowBlinkAnim }
            ]}
          >
            <View style={styles.arrowIconBubble}><Text style={styles.arrowIconText}>▼</Text></View>
          </Animated.View>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => isCurrent && rollDice()}
          style={[
            styles.playerCard,
            isCurrent && styles.activeCardGlow,
            isReconnecting && styles.reconnectingCardDim
          ]}
        >
          {/* 🔄 Reconnecting badge (top of card) */}
          {isReconnecting && (
            <View style={styles.reconnectingBadge}>
              <Text style={styles.reconnectingBadgeText}>🔄 Reconnecting...</Text>
            </View>
          )}

          {/* Upper row: dice, timer, avatar */}
          <View style={styles.cardRow}>
            {isLeftDice ? (
              <>
                <Animated.View style={[styles.cardDiceWrap, isCurrent && isRolling && { transform: [{ rotate: spinVal }, { scale: diceBounceAnim }] }]}>
                  <DiceFace value={playerDices[color]} />
                </Animated.View>
                {isCurrent && (
                  <TurnTimer active={timerActive} onTimeout={handleTimeoutMiss} />
                )}
                <View style={styles.cardAvatarRight}>
                  <PinToken colorHex={pinHex} stackCount={1} />
                  {misses > 0 && <Text style={styles.missCounterBadge}>⚠️ {misses}/3</Text>}
                  {badgeText !== '' && <Text style={styles.slotSmallBadge}>{badgeText}</Text>}
                </View>
              </>
            ) : (
              <>
                <View style={styles.cardAvatarLeft}>
                  <PinToken colorHex={pinHex} stackCount={1} />
                  {misses > 0 && <Text style={styles.missCounterBadge}>⚠️ {misses}/3</Text>}
                  {badgeText !== '' && <Text style={styles.slotSmallBadge}>{badgeText}</Text>}
                </View>
                {isCurrent && (
                  <TurnTimer active={timerActive} onTimeout={handleTimeoutMiss} />
                )}
                <Animated.View style={[styles.cardDiceWrap, isCurrent && isRolling && { transform: [{ rotate: spinVal }, { scale: diceBounceAnim }] }]}>
                  <DiceFace value={playerDices[color]} />
                </Animated.View>
              </>
            )}
          </View>

          {/* 👇 Name row – full width at bottom */}
          <View style={styles.cardNameRow}>
            <Text style={[styles.cardPlayerName, isReconnecting && styles.reconnectingNameText]} numberOfLines={1}>
              {playerName}{isReconnecting ? '  🔄' : ''}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // ========== RENDER FRIENDS MODAL ==========
  const renderFriendsSquadModal = () => (
    <Modal transparent animationType="slide" visible={friendsModal}>
      <View style={styles.inviteModalOverlay}>
        <View style={[styles.glassCard, { maxHeight: '92%', padding: 14 }]}>
          <View style={styles.squadTopHeaderRow}>
            <View>
              <Text style={styles.squadMainTitle}>👥 FRIENDS SQUAD</Text>
              <Text style={styles.squadSubTitle}>Play, Connect & Send Invites</Text>
            </View>
            <TouchableOpacity style={styles.squadCloseCrossBtn} onPress={() => setFriendsModal(false)}>
              <Text style={styles.squadCloseCrossText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.myIdPlankBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>🪪</Text>
              <Text style={styles.myIdPlankText}>Your ID: <Text style={{ color: '#facc15', fontWeight: '900' }}>#{currentUser?.playerId || '9575'}</Text></Text>
            </View>
            <TouchableOpacity style={styles.copyIdPillBtn} onPress={copyMyPlayerId}><Text style={styles.copyIdPillText}>📋 Copy</Text></TouchableOpacity>
          </View>
          <View style={styles.topSquadSearchRow}>
            <TextInput style={styles.topSquadSearchInput} placeholder="Search by Player ID or Email..." placeholderTextColor="#64748b" autoCapitalize="none" value={searchQuery} onChangeText={setSearchQuery} />
            <TouchableOpacity style={styles.topSquadSearchBtn} onPress={handleSearchUser}>
              {isSearchingCloud ? <ActivityIndicator color="#000000" size="small" /> : <Text style={styles.topSquadSearchBtnText}>🔍 Search</Text>}
            </TouchableOpacity>
          </View>
          {searchedUserResult && (
            <View style={styles.searchedPlayerCardBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>{searchedUserResult.avatar}</Text>
                <View><Text style={styles.friendCardNameText}>{searchedUserResult.name}</Text><Text style={styles.friendCardSubText}>ID: #{searchedUserResult.playerId}</Text></View>
              </View>
              <TouchableOpacity style={styles.addFriendActionBtn} onPress={() => sendRealtimeFriendRequest(searchedUserResult)}>
                <Text style={styles.addFriendActionText}>+ Add Friend</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.cleanTabsRow}>
            <TouchableOpacity style={[styles.cleanTabPill, friendsTab === 'LIST' && styles.cleanTabPillActive]} onPress={() => { setFriendsTab('LIST'); fetchCloudFriendList(currentUser?.playerId); }}>
              <Text style={[styles.cleanTabText, friendsTab === 'LIST' && styles.cleanTabTextActive]}>👥 Friends ({friendsList.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cleanTabPill, friendsTab === 'RECENT' && styles.cleanTabPillActive]} onPress={() => setFriendsTab('RECENT')}>
              <Text style={[styles.cleanTabText, friendsTab === 'RECENT' && styles.cleanTabTextActive]}>🕒 Recent ({recentPlayersList.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cleanTabPill, friendsTab === 'INVITES' && styles.cleanTabPillActive]} onPress={() => setFriendsTab('INVITES')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.cleanTabText, friendsTab === 'INVITES' && styles.cleanTabTextActive]}>🎮 Invites</Text>
                {incomingInvitesList.length > 0 && <View style={styles.tabRedDotIndicator} />}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cleanTabPill, friendsTab === 'REQUESTS' && styles.cleanTabPillActive]} onPress={() => setFriendsTab('REQUESTS')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.cleanTabText, friendsTab === 'REQUESTS' && styles.cleanTabTextActive]}>📩 Reqs</Text>
                {pendingRequests.length > 0 && <View style={styles.tabRedDotIndicator} />}
              </View>
            </TouchableOpacity>
          </View>
          {friendsTab === 'LIST' && (
            <ScrollView style={styles.squadTabScrollFeed}>
              {friendsList.length === 0 ? <Text style={styles.squadEmptyStateText}>No friends added yet. Type an ID in search box to add friends!</Text> :
                friendsList.map((friend) => (
                  <View key={friend.id} style={styles.friendItemCardWrap}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.avatarWithRingBox}>
                        <Text style={{ fontSize: 24 }}>{friend.avatar || '👤'}</Text>
                        <View style={[styles.onlineIndicatorDot, { backgroundColor: friend.online ? '#10b981' : '#64748b' }]} />
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.friendCardNameText}>{friend.name}</Text>
                        <Text style={styles.friendCardSubText}>ID: #{friend.id} • {friend.online ? 'Online' : 'Offline'}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={[styles.inviteFriendActionBtn, friend.isInvited && { backgroundColor: '#475569' }]} disabled={friend.isInvited} onPress={() => sendFriendInvite(friend)}>
                      <Text style={styles.inviteFriendActionText}>{friend.isInvited ? '✓ Invited' : '🎮 Invite'}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }
            </ScrollView>
          )}
          {friendsTab === 'RECENT' && (
            <ScrollView style={styles.squadTabScrollFeed}>
              {recentPlayersList.length === 0 ? <Text style={styles.squadEmptyStateText}>No recent players yet. Play online matches to see players here!</Text> :
                recentPlayersList.map((player) => {
                  const isAlreadyFriend = friendsList.some(f => f.id === player.id);
                  return (
                    <View key={player.id} style={styles.friendItemCardWrap}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, marginRight: 8 }}>{player.avatar || '👤'}</Text>
                        <View><Text style={styles.friendCardNameText}>{player.name}</Text><Text style={styles.friendCardSubText}>Played: {player.playedAt}</Text></View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!isAlreadyFriend && <TouchableOpacity style={[styles.inviteFriendActionBtn, { backgroundColor: '#3b82f6', marginRight: 6 }]} onPress={() => sendRealtimeFriendRequest(player)}>
                          <Text style={styles.inviteFriendActionText}>+ Friend</Text>
                        </TouchableOpacity>}
                        <TouchableOpacity style={styles.inviteFriendActionBtn} onPress={() => sendFriendInvite(player)}>
                          <Text style={styles.inviteFriendActionText}>🎮 Invite</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              }
            </ScrollView>
          )}
          {friendsTab === 'INVITES' && (
            <ScrollView style={styles.squadTabScrollFeed}>
              {incomingInvitesList.length === 0 ? <Text style={styles.squadEmptyStateText}>No match invites right now.</Text> :
                incomingInvitesList.map((inv) => (
                  <View key={inv.id} style={styles.friendItemCardWrap}>
                    <View><Text style={styles.friendCardNameText}>🎮 {inv.from_name}</Text><Text style={styles.friendCardSubText}>Room: #{inv.room_code} • Fee: 🪙 {inv.entry_fee}</Text></View>
                    <TouchableOpacity style={[styles.inviteFriendActionBtn, { backgroundColor: '#eab308' }]} onPress={() => acceptInvite({
                      inviteRowId: inv.id,
                      fromName: inv.from_name,
                      fromId: inv.from_id,
                      roomCode: inv.room_code,
                      playType: inv.play_type,
                      entryFee: inv.entry_fee,
                      targetColor: 'GREEN'
                    })}>
                      <Text style={[styles.inviteFriendActionText, { color: '#000000' }]}>✓ Join Match</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }
            </ScrollView>
          )}
          {friendsTab === 'REQUESTS' && (
            <ScrollView style={styles.squadTabScrollFeed}>
              {pendingRequests.length === 0 ? <Text style={styles.squadEmptyStateText}>No pending friend requests.</Text> :
                pendingRequests.map((req) => (
                  <View key={req.id} style={styles.friendItemCardWrap}>
                    <View><Text style={styles.friendCardNameText}>{req.from_name || 'Player'}</Text><Text style={styles.friendCardSubText}>Sent you a friend request</Text></View>
                    <TouchableOpacity style={[styles.inviteFriendActionBtn, { backgroundColor: '#10b981' }]} onPress={() => acceptFriendRequest(req)}>
                      <Text style={styles.inviteFriendActionText}>✓ Accept</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }
            </ScrollView>
          )}
          <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10, width: '100%' }]} onPress={() => setFriendsModal(false)}>
            <Text style={styles.darkSecondaryButtonText}>Close Squad</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ========== COMPLETE APP RENDER ==========
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <View style={styles.brandHero}>
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={styles.brandGoldTitle}>LUDO SUPREME</Text>
          <View style={styles.goldPillBadge}><Text style={styles.goldPillText}>★ CLOUD AUTH & REALTIME ★</Text></View>
        </View>
        <View style={styles.glassCard}>
          {authMode !== 'FORGOT' ? (
            <View style={styles.tabToggleRow}>
              <TouchableOpacity style={[styles.tabToggleBtn, authMode === 'LOGIN' && styles.tabToggleActive]} onPress={() => setAuthMode('LOGIN')}>
                <Text style={[styles.tabToggleText, authMode === 'LOGIN' && styles.tabToggleTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabToggleBtn, authMode === 'SIGNUP' && styles.tabToggleActive]} onPress={() => setAuthMode('SIGNUP')}>
                <Text style={[styles.tabToggleText, authMode === 'SIGNUP' && styles.tabToggleTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.forgotHeaderBox}>
              <Text style={styles.forgotTitle}>🔑 Reset Your Password</Text>
              <Text style={styles.forgotSubtitle}>Enter registered email and set a new password</Text>
            </View>
          )}
          {authMode === 'SIGNUP' && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>CHOOSE USERNAME</Text>
              <TextInput style={styles.gameTextInput} placeholder="e.g. MasterRajeev" placeholderTextColor="#64748b" value={usernameInput} onChangeText={setUsernameInput} />
            </View>
          )}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.inputLabel}>EMAIL / USER ID</Text>
            <TextInput style={styles.gameTextInput} placeholder="name@gmail.com" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" value={emailInput} onChangeText={setEmailInput} />
          </View>
          {authMode !== 'FORGOT' ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput style={styles.gameTextInput} placeholder="••••••••" placeholderTextColor="#64748b" secureTextEntry value={passwordInput} onChangeText={setPasswordInput} />
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>NEW PASSWORD</Text>
              <TextInput style={styles.gameTextInput} placeholder="Enter new password" placeholderTextColor="#64748b" secureTextEntry value={newPasswordInput} onChangeText={setNewPasswordInput} />
            </View>
          )}
          {authMode === 'LOGIN' && (
            <TouchableOpacity style={styles.forgotLinkContainer} onPress={() => setAuthMode('FORGOT')}>
              <Text style={styles.forgotLinkText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={handleAuthSubmit}>
            <Text style={styles.gold3DButtonText}>
              {authMode === 'LOGIN' ? 'LOGIN TO ACCOUNT  ➔' : authMode === 'SIGNUP' ? 'SIGN UP PERMANENTLY  ➔' : 'CONFIRM RESET PASSWORD  ➔'}
            </Text>
          </TouchableOpacity>
          {authMode === 'FORGOT' && (
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setAuthMode('LOGIN')}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back to Sign In</Text>
            </TouchableOpacity>
          )}
          {authMode !== 'FORGOT' && (
            <>
              <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>OR</Text><View style={styles.dividerLine} /></View>
              <TouchableOpacity activeOpacity={0.85} style={styles.darkSecondaryButton} onPress={handleGuestLogin}>
                <Text style={styles.darkSecondaryButtonText}>⚡ Quick Guest Play</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (botSelectModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}>
            <Text style={styles.crownEmoji}>🤖</Text>
            <Text style={styles.brandGoldTitle}>VS COMPUTER</Text>
            <Text style={styles.lobbySubtitle}>Practice & Win Free Coins</Text>
          </View>
          <View style={[styles.glassCard, { marginTop: 14 }]}>
            <Text style={styles.inputLabel}>HOW MANY PLAYERS?</Text>
            <View style={styles.playerCountRow}>
              {[2,3,4].map((count) => (
                <TouchableOpacity key={count} style={[styles.countPill, botPlayerCount === count && styles.countPillActive]} onPress={() => setBotPlayerCount(count)}>
                  <Text style={[styles.countPillText, botPlayerCount === count && styles.countPillTextActive]}>{count} Players</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.prizePoolPreviewBox}>
              <Text style={styles.prizePoolPreviewLabel}>🛡️ RISK FREE WINNER REWARD:</Text>
              <Text style={styles.prizePoolPreviewAmount}>🪙 Win {botPlayerCount === 2 ? '100' : botPlayerCount === 3 ? '200' : '300'} Coins on 1st Place!</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 16 }]} onPress={() => startBotMatch(botPlayerCount)}>
              <Text style={styles.gold3DButtonText}>START PRACTICE MATCH ➔</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setBotSelectModal(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (passPlayModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}>
            <Text style={styles.crownEmoji}>👥</Text>
            <Text style={styles.brandGoldTitle}>PASS & PLAY</Text>
            <Text style={styles.lobbySubtitle}>Select Match Format</Text>
          </View>
          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>SELECT GAMEPLAY TYPE:</Text>
            <View style={styles.tabToggleRow}>
              <TouchableOpacity style={[styles.tabToggleBtn, playType === 'SOLO' && styles.tabToggleActive]} onPress={() => setPlayType('SOLO')}>
                <Text style={[styles.tabToggleText, playType === 'SOLO' && styles.tabToggleTextActive]}>👤 Individual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabToggleBtn, playType === 'TEAM' && styles.tabToggleActive]} onPress={() => setPlayType('TEAM')}>
                <Text style={[styles.tabToggleText, playType === 'TEAM' && styles.tabToggleTextActive]}>🤝 2v2 Team</Text>
              </TouchableOpacity>
            </View>
            {playType === 'SOLO' ? (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>HOW MANY PLAYERS?</Text>
                <View style={styles.playerCountRow}>
                  {[2,3,4].map((count) => (
                    <TouchableOpacity key={count} style={[styles.countPill, selectedPlayerCount === count && styles.countPillActive]} onPress={() => setSelectedPlayerCount(count)}>
                      <Text style={[styles.countPillText, selectedPlayerCount === count && styles.countPillTextActive]}>{count} Players</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>TEAM UP SETUP:</Text>
                <View style={styles.teamContainerBoxA}><Text style={styles.teamHeaderTitleA}>🛡️ Team A: Blue + Green</Text></View>
                <View style={[styles.teamContainerBoxB, { marginTop: 6 }]}><Text style={styles.teamHeaderTitleB}>⚔️ Team B: Red + Yellow</Text></View>
                <TouchableOpacity style={[styles.checkboxRow, { marginTop: 10 }]} onPress={() => setFriendlyKill(!friendlyKill)}>
                  <View style={[styles.checkSquare, friendlyKill && styles.checkSquareActive]}>{friendlyKill && <Text style={styles.checkTick}>✓</Text>}</View>
                  <View style={{ marginLeft: 10 }}><Text style={styles.checkboxLabel}>Enable Friendly Kill?</Text></View>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 18 }]} onPress={startCustomPassPlay}>
              <Text style={styles.gold3DButtonText}>START GAME NOW ➔</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setPassPlayModal(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (hybridTeamModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}>
            <Text style={styles.crownEmoji}>⚡</Text>
            <Text style={styles.brandGoldTitle}>HYBRID TEAM BATTLE</Text>
            <Text style={styles.lobbySubtitle}>Host or Join 2v2 Team Match</Text>
          </View>
          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>SELECT ENTRY FEE PER PLAYER:</Text>
            <View style={styles.playerCountRow}>
              {ENTRY_FEE_OPTIONS.map((fee) => (
                <TouchableOpacity key={fee} style={[styles.countPill, selectedEntryFee === fee && styles.countPillActive]} onPress={() => setSelectedEntryFee(fee)}>
                  <Text style={[styles.countPillText, selectedEntryFee === fee && styles.countPillTextActive]}>🪙 {fee}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.inputLabel, { marginTop: 8 }]}>CREATE TEAM SLOTS:</Text>
            <View style={styles.teamContainerBoxA}>
              <View style={styles.teamHeaderRow}>
                <Text style={styles.teamHeaderTitleA}>🛡️ TEAM A (Blue & Green)</Text>
                <View style={styles.teamBadgeA}><Text style={styles.teamBadgeText}>Partners</Text></View>
              </View>
              {['BLUE','GREEN'].map((col) => (
                <View key={col} style={styles.slotRow}>
                  <Text style={[styles.slotColorText, { color: getTurnColorHex(col) }]}>{col}</Text>
                  <View style={styles.slotTypeSelector}>
                    {['LOCAL','ONLINE','BOT'].map((type) => (
                      <TouchableOpacity key={type} style={[styles.slotTypePill, playerSlots[col] === type && styles.slotTypePillActive]} onPress={() => handleSlotTypeChange(col, type)}>
                        <Text style={[styles.slotTypeText, playerSlots[col] === type && styles.slotTypeTextActive]}>
                          {type === 'LOCAL' ? '📱 Local' : type === 'ONLINE' ? '🌐 Online' : '🤖 Bot'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.vsContainer}><View style={styles.vsLine} /><View style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></View><View style={styles.vsLine} /></View>
            <View style={styles.teamContainerBoxB}>
              <View style={styles.teamHeaderRow}>
                <Text style={styles.teamHeaderTitleB}>⚔️ TEAM B (Red & Yellow)</Text>
                <View style={styles.teamBadgeB}><Text style={styles.teamBadgeText}>Partners</Text></View>
              </View>
              {['RED','YELLOW'].map((col) => (
                <View key={col} style={styles.slotRow}>
                  <Text style={[styles.slotColorText, { color: getTurnColorHex(col) }]}>{col}</Text>
                  <View style={styles.slotTypeSelector}>
                    {['LOCAL','ONLINE','BOT'].map((type) => (
                      <TouchableOpacity key={type} style={[styles.slotTypePill, playerSlots[col] === type && styles.slotTypePillActive]} onPress={() => handleSlotTypeChange(col, type)}>
                        <Text style={[styles.slotTypeText, playerSlots[col] === type && styles.slotTypeTextActive]}>
                          {type === 'LOCAL' ? '📱 Local' : type === 'ONLINE' ? '🌐 Online' : '🤖 Bot'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={async () => {
              const hasLocal = Object.values(playerSlots).some(t => t === 'LOCAL');
              if (!hasLocal) { Alert.alert('Configuration Error', 'At least 1 slot must be set to Local.'); return; }

              // Final safety check: if any Team Up slot is ONLINE, do not create
              // a room while the device has no internet/backend connection.
              const hasOnlinePlayer = Object.values(playerSlots).some(t => t === 'ONLINE');
              if (hasOnlinePlayer) {
                const connected = await checkInternetConnection();
                if (!connected) {
                  showInternetRequiredAlert(() => {});
                  return;
                }
              }

              const code = Math.floor(100000 + Math.random() * 900000).toString();
              setRoomCode(code);
              setMyColor('BLUE');
              myColorRef.current = 'BLUE';
              setIsHost(true);
              setActiveColors(['BLUE','RED','GREEN','YELLOW']);
              setPlayType('TEAM');
              matchStartedRef.current = false;
              // Room creation only opens the lobby. The match starts only from startMatchFromLobby().
              setMatchPrizePool(selectedEntryFee * 4);
              setRoomPlayers({ BLUE: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar } });
              setHybridTeamModal(false);
              setOnlineLobbyModal(true);
            }}>
              <Text style={styles.gold3DButtonText}>➕ CREATE TEAM ROOM (HOST)</Text>
            </TouchableOpacity>
            <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>JOIN EXISTING TEAM</Text><View style={styles.dividerLine} /></View>
            <TextInput style={[styles.gameTextInput, { textAlign: 'center', fontSize: 18, letterSpacing: 4 }]} placeholder="ENTER TEAM ROOM CODE" placeholderTextColor="#64748b" keyboardType="number-pad" maxLength={6} value={teamJoinCode} onChangeText={setTeamJoinCode} />
            <TouchableOpacity activeOpacity={0.85} disabled={isVerifyingRoom} style={[styles.gold3DButton, { marginTop: 10, backgroundColor: '#0284c7', borderColor: '#38bdf8' }]} onPress={() => joinTeamOnlineRoom()}>
              {isVerifyingRoom ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.gold3DButtonText}>🚪 JOIN TEAM ROOM NOW</Text>}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setHybridTeamModal(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (onlineScreen) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}><Text style={styles.crownEmoji}>🌐</Text><Text style={styles.brandGoldTitle}>ONLINE ARENA</Text><Text style={styles.lobbySubtitle}>Host or Join Room</Text></View>
          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>SELECT MATCH TYPE:</Text>
            <View style={styles.tabToggleRow}>
              <TouchableOpacity style={[styles.tabToggleBtn, onlinePlayType === 'SOLO' && styles.tabToggleActive]} onPress={() => setOnlinePlayType('SOLO')}>
                <Text style={[styles.tabToggleText, onlinePlayType === 'SOLO' && styles.tabToggleTextActive]}>👤 Individual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabToggleBtn, onlinePlayType === 'TEAM' && styles.tabToggleActive]} onPress={() => setOnlinePlayType('TEAM')}>
                <Text style={[styles.tabToggleText, onlinePlayType === 'TEAM' && styles.tabToggleTextActive]}>🤝 2v2 Team</Text>
              </TouchableOpacity>
            </View>
            {onlinePlayType === 'SOLO' ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.inputLabel}>PLAYERS COUNT:</Text>
                <View style={styles.playerCountRow}>
                  {[2,3,4].map((count) => (
                    <TouchableOpacity key={count} style={[styles.countPill, onlinePlayerCount === count && styles.countPillActive]} onPress={() => setOnlinePlayerCount(count)}>
                      <Text style={[styles.countPillText, onlinePlayerCount === count && styles.countPillTextActive]}>{count} Players</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 10 }}><Text style={styles.helperTip}>• 4 Real Online Players (Team A vs Team B)</Text></View>
            )}
            <Text style={[styles.inputLabel, { marginTop: 10 }]}>SELECT ENTRY FEE (BET):</Text>
            <View style={styles.playerCountRow}>
              {ENTRY_FEE_OPTIONS.map((fee) => (
                <TouchableOpacity key={fee} style={[styles.countPill, selectedEntryFee === fee && styles.countPillActive]} onPress={() => setSelectedEntryFee(fee)}>
                  <Text style={[styles.countPillText, selectedEntryFee === fee && styles.countPillTextActive]}>🪙 {fee}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 12 }]} onPress={startOnlineHost}>
              <Text style={styles.gold3DButtonText}>➕ CREATE PRIVATE ROOM</Text>
            </TouchableOpacity>
            <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>JOIN ROOM</Text><View style={styles.dividerLine} /></View>
            <TextInput style={[styles.gameTextInput, { textAlign: 'center', fontSize: 18, letterSpacing: 4 }]} placeholder="ENTER ROOM CODE" placeholderTextColor="#64748b" keyboardType="number-pad" maxLength={6} value={inputRoomCode} onChangeText={setInputRoomCode} />
            <TouchableOpacity activeOpacity={0.85} disabled={isVerifyingRoom} style={[styles.gold3DButton, { marginTop: 10, backgroundColor: '#0284c7', borderColor: '#38bdf8' }]} onPress={() => joinOnlineRoom()}>
              {isVerifyingRoom ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.gold3DButtonText}>🚪 JOIN ROOM NOW</Text>}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setOnlineScreen(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Online Lobby
  if (onlineLobbyModal) {
    const isTeamMode = playType === 'TEAM';
    const opponentColors = activeColors.filter(c => c !== 'BLUE');
    const totalPotentialPool = selectedEntryFee * activeColors.length;
    const currentReady = getEffectiveReadyCount();
    const isRoomFull = currentReady === activeColors.length;

    const renderTeamSlot = (col, roleTag, badgeStyle, borderStyle) => {
      const slotSetting = playerSlots[col];
      const playerJoined = roomPlayers[col];
      if (slotSetting === 'BOT') {
        return (
          <View style={[styles.playerSquareActive, styles.slotBoxFilledYellow]}>
            <Text style={{ fontSize: 32 }}>🤖</Text>
            <Text style={styles.slotPlayerNameText}>AI Bot</Text>
            <Text style={styles.slotRoleTagYellow}>READY</Text>
          </View>
        );
      }
      if (slotSetting === 'LOCAL') {
        const isMeControlling = (col === myColor);
        return (
          <View style={[styles.playerSquareActive, badgeStyle]}>
            <Text style={{ fontSize: 32 }}>{isMeControlling ? userAvatar : '📱'}</Text>
            <Text style={styles.slotPlayerNameText} numberOfLines={1}>{isMeControlling ? currentUser.name : `Local (${col})`}</Text>
            <Text style={styles.slotRoleTagGreen}>LOCAL (READY)</Text>
          </View>
        );
      }
      if (playerJoined) {
        return (
          <View style={[styles.playerSquareActive, borderStyle]}>
            <Text style={{ fontSize: 32 }}>{playerJoined.avatar || '🎮'}</Text>
            <Text style={styles.slotPlayerNameText} numberOfLines={1}>{playerJoined.name}</Text>
            <Text style={styles.slotRoleTagGreen}>READY</Text>
          </View>
        );
      }
      return (
        <TouchableOpacity activeOpacity={0.8} style={styles.slotInviteBox} onPress={() => setFriendsModal(true)}>
          <Text style={styles.plusAvatarIcon}>👤+</Text>
          <Text style={styles.inviteSlotLabel}>Tap to Invite</Text>
        </TouchableOpacity>
      );
    };

    return (
      <SafeAreaView style={styles.matchmakingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#881337" />
        {renderFriendsSquadModal()}
        <View style={styles.matchLobbyHeader}>
          <Text style={styles.matchLobbyTitle}>ONLINE MULTIPLAYER</Text>
          <Text style={styles.matchFormatSub}>
            {isTeamMode ? '🤝 2v2 TEAM BATTLE' : `👤 ${activeColors.length} PLAYERS INDIVIDUAL`}
          </Text>
        </View>
        <View style={styles.matchCodeCard}>
          <Text style={styles.matchCodeLabel}>Room Code : </Text>
          <View style={styles.codePillBox}><Text style={styles.codePillText}>{roomCode}</Text></View>
          <TouchableOpacity activeOpacity={0.7} style={styles.shareCodeBtn} onPress={handleCopyAndShareRoomCode}>
            <Text style={styles.shareCodeText}>📋 Copy</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.prizePoolBadgeLobby}>
          <Text style={styles.prizePoolBadgeLobbyText}>🪙 Total Prize Pool: {totalPotentialPool.toLocaleString()} Coins</Text>
        </View>
        {isTeamMode ? (
          <View style={styles.teamMatchLobbyWrap}>
            <View style={styles.teamLobbyBoxA}>
              <Text style={styles.teamLobbyTitleA}>🛡️ TEAM A (Blue + Green)</Text>
              <View style={styles.teamSlotsRow}>
                {renderTeamSlot('BLUE', 'HOST (BLUE)', styles.slotBoxFilledBlue, styles.slotBoxFilledBlue)}
                {renderTeamSlot('GREEN', 'PARTNER', styles.slotBoxFilledGreen, styles.slotBoxFilledGreen)}
              </View>
            </View>
            <View style={styles.vsGlowBanner}><Text style={styles.vsGlowText}>⚡ VS ⚡</Text></View>
            <View style={styles.teamLobbyBoxB}>
              <Text style={styles.teamLobbyTitleB}>⚔️ TEAM B (Red + Yellow)</Text>
              <View style={styles.teamSlotsRow}>
                {renderTeamSlot('RED', 'OPPONENT', styles.slotBoxFilledRed, styles.slotBoxFilledRed)}
                {renderTeamSlot('YELLOW', 'OPPONENT', styles.slotBoxFilledYellow, styles.slotBoxFilledYellow)}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.soloMatchLobbyWrap}>
            <View style={styles.hostProfileBox}>
              <View style={styles.hostAvatarSquare}>
                <Text style={{ fontSize: 44 }}>{isHost ? userAvatar : (roomPlayers['BLUE']?.avatar || '👑')}</Text>
              </View>
              <Text style={styles.hostNameText}>{roomPlayers['BLUE']?.name || 'Host'}</Text>
              <Text style={styles.hostBadgeText}>ROOM HOST (BLUE)</Text>
            </View>
            <View style={styles.vsGlowBanner}><Text style={styles.vsGlowText}>⚡ VS ⚡</Text></View>
            <View style={styles.opponentSlotsRow}>
              {opponentColors.map((colorKey) => {
                const playerJoined = roomPlayers[colorKey];
                return (
                  <TouchableOpacity key={colorKey} activeOpacity={0.8} style={[styles.slotInviteBox, playerJoined && { borderColor: getTurnColorHex(colorKey), backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={() => !playerJoined && setFriendsModal(true)}>
                    {playerJoined ? (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 30 }}>{playerJoined.avatar || '🎮'}</Text>
                        <Text style={styles.joinedSlotName} numberOfLines={1}>{playerJoined.name}</Text>
                        <Text style={[styles.joinedSlotTag, { color: getTurnColorHex(colorKey) }]}>READY</Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.plusAvatarIcon}>👤+</Text>
                        <Text style={styles.inviteSlotLabel}>Tap to Invite</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        <View style={styles.matchBottomActions}>
          {isHost ? (
            <TouchableOpacity activeOpacity={0.85} disabled={!isRoomFull} style={[styles.startMatchGoldBtn, !isRoomFull && { backgroundColor: '#475569', borderColor: '#64748b' }]} onPress={startMatchFromLobby}>
              <Text style={[styles.startMatchGoldText, !isRoomFull && { color: '#94a3b8' }]}>
                {isRoomFull ? 'START MATCH NOW ➔' : `WAITING FOR PLAYERS (${currentReady}/${activeColors.length})...`}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.startMatchGoldBtn, { backgroundColor: '#334155', borderColor: '#64748b' }]}>
              <Text style={[styles.startMatchGoldText, { color: '#94a3b8', fontSize: 13 }]}>⏳ WAITING FOR HOST TO START...</Text>
            </View>
          )}
          <TouchableOpacity activeOpacity={0.85} style={styles.cancelMatchBtn} onPress={() => { setOnlineLobbyModal(false); resetGame(); }}>
            <Text style={styles.cancelMatchText}>✕ Leave Room</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Dashboard
  if (!gameMode) {
    const winPercentage = userStats.totalPlayed > 0 ? Math.round((userStats.totalWon / userStats.totalPlayed) * 100) : 0;
    return (
      <View style={styles.dashboardContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Image source={require('./lobby_bg.png')} style={styles.lobbyBgImage} resizeMode="cover" />
        {incomingInvite && (
          <Modal transparent animationType="fade" visible={!!incomingInvite}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2.5 }]}>
                <Text style={styles.cardHeading}>🎮 LIVE GAME INVITE!</Text>
                <View style={styles.inviteDetailsBox}>
                  <Text style={styles.invitePromptText}><Text style={{ fontWeight: 'bold', color: '#facc15', fontSize: 18 }}>{incomingInvite.fromName}</Text> invited you to play a match!</Text>
                  <Text style={styles.inviteRoomTag}>Room Code: #{incomingInvite.roomCode}</Text>
                  <Text style={styles.inviteModeTag}>Entry Bet: 🪙 {incomingInvite.entryFee || 50} Coins</Text>
                </View>
                <TouchableOpacity activeOpacity={0.85} style={styles.gold3DButton} onPress={() => acceptInvite()}>
                  <Text style={styles.gold3DButtonText}>ACCEPT & ENTER LOBBY ➔</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 8 }]} onPress={() => declineInvite()}>
                  <Text style={styles.darkSecondaryButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {leaderboardModal && (
          <Modal transparent animationType="slide" visible={leaderboardModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2 }]}>
                <Text style={styles.podiumTitleHeader}>🏆 GLOBAL LEADERBOARD</Text>
                <Text style={styles.podiumSubHeader}>Top Royale Champions (Real Cloud)</Text>
                <ScrollView style={styles.leaderboardListWrap}>
                  {cloudLeaderboardData.map((player, index) => {
                    const isMe = player.player_id === currentUser.playerId;
                    const rankEmoji = index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `${index + 1}th`;
                    return (
                      <View key={player.player_id} style={[styles.leaderboardRowItem, isMe && styles.leaderboardHostRow]}>
                        <Text style={styles.rankBadgeText}>{rankEmoji}</Text>
                        <Text style={[styles.rankPlayerName, isMe && { color: '#facc15' }]}>{player.name} {isMe ? '(You)' : ''}</Text>
                        <Text style={styles.rankCoinText}>🪙 {player.coins.toLocaleString()}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={() => setLeaderboardModal(false)}>
                  <Text style={styles.gold3DButtonText}>CLOSE LEADERBOARD</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {dailyBonusModal && (
          <Modal
            transparent
            animationType="fade"
            visible={dailyBonusModal}
          >
            <View style={styles.inviteModalOverlay}>
              <View
                style={[
                  styles.glassCard,
                  {
                    borderColor: '#facc15',
                    borderWidth: 2
                  }
                ]}
              >
                <Text style={styles.podiumTitleHeader}>
                  🎁 DAILY BONUS
                </Text>

                <Text style={styles.podiumSubHeader}>
                  Come back every day and collect your reward!
                </Text>

                <View
                  style={{
                    marginVertical: 20,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ fontSize: 52 }}>🪙</Text>

                  <Text
                    style={{
                      color: '#facc15',
                      fontSize: 30,
                      fontWeight: '900',
                      marginTop: 8
                    }}
                  >
                    +200 COINS
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.gold3DButton}
                  onPress={claimDailyBonus}
                >
                  <Text style={styles.gold3DButtonText}>
                    {dailyBonusClaimed
                      ? 'ALREADY CLAIMED TODAY ✓'
                      : 'CLAIM DAILY BONUS 🎁'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.darkSecondaryButton,
                    { marginTop: 10 }
                  ]}
                  onPress={() => setDailyBonusModal(false)}
                >
                  <Text style={styles.darkSecondaryButtonText}>
                    CLOSE
                  </Text>
                </TouchableOpacity>

              </View>
            </View>
          </Modal>
        )}
        {profileStatsModal && (
          <Modal transparent animationType="slide" visible={profileStatsModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2 }]}>
                <View style={styles.profileModalHeader}>
                  <Text style={styles.crownEmoji}>👑</Text>
                  <Text style={styles.profileStatsTitle}>{currentUser.name}</Text>
                  <Text style={styles.profileStatsSubId}>Player ID: #{currentUser?.playerId || '9575'}</Text>
                </View>
                <View style={styles.profileBigAvatarWrap}><Text style={{ fontSize: 44 }}>{userAvatar}</Text></View>
                <View style={styles.statsRowGrid}>
                  <View style={styles.statBoxCard}><Text style={styles.statBoxNumber}>{userStats.totalPlayed}</Text><Text style={styles.statBoxLabel}>Played</Text></View>
                  <View style={[styles.statBoxCard, { borderColor: '#10b981' }]}><Text style={[styles.statBoxNumber, { color: '#10b981' }]}>{userStats.totalWon}</Text><Text style={styles.statBoxLabel}>Won 🏆</Text></View>
                  <View style={[styles.statBoxCard, { borderColor: '#ef4444' }]}><Text style={[styles.statBoxNumber, { color: '#ef4444' }]}>{userStats.totalLost}</Text><Text style={styles.statBoxLabel}>Lost ❌</Text></View>
                  <View style={[styles.statBoxCard, { borderColor: '#facc15' }]}><Text style={[styles.statBoxNumber, { color: '#facc15' }]}>{winPercentage}%</Text><Text style={styles.statBoxLabel}>Win Rate</Text></View>
                </View>
                <View style={styles.infoLineRow}><Text style={styles.infoFieldLabel}>Gmail ID :</Text><Text style={styles.infoFieldValue} numberOfLines={1}>{currentUser.email}</Text></View>
                <View style={styles.infoLineRow}><Text style={styles.infoFieldLabel}>Coin Balance :</Text><Text style={[styles.infoFieldValue, { color: '#facc15' }]}>🪙 {currentUser.coins.toLocaleString()}</Text></View>
                <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={() => setProfileStatsModal(false)}>
                  <Text style={styles.gold3DButtonText}>CLOSE PROFILE ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {settingsModal && (
          <Modal transparent animationType="slide" visible={settingsModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { maxHeight: '90%' }]}>
                <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 10 }}>
                  <Text style={styles.cardHeading}>⚙️ GAME SETTINGS</Text>
                  <View style={styles.settingsSectionCard}>
                    <Text style={styles.settingsSectionTitle}>👤 USER PROFILE</Text>
                    <TouchableOpacity activeOpacity={0.8} style={styles.profileBigAvatarWrap} onPress={() => setAvatarModal(true)}>
                      <Text style={{ fontSize: 48 }}>{userAvatar}</Text>
                      <View style={styles.editAvatarBadge}><Text style={{ fontSize: 10, color: '#ffffff', fontWeight: 'bold' }}>✏️ Change</Text></View>
                    </TouchableOpacity>
                    <View style={styles.infoLineRow}><Text style={styles.infoFieldLabel}>Username :</Text><Text style={styles.infoFieldValue}>{currentUser.name}</Text></View>
                    <View style={styles.infoLineRow}><Text style={styles.infoFieldLabel}>Gmail ID :</Text><Text style={styles.infoFieldValue} numberOfLines={1}>{currentUser.email}</Text></View>
                    <View style={styles.infoLineRow}><Text style={styles.infoFieldLabel}>Player ID :</Text><Text style={styles.infoFieldValue}>#{currentUser.playerId || '9575'}</Text></View>
                    <TouchableOpacity style={styles.avatarPickerTriggerBtn} onPress={() => setAvatarModal(true)}><Text style={styles.avatarPickerTriggerText}>🎭 Select Cartoon Profile Picture ➔</Text></TouchableOpacity>
                  </View>
                  <View style={styles.settingsSectionCard}>
                    <Text style={styles.settingsSectionTitle}>🔊 AUDIO & FEEDBACK</Text>

                    {/* Sound Toggle (existing) */}
                    <View style={styles.soundToggleRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 22, marginRight: 8 }}>{soundEnabled ? '🔊' : '🔇'}</Text>
                        <Text style={styles.soundLabelText}>Game Sounds & FX</Text>
                      </View>
                      <Switch
                        trackColor={{ false: '#475569', true: '#10b981' }}
                        thumbColor={soundEnabled ? '#ffffff' : '#94a3b8'}
                        onValueChange={toggleSound}
                        value={soundEnabled}
                      />
                    </View>

                    {/* 📳 Vibration Toggle (NEW) */}
                    <View style={[styles.soundToggleRow, { marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#1e293b', paddingTop: 12 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 22, marginRight: 8 }}>{hapticsEnabled ? '📳' : '📴'}</Text>
                        <Text style={styles.soundLabelText}>Vibration Feedback</Text>
                      </View>
                      <Switch
                        trackColor={{ false: '#475569', true: '#f59e0b' }}
                        thumbColor={hapticsEnabled ? '#ffffff' : '#94a3b8'}
                        onValueChange={toggleHaptics}
                        value={hapticsEnabled}
                      />
                    </View>
                  </View>
                  <View style={styles.settingsSectionCard}>
                    <Text style={styles.settingsSectionTitle}>ℹ️ ABOUT GAME</Text>
                    <Text style={styles.aboutGoldTitle}>LUDO SUPREME 3D</Text>
                    <Text style={styles.aboutVersionText}>Version: 1.0.0 (Royale Edition)</Text>
                    <View style={styles.dividerLine} />
                    <Text style={styles.aboutCreatorText}>App created by Rajeev Kumar sah</Text>
                    <Text style={styles.aboutContactText}>Gmail - razeevsah@gmail.com</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.85} style={styles.logoutSettingsBtn} onPress={handleLogout}>
                    <Text style={styles.logoutSettingsText}>🚪 LOGOUT ACCOUNT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.gold3DButton, { width: '100%', marginTop: 8 }]} onPress={() => setSettingsModal(false)}>
                    <Text style={styles.gold3DButtonText}>SAVE & CLOSE</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
        {avatarModal && (
          <Modal transparent animationType="fade" visible={avatarModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={styles.avatarSelectionCard}>
                <View style={styles.avatarPreviewTopBox}>
                  <View style={styles.avatarPreviewCircle}><Text style={{ fontSize: 36 }}>{userAvatar}</Text></View>
                  <View style={styles.avatarPreviewNamePlank}><Text style={styles.avatarPreviewNameText}>{currentUser.name}</Text></View>
                </View>
                <View style={styles.avatarCategoryRow}>
                  <TouchableOpacity style={[styles.avatarTabBtn, avatarCategory === 'MALE' && styles.avatarTabActiveMale]} onPress={() => setAvatarCategory('MALE')}><Text style={styles.avatarTabText}>👦 Male</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.avatarTabBtn, avatarCategory === 'FEMALE' && styles.avatarTabActiveFemale]} onPress={() => setAvatarCategory('FEMALE')}><Text style={styles.avatarTabText}>👧 Female</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.avatarTabBtn, avatarCategory === 'ROYALE' && styles.avatarTabActiveRoyale]} onPress={() => setAvatarCategory('ROYALE')}><Text style={styles.avatarTabText}>👑 Special</Text></TouchableOpacity>
                </View>
                <Text style={styles.selectPicHeading}>SELECT PROFILE PICTURE</Text>
                <View style={styles.avatarGridContainer}>
                  {AVATAR_DATA[avatarCategory].map((item) => {
                    const isSelected = userAvatar === item.icon;
                    return (
                      <TouchableOpacity key={item.id} activeOpacity={0.7} style={[styles.avatarGridTile, isSelected && styles.avatarGridTileSelected]} onPress={() => selectAvatar(item.icon)}>
                        <Text style={{ fontSize: 38 }}>{item.icon}</Text>
                        <Text style={styles.avatarTileLabel} numberOfLines={1}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { width: '100%', marginTop: 14 }]} onPress={() => setAvatarModal(false)}>
                  <Text style={styles.gold3DButtonText}>CONFIRM PICTURE ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {renderFriendsSquadModal()}
        <SafeAreaView style={styles.fulfilledTopActionCenterBar}>
          <View style={styles.topActionCenterInnerRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaFulfilledButton} onPress={() => {
  loadGlobalLeaderboard();
  setLeaderboardModal(true);
}}>
              <Text style={styles.megaFulfilledEmoji}>🏆</Text><Text style={styles.megaFulfilledText}>Leaderboard</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaFulfilledButton} onPress={() => { setFriendsModal(true); fetchCloudFriendList(currentUser?.playerId); }}>
              <Text style={styles.megaFulfilledEmoji}>👥</Text><Text style={styles.megaFulfilledText}>Friends Squad</Text>
              {(pendingRequests.length > 0 || incomingInvitesList.length > 0) && (
                <View style={styles.friendNotificationBadge}><Text style={styles.friendNotificationBadgeText}>{pendingRequests.length + incomingInvitesList.length}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaFulfilledButton} onPress={() => setSettingsModal(true)}>
              <Text style={styles.megaFulfilledEmoji}>⚙️</Text><Text style={styles.megaFulfilledText}>Settings</Text>
            </TouchableOpacity>
          <TouchableOpacity
  activeOpacity={0.85}
  style={styles.megaFulfilledButton}
  onPress={() => setDailyBonusModal(true)}
>
  <Text style={styles.megaFulfilledEmoji}>🎁</Text>
  <Text style={styles.megaFulfilledText}>
    Daily Bonus
  </Text>
</TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.centerBannerProfileWrapPerfect}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setProfileStatsModal(true)} style={styles.centerCrownPosition}>
            <Text style={{ fontSize: 30 }}>👑</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setProfileStatsModal(true)} style={styles.centerBannerContainerPerfect}>
            <Text style={styles.centerBannerUsername} numberOfLines={1}>{currentUser.name}</Text>
            <View style={styles.centerBannerCoinsRow}>
              <Text style={{ fontSize: 13, marginRight: 4 }}>🪙</Text>
              <Text style={styles.centerBannerCoinsText}>{currentUser.coins.toLocaleString()} Coins</Text>
            </View>
            <Text style={styles.viewProfileSubHint}>Tap to view stats</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.podiumTouchLayer}>
          <TouchableOpacity activeOpacity={0.4} style={styles.podiumTouchSpot} onPress={() => setBotSelectModal(true)} />
          <TouchableOpacity activeOpacity={0.4} style={styles.podiumTouchSpot} onPress={() => setPassPlayModal(true)} />
          <TouchableOpacity activeOpacity={0.4} style={styles.podiumTouchSpot} onPress={() => setHybridTeamModal(true)} />
          <TouchableOpacity activeOpacity={0.4} style={styles.podiumTouchSpot} onPress={() => setOnlineScreen(true)} />
        </View>
      </View>
    );
  }

  // ========== GAME BOARD ==========
  const boardRotation = getBoardRotationAngle(myColor);
  const perspective = getPerspectiveLayout(myColor);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f2b5c" />
      <Image source={require('./lobby_bg.png')} style={styles.inGameBgCover} resizeMode="cover" blurRadius={12} />
      <View style={styles.inGameBackdropShade} />

      {/* Chat Modal */}
      <Modal transparent animationType="slide" visible={chatModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inviteModalOverlay}>
          <View style={[styles.glassCard, styles.chatModalBox]}>
            <View style={styles.chatHeaderRow}>
              <Text style={styles.chatTitleText}>💬 LIVE MATCH CHAT</Text>
              <TouchableOpacity onPress={() => setChatModal(false)} style={styles.closeChatBtn}><Text style={styles.closeChatText}>✕</Text></TouchableOpacity>
            </View>
            <FlatList
              data={chatMessages}
              keyExtractor={(item) => item.id}
              style={styles.chatListFeed}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const isMe = item.senderColor === myColor;
                return (
                  <View style={[styles.chatBubbleRow, isMe ? styles.chatBubbleRight : styles.chatBubbleLeft]}>
                    <View style={[styles.chatMessageBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOpponent]}>
                      <Text style={[styles.chatSenderName, { color: getTurnColorHex(item.senderColor) }]}>{item.senderName} ({item.senderColor})</Text>
                      <Text style={styles.chatMessageText}>{item.text}</Text>
                      <Text style={styles.chatTimeText}>{item.time}</Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={styles.noChatText}>No messages yet. Send a quick emoji or message!</Text>}
            />
            <View style={styles.quickEmojiRow}>
              {QUICK_EMOJIS.map((emoji, idx) => (
                <TouchableOpacity key={idx} style={styles.emojiCircleBtn} onPress={() => sendChatMessage(emoji)}>
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.chatInputWrap}>
              <TextInput style={styles.chatTextInputField} placeholder="Type your message..." placeholderTextColor="#64748b" value={chatInputText} onChangeText={setChatInputText} />
              <TouchableOpacity style={styles.sendChatBtn} onPress={() => sendChatMessage()}><Text style={styles.sendChatBtnText}>Send ➔</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {showPodiumBoard && (
        <Modal transparent animationType="slide" visible={showPodiumBoard}>
          <View style={styles.inviteModalOverlay}>
            <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2.5 }]}>
              <Text style={styles.podiumTitleHeader}>🏆 MATCH LEADERBOARD 🏆</Text>
              <Text style={styles.podiumSubHeader}>Prize Pool Winner Payout</Text>
              <View style={styles.leaderboardListWrap}>
                {finishedRankings.map((colorKey, index) => {
                  const playerName = getBaseDynamicLabel(colorKey);
                  const isHostUser = colorKey === myColor;
                  const rankBadge = index === 0 ? '🥇 1st (Winner)' : index === 1 ? '🥈 2nd Place' : index === 2 ? '🥉 3rd Place' : '🎖️ 4th Place';
                  const coinReward = index === 0 ? `+🪙 ${matchPrizePool.toLocaleString()}` : '+🪙 0';
                  return (
                    <View key={colorKey} style={[styles.leaderboardRowItem, isHostUser && styles.leaderboardHostRow]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.rankBadgeText}>{rankBadge}</Text>
                        <View style={{ marginLeft: 10 }}>
                          <Text style={[styles.rankPlayerName, { color: getTurnColorHex(colorKey) }]}>{playerName}</Text>
                          <Text style={styles.rankColorSub}>{colorKey}</Text>
                        </View>
                      </View>
                      <View style={styles.rankCoinBox}><Text style={styles.rankCoinText}>{coinReward}</Text></View>
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 16 }]} onPress={resetGame}>
                <Text style={styles.gold3DButtonText}>COLLECT REWARD & EXIT ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExitGame}><Text style={styles.exitBtnText}>✕ Exit</Text></TouchableOpacity>
        <View style={styles.inGamePoolBox}><Text style={styles.inGamePoolText}>🪙 Pool: {matchPrizePool.toLocaleString()}</Text></View>
        <View style={styles.onlineGameActions}>
          {/* 🔊 Quick Sound Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.quickToggleBtn, soundEnabled ? styles.quickToggleBtnActive : styles.quickToggleBtnOff]}
            onPress={() => toggleSound(!soundEnabled)}
          >
            <Text style={styles.quickToggleEmoji}>{soundEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>

          {/* 📳 Quick Vibration Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.quickToggleBtn, hapticsEnabled ? styles.quickToggleBtnActive : styles.quickToggleBtnOff]}
            onPress={() => toggleHaptics(!hapticsEnabled)}
          >
            <Text style={styles.quickToggleEmoji}>{hapticsEnabled ? '📳' : '📴'}</Text>
          </TouchableOpacity>

          {/* 💬 Chat (only online/hybrid) */}
          {(gameMode === 'ONLINE' || gameMode === 'HYBRID') && (
            <TouchableOpacity activeOpacity={0.8} style={[styles.inGameIconBtn, styles.chatTriggerBtn]} onPress={() => setChatModal(true)}>
              <Text style={{ fontSize: 16 }}>💬</Text>
              {chatMessages.length > 0 && <View style={styles.chatBadgeDot} />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.topCardsRow}>
        {renderPlayerCard(perspective.leftColor, getTurnColorHex(perspective.leftColor), false)}
        {renderPlayerCard(perspective.topColor, getTurnColorHex(perspective.topColor), true)}
      </View>

      <View style={styles.boardContainer}>
        <View style={[styles.board, { transform: [{ rotate: boardRotation }] }]}>
          {renderBase('RED', styles.redBase, true)}
          {renderBase('GREEN', styles.greenBase, false)}
          {renderBase('BLUE', styles.blueBase, false)}
          {renderBase('YELLOW', styles.yellowBase, false)}
          <View style={styles.centerHome}>
            <View style={styles.centerTriangleTop} />
            <View style={styles.centerTriangleRight} />
            <View style={styles.centerTriangleBottom} />
            <View style={styles.centerTriangleLeft} />
          </View>
          <BoardCells myColor={myColor} />
          {renderAllTokens()}
        </View>
      </View>

      <View style={styles.bottomCardsRow}>
        {renderPlayerCard(perspective.bottomColor, getTurnColorHex(perspective.bottomColor), false)}
        {renderPlayerCard(perspective.rightColor, getTurnColorHex(perspective.rightColor), true)}
      </View>
    </SafeAreaView>
  );
}
