import React, { useState, useEffect, useRef } from 'react';
import { GuestUser } from '../types';

interface LoginScreenProps {
  onAdminLogin: () => void;
  onGuestLogin: (guest: GuestUser) => void;
}

// Constants from provided code
const DEFAULT_USER_ENC = "MTAxNzEwMjk="; // 10171029
const DEFAULT_MAIL_ENC = "cmFqa3VtYXIyMDA0MDZAZ21haWwuY29t"; // rajkumar200406@gmail.com
const DEFAULT_PASS_ENC = "UmFqQDIwMDQwNg=="; // Raj@200406

const SEC_ANS_1 = "SW5ub3phbnQ="; // Innozant
const SEC_ANS_2 = "QmVndXNhcmFp"; // Begusarai
// SEC_ANS_3 (DOB) Removed
const SEC_ANS_4 = "UmFqIFB1YmxpYyBTY2hvb2w="; // Raj Public School

const AppLogo = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'}}>
    <rect x="12" y="8" width="40" height="48" rx="8" fill="#1e3a8a" />
    <path d="M22 20H42" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <path d="M22 32H42" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <path d="M22 44H32" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="44" cy="44" r="6" fill="#0d9488" />
  </svg>
);

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAdminLogin, onGuestLogin }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'guest'>('login');
  const [uiMode, setUiMode] = useState<'login' | 'recovery'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Recovery State
  const [recStep, setRecStep] = useState(1);
  const [recEmail, setRecEmail] = useState('');
  const [recSecQ, setRecSecQ] = useState("1");
  const [recSecAns, setRecSecAns] = useState('');
  const [recCaptcha, setRecCaptcha] = useState('');
  const [recCaptchaInput, setRecCaptchaInput] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [newUser, setNewUser] = useState('');
  const [recError, setRecError] = useState('');
  const [fpRetryCount, setFpRetryCount] = useState(0);

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let cap = "";
    for(let i=0; i<6; i++) cap += chars[Math.floor(Math.random() * chars.length)];
    return cap;
  };

  useEffect(() => {
    if (recStep === 3) setRecCaptcha(generateCaptcha());
  }, [recStep]);

  const getAdminCreds = () => {
    const stored = localStorage.getItem('rajAdminConfig');
    if(stored) return JSON.parse(stored);
    return { user: DEFAULT_USER_ENC, pass: DEFAULT_PASS_ENC };
  };

  const handleLogin = () => {
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (activeTab === 'login') {
        const creds = getAdminCreds();
        const u = btoa(username);
        const m = btoa(username.toLowerCase());
        const p = btoa(password);

        if ((u === creds.user || m === DEFAULT_MAIL_ENC) && p === creds.pass) {
          onAdminLogin();
        } else {
          setError('Wrong Admin Credentials');
        }
      } else {
        const guests: GuestUser[] = JSON.parse(localStorage.getItem('rajResumeGuests') || '[]');
        const guest = guests.find(g => g.user === username && g.pass === password);
        
        if (!guest) {
           setError('Wrong Guest Credentials');
        } else {
           if (Date.now() > guest.expiry) {
              // Remove expired
              const activeGuests = guests.filter(g => g !== guest);
              localStorage.setItem('rajResumeGuests', JSON.stringify(activeGuests));
              setError('Guest Pass Expired');
           } else {
              onGuestLogin(guest);
           }
        }
      }
      setLoading(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  }

  // Recovery Logic
  const startRecovery = () => {
    if (localStorage.getItem('fpLockoutTime')) {
        const lockoutTime = parseInt(localStorage.getItem('fpLockoutTime')!);
        if (Date.now() < lockoutTime) {
            alert("Account locked due to too many failed attempts. Try again later.");
            return;
        } else {
            localStorage.removeItem('fpLockoutTime');
            setFpRetryCount(0);
        }
    }
    setUiMode('recovery');
    setRecStep(1);
    setRecError('');
    setRecEmail('');
  };

  const recVerifyEmail = () => {
      const encodedEmail = btoa(recEmail.trim().toLowerCase());
      if(encodedEmail === DEFAULT_MAIL_ENC) {
          setRecStep(2);
          setRecError("");
      } else {
          setRecError("Verification Failed");
      }
  };

  const recVerifySecurity = () => {
      if (fpRetryCount >= 3) {
          localStorage.setItem('fpLockoutTime', (Date.now() + 30000).toString()); 
          alert("Too many failed attempts. Locked for 30s.");
          setUiMode('login');
          return;
      }

      let correctAnsEnc = "";
      if (recSecQ === "1") correctAnsEnc = SEC_ANS_1;
      else if (recSecQ === "2") correctAnsEnc = SEC_ANS_2;
      else if (recSecQ === "4") correctAnsEnc = SEC_ANS_4;
      
      const correctAns = atob(correctAnsEnc);

      if (recSecAns.trim().toLowerCase() !== correctAns.toLowerCase()) {
          setFpRetryCount(prev => prev + 1);
          setRecError(`Incorrect Answer. Attempt ${fpRetryCount + 1}/3.`);
          return;
      }
      
      setRecStep(3);
      setRecError("");
      setFpRetryCount(0);
  };

  const recVerifyCaptcha = () => {
      if (recCaptchaInput.trim().toUpperCase() !== recCaptcha) {
          setFpRetryCount(prev => prev + 1);
          setRecError(`Incorrect Captcha!`);
          setRecCaptcha(generateCaptcha());
          setRecCaptchaInput('');
          return;
      }
      setRecStep(4);
      setRecError("");
      setFpRetryCount(0);
  };

  const recSaveNewPass = () => {
      const strongRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

      if (!newPass) { setRecError("Password cannot be empty."); return; }
      if (!strongRegex.test(newPass)) {
          setRecError("Password too weak! 8+ chars, letters, nums & symbols.");
          return;
      }
      if (newPass !== confirmPass) { setRecError("Passwords do not match."); return; }

      const currentCreds = getAdminCreds();
      if (btoa(newPass) === currentCreds.pass) {
          setRecError("New password cannot be same as old.");
          return;
      }

      const updatedCreds = {
          user: newUser ? btoa(newUser) : currentCreds.user,
          pass: btoa(newPass)
      };

      localStorage.setItem('rajAdminConfig', JSON.stringify(updatedCreds));
      setRecStep(5);
      setRecError("");
  };

  return (
    <div className="login-screen">
      <div className="login-wrapper">
          <div className="login-header">
              <div className="app-icon" style={{background: 'transparent', boxShadow: 'none'}}>
                  <AppLogo />
              </div>
              <h1 className="app-name">Raj Resume Builder</h1>
              <p className="app-tagline">Build professional resumes effortlessly</p>
          </div>

          <div className="login-card">
              <div className="login-tabs">
                  <button 
                    className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`} 
                    onClick={() => { setActiveTab('login'); setError(''); }}
                  >
                    <i className="fa-solid fa-user-shield"></i> Admin Login
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'guest' ? 'active' : ''}`} 
                    onClick={() => { setActiveTab('guest'); setError(''); }}
                  >
                    <i className="fa-solid fa-user-clock"></i> Guest Access
                  </button>
              </div>

              {/* LOGIN FORM */}
              {uiMode === 'login' && (
                  <div id="login-ui">
                      <div className="input-group">
                          <label>Username or Email</label>
                          <input 
                            type="text" 
                            className="login-input" 
                            placeholder="Enter Username" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onKeyDown={handleKeyPress}
                          />
                      </div>
                      
                      <div className="input-group">
                          <label>Password</label>
                          <input 
                            type="password" 
                            className="login-input" 
                            placeholder="Enter Password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={handleKeyPress}
                          />
                      </div>

                      <button className="btn-login" onClick={handleLogin} disabled={loading}>
                          {loading ? <div className="spinner"></div> : (activeTab === 'login' ? 'Admin Log In' : 'Guest Log In')}
                      </button>
                      
                      {activeTab === 'login' && (
                        <button className="btn-link" onClick={startRecovery}>Forgot Password?</button>
                      )}

                      {error && <div className="error-msg" style={{display:'block'}}>{error}</div>}
                  </div>
              )}

              {/* RECOVERY FORM */}
              {uiMode === 'recovery' && (
                  <div id="recovery-ui">
                      <div className="recovery-header">Reset Password</div>
                      
                      {recStep === 1 && (
                          <div>
                              <div className="step-indicator">Step 1: Verification</div>
                              <div className="input-group">
                                  <label>Registered Admin Email</label>
                                  <input 
                                    type="text" 
                                    className="login-input" 
                                    placeholder="Enter Email ID" 
                                    value={recEmail}
                                    onChange={e => setRecEmail(e.target.value)}
                                  />
                              </div>
                              <button className="btn-login" onClick={recVerifyEmail}>Verify Email</button>
                          </div>
                      )}

                      {recStep === 2 && (
                          <div>
                              <div className="step-indicator">Step 2: Security Check</div>
                              <div className="input-group">
                                  <label>Security Question</label>
                                  <select className="login-input" style={{padding:'10px', cursor:'pointer'}} value={recSecQ} onChange={e => setRecSecQ(e.target.value)}>
                                      <option value="1">Best Institute</option>
                                      <option value="2">Village Name</option>
                                      <option value="4">Primary School</option>
                                  </select>
                              </div>
                              <div className="input-group">
                                  <label>Your Answer</label>
                                  <input 
                                    type="text" 
                                    className="login-input" 
                                    placeholder="Type exact answer..." 
                                    value={recSecAns}
                                    onChange={e => setRecSecAns(e.target.value)}
                                  />
                              </div>
                              <button className="btn-login" onClick={recVerifySecurity}>Verify Answer</button>
                          </div>
                      )}

                      {recStep === 3 && (
                          <div>
                              <div className="step-indicator">Step 3: Human Check</div>
                              <div className="input-group">
                                  <label>Captcha</label>
                                  <div className="captcha-container">
                                      <div className="captcha-display" onClick={() => setRecCaptcha(generateCaptcha())} title="Click to refresh">
                                          {recCaptcha.split('').join(' ')}
                                      </div>
                                      <input 
                                        type="text" 
                                        className="login-input" 
                                        placeholder="Code" 
                                        style={{width: '100px', textAlign:'center', fontWeight:'bold'}}
                                        value={recCaptchaInput}
                                        onChange={e => setRecCaptchaInput(e.target.value)}
                                      />
                                  </div>
                              </div>
                              <button className="btn-login" onClick={recVerifyCaptcha}>Verify Captcha</button>
                          </div>
                      )}

                      {recStep === 4 && (
                          <div>
                              <div className="step-indicator">Step 4: Set Credentials</div>
                              <div className="input-group">
                                  <label>New Username (Optional)</label>
                                  <input type="text" className="login-input" placeholder="New Username" value={newUser} onChange={e => setNewUser(e.target.value)}/>
                              </div>
                              <div className="input-group">
                                  <label>New Password</label>
                                  <input type="password" className="login-input" placeholder="Strong Password (min 8 chars)" value={newPass} onChange={e => setNewPass(e.target.value)}/>
                              </div>
                               <div className="input-group">
                                  <label>Confirm Password</label>
                                  <input type="password" className="login-input" placeholder="Re-enter Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}/>
                              </div>
                              <button className="btn-login" onClick={recSaveNewPass}>Reset & Login</button>
                          </div>
                      )}

                      {recStep === 5 && (
                          <div style={{textAlign:'center'}}>
                              <div style={{fontSize:'40px', color:'#16a34a', marginBottom:'15px'}}><i className="fa-solid fa-circle-check"></i></div>
                              <h3 style={{color:'#16a34a', marginBottom:'10px'}}>Success!</h3>
                              <p style={{fontSize:'13px', color:'#666', marginBottom:'20px'}}>Your credentials have been updated.</p>
                              <button className="btn-login" onClick={() => setUiMode('login')}>Back to Login</button>
                          </div>
                      )}

                      {recStep < 5 && (
                        <button className="btn-link" onClick={() => setUiMode('login')} style={{marginTop:'15px'}}>Cancel</button>
                      )}
                      
                      {recError && <div className="error-msg" style={{display:'block'}}>{recError}</div>}
                  </div>
              )}
          </div>

          <div className="login-footer">
              &copy; 2025 Raj Resume Builder. All rights reserved.
          </div>
      </div>
    </div>
  );
};