import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Editor from '@monaco-editor/react';

import { Sun, Moon, Play, CheckCircle, Code, Terminal, Cpu, RefreshCw, LogIn, LogOut, Mail, Lock, User, List, X, AlignJustify, Trophy, Flame, Zap, BarChart2, Layers } from 'lucide-react';
import { toggleTheme, setLanguage, setCode, setCustomInput, setStatus, setResult, setProblemsList, setCurrentProblem, loginSuccess, logout, setAuthView } from './redux/problemSlice';

import axios from 'axios';

function App() {
  
  const [leftWidth, setLeftWidth] = useState(50); 
  const [isDragging, setIsDragging] = useState(false);

  const startResize = (e) => {
    if (e) e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
     
      let newWidth = (e.clientX / window.innerWidth) * 100;
      
      
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const dispatch = useDispatch();
  const { theme, language, currentProblem, problemsList, code, customInput, status, result, token, username, authView } = useSelector((state) => state.problem);
  
  const [activeTab, setActiveTab] = useState('input');
  const [showProblemsOverlay, setShowProblemsOverlay] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfileStats, setShowProfileStats] = useState(false);
  
  
  const [dbStats, setDbStats] = useState({ solvedEasy: 0, solvedMedium: 0, solvedHard: 0, totalScore: 0, streak: 3 });
  const [leaderboardList, setLeaderboardList] = useState([]);

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMsg, setAuthMsg] = useState('');

  const BACKEND_URL = 'https://leetcode-backend-9grm.onrender.com';
  const isDark = theme === 'dark';

  
  useEffect(() => {
    if (code && currentProblem?._id) {
      const delayDebounce = setTimeout(() => {
        localStorage.setItem(`autosave_${currentProblem._id}`, code);
      }, 2000);
      return () => clearTimeout(delayDebounce);
    }
  }, [code, currentProblem?._id]);

  
  useEffect(() => {
    if (currentProblem?._id) {
      const saved = localStorage.getItem(`autosave_${currentProblem._id}`);
      if (saved) {
        dispatch(setCode(saved));
      } else {
        dispatch(setCode('// Write your solution here...\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Code here\n    return 0;\n}'));
      }
    }
  }, [currentProblem?._id, dispatch]);

  useEffect(() => {
    if (!token && (authView === 'judge')) dispatch(setAuthView('login'));
  }, [token, authView]);

  useEffect(() => {
    if (token) {
      axios.get(`${BACKEND_URL}/problems`)
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
            dispatch(setProblemsList(res.data));
          }
        })
        .catch(err => console.error("Problems list pull failed", err));
      fetchLiveUserStats();
    }
  }, [token, currentProblem]);

  const fetchLiveUserStats = () => {
    if (!username) return;
    axios.get(`${BACKEND_URL}/api/user/stats/${username}`)
      .then(res => {
        if (res.data) setDbStats(res.data);
      })
      .catch(err => console.error("Stats fetch failure", err));
  };

  const fetchLeaderboard = () => {
    axios.get(`${BACKEND_URL}/api/leaderboard`)
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setLeaderboardList(res.data);
          setShowLeaderboard(true);
        }
      })
      .catch(err => console.error("Leaderboard error", err));
  };

  const handleRun = async (e) => {
  if (e) e.preventDefault();
  dispatch(setStatus('Running')); dispatch(setResult(null)); setActiveTab('output');
  try {
    const response = await axios.post(`${BACKEND_URL}/run`, { code, input: customInput });
    dispatch(setResult(response.data));
  } catch (err) { 
    // ACTUAL ERROR DEKHNE KE LIYE ISKO UPDATE KIYA[cite: 4]
    const errMsg = err.response?.data?.error || err.response?.data?.details || "Network Timeout / Server Unreachable";
    dispatch(setResult({ status: "Error", error: errMsg })); 
  } finally { 
    dispatch(setStatus('Idle')); 
  }
};
  };

  const handleSubmitCode = async (e) => {
  if (e) e.preventDefault();
  if (!currentProblem?._id) return;
  dispatch(setStatus('Submitting')); dispatch(setResult(null)); setActiveTab('output');
  try {
    const response = await axios.post(`${BACKEND_URL}/submit`, { code, problemId: currentProblem._id, username });
    dispatch(setResult(response.data));
    fetchLiveUserStats();
  } catch (err) { 
    // ACTUAL ERROR DEKHNE KE LIYE ISKO UPDATE KIYA[cite: 4]
    const errMsg = err.response?.data?.error || err.response?.data?.details || "Submission Pipeline Interrupted";
    dispatch(setResult({ status: "Error", error: errMsg })); 
  } finally { 
    dispatch(setStatus('Idle')); 
  }
};

  const handleResetCode = (e) => {
    if (e) e.preventDefault();
    if (!currentProblem?._id) return;
    localStorage.removeItem(`autosave_${currentProblem._id}`);
    const defaultTemplate = '// Write your solution here...\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Code here\n    return 0;\n}';
    dispatch(setCode(defaultTemplate));
    dispatch(setResult(null));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, { email: authEmail, password: authPassword });
      if (response.data && response.data.token) {
        dispatch(loginSuccess({ token: response.data.token, username: response.data.username }));
      }
    } catch (err) { 
      setAuthError(err.response?.data?.error || "invalid credentials!"); 
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthMsg('');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/signup`, {
        username: authUsername,
        email: authEmail,
        password: authPassword
      });
      setAuthMsg("Account created successfully ! Switching to login...");
      setTimeout(() => {
        dispatch(setAuthView('login'));
        setAuthMsg('');
      }, 1500);
    } catch (err) {
      const errorResponse = err.response?.data?.error || "Signup Failed! Schema constraints not matched.";
      setAuthError(errorResponse);
    }
  };

  const bgMain = isDark ? 'bg-[#0a0a0c] text-[#e2e8f0]' : 'bg-[#f4f6f9] text-[#1e293b]';
  const bgCard = isDark ? 'bg-[#121216] border-[#22222b]' : 'bg-white border-gray-200';
  const textTitle = isDark ? 'text-white font-black' : 'text-gray-900 font-black';
  const bgTerminal = isDark ? 'bg-[#0b0b0d] text-[#4af626]' : 'bg-[#141517] text-[#4af626]';

  const formatIndex = (index) => String(index + 1).padStart(2, '0');

  const safeProblem = currentProblem || { title: "Loading...", description: "Please select a task", difficulty: "Easy", inputFormat: "N/A", outputFormat: "N/A" };
  const safeProblemsList = problemsList || [];
  const safeLeaderboardList = leaderboardList || [];

  return (
    <div className={`h-screen ${bgMain} font-sans flex flex-col overflow-hidden text-xs transition-all duration-500`}>
      
     
      <nav className={`flex items-center justify-between px-5 py-2.5 border-b shadow-lg backdrop-blur-md ${bgCard} relative`}>
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => { if(token) setShowProblemsOverlay(true); }}>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl text-black shadow-lg shadow-orange-500/20 transform group-hover:rotate-12 transition-transform duration-300"><Cpu size={18} /></div>
          <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent group-hover:brightness-125 transition-all">CodeEngine Pro</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {token && (
            <div className="flex items-center space-x-2">
              <button 
                type="button" 
                onClick={fetchLeaderboard} 
                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl transition-all duration-300 flex items-center space-x-1 hover:shadow-md hover:shadow-blue-500/10"
              >
                <Trophy size={14} /> <span className="font-bold">Leaderboard</span>
              </button>
              
              <div 
                onClick={() => setShowProfileStats(!showProfileStats)}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:brightness-125 px-3 py-1.5 rounded-xl border border-amber-500/30 cursor-pointer shadow-inner transition-all duration-300 transform hover:scale-105"
              >
                <Flame size={14} className="text-orange-500 animate-bounce" />
                <span className="font-black text-amber-500">Hi, {username || 'Coder'} ({dbStats?.totalScore || 0} pts)</span>
              </div>
            </div>
          )}
          <button type="button" onClick={() => dispatch(toggleTheme())} className={`p-2 rounded-xl border transition-transform active:scale-95 duration-300 ${isDark ? 'bg-[#1c1c24] border-[#2d2d3d] text-yellow-400' : 'bg-amber-50 border-amber-300 text-amber-700'}`}>{isDark ? <Sun size={14} /> : <Moon size={14} />}</button>
          {token && <button type="button" onClick={() => dispatch(logout())} className="p-2 rounded-xl text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/30 transition-all duration-300"><LogOut size={14} /></button>}
        </div>
      </nav>

     
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111115] border-2 border-blue-500/30 rounded-3xl p-6 shadow-2xl flex flex-col text-white">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div className="flex items-center space-x-2 text-blue-400 font-black text-lg"><Trophy size={20} /> <span>GLOBAL RANKING LEADERBOARD</span></div>
              <button type="button" onClick={() => setShowLeaderboard(false)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400"><X size={16} /></button>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {safeLeaderboardList.map((leader, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border border-gray-800/60 ${leader?.username === username ? 'bg-blue-500/10 border-blue-500/40' : 'bg-[#16161f]'}`}>
                  <div className="flex items-center space-x-3">
                    <span className={`font-black text-base w-6 text-center ${i===0?'text-yellow-400':i===1?'text-gray-300':'text-gray-500'}`}>#{i+1}</span>
                    <div>
                      <p className="font-black text-xs text-gray-200">{leader?.username} {leader?.username === username && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded">(You)</span>}</p>
                      <p className="text-[10px] text-gray-500">Solves: E:{leader?.solvedEasy || 0} M:{leader?.solvedMedium || 0} H:{leader?.solvedHard || 0}</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-blue-400">{leader?.totalScore || 0} PTS</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

     
      {showProfileStats && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131318] border-2 border-orange-500/30 rounded-3xl p-6 text-white text-center shadow-2xl relative">
            <button type="button" onClick={() => setShowProfileStats(false)} className="absolute top-4 right-4 p-1.5 bg-gray-800 rounded-full text-gray-400"><X size={16} /></button>
            <BarChart2 size={36} className="mx-auto text-orange-500 mb-2" />
            <h2 className="text-xl font-black bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent uppercase tracking-tight">Coding Metrics Dashboard</h2>
            <p className="text-[10px] text-gray-500 mb-6">Real-Time Core Engine Evaluation Metrics</p>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-2xl">
                <p className="text-[10px] uppercase text-green-400 font-bold">Easy Solved</p>
                <p className="text-2xl font-black mt-1 text-green-300">{dbStats?.solvedEasy || 0}</p>
              </div>
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <p className="text-[10px] uppercase text-amber-400 font-bold">Medium Solved</p>
                <p className="text-2xl font-black mt-1 text-green-300">{dbStats?.solvedMedium || 0}</p>
              </div>
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <p className="text-[10px] uppercase text-red-400 font-bold">Hard Solved</p>
                <p className="text-2xl font-black mt-1 text-red-300">{dbStats?.solvedHard || 0}</p>
              </div>
            </div>

            <div className="bg-black/20 p-4 border border-gray-800 rounded-xl flex items-center justify-between text-left">
              <div>
                <p className="font-black text-gray-300 text-xs uppercase flex items-center space-x-1"><Zap size={12} className="text-yellow-400" /> <span>Rank Badge Factor</span></p>
                <p className="text-[11px] text-gray-500 mt-0.5">Calculated score scaling ranks</p>
              </div>
              <span className="px-3 py-1 bg-amber-500 text-black font-black uppercase rounded-lg text-[10px]">
                {(dbStats?.totalScore || 0) >= 200 ? "Elite Master" : (dbStats?.totalScore || 0) >= 50 ? "Knight" : "Novice"}
              </span>
            </div>
          </div>
        </div>
      )}

     
      {showProblemsOverlay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 p-6 flex justify-center transition-all duration-300">
          <div className={`w-full max-w-4xl rounded-3xl p-5 flex flex-col shadow-2xl border-2 ${bgCard}`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-500/20">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-1.5 rounded-lg text-black shadow-md"><List size={18} /></div>
                <h1 className="text-base font-black bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Full Task Suite Platform</h1>
              </div>
              <button type="button" onClick={() => setShowProblemsOverlay(false)} className="p-1.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
              {safeProblemsList.map((prob, index) => (
                <div 
                  key={prob?._id || index}
                  onClick={() => { if(prob) { dispatch(setCurrentProblem(prob)); setShowProblemsOverlay(false); } }}
                  className={`group p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${safeProblem?._id === prob?._id ? 'bg-amber-500/10 border-amber-500/60 shadow-sm' : isDark ? 'bg-[#15151b] border-[#22222a] hover:border-amber-500/30' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-black text-xl text-gray-600 group-hover:text-amber-500">{formatIndex(index)}.</span>
                    <div>
                      <p className="text-xs font-black group-hover:text-amber-400">{prob?.title || "Untitled problem"}</p>
                      <span className={`w-fit px-2 py-0.5 mt-1 rounded-md text-[9px] uppercase tracking-wider font-extrabold flex items-center ${prob?.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' : prob?.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{prob?.difficulty || "Easy"}</span>
                    </div>
                  </div>
                  {safeProblem?._id === prob?._id && <div className="text-amber-500 bg-amber-500/10 p-1 rounded-full"><CheckCircle size={14} /></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      
      {authView === 'login' && (
        <div className="flex-1 flex items-center justify-center bg-black/20 p-4">
          <div className={`p-6 rounded-2xl border w-full max-w-sm shadow-2xl backdrop-blur-md ${bgCard} border-amber-500/20`}>
            <h2 className="text-2xl font-black mb-1 text-center bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">System Authentication</h2>
            <p className="text-[10px] text-center mb-5 text-gray-500 uppercase tracking-widest font-bold">Authorized Coders Nodes Only</p>
            {authError && <div className="p-2 mb-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-bold text-center">{authError}</div>}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left">
              <div>
                <label className="block font-black uppercase text-[10px] tracking-wider text-gray-400 mb-1">Secure Email</label>
                <div className="relative"><Mail className="absolute left-3 top-2.5 text-gray-500" size={14} /><input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-black/20 border border-gray-800 rounded-xl text-xs outline-none focus:border-amber-500 text-white" placeholder="name@domain.com" /></div>
              </div>
              <div>
                <label className="block font-black uppercase text-[10px] tracking-wider text-gray-400 mb-1">Cipher Key (Password)</label>
                <div className="relative"><Lock className="absolute left-3 top-2.5 text-gray-500" size={14} /><input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-black/20 border border-gray-800 rounded-xl text-xs outline-none focus:border-amber-500 text-white" placeholder="••••••••" /></div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-black font-black rounded-xl uppercase tracking-wider text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all">Establish Core Session</button>
            </form>
            <p className="text-[11px] text-center mt-4 text-gray-400">
              {' '}
              <span 
                onClick={() => { dispatch(setAuthView('signup')); setAuthError(''); }} 
                className="text-amber-500 font-black cursor-pointer hover:underline hover:text-orange-400 transition-colors"
              >
                Register/Signup 
              </span>
            </p>
          </div>
        </div>
      )}

      
      {authView === 'signup' && (
        <div className="flex-1 flex items-center justify-center bg-black/20 p-4">
          <div className={`p-6 rounded-2xl border w-full max-w-sm shadow-2xl backdrop-blur-md ${bgCard} border-amber-500/20`}>
            <h2 className="text-2xl font-black mb-1 text-center bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">Create Account</h2>
            <p className="text-[10px] text-center mb-5 text-gray-500 uppercase tracking-widest font-bold">Register Developer Cluster Node</p>
            {authError && <div className="p-2 mb-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-bold text-center">{authError}</div>}
            {authMsg && <div className="p-2 mb-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-[10px] font-bold text-center">{authMsg}</div>}
            <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-left">
              <div>
                <label className="block font-black uppercase text-[10px] tracking-wider text-gray-400 mb-1">Unique Username</label>
                <div className="relative"><User className="absolute left-3 top-2.5 text-gray-500" size={14} /><input type="text" required value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-black/20 border border-gray-800 rounded-xl text-xs outline-none focus:border-amber-500 text-white" placeholder="sumit_coder" /></div>
              </div>
              <div>
                <label className="block font-black uppercase text-[10px] tracking-wider text-gray-400 mb-1">Email Address</label>
                <div className="relative"><Mail className="absolute left-3 top-2.5 text-gray-500" size={14} /><input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-black/20 border border-gray-800 rounded-xl text-xs outline-none focus:border-amber-500 text-white" placeholder="name@domain.com" /></div>
              </div>
              <div>
                <label className="block font-black uppercase text-[10px] tracking-wider text-gray-400 mb-1">Choose Password</label>
                <div className="relative"><Lock className="absolute left-3 top-2.5 text-gray-500" size={14} /><input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-black/20 border border-gray-800 rounded-xl text-xs outline-none focus:border-amber-500 text-white" placeholder="••••••••" /></div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-black font-black rounded-xl uppercase tracking-wider text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all">Register Node</button>
            </form>
            <p className="text-[11px] text-center mt-4 text-gray-400">
              Already have account?{' '}
              <span 
                onClick={() => { dispatch(setAuthView('login')); setAuthError(''); }} 
                className="text-amber-500 font-black cursor-pointer hover:underline hover:text-orange-400 transition-colors"
              >
                Login
              </span>
            </p>
          </div>
        </div>
      )}

      
      {authView === 'judge' && (
        <div className="flex p-3 flex-1 overflow-hidden h-[calc(100vh-50px)] relative">
          
         
          <div 
            style={{ width: `${leftWidth}%` }}
            className={`flex flex-col rounded-xl p-4 overflow-y-auto shadow-sm ${bgCard} border border-gray-800/40 transition-none`}
          >
            <div className="flex items-center justify-between mb-2">
              <h1 className={`text-base font-black tracking-tight ${textTitle}`}>{safeProblem.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${safeProblem.difficulty==='Easy'?'bg-green-500/10 text-green-400 border-green-500/20':safeProblem.difficulty==='Medium'?'bg-amber-500/10 text-amber-400 border-amber-500/20':'bg-red-500/10 text-red-400 border-red-500/20'}`}>{safeProblem.difficulty}</span>
            </div>
            <hr className="my-2 border-gray-800/40" />
            <div className="space-y-3 flex-1 text-xs font-medium text-left">
              <p className="text-[13px] leading-relaxed opacity-90">{safeProblem.description}</p>
              <div className="p-3 bg-black/10 border border-gray-800/40 rounded-xl">
                <h3 className="font-black text-amber-500 text-[10px] tracking-wider uppercase flex items-center space-x-1"><Terminal size={12} /> <span>Input Constraints Specification</span></h3>
                <p className="opacity-70 mt-0.5">{safeProblem.inputFormat}</p>
              </div>
              <div className="p-3 bg-black/10 border border-gray-800/40 rounded-xl">
                <h3 className="font-black text-amber-500 text-[10px] tracking-wider uppercase flex items-center space-x-1"><CheckCircle size={12} /> <span>Expected Output Alignment</span></h3>
                <p className="opacity-70 mt-0.5">{safeProblem.outputFormat}</p>
              </div>
            </div>
          </div>

  
          <div 
            onMouseDown={startResize}
            className={`w-2 h-full cursor-col-resize flex flex-col justify-center items-center relative group z-30 transition-all ${isDragging ? 'bg-amber-500/30' : 'hover:bg-amber-500/20'}`}
          >
            <div className={`w-[2px] h-6 rounded-full transition-all ${isDragging ? 'bg-amber-400 h-10 shadow-lg shadow-amber-500' : 'bg-gray-700 group-hover:bg-amber-500 group-hover:h-8'}`}></div>
          </div>

         
          <div 
            style={{ width: `${100 - leftWidth}%` }}
            className="flex flex-col space-y-3 h-full overflow-hidden transition-none"
          >
            <div className={`flex-1 border rounded-xl overflow-hidden shadow-md flex flex-col ${bgCard} border-gray-800/40`}>
              <div className="px-3 py-2 flex items-center justify-between bg-black/20 border-b border-gray-800/40 text-[10px] font-black tracking-wider uppercase">
                <div className="flex items-center space-x-2">
                  <button 
                    type="button" 
                    onClick={() => setShowProblemsOverlay(true)} 
                    className="p-1 bg-amber-500 hover:bg-orange-500 text-black rounded shadow transition-all duration-200" 
                    title="Open Tasks Archive Grid"
                  >
                    <AlignJustify size={11} />
                  </button>
                  <Code size={12} className="text-amber-400" /> <span className="text-gray-300 font-extrabold">Sandbox Workspace Terminal</span>
                  
               
                  <button
                    type="button"
                    onClick={handleResetCode}
                    className="p-1 text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/30 rounded-md transition-all duration-300 flex items-center space-x-1 active:scale-95 group"
                    title="Reset Code to Template & Clear Cache"
                  >
                    <RefreshCw size={11} className="group-hover:rotate-180 transition-transform duration-500 text-red-400" />
                    <span className="text-[9px] font-bold">Reset</span>
                  </button>
                  
                  <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.2 border border-green-500/20 rounded animate-pulse">Autosave Active</span>
                </div>
                <select value={language} onChange={(e) => dispatch(setLanguage(e.target.value))} className="px-2 py-0.5 bg-[#1b1b22] border border-gray-800 rounded text-[10px] font-black text-white outline-none"><option value="cpp">C++ (GCC 11)</option></select>
              </div>
              <div className="flex-1 w-full pt-1">
                <Editor height="100%" language="cpp" theme={isDark ? 'vs-dark' : 'light'} value={code} onChange={(val) => dispatch(setCode(val))} options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true }} />
              </div>
            </div>

          
            <div className={`h-44 border rounded-xl overflow-hidden shadow-lg flex flex-col ${bgCard} border-gray-800/40`}>
              <div className="flex items-center justify-between px-2 bg-black/20 border-b border-gray-800/40">
                <div className="flex space-x-1 text-[10px] font-black">
                  <button type="button" onClick={() => setActiveTab('input')} className={`px-2 py-2.5 flex items-center space-x-1 border-b-2 transition-all ${activeTab === 'input' ? 'border-amber-500 text-amber-500' : 'border-transparent opacity-50'}`}><Terminal size={12} /><span>Custom Input</span></button>
                  <button type="button" onClick={() => setActiveTab('output')} className={`px-2 py-2.5 flex items-center space-x-1 border-b-2 transition-all ${activeTab === 'output' ? 'border-amber-500 text-amber-500' : 'border-transparent opacity-50'}`}><Layers size={12} /><span>Diagnostics Verdict</span></button>
                </div>
                <div className="flex items-center space-x-2 pr-1">
                  <button type="button" onClick={(e) => handleRun(e)} disabled={status !== 'Idle'} className="px-2.5 py-1 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/30 font-black rounded text-[11px] flex items-center space-x-1 disabled:opacity-40 transition-all">{status === 'Running' ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}<span>Run Code</span></button>
                  <button type="button" onClick={(e) => handleSubmitCode(e)} disabled={status !== 'Idle'} className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded text-[11px] flex items-center space-x-1 disabled:opacity-40 transition-all shadow-md"> {status === 'Submitting' ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle size={11} />}<span>Submit Production</span></button>
                </div>
              </div>
              
              <div className="flex-1 p-2 overflow-hidden text-[11px]">
                {activeTab === 'input' ? (
                  <textarea value={customInput} onChange={(e) => dispatch(setCustomInput(e.target.value))} className="w-full h-full p-2 bg-black/10 border border-gray-800/40 rounded-lg outline-none font-mono text-xs resize-none text-white focus:border-amber-500 transition-all" placeholder="Feed process stream vector array elements..." />
                ) : (
                  <div className={`w-full h-full p-2 font-mono rounded-lg overflow-auto ${bgTerminal}`}>
                    {status !== 'Idle' ? (
                      <div className="flex items-center space-x-2 text-amber-400 animate-pulse"><RefreshCw size={12} className="animate-spin" /><span className="font-bold uppercase tracking-wider text-[10px]">{status === 'Running' ? 'Executing Sandboxed Environment...' : 'Parsing Live Test Benchmarks...'}</span></div>
                    ) : result ? (
                      <div className="space-y-1 text-left">
                        
                        
                        {result?.time && (
                          <div className="flex items-center space-x-3 mb-1 text-[10px] bg-white/5 p-1 rounded border border-gray-800/50 w-fit text-gray-400">
                            <span className="flex items-center space-x-0.5 font-bold"><Zap size={10} className="text-yellow-400"/> <span>Speed: {result.time}</span></span>
                            <span className="flex items-center space-x-0.5 font-bold"><Cpu size={10} className="text-blue-400"/> <span>Memory: {result.memory || "3.2MB"}</span></span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1.5"><span className="text-gray-500 font-bold">VERDICT:</span><span className={`font-black uppercase tracking-wide px-1.5 py-0.2 rounded text-[9px] ${result.status === 'Accepted' || result.status === 'Success' ? 'bg-green-500 text-black animate-bounce' : 'bg-red-500 text-white'}`}>{result?.status || "Unknown"}</span></div>
                        {result?.message && <p className="text-green-400 font-black text-xs">{result.message}</p>}
                        {result?.output && <pre className="p-1.5 bg-black/30 rounded mt-1 text-white border border-gray-800/30">{result.output}</pre>}
                        {result?.error && <pre className="p-1.5 bg-red-950/20 text-red-300 rounded mt-1 border border-red-900/40 whitespace-pre-wrap">{result.error}</pre>}
                      </div>
                    ) : (
                      <span className="text-gray-600 italic">No telemetry logs found. Hit Run Code or Submit Production.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;