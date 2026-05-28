import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'dark',
  language: 'cpp',
  problemsList: [],
  currentProblem: {
    _id: "6a104784919de5736f09bcd9", 
    title: "1. Even or Odd",
    difficulty: "Easy",
    description: "Given an integer N, print 'Even' if it is even, otherwise print 'Odd'. Provide optimized space and time complexity.",
    inputFormat: "A single integer N.",
    outputFormat: "Print 'Even' or 'Odd'."
  },
  code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    if(n % 2 == 0) cout << "Even";\n    else cout << "Odd";\n    return 0;\n}`,
  customInput: "4",
  status: 'Idle',
  result: null,
  
  // Auth States
  token: localStorage.getItem('token') || null,
  username: localStorage.getItem('username') || null,
  authView: localStorage.getItem('token') ? 'judge' : 'login',

  // 🔥 Profile Details States
  userProfile: {
    fullName: localStorage.getItem('user_fullName') || "Sumit Sahu",
    bio: localStorage.getItem('user_bio') || "Competitive Programmer | Full Stack Developer",
    avatar: localStorage.getItem('user_avatar') || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"
  }
};

const problemSlice = createSlice({
  name: 'problem',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setCode: (state, action) => {
      state.code = action.payload;
    },
    setCustomInput: (state, action) => {
      state.customInput = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setResult: (state, action) => {
      state.result = action.payload;
    },
    setProblemsList: (state, action) => {
      state.problemsList = action.payload;
    },
    setCurrentProblem: (state, action) => {
      state.currentProblem = action.payload;
      state.result = null;
    },
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.username = action.payload.username;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('username', action.payload.username);
      state.authView = 'judge';
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      state.authView = 'login'; 
    },
    setAuthView: (state, action) => {
      state.authView = action.payload;
    },
    // 🔥 Profile Sync Update Reducer
    updateProfile: (state, action) => {
      state.userProfile = { ...state.userProfile, ...action.payload };
      if(action.payload.fullName) localStorage.setItem('user_fullName', action.payload.fullName);
      if(action.payload.bio) localStorage.setItem('user_bio', action.payload.bio);
      if(action.payload.avatar) localStorage.setItem('user_avatar', action.payload.avatar);
    }
  },
});

export const { 
  toggleTheme, setLanguage, setCode, setCustomInput, setStatus, setResult,
  setProblemsList, setCurrentProblem, loginSuccess, logout, setAuthView, updateProfile 
} = problemSlice.actions;

export default problemSlice.reducer;