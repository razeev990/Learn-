import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@ludo_supreme_user';


// ===============================
// SIGN UP
// ===============================

export const signUpUser = async ({
  emailInput,
  passwordInput,
  usernameInput,
}) => {
  try {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();
    const username = usernameInput.trim();

    if (!email) {
      return {
        success: false,
        error: 'Please enter your email.',
      };
    }

    if (!username) {
      return {
        success: false,
        error: 'Please enter a username.',
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    const existing = await AsyncStorage.getItem(
      USER_STORAGE_KEY
    );

    if (existing) {
      const parsed = JSON.parse(existing);

      if (parsed.email === email) {
        return {
          success: false,
          error:
            'Account already exists. Please login.',
        };
      }
    }

    const newUser = {
      playerId: `player_${Date.now()}`,
      name: username,
      email,
      password,
      coins: 500,
      avatar: '👸',
    };

    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(newUser)
    );

    return {
      success: true,
      user: newUser,
    };
  } catch (error) {
    console.log('Signup Error:', error);

    return {
      success: false,
      error:
        'Something went wrong. Please try again.',
    };
  }
};


// ===============================
// LOGIN
// ===============================

export const loginUser = async ({
  emailInput,
  passwordInput,
}) => {
  try {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!email) {
      return {
        success: false,
        error: 'Please enter your email.',
      };
    }

    if (!password) {
      return {
        success: false,
        error: 'Please enter your password.',
      };
    }

    const savedUser = await AsyncStorage.getItem(
      USER_STORAGE_KEY
    );

    if (!savedUser) {
      return {
        success: false,
        error:
          'No account found. Please sign up first.',
      };
    }

    const user = JSON.parse(savedUser);

    if (
      user.email !== email ||
      user.password !== password
    ) {
      return {
        success: false,
        error:
          'Incorrect email or password.',
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.log('Login Error:', error);

    return {
      success: false,
      error:
        'Something went wrong. Please try again.',
    };
  }
};


// ===============================
// RESET PASSWORD
// ===============================

export const resetUserPassword = async ({
  emailInput,
  newPasswordInput,
}) => {
  try {
    const email = emailInput.trim().toLowerCase();

    if (
      !newPasswordInput ||
      newPasswordInput.length < 6
    ) {
      return {
        success: false,
        error:
          'New password must be at least 6 characters.',
      };
    }

    const savedUser = await AsyncStorage.getItem(
      USER_STORAGE_KEY
    );

    if (!savedUser) {
      return {
        success: false,
        error: 'No account found.',
      };
    }

    const user = JSON.parse(savedUser);

    if (user.email !== email) {
      return {
        success: false,
        error: 'Email does not match.',
      };
    }

    const updatedUser = {
      ...user,
      password: newPasswordInput,
    };

    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(updatedUser)
    );

    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    console.log('Password Reset Error:', error);

    return {
      success: false,
      error:
        'Something went wrong. Please try again.',
    };
  }
};


// ===============================
// LOAD SAVED USER
// ===============================

export const loadSavedUser = async () => {
  try {
    const savedUser = await AsyncStorage.getItem(
      USER_STORAGE_KEY
    );

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);
  } catch (error) {
    console.log('Load User Error:', error);

    return null;
  }
};


// ===============================
// LOGOUT
// ===============================

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(
      USER_STORAGE_KEY
    );

    return {
      success: true,
    };
  } catch (error) {
    console.log('Logout Error:', error);

    return {
      success: false,
      error:
        'Unable to logout. Please try again.',
    };
  }
};
