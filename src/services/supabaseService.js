
import {
  SUPABASE_REST_URL,
  SUPABASE_ANON_KEY,
} from '../constants/config';


// ===============================
// SUPABASE HEADERS
// ===============================

export const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,

  Authorization:
    `Bearer ${SUPABASE_ANON_KEY}`,

  'Content-Type':
    'application/json',
};


// ===============================
// GENERIC GET REQUEST
// ===============================

export const supabaseGet = async (
  endpoint
) => {
  try {
    const response = await fetch(
      `${SUPABASE_REST_URL}/${endpoint}`,
      {
        headers: supabaseHeaders,
      }
    );

    return await response.json();
  } catch (error) {
    console.log(
      'Supabase GET Error:',
      error
    );

    throw error;
  }
};


// ===============================
// GENERIC POST REQUEST
// ===============================

export const supabasePost = async (
  endpoint,
  data
) => {
  try {
    const response = await fetch(
      `${SUPABASE_REST_URL}/${endpoint}`,
      {
        method: 'POST',

        headers: {
          ...supabaseHeaders,

          Prefer:
            'return=representation',
        },

        body:
          JSON.stringify(data),
      }
    );

    return await response.json();
  } catch (error) {
    console.log(
      'Supabase POST Error:',
      error
    );

    throw error;
  }
};


// ===============================
// GENERIC PATCH REQUEST
// ===============================

export const supabasePatch = async (
  endpoint,
  data
) => {
  try {
    const response = await fetch(
      `${SUPABASE_REST_URL}/${endpoint}`,
      {
        method: 'PATCH',

        headers: {
          ...supabaseHeaders,

          Prefer:
            'return=minimal',
        },

        body:
          JSON.stringify(data),
      }
    );

    return response;
  } catch (error) {
    console.log(
      'Supabase PATCH Error:',
      error
    );

    throw error;
  }
};


// ===============================
// FETCH CLOUD FRIEND LIST
// ===============================

export const fetchCloudFriendList = async (
  myPlayerId
) => {
  if (!myPlayerId) {
    return [];
  }

  try {
    const filter =
      `(user_a.eq.${myPlayerId},` +
      `user_b.eq.${myPlayerId})`;

    const friendships =
      await supabaseGet(
        `ludo_friendships?or=${encodeURIComponent(
          filter
        )}`
      );

    if (!Array.isArray(friendships)) {
      return [];
    }

    const friendIds =
      friendships.map((row) =>
        String(row.user_a) ===
        String(myPlayerId)
          ? row.user_b
          : row.user_a
      );

    if (friendIds.length === 0) {
      return [];
    }

    const users =
      await supabaseGet(
        `ludo_users?player_id=in.(` +
        `${friendIds.join(',')})`
      );

    if (!Array.isArray(users)) {
      return [];
    }

    return users.map((user) => ({
      id: user.player_id,

      playerId:
        user.player_id,

      name:
        user.name || 'Player',

      email:
        user.email,

      avatar:
        user.avatar || '👤',

      online:
        user.last_seen
          ? Date.now() -
              new Date(
                user.last_seen
              ).getTime() <
            2 * 60 * 1000
          : false,
    }));
  } catch (error) {
    console.log(
      'Friend list error:',
      error
    );

    return [];
  }
};


// ===============================
// UPDATE LAST SEEN
// ===============================

export const updateLastSeen = async (
  playerId
) => {
  if (!playerId) {
    return;
  }

  try {
    await supabasePatch(
      `ludo_users?player_id=eq.${encodeURIComponent(
        playerId
      )}`,
      {
        last_seen:
          new Date().toISOString(),
      }
    );
  } catch (error) {
    console.log(
      'Update last seen error:',
      error
    );
  }
};
