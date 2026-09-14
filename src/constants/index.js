import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const SUPABASE_PROJECT_REF = 'zyqlntdpftowobsrzbgv';
export const SUPABASE_ANON_KEY = 'sb_publishable_DuyB_EEKvMkDk0QFxQykqg_ZXCMzTwo';
export const SUPABASE_REST_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1`;
export const AGORA_APP_ID = '110534b7d9ce4f1ea80f93494d69ffa5';

export const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};

export const BOARD_SIZE = Math.min(width - 24, 420);
export const CELL_SIZE = BOARD_SIZE / 15;

export const ENTRY_FEE_OPTIONS = [50, 100, 200, 500];

export const TRACK_COORDINATES = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0]
];

export const HOME_PATHS = {
  BLUE: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  RED: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  GREEN: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  YELLOW: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]]
};

export const BASE_SPOTS = {
  BLUE: [[11.0, 2.0], [11.0, 4.0], [13.0, 2.0], [13.0, 4.0]],
  RED: [[2.0, 2.0], [2.0, 4.0], [4.0, 2.0], [4.0, 4.0]],
  GREEN: [[2.0, 11.0], [2.0, 13.0], [4.0, 11.0], [4.0, 13.0]],
  YELLOW: [[11.0, 11.0], [11.0, 13.0], [13.0, 11.0], [13.0, 13.0]]
};

export const START_INDEX = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };
export const SAFE_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47];
export const ALL_COLORS = ['BLUE','RED','GREEN','YELLOW'];

export const AVATAR_DATA = {
  MALE: [
    { id:'m1', label:'👦 Boy', icon:'👦' },
    { id:'m2', label:'🧔 Hero', icon:'🧔' },
    { id:'m3', label:'🧑‍🦱 Cool Guy', icon:'🧑‍🦱' },
    { id:'m4', label:'👨‍🦰 Smart', icon:'👨‍🦰' },
    { id:'m5', label:'🤠 Cowboy', icon:'🤠' },
    { id:'m6', label:'😎 Shades', icon:'😎' }
  ],
  FEMALE: [
    { id:'f1', label:'👧 Girl', icon:'👧' },
    { id:'f2', label:'👩‍🦰 Redhead', icon:'👩‍🦰' },
    { id:'f3', label:'👱‍♀️ Blonde', icon:'👱‍♀️' },
    { id:'f4', label:'👩‍🦱 Curly', icon:'👩‍🦱' },
    { id:'f5', label:'👒 Cute Cap', icon:'👒' },
    { id:'f6', label:'👸 Princess', icon:'👸' }
  ],
  ROYALE: [
    { id:'r1', label:'👑 King', icon:'👑' },
    { id:'r2', label:'🦁 Lion King', icon:'🦁' },
    { id:'r3', label:'🐯 Tiger Pro', icon:'🐯' },
    { id:'r4', label:'⚡ Flash', icon:'⚡' },
    { id:'r5', label:'🐉 Dragon', icon:'🐉' },
    { id:'r6', label:'💎 Diamond', icon:'💎' }
  ]
};

export const QUICK_EMOJIS = ['😀','🔥','😂','👏','🎯','👑','😎','🤫'];
