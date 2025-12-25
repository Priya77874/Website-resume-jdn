import React, { useState, useEffect, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Editable } from './components/Editable';
import { rewriteContent, chatWithAi, generateCoverLetter, chatInterview } from './services/geminiService';
import { ResumeData, ThemeColors, GuestUser, GuestPermissions, CertLinks } from './types';

// Declare globals for CDN libs
declare global {
  interface Window {
    html2pdf: any;
    html2canvas: any;
    Cropper: any;
  }
}

// --- SECURITY CONSTANTS (DO NOT CHANGE) ---
const SEC_ANS_1 = "SW5ub3phbnQ="; // Innozant
const SEC_ANS_2 = "QmVndXNhcmFp"; // Begusarai
// SEC_ANS_3 (DOB) - REMOVED
const SEC_ANS_4 = "UmFqIFB1YmxpYyBTY2hvb2w="; // Raj Public School

// Admin Credentials Verification Constants (Matches LoginScreen - Salted Reverse Base64)
const DEFAULT_USER_ENC = "OTIwMTcxMDFfUkFKX1NFQ1VSRQ=="; // 10171029
const DEFAULT_PASS_ENC = "NjA0MDAyQGphUl9SQUpfU0VDVVJF"; // Raj@200406

const DEFAULT_PROFILE_URI = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect fill='%23f0f0f0' width='150' height='150'/%3E%3Ctext fill='%23999999' font-family='sans-serif' font-size='20' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EPhoto%3C/text%3E%3C/svg%3E";

// Security Helper: Reverse String + Salt + Base64
const secureEncode = (str: string): string => {
    return btoa(str.split('').reverse().join('') + "_RAJ_SECURE");
};

const INITIAL_THEME: ThemeColors = {
  sidebarBg: '#2c3e50',
  accentBlue: '#3498db',
  textColor: '#333333'
};

// Predefined Themes for Quick Selection
const PRESET_THEMES = [
  // Row 1
  { name: 'Navy Soft Blue', sidebarBg: '#1A2A4F', accentBlue: '#4F9DFB', textColor: '#333333' },
  { name: 'Charcoal Teal', sidebarBg: '#2B2B2B', accentBlue: '#18A999', textColor: '#333333' },
  { name: 'Hunter Gold', sidebarBg: '#0F3D3E', accentBlue: '#F2C14E', textColor: '#333333' },
  { name: 'Deep Violet', sidebarBg: '#36255D', accentBlue: '#3AD9FF', textColor: '#333333' },
  
  // Row 2
  { name: 'Slate Orange', sidebarBg: '#37474F', accentBlue: '#FF8A3D', textColor: '#333333' },
  { name: 'Midnight Mint', sidebarBg: '#0D1B2A', accentBlue: '#A3FFD6', textColor: '#333333' },
  { name: 'Burgundy Pink', sidebarBg: '#5A1A2B', accentBlue: '#FF8FAB', textColor: '#333333' },
  { name: 'Gunmetal Blue', sidebarBg: '#2A2D34', accentBlue: '#4DAFFF', textColor: '#333333' },
  
  // Row 3
  { name: 'Forest Beige', sidebarBg: '#1E3B32', accentBlue: '#E9D8A6', textColor: '#333333' },
  { name: 'Black Purple', sidebarBg: '#1E1E1E', accentBlue: '#A259FF', textColor: '#333333' },
  { name: 'Steel Green', sidebarBg: '#3A506B', accentBlue: '#A3D9A5', textColor: '#333333' },
  { name: 'Graphite Sky', sidebarBg: '#2F2F2F', accentBlue: '#7EC8E3', textColor: '#333333' },
  
  // Row 4
  { name: 'Olive Sand', sidebarBg: '#3B4A3F', accentBlue: '#DCCCA3', textColor: '#333333' },
  { name: 'Royal Silver', sidebarBg: '#2C3E91', accentBlue: '#C7CEDB', textColor: '#333333' },
  { name: 'Pine Peach', sidebarBg: '#1B3D2F', accentBlue: '#FFCBB7', textColor: '#333333' },
  { name: 'Coffee Cream', sidebarBg: '#4B3621', accentBlue: '#F5E9D7', textColor: '#333333' },
  
  // Row 5
  { name: 'Denim Mustard', sidebarBg: '#355C7D', accentBlue: '#E1AD01', textColor: '#333333' },
  { name: 'Carbon Aqua', sidebarBg: '#1C1C1C', accentBlue: '#1ABCDF', textColor: '#333333' },
  { name: 'Emerald Gold', sidebarBg: '#0E5E3B', accentBlue: '#FFD88A', textColor: '#333333' },
  { name: 'Taupe Seafoam', sidebarBg: '#6E6E6E', accentBlue: '#A8E6CF', textColor: '#333333' },
  
  // Row 6
  { name: 'Plum Lavender', sidebarBg: '#532E5B', accentBlue: '#C8A2C8', textColor: '#333333' },
  { name: 'Ocean Blue', sidebarBg: '#006064', accentBlue: '#4DD0E1', textColor: '#333333' },
  { name: 'Sienna Cream', sidebarBg: '#A23D2A', accentBlue: '#F6E9D7', textColor: '#333333' },
  { name: 'Copper Ice', sidebarBg: '#6A3E2E', accentBlue: '#D5EFFA', textColor: '#333333' },
  
  // Row 7
  { name: 'Arctic Dark', sidebarBg: '#273036', accentBlue: '#AEE1F9', textColor: '#333333' },
  { name: 'Ash Lilac', sidebarBg: '#555555', accentBlue: '#B9A0FF', textColor: '#333333' },
  { name: 'Rustic Tan', sidebarBg: '#8B2F2F', accentBlue: '#EED9C4', textColor: '#333333' },
  { name: 'Navy Coral', sidebarBg: '#184E51', accentBlue: '#FF796D', textColor: '#333333' },
  
  // Row 8
  { name: 'Midnight Cyan', sidebarBg: '#2B1E47', accentBlue: '#46C9FF', textColor: '#333333' },
  { name: 'Slate Yellow', sidebarBg: '#445E93', accentBlue: '#FFEFA1', textColor: '#333333' },

  // Row 9 (New)
  { name: 'Noir Red', sidebarBg: '#1a1a1a', accentBlue: '#e63946', textColor: '#333333' },
  { name: 'Slate Teal', sidebarBg: '#343a40', accentBlue: '#20c997', textColor: '#333333' },
  { name: 'Forest Lime', sidebarBg: '#14532d', accentBlue: '#84cc16', textColor: '#333333' },
  { name: 'Purple Amber', sidebarBg: '#581c87', accentBlue: '#fbbf24', textColor: '#333333' },
  
  // Row 10 (New)
  { name: 'Cobalt Cyan', sidebarBg: '#1e3a8a', accentBlue: '#06b6d4', textColor: '#333333' },
  { name: 'Mocha Rose', sidebarBg: '#4a3b32', accentBlue: '#fda4af', textColor: '#333333' },
  { name: 'Granite Orange', sidebarBg: '#262626', accentBlue: '#f97316', textColor: '#333333' },
  { name: 'Deep Emerald', sidebarBg: '#064e3b', accentBlue: '#34d399', textColor: '#333333' }
];

const INITIAL_DATA: ResumeData = {
  name: "Raj Kumar",
  role: "Data Expert | Insights & Reporting Professional",
  phone: "8178365708",
  email: "rajkumar200406@outlook.com",
  address: "H. No. 416/152, Madanpur Khadar, Sarita Vihar, New Delhi – 110076",
  fatherName: "Nawal Rai",
  dob: "06 June 2004",
  gender: "Male",
  nationality: "Indian",
  maritalStatus: "Single",
  languages: ["English", "Hindi"],
  hobbies: ["Craft", "Cycling"],
  socials: [
    { id: 'linkedin', name: 'LinkedIn', icon: 'fa-brands fa-linkedin', url: 'https://linkedin.com/in/rajkumar', enabled: false },
    { id: 'github', name: 'GitHub', icon: 'fa-brands fa-github', url: 'https://github.com/rajkumar', enabled: false },
    { id: 'indeed', name: 'Indeed', icon: 'fa-solid fa-briefcase', url: 'https://indeed.com/rajkumar', enabled: false },
    { id: 'portfolio', name: 'Portfolio', icon: 'fa-solid fa-globe', url: 'https://rajkumar.com', enabled: false }
  ],
  objective: "Motivated and detail-oriented professional seeking opportunities where I can utilize my technical skills, analytical abilities and operational experience.",
  education: [
    { id: 'ma', qualification: 'M.A. Political Science', board: 'IGNOU', year: '2026', score: '--', isHidden: true },
    { id: 'ba', qualification: 'B.A. Political Science (Hons.)', board: 'IGNOU', year: 'Pursuing', score: '--' },
    { id: '12', qualification: '12th Grade', board: 'CBSE, R.K. Govt. Boys Sr. Sec. School', year: '2023', score: '82%' },
    { id: '10', qualification: '10th Grade', board: 'CBSE, R.K. Govt. Boys Sr. Sec. School', year: '2021', score: '87%' },
  ],
  experience: [
    { id: '1', title: 'Content Operations Executive', company: 'Justdial Limited' }
  ],
  techSkills: ["Advanced Excel, SQL, and Power BI", "Expert in MS Word, PowerPoint, and documentation", "Professional typing speed of 40–45 WPM"],
  softSkills: ["Strong verbal and written communication", "Effective convincing and negotiation skills", "Excellent problem-solving abilities"],
  declaration: "I hereby declare that the information provided above is true to the best of my knowledge and belief.",
  date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
  place: "New Delhi",
  signatureName: "Raj Kumar",
  profileImage: DEFAULT_PROFILE_URI,
  signatureImage: null,
  theme: INITIAL_THEME
};

const App: React.FC = () => {
  const [authMode, setAuthMode] = useState<'none' | 'admin' | 'guest'>('none');
  const [data, setData] = useState<ResumeData>(INITIAL_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState("");
  const [blackout, setBlackout] = useState(false);
  
  // History for Undo/Redo
  const [history, setHistory] = useState<ResumeData[]>([INITIAL_DATA]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isTimeTraveling = useRef(false);

  // Dynamic Cert IPs & Security Tokens
  const [secureIP, setSecureIP] = useState("");
  const [secureToken, setSecureToken] = useState("");
  const [certLinks, setCertLinks] = useState<CertLinks>({});

  // Modals State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Resume Form Tab State
  const [formTab, setFormTab] = useState('personal');
  const [revertData, setRevertData] = useState<ResumeData | null>(null);
  
  // AI State
  const [aiMode, setAiMode] = useState<'improver' | 'assistant'>('improver');
  const [aiSection, setAiSection] = useState<'dashboard' | 'improver' | 'chat' | 'cover-letter' | 'interview'>('dashboard');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTarget, setAiTarget] = useState<keyof ResumeData>('objective');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string, image?: string}[]>([]);
  const [interviewHistory, setInterviewHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatImage, setChatImage] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const interviewScrollRef = useRef<HTMLDivElement>(null);
  const aiImageInputRef = useRef<HTMLInputElement>(null);

  // New Tool States
  const [clJobTitle, setClJobTitle] = useState('');
  const [clCompany, setClCompany] = useState('');
  const [clDesc, setClDesc] = useState('');
  const [interviewRole, setInterviewRole] = useState('');

  // Details Modal State
  const [dmTab, setDmTab] = useState('work');
  const [localDetails, setLocalDetails] = useState<any[]>([]); 
  const [rowsToAdd, setRowsToAdd] = useState(5);

  // Contact Modal State
  const [contactModal, setContactModal] = useState<{title: string, actions: {label: string, icon: string, fn: () => void}[]} | null>(null);

  // Guest Manager State
  const [guestList, setGuestList] = useState<GuestUser[]>([]);
  const [newGuestUser, setNewGuestUser] = useState("");
  const [newGuestPass, setNewGuestPass] = useState("");
  const [newGuestTime, setNewGuestTime] = useState(15);
  const [guestPerms, setGuestPerms] = useState<GuestPermissions>({
    pdf: true, jpg: true, social: true, ma: true, edit: true, img: true, toggle: true
  });

  // Admin Security Modal State
  const [adminSecStep, setAdminSecStep] = useState('verify');
  const [secQ, setSecQ] = useState("1");
  const [secAns, setSecAns] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaVal, setCaptchaVal] = useState("");
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newApiKey, setNewApiKey] = useState("");

  // Certificate Manager State
  const [certAuthStep, setCertAuthStep] = useState('login');
  const [certAuthUser, setCertAuthUser] = useState("");
  const [certAuthPass, setCertAuthPass] = useState("");
  const [certCaptcha, setCertCaptcha] = useState("");
  const [certCaptchaVal, setCertCaptchaVal] = useState("");

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const certUploadRef = useRef<HTMLInputElement>(null); // For Cert Upload
  const [activeCertKey, setActiveCertKey] = useState<keyof CertLinks | null>(null);

  const cropperRef = useRef<any>(null);
  const [croppingImg, setCroppingImg] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'profile' | 'signature'>('profile');
  
  // Image Enhancement State
  const [enhanceLevel, setEnhanceLevel] = useState<1 | 2 | 4>(1);

  // VIEWPORT CONTROL: FORCE DESKTOP MODE ON MOBILE
  useEffect(() => {
    const enforceDesktopMode = () => {
        let metaViewport = document.querySelector('meta[name="viewport"]');
        const content = 'width=1280, initial-scale=0.1, user-scalable=yes';
        if (metaViewport) metaViewport.setAttribute('content', content);
        else {
            const meta = document.createElement('meta');
            meta.name = 'viewport'; meta.content = content;
            document.head.appendChild(meta);
        }
        document.body.style.minWidth = '1280px';
    };
    enforceDesktopMode();
    window.addEventListener('resize', enforceDesktopMode);
    return () => window.removeEventListener('resize', enforceDesktopMode);
  }, []);

  // COPY/CUT BLOCKING
  useEffect(() => {
      const preventCopyCut = (e: ClipboardEvent) => { e.preventDefault(); e.stopPropagation(); return false; };
      window.addEventListener('copy', preventCopyCut, { capture: true });
      window.addEventListener('cut', preventCopyCut, { capture: true });
      window.addEventListener('dragstart', (e) => e.preventDefault(), { capture: true });
      return () => {
          window.removeEventListener('copy', preventCopyCut, { capture: true });
          window.removeEventListener('cut', preventCopyCut, { capture: true });
          window.removeEventListener('dragstart', (e) => e.preventDefault(), { capture: true });
      };
  }, []);

  // Load Data
  useEffect(() => {
    const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const saved = localStorage.getItem('rajResumeData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const updatedData = { ...INITIAL_DATA, ...parsed, date: currentDate };
        setData(updatedData);
        setHistory([ updatedData ]); 
      } catch (e) { console.error("Load error", e); }
    } else {
        setData(prev => ({...prev, date: currentDate}));
    }
    const savedCerts = localStorage.getItem('rajCertificates');
    if(savedCerts) { try { setCertLinks(JSON.parse(atob(savedCerts))); } catch(e) {} }
    const savedColors = localStorage.getItem('rajResumeColors');
    if(savedColors) {
        const c = JSON.parse(savedColors);
        updateThemeCSS(c.sidebar, c.accent, c.text);
        setData(prev => ({...prev, theme: {sidebarBg: c.sidebar, accentBlue: c.accent, textColor: c.text}}));
    }
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const json = await response.json();
          const city = json.address.city || json.address.town || json.address.village || json.address.state_district;
          if (city) setData(prev => ({...prev, place: city}));
        } catch (e) {}
      });
    }
    const handleResize = () => fitToScreen();
    window.addEventListener('resize', handleResize);
    setTimeout(fitToScreen, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save Data & Manage History
  useEffect(() => {
    localStorage.setItem('rajResumeData', JSON.stringify(data));
    if(isTimeTraveling.current) { isTimeTraveling.current = false; return; }
    const handler = setTimeout(() => {
        setHistory(prev => {
            const upToCurrent = prev.slice(0, historyIndex + 1);
            const currentHead = upToCurrent[upToCurrent.length - 1];
            if (JSON.stringify(currentHead) !== JSON.stringify(data)) return [...upToCurrent, data];
            return prev;
        });
    }, 800);
    return () => clearTimeout(handler);
  }, [data]);

  useEffect(() => { setHistoryIndex(history.length - 1); }, [history.length]);

  // Security, Timer & Dynamic Link Rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && ['3','4','5'].includes(e.key)) || (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's')) {
         setBlackout(true); setTimeout(() => setBlackout(false), 2000); e.preventDefault(); return false;
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) || (e.ctrlKey && ['u','s','p','U'].includes(e.key))) {
        e.preventDefault(); e.stopPropagation(); return false;
      }
    };
    const handleTouchStart = (e: TouchEvent) => { if (e.touches.length > 1 || e.touches.length === 3) { e.preventDefault(); if(e.touches.length === 3) { setBlackout(true); setTimeout(() => setBlackout(false), 1500); } } };
    document.addEventListener('keydown', handleKeyDown); document.addEventListener('keyup', handleKeyDown);
    document.addEventListener('contextmenu', e => e.preventDefault()); document.addEventListener('touchstart', handleTouchStart, {passive: false});

    let timer: any;
    if (authMode === 'guest' && guestUser) {
        timer = setInterval(() => {
            const diff = guestUser.expiry - Date.now();
            if (diff <= 0) { logout(); return; }
            const m = Math.floor(diff / 60000); const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${m}:${s < 10 ? '0'+s : s}`);
        }, 1000);
    }
    const rotater = setInterval(() => {
         setSecureIP(`${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`);
         const randomBytes = new Uint8Array(16); window.crypto.getRandomValues(randomBytes);
         setSecureToken(Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join(''));
    }, 5000);
    return () => {
      document.removeEventListener('keydown', handleKeyDown); document.removeEventListener('keyup', handleKeyDown);
      document.removeEventListener('contextmenu', e => e.preventDefault()); document.removeEventListener('touchstart', handleTouchStart);
      if (timer) clearInterval(timer); clearInterval(rotater);
    }
  }, [authMode, guestUser]);

  // Inactivity Timeout
  useEffect(() => {
      if (authMode === 'none') return;
      let inactivityTimer: ReturnType<typeof setTimeout>;
      const resetInactivity = () => {
          clearTimeout(inactivityTimer);
          inactivityTimer = setTimeout(() => { alert("Session expired due to inactivity for security."); logout(); }, 10 * 60 * 1000); 
      };
      window.addEventListener('mousemove', resetInactivity); window.addEventListener('keydown', resetInactivity); window.addEventListener('click', resetInactivity);
      resetInactivity();
      return () => { window.removeEventListener('mousemove', resetInactivity); window.removeEventListener('keydown', resetInactivity); window.removeEventListener('click', resetInactivity); clearTimeout(inactivityTimer); };
  }, [authMode]);

  // Scroll Chat to bottom
  useEffect(() => { if(chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight; }, [chatHistory, aiSection]);
  useEffect(() => { if(interviewScrollRef.current) interviewScrollRef.current.scrollTop = interviewScrollRef.current.scrollHeight; }, [interviewHistory, aiSection]);

  const updateThemeCSS = (sidebar: string, accent: string, text: string) => {
      document.documentElement.style.setProperty('--sidebar-bg', sidebar);
      document.documentElement.style.setProperty('--accent-blue', accent);
      document.documentElement.style.setProperty('--text-color', text);
  };

  const fitToScreen = () => {
       const container = document.getElementById('resume-container'); const viewport = document.getElementById('viewport');
       if (container && viewport) {
          const width = viewport.offsetWidth; const availableWidth = width - (width < 600 ? 0 : 40);
          setZoomLevel(Math.min(1, availableWidth / 794));
       }
  };

  const logout = () => {
    setAuthMode('none'); setGuestUser(null); setIsEditing(false); setToolbarOpen(false); document.body.classList.remove('guest-mode');
  };

  const sanitize = (val: string) => { return val.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "").replace(/<[^>]+>/g, ""); };
  const canEdit = authMode === 'admin' || (authMode === 'guest' && guestUser?.permissions.edit);
  const generateCaptcha = () => { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let cap = ""; for(let i=0; i<6; i++) cap += chars[Math.floor(Math.random() * chars.length)]; return cap; };

  const performUndo = () => { if (historyIndex > 0) { isTimeTraveling.current = true; const prevIndex = historyIndex - 1; setHistoryIndex(prevIndex); setData(history[prevIndex]); } };
  const performRedo = () => { if (historyIndex < history.length - 1) { isTimeTraveling.current = true; const nextIndex = historyIndex + 1; setHistoryIndex(nextIndex); setData(history[nextIndex]); } };

  // --- Handlers ---
  const downloadPDF = () => {
    const element = document.getElementById('resume-content'); if (!element || !window.html2pdf) return;
    const originalTransform = element.style.transform; const originalMargin = element.style.margin;
    element.style.transform = 'scale(1)'; element.style.margin = '0';
    const sigPlaceholder = document.getElementById('sig-placeholder'); if(sigPlaceholder) sigPlaceholder.style.display = 'none';
    const watermark = document.querySelector('.security-watermark') as HTMLElement; let originalWatermarkDisplay = ''; if(watermark) { originalWatermarkDisplay = watermark.style.display; watermark.style.display = 'none'; }
    const opt = { margin: 0, filename: 'Raj_Resume.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }, enableLinks: true };
    window.html2pdf().set(opt).from(element).save().then(() => {
        element.style.transform = originalTransform; element.style.margin = originalMargin;
        if(sigPlaceholder) sigPlaceholder.style.display = 'flex'; if(watermark) watermark.style.display = originalWatermarkDisplay;
    });
  };

  const downloadJPG = () => {
      const element = document.getElementById('resume-content'); if(!element || !window.html2canvas) return;
      const originalTransform = element.style.transform; const originalMargin = element.style.margin;
      element.style.transform = 'scale(1)'; element.style.margin = '0';
      const sigPlaceholder = document.getElementById('sig-placeholder'); if(sigPlaceholder) sigPlaceholder.style.display = 'none';
      const watermark = document.querySelector('.security-watermark') as HTMLElement; let originalWatermarkDisplay = ''; if(watermark) { originalWatermarkDisplay = watermark.style.display; watermark.style.display = 'none'; }
      window.html2canvas(element, {scale: 2, useCORS: true}).then(canvas => {
          const link = document.createElement('a'); link.download = 'Raj_Resume.jpg'; link.href = canvas.toDataURL('image/jpeg', 0.9); link.click();
          element.style.transform = originalTransform; element.style.margin = originalMargin;
          if(sigPlaceholder) sigPlaceholder.style.display = 'flex'; if(watermark) watermark.style.display = originalWatermarkDisplay;
      });
  };

  const handleAiImprove = async () => {
    setAiLoading(true);
    try {
      let content = '';
      if (typeof data[aiTarget] === 'string') content = data[aiTarget] as string;
      else if (Array.isArray(data[aiTarget])) content = (data[aiTarget] as string[]).join(', ');
      const improved = await rewriteContent(content, aiPrompt);
      setAiResult(improved);
    } catch (e) { alert(e instanceof Error ? e.message : "AI Error"); } finally { setAiLoading(false); }
  };

  const handleAiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              const result = ev.target?.result as string;
              if (file.type === 'application/pdf') { setChatImage(result); } else {
                  const img = new Image();
                  img.onload = () => {
                      const canvas = document.createElement('canvas');
                      let width = img.width; let height = img.height; const maxDim = 800;
                      if (width > height) { if (width > maxDim) { height *= maxDim / width; width = maxDim; } } else { if (height > maxDim) { width *= maxDim / height; height = maxDim; } }
                      canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d');
                      if (ctx) { ctx.drawImage(img, 0, 0, width, height); const dataUrl = canvas.toDataURL('image/jpeg', 0.8); setChatImage(dataUrl); } else { setChatImage(result); }
                  };
                  img.src = result;
              }
          };
          reader.readAsDataURL(file); e.target.value = '';
      }
  };

  const handleAiChat = async () => {
      if(!chatInput.trim() && !chatImage) return;
      const userMsg = chatInput; const imgToSend = chatImage;
      setChatHistory(prev => [...prev, {role: 'user', text: userMsg, image: imgToSend || undefined}]);
      setChatInput(''); setChatImage(null); setAiLoading(true);
      try {
          const res = await chatWithAi(userMsg, imgToSend || undefined, data);
          setChatHistory(prev => [...prev, {role: 'ai', text: res}]);
      } catch(e) { setChatHistory(prev => [...prev, {role: 'ai', text: "Error: Unable to get response."}]); } finally { setAiLoading(false); }
  };

  const handleInterviewChat = async () => {
      if(!chatInput.trim()) return;
      const userMsg = chatInput;
      setInterviewHistory(prev => [...prev, {role: 'user', text: userMsg}]);
      setChatInput(''); setAiLoading(true);
      try {
          // Pass the simple history array to the backend
          const res = await chatInterview(userMsg, interviewHistory, data);
          setInterviewHistory(prev => [...prev, {role: 'ai', text: res}]);
      } catch(e) { setInterviewHistory(prev => [...prev, {role: 'ai', text: "Error: Unable to get response."}]); } finally { setAiLoading(false); }
  };

  const handleCoverLetterGen = async () => {
      if(!clJobTitle || !clCompany) { alert("Please fill Job Title and Company"); return; }
      setAiLoading(true);
      try {
          const res = await generateCoverLetter({title: clJobTitle, company: clCompany, description: clDesc}, data);
          setAiResult(res);
      } catch(e) { alert("Error generating cover letter."); } finally { setAiLoading(false); }
  };

  const startInterview = async () => {
      if(!interviewRole) { alert("Enter a target role."); return; }
      setInterviewHistory([]);
      setAiLoading(true);
      // Trigger first question
      const initMsg = `I want to interview for the position of ${interviewRole}. Start the interview.`;
      try {
          const res = await chatInterview(initMsg, [], data);
          setInterviewHistory([{role: 'ai', text: res}]);
      } catch(e) { alert("Could not start interview."); } finally { setAiLoading(false); }
  };

  const applyAiResult = () => {
      if (Array.isArray(data[aiTarget])) {
         const list = aiResult.split(/<br>|\n/).map(s => s.replace(/<[^>]*>/g, '').trim()).filter(s => s);
         setData(prev => ({ ...prev, [aiTarget]: list }));
      } else { setData(prev => ({ ...prev, [aiTarget]: aiResult })); }
      setActiveModal(null); setAiResult('');
  };

  // ... (Contact, Details, Cert, Auth, Image Logic - No changes needed) ...
  const handlePhoneClick = () => { if (isEditing) return; const clean = data.phone.replace(/\D/g, ''); setContactModal({ title: "Phone Options", actions: [ { label: "Call", icon: "fa-solid fa-phone", fn: () => window.location.href = `tel:${clean}` }, { label: "WhatsApp", icon: "fa-brands fa-whatsapp", fn: () => window.open(`https://wa.me/91${clean}`, '_blank') }, { label: "Copy Number", icon: "fa-solid fa-copy", fn: () => { navigator.clipboard.writeText(data.phone); setContactModal(null); } } ] }); };
  const handleEmailClick = () => { if (isEditing) return; setContactModal({ title: "Email Options", actions: [ { label: "Mail App", icon: "fa-solid fa-envelope", fn: () => window.location.href = `mailto:${data.email}` }, { label: "Gmail", icon: "fa-brands fa-google", fn: () => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${data.email}`, '_blank') }, { label: "Outlook", icon: "fa-brands fa-microsoft", fn: () => window.open(`https://outlook.live.com/mail/0/deeplink/compose?to=${data.email}`, '_blank') }, { label: "Copy Email", icon: "fa-solid fa-copy", fn: () => { navigator.clipboard.writeText(data.email); setContactModal(null); } } ] }); };
  const handleAddressClick = () => { if (isEditing) return; const encoded = encodeURIComponent(data.address); setContactModal({ title: "Location Options", actions: [ { label: "Open in Maps", icon: "fa-solid fa-map-location-dot", fn: () => window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank') }, { label: "Copy Address", icon: "fa-solid fa-copy", fn: () => { navigator.clipboard.writeText(data.address); setContactModal(null); } } ] }); };
  const openDetailsModal = () => { setDmTab('work'); setLocalDetails([...data.experience]); setActiveModal('details'); };
  const switchDmTab = (tab: string) => { setDmTab(tab); if(tab === 'work') setLocalDetails([...data.experience]); else if(tab === 'tech') setLocalDetails([...data.techSkills]); else if(tab === 'soft') setLocalDetails([...data.softSkills]); else if(tab === 'lang') setLocalDetails([...data.languages]); else if(tab === 'hobby') setLocalDetails([...data.hobbies]); };
  const addDmRows = () => { const newItems = []; for(let i=0; i<rowsToAdd; i++) { if(dmTab === 'work') newItems.push({id: Date.now()+i, title:'', company:''}); else newItems.push(''); } setLocalDetails([...localDetails, ...newItems]); };
  const saveDetails = () => { const filtered = dmTab === 'work' ? localDetails.filter((i:any) => i.title || i.company) : localDetails.filter((i:any) => i && i.trim() !== ''); if(dmTab === 'work') setData({...data, experience: filtered}); else if(dmTab === 'tech') setData({...data, techSkills: filtered}); else if(dmTab === 'soft') setData({...data, softSkills: filtered}); else if(dmTab === 'lang') setData({...data, languages: filtered}); else if(dmTab === 'hobby') setData({...data, hobbies: filtered}); setActiveModal(null); };
  const handleCertClick = (key: keyof CertLinks) => { if(isEditing) return; const base = certLinks[key]; if(base) { if(base.startsWith('data:')) { try { const arr = base.split(','); const match = arr[0].match(/:(.*?);/); if (!match) return; const mime = match[1]; const bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n); while(n--){ u8arr[n] = bstr.charCodeAt(n); } const blob = new Blob([u8arr], {type:mime}); const blobUrl = URL.createObjectURL(blob); const w = window.open(blobUrl, '_blank'); setTimeout(() => URL.revokeObjectURL(blobUrl), 60000); } catch(e) { alert("Certificate file corrupted."); } return; } const separator = base?.includes('?') ? '&' : '?'; const dynamicUrl = `${base}${separator}_token=${secureToken}&_ts=${Date.now()}&_node=${secureIP}&_security=high`; const w = window.open(dynamicUrl, '_blank'); if(w) w.opener = null; } };
  const verifyCertAuth = () => { if(certCaptcha.trim().toUpperCase() !== certCaptchaVal) { alert("Incorrect Captcha"); setCertCaptchaVal(generateCaptcha()); return; } const stored = localStorage.getItem('rajAdminConfig'); const creds = stored ? JSON.parse(stored) : { user: DEFAULT_USER_ENC, pass: DEFAULT_PASS_ENC }; const u = secureEncode(certAuthUser); const p = secureEncode(certAuthPass); if (u === creds.user && p === creds.pass) { setCertAuthStep('manage'); } else { alert("Invalid Credentials"); setCertCaptchaVal(generateCaptcha()); } };
  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if(e.target.files && e.target.files[0] && activeCertKey) { const file = e.target.files[0]; if(file.size > 2 * 1024 * 1024) { if(!confirm("File is large (>2MB). Saving might fail or slow down browser. Continue?")) return; } const reader = new FileReader(); reader.onload = (ev) => { const res = ev.target?.result as string; setCertLinks(prev => ({...prev, [activeCertKey]: res})); }; reader.readAsDataURL(file); } };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'signature') => { if(e.target.files && e.target.files[0]) { const reader = new FileReader(); reader.onload = (ev) => { setCroppingImg(ev.target?.result as string); setCropType(type); setEnhanceLevel(1); setActiveModal('crop'); }; reader.readAsDataURL(e.target.files[0]); } };
  useEffect(() => { if(activeModal === 'crop' && croppingImg && window.Cropper) { const img = document.getElementById('image-to-crop') as HTMLImageElement; if(cropperRef.current) cropperRef.current.destroy(); cropperRef.current = new window.Cropper(img, {aspectRatio: cropType === 'profile' ? 1 : NaN, viewMode: 1}); } }, [activeModal, croppingImg]);
  const performCrop = () => { if(cropperRef.current) { const baseWidth = cropType === 'profile' ? 300 : 450; const targetWidth = baseWidth * enhanceLevel; const canvas = cropperRef.current.getCroppedCanvas({ width: targetWidth, fillColor: 'transparent', imageSmoothingEnabled: true, imageSmoothingQuality: 'high', }); if (!canvas) { alert("Image processing failed. Please try again."); return; } if (cropType === 'signature') { const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (ctx) { const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height); const data = imgData.data; const contrast = 1.5; const intercept = 128 * (1 - contrast); let opaqueCount = 0; for (let i = 0; i < data.length; i += 4) { if (data[i + 3] === 0) continue; let r = data[i]; let g = data[i + 1]; let b = data[i + 2]; const brightness = (r * 299 + g * 587 + b * 114) / 1000; if (brightness > 160) { data[i + 3] = 0; } else { r = r * contrast + intercept; g = g * contrast + intercept; b = b * contrast + intercept; data[i] = Math.min(255, Math.max(0, r)); data[i + 1] = Math.min(255, Math.max(0, g)); data[i + 2] = Math.min(255, Math.max(0, b)); data[i + 3] = 255; opaqueCount++; } } if (opaqueCount < 50) { alert("Signature appears empty. Please ensure the signature is dark on a light background."); return; } ctx.putImageData(imgData, 0, 0); } } const url = canvas.toDataURL('image/png'); if(cropType === 'profile') setData({...data, profileImage: url}); else setData({...data, signatureImage: url}); setActiveModal(null); } };
  const verifyAdminSecurity = () => { if(captchaInput.trim().toUpperCase() !== captchaVal) { alert("Incorrect Captcha"); setCaptchaVal(generateCaptcha()); return; } let correctAnsEnc = ""; if (secQ === "1") correctAnsEnc = SEC_ANS_1; else if (secQ === "2") correctAnsEnc = SEC_ANS_2; else if (secQ === "4") correctAnsEnc = SEC_ANS_4; const correctAns = atob(correctAnsEnc); if(secAns.trim().toLowerCase() !== correctAns.toLowerCase()) { alert("Incorrect Answer"); setCaptchaVal(generateCaptcha()); return; } setAdminSecStep('update'); const storedKey = localStorage.getItem('rajAiApiKey') || ""; setNewApiKey(storedKey); };
  const saveAdminCreds = () => { if(!newAdminUser && !newAdminPass && !newApiKey) return; if(newAdminUser && newAdminPass) { const creds = { user: secureEncode(newAdminUser), pass: secureEncode(newAdminPass) }; localStorage.setItem('rajAdminConfig', JSON.stringify(creds)); alert("Credentials Updated. Please Re-login."); logout(); } if(newApiKey) { localStorage.setItem('rajAiApiKey', newApiKey); alert("API Key Updated Successfully"); } setActiveModal(null); };
  
  // Navigation State & Helpers
  const formTabs = ['personal', 'education', 'experience', 'skills', 'misc'];
  const currentTabIdx = formTabs.indexOf(formTab);

  const handleNextTab = () => { if (currentTabIdx < formTabs.length - 1) setFormTab(formTabs[currentTabIdx + 1]); };
  const handlePrevTab = () => { if (currentTabIdx > 0) setFormTab(formTabs[currentTabIdx - 1]); };
  const isSectionComplete = (section: string) => { if(section === 'personal') return !!(data.name && data.phone && data.email); if(section === 'education') return !!(data.education[2].qualification && data.education[2].score); if(section === 'experience') return data.experience.length > 0 && !!data.experience[0].title; if(section === 'skills') return data.techSkills.length > 0; if(section === 'misc') return !!data.declaration; return false; };
  const renderInput = (label: string, value: string, onChange: (val: string) => void, placeholder = "", width = "100%") => ( <div className="modern-input-group" style={{width: width}}> <label className="modern-label"> <span>{label}</span> {value ? <i className="fa-solid fa-check-circle" style={{color:'#10b981', fontSize:'12px'}}></i> : <span style={{color:'#ef4444'}}>*</span>} </label> <input type="text" className="modern-input" placeholder={placeholder || `Enter ${label}`} value={value} onChange={e => onChange(sanitize(e.target.value))} /> </div> );
  const calculateFormProgress = () => { let filled = 0; let total = 0; const pKeys: (keyof ResumeData)[] = ['name', 'role', 'phone', 'email', 'address', 'fatherName', 'dob', 'gender', 'nationality', 'maritalStatus']; total += pKeys.length; pKeys.forEach(k => { if(data[k]) filled++; }); total += 16; data.education.forEach(e => { if(e.qualification) filled++; if(e.board) filled++; if(e.year) filled++; if(e.score) filled++; }); total += 2; if(data.experience.length > 0 && data.experience[0].title) filled++; if(data.experience.length > 0 && data.experience[0].company) filled++; total += 4; if(data.techSkills.length > 0 && data.techSkills[0]) filled++; if(data.softSkills.length > 0 && data.softSkills[0]) filled++; if(data.languages.length > 0 && data.languages[0]) filled++; if(data.hobbies.length > 0 && data.hobbies[0]) filled++; return Math.min(100, Math.round((filled / total) * 100)); };

  if (authMode === 'none') {
    return <LoginScreen onAdminLogin={() => { setAuthMode('admin'); setToolbarOpen(true); document.body.classList.remove('guest-mode'); }} onGuestLogin={(g) => { setGuestUser(g); setAuthMode('guest'); setToolbarOpen(true); document.body.classList.add('guest-mode'); if(g.permissions.toggle) document.body.classList.add('allow-toggle'); if(!g.permissions.edit) document.body.classList.add('guest-no-edit'); if(!g.permissions.img) document.body.classList.add('guest-no-img-edit'); }} />;
  }

  return (
    <div id="protected-content" onCopy={(e) => { e.preventDefault(); return false; }} onCut={(e) => { e.preventDefault(); return false; }}>
      {/* Styles for Chat Content & Privacy Blackout & Modern Form */}
      <style>{`
          .ai-message-content { line-height: 1.6; font-size: 14px; color: #374151; }
          .ai-message-content ul { padding-left: 20px; list-style-type: none; margin: 8px 0; }
          .ai-message-content li { margin-bottom: 6px; position: relative; padding-left: 15px; }
          .ai-message-content li::before { content: '•'; color: #3b82f6; position: absolute; left: 0; font-weight: bold; }
          .ai-message-content p { margin-bottom: 8px; }
          .ai-message-content b, .ai-message-content strong { font-weight: 700; color: #1e293b; }
          .chat-bubble-user { background-color: #3b82f6; color: white; padding: 12px 16px; border-radius: 18px 18px 4px 18px; max-width: 85%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px; align-self: flex-end; }
          .chat-bubble-ai { background-color: #f3f4f6; color: #1f2937; padding: 12px 16px; border-radius: 18px 18px 18px 4px; max-width: 85%; box-shadow: 0 1px 2px rgba(0,0,0,0.05); font-size: 14px; align-self: flex-start; border: 1px solid #e5e7eb; }
          .chat-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
          #privacy-curtain { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #000; z-index: 2147483647; display: ${blackout ? 'flex' : 'none'}; align-items: center; justify-content: center; color: #fff; font-size: 24px; font-weight: bold; pointer-events: all; }
          .modern-input-group { margin-bottom: 20px; display: flex; flex-direction: column; }
          .modern-label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; letter-spacing: 0.3px; }
          .modern-input, .modern-textarea, .modern-select { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; transition: all 0.2s ease-in-out; font-size: 14px; outline: none; background: #f9fafb; color: #1e293b; font-family: inherit; }
          .modern-input:focus, .modern-textarea:focus, .modern-select:focus { border-color: #3b82f6; background-color: #ffffff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
          .modern-input::placeholder, .modern-textarea::placeholder { color: #94a3b8; }
          .modern-grid-2 { display: grid; grid-template-columns: 1fr; gap: 20px; }
          @media (min-width: 768px) { .modern-grid-2 { grid-template-columns: 1fr 1fr; } }
          .modern-card { background: #fff; padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px; transition: transform 0.2s; }
          .modern-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
          .modern-radio-group { display: flex; gap: 15px; }
          .modern-radio-label { display: flex; align-items: center; padding: 10px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 13px; color: #475569; font-weight: 500; }
          .modern-radio-label:hover { background: #f8fafc; }
          .modern-radio-label input { margin-right: 8px; accent-color: #3b82f6; }
          .modern-radio-label.selected { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
          .modern-section-title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
          .modern-section-icon { width: 32px; height: 32px; background: #eff6ff; color: #3b82f6; border-radius: 8px; display: flex; alignItems: center; justify-content: center; font-size: 14px; }
      `}</style>
      
      <div id="privacy-curtain">
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'20px'}}>
              <i className="fa-solid fa-shield-halved" style={{fontSize:'50px', color:'#ef4444'}}></i>
              <span>Screen Capture Disabled</span>
          </div>
      </div>

      {(!guestUser || guestUser.permissions.toggle) && (
        <div onClick={() => setToolbarOpen(!toolbarOpen)} className={`settings-toggle ${toolbarOpen ? '' : 'timer-active'}`} title="Toggle Toolbar">
            {authMode === 'guest' && !toolbarOpen ? <><i className="fa-solid fa-clock"></i> {timeLeft}</> : <i className={`fa-solid ${toolbarOpen ? 'fa-times' : 'fa-gear'}`}></i>}
        </div>
      )}

      {/* Admin Toolbar */}
      <div className={`toolbar ${toolbarOpen ? 'active' : ''}`} id="admin-toolbar">
        <div className="toolbar-header">
            <div className="toolbar-top-row">
                <div className="toolbar-title">Raj Resume Builder <span style={{fontSize:'12px', fontWeight:400}}>({authMode === 'admin' ? 'Admin Mode' : 'Guest Mode'})</span></div>
                <button className="btn btn-cancel" onClick={() => setToolbarOpen(false)}><i className="fa-solid fa-times"></i></button>
            </div>
            {authMode === 'guest' && <div id="guest-timer-display" style={{display:'block'}}><i className="fa-solid fa-clock"></i> <span id="time-val">{timeLeft}</span></div>}
        </div>
        <div className="tools">
            {canEdit && (
                <>
                    <button className={`btn ${isEditing ? 'btn-save' : 'btn-edit'}`} onClick={() => setIsEditing(!isEditing)}><i className={`fa-solid ${isEditing ? 'fa-check' : 'fa-pen-to-square'}`}></i> {isEditing ? 'Save Changes' : 'Edit Details'}</button>
                    <button className="btn btn-blue" onClick={() => { setRevertData(JSON.parse(JSON.stringify(data))); setFormTab('personal'); setActiveModal('resume-form'); }}><i className="fa-solid fa-file-pen"></i> Fill Details</button>
                    <button className="btn btn-purple" onClick={openDetailsModal}><i className="fa-solid fa-list-check"></i> Edit Points</button>
                    <button className="btn btn-ai" onClick={() => setActiveModal('ai')}><i className="fa-solid fa-wand-magic-sparkles"></i> AI Assistant</button>
                </>
            )}
            <button className="btn btn-undo" onClick={performUndo} disabled={historyIndex <= 0} style={{opacity: historyIndex <= 0 ? 0.5 : 1}}><i className="fa-solid fa-rotate-left"></i> Undo</button>
            <button className="btn btn-redo" onClick={performRedo} disabled={historyIndex >= history.length - 1} style={{opacity: historyIndex >= history.length - 1 ? 0.5 : 1}}><i className="fa-solid fa-rotate-right"></i> Redo</button>
            <button className="btn btn-purple" onClick={() => setActiveModal('colors')}><i className="fa-solid fa-palette"></i> Theme Colors</button>
            {authMode === 'admin' && ( <> <button className="btn btn-cert" onClick={() => { setCertAuthStep('login'); setCertCaptchaVal(generateCaptcha()); setActiveModal('cert'); }}><i className="fa-solid fa-certificate"></i> Manage Certificates</button> <button className="btn btn-guest-mgr" onClick={() => { setGuestList(JSON.parse(localStorage.getItem('rajResumeGuests')||'[]')); setActiveModal('guest-mgr'); }}><i className="fa-solid fa-user-clock"></i> Guest Manager</button> <button className="btn btn-security" onClick={() => { setAdminSecStep('verify'); setCaptchaVal(generateCaptcha()); setActiveModal('admin-sec'); }}><i className="fa-solid fa-lock"></i> Admin Security</button> </> )}
            {(!guestUser || guestUser.permissions.ma) && ( <button className="btn btn-blue" onClick={() => { const newData = {...data}; newData.education[0].isHidden = !newData.education[0].isHidden; setData(newData); }}><i className="fa-solid fa-graduation-cap"></i> Toggle M.A.</button> )}
            {(!guestUser || guestUser.permissions.social) && ( <button className="btn btn-blue" onClick={() => setActiveModal('social')}><i className="fa-brands fa-linkedin"></i> Manage Socials</button> )}
            {(!guestUser || guestUser.permissions.pdf) && ( <button className="btn btn-pdf" onClick={downloadPDF}><i className="fa-solid fa-file-pdf"></i> PDF</button> )}
            {(!guestUser || guestUser.permissions.jpg) && ( <button className="btn btn-jpg" onClick={downloadJPG}><i className="fa-solid fa-image"></i> JPG</button> )}
            <button className="btn btn-remove" onClick={logout} style={{backgroundColor:'#2c3e50'}}><i className="fa-solid fa-right-from-bracket"></i> Log Out</button>
        </div>
      </div>

      {/* VIEWPORT */}
      <div id="viewport">
        <div id="resume-container" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', margin: '0 auto' }}>
            <div id="resume-content" style={{width: '794px', height: '1123px', background: 'white', display: 'flex', fontFamily: "'Roboto', sans-serif", boxShadow:'0 0 30px rgba(0,0,0,0.5)', position: 'relative'}}>
                <aside className="sidebar">
                    <div className="profile-photo-container" onClick={() => { if(canEdit || (guestUser && guestUser.permissions.img)) setActiveModal('img-opts-profile'); }} onContextMenu={(e) => e.preventDefault()}>
                        <img src={data.profileImage} alt="Profile" className="profile-photo" draggable="false" onContextMenu={(e) => e.preventDefault()} />
                    </div>
                    <div className="sidebar-section">
                        <div className="sidebar-header editable">Contact</div>
                        <a href={`https://wa.me/91${data.phone.replace(/\D/g, '')}`} className="contact-item" onClick={(e) => { e.preventDefault(); handlePhoneClick(); }} style={{textDecoration:'none', color:'inherit'}} title="Click for options (Web) or WhatsApp (PDF)">
                            <i className="fa-solid fa-phone contact-icon"></i> <Editable tagName="span" className="editable" value={data.phone} onChange={v => setData({...data, phone: v})} disabled={!isEditing} />
                        </a>
                        <a href={`mailto:${data.email}`} className="contact-item" onClick={(e) => { e.preventDefault(); handleEmailClick(); }} style={{textDecoration:'none', color:'inherit'}} title="Click for options (Web) or Mail (PDF)">
                            <i className="fa-solid fa-envelope contact-icon"></i> <Editable tagName="span" className="editable" value={data.email} onChange={v => setData({...data, email: v})} disabled={!isEditing} style={{wordBreak:'break-all'}} />
                        </a>
                         <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`} className="contact-item" onClick={(e) => { e.preventDefault(); handleAddressClick(); }} style={{textDecoration:'none', color:'inherit'}} title="Click for options (Web) or Maps (PDF)">
                            <i className="fa-solid fa-location-dot contact-icon"></i> <Editable tagName="span" className="editable" value={data.address} onChange={v => setData({...data, address: v})} disabled={!isEditing} />
                        </a>
                    </div>
                    <div className="sidebar-section">
                        <div className="sidebar-header editable">Personal Info</div>
                        <table className="info-table">
                            <tbody> {[['Father\'s Name', 'fatherName'], ['DOB', 'dob'], ['Gender', 'gender'], ['Nationality', 'nationality'], ['Marital Status', 'maritalStatus']].map(([label, key]) => ( <tr key={key}> <td className="info-label">{label}</td> <td><Editable className="editable" value={(data as any)[key]} onChange={v => setData({...data, [key]: v})} disabled={!isEditing} /></td> </tr> ))} </tbody>
                        </table>
                    </div>
                    <div className="sidebar-section">
                        <div className="sidebar-header editable">Languages</div>
                        <ul className="lang-list"> {data.languages.map((l, i) => ( <li key={i}><Editable className="editable" value={l} onChange={v => { const n=[...data.languages]; n[i]=v; setData({...data, languages: n}); }} disabled={!isEditing} /></li> ))} </ul>
                    </div>
                    <div className="sidebar-section">
                         <div className="sidebar-header editable">Hobbies</div>
                         <ul className="hobbies-list"> {data.hobbies.map((h, i) => ( <li key={i}><Editable className="editable" value={h} onChange={v => { const n=[...data.hobbies]; n[i]=v; setData({...data, hobbies: n}); }} disabled={!isEditing} /></li> ))} </ul>
                    </div>
                    {data.socials.some(s => s.enabled) && ( <div className="social-links-container" style={{marginTop:'auto'}}> <div className="sidebar-header editable" style={{border:'none', fontSize:'14px', marginBottom:'5px'}}>Social Links</div> {data.socials.filter(s => s.enabled).map(s => ( <a key={s.id} className="social-item" href={s.url} target="_blank" rel="noreferrer"> <i className={s.icon}></i> {s.url.replace(/^https?:\/\/(www\.)?/, '').substring(0, 22)}... </a> ))} </div> )}
                </aside>
                <main className="main-content">
                    <div className="main-section"> <Editable tagName="div" className="header-name editable" value={data.name} onChange={v => setData({...data, name: v})} disabled={!isEditing} /> <Editable tagName="div" className="header-role editable" value={data.role} onChange={v => setData({...data, role: v})} disabled={!isEditing} /> </div>
                    <div className="main-section"> <div className="section-title"><i className="fa-solid fa-bullseye"></i> <span className="editable">Career Objective</span></div> <Editable className="content-text editable" value={data.objective} onChange={v => setData({...data, objective: v})} disabled={!isEditing} /> </div>
                    <div className="main-section"> <div className="section-title"><i className="fa-solid fa-graduation-cap"></i> <span className="editable">Academic Qualification</span></div>
                        <table className="edu-table">
                            <thead><tr><th style={{width:'35%'}}>Qualification</th><th style={{width:'40%'}}>Board / University</th><th style={{width:'15%'}}>Year</th><th style={{width:'10%'}}>Score</th></tr></thead>
                            <tbody>
                                <tr id="ma-row" className={data.education[0].isHidden ? "hidden-row" : ""}> <td onClick={() => handleCertClick('ma')} className={certLinks.ma ? "cert-linked" : ""} title={certLinks.ma ? `Secure Node: ${secureIP}` : ''}> <Editable className="editable" value={data.education[0].qualification} onChange={v => {const e=[...data.education]; e[0].qualification=v; setData({...data, education:e})}} disabled={!isEditing} /> </td> <td><Editable className="editable" value={data.education[0].board} onChange={v => {const e=[...data.education]; e[0].board=v; setData({...data, education:e})}} disabled={!isEditing} /></td> <td><Editable className="editable" value={data.education[0].year} onChange={v => {const e=[...data.education]; e[0].year=v; setData({...data, education:e})}} disabled={!isEditing} /></td> <td><Editable className="editable" value={data.education[0].score} onChange={v => {const e=[...data.education]; e[0].score=v; setData({...data, education:e})}} disabled={!isEditing} /></td> </tr>
                                <tr> <td onClick={() => handleCertClick('ba')} className={certLinks.ba ? "cert-linked" : ""} title={certLinks.ba ? `Secure Node: ${secureIP}` : ''}> <Editable className="editable" value={data.education[1].qualification} onChange={v => {const e=[...data.education]; e[1].qualification=v; setData({...data, education:e})}} disabled={!isEditing} /> </td> <td><Editable className="editable" value={data.education[1].board} onChange={v => {const e=[...data.education]; e[1].board=v; setData({...data, education:e})}} disabled={!isEditing} /></td> <td><Editable className="editable" value={data.education[1].year} onChange={v => {const e=[...data.education]; e[1].year=v; setData({...data, education:e})}} disabled={!isEditing} /></td> <td><Editable className="editable" value={data.education[1].score} onChange={v => {const e=[...data.education]; e[1].score=v; setData({...data, education:e})}} disabled={!isEditing} /></td> </tr>
                                <tr> <td onClick={() => handleCertClick('12')} className={certLinks['12'] ? "cert-linked" : ""} title={certLinks['12'] ? `Secure Node: ${secureIP}` : ''}> <Editable className="editable" value={data.education[2].qualification} onChange={v => {const e=[...data.education]; e[2].qualification=v; setData({...data, education:e})}} disabled={!isEditing} /> </td> <td><Editable className="editable" value={data.education[2].board} onChange={v => {const e=[...data.education]; e[2].board=v; setData({...data, education:e})}} disabled={!isEditing} /></td> <td><Editable className="editable" value={data.education[2].year} onChange={v => {const e=[...data.education]; e[2].year=v; setData({...data, education:e})}} disabled={!isEditing} /></td> <td><Editable className="editable" value={data.education[2].score} onChange={v => {const e=[...data.education]; e[2].score=v; setData({...data, education:e})}} disabled={!isEditing} /></td> </tr>
                                <tr> <td onClick={() => handleCertClick('10')} className={certLinks['10'] ? "cert-linked" : ""} title={certLinks['10'] ? `Secure Node: ${secureIP}` : ''}> <Editable className="editable" value={data.education[3].qualification} onChange={v => {const e=[...data.education]; e[3].qualification=v; setData({...data, education:e})}} disabled={!isEditing} /> </td> <td><Editable className="editable" value={data.education[3].board} onChange={v => {const e=[...data.education]; e[3].board=v; setData({...data, education:e})}} disabled={!isEditing} /></td> <td><Editable className="editable" value={data.education[3].year} onChange={v => {const e=[...data.education]; e[3].year=v; setData({...data, education:e})}} disabled={!isEditing} /></td> <td><Editable className="editable" value={data.education[3].score} onChange={v => {const e=[...data.education]; e[3].score=v; setData({...data, education:e})}} disabled={!isEditing} /></td> </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="main-section"> <div className="section-title"><i className="fa-solid fa-briefcase"></i> <span className="editable">Work Experience</span></div> <div className="job-container"> {data.experience.map((exp, i) => ( <div key={i} className="job-entry"> <Editable className="job-title editable" value={exp.title} onChange={v => {const ex=[...data.experience]; ex[i].title=v; setData({...data, experience:ex})}} disabled={!isEditing} /> <Editable className="job-company editable" value={exp.company} onChange={v => {const ex=[...data.experience]; ex[i].company=v; setData({...data, experience:ex})}} disabled={!isEditing} /> </div> ))} </div> </div>
                    <div className="main-section"> <div className="section-title"><i className="fa-solid fa-laptop-code"></i> <span className="editable">Technical Skills</span></div> <ul className="bullet-list"> {data.techSkills.map((s, i) => ( <li key={i}><Editable className="editable" value={s} onChange={v => {const n=[...data.techSkills]; n[i]=v; setData({...data, techSkills:n})}} disabled={!isEditing} /></li> ))} </ul> </div>
                    <div className="main-section"> <div className="section-title"><i className="fa-solid fa-user-gear"></i> <span className="editable">Soft Skills & Strengths</span></div> <ul className="bullet-list"> {data.softSkills.map((s, i) => ( <li key={i}><Editable className="editable" value={s} onChange={v => {const n=[...data.softSkills]; n[i]=v; setData({...data, softSkills:n})}} disabled={!isEditing} /></li> ))} </ul> </div>
                    <div className="main-section"> <div className="section-title"><i className="fa-solid fa-check-circle"></i> <span className="editable">Declaration</span></div> <Editable className="content-text editable" value={data.declaration} onChange={v => setData({...data, declaration:v})} disabled={!isEditing} /> </div>
                    <div className="bottom-row"> <div className="place-date-group"> <p><strong className="editable">Date:</strong> <span className="editable">{data.date}</span></p> <p><strong className="editable">Place:</strong> <Editable tagName="span" className="editable" value={data.place} onChange={v => setData({...data, place:v})} disabled={!isEditing} /></p> </div> <div className="signature-box" onClick={() => { if(canEdit || (guestUser && guestUser.permissions.img)) setActiveModal('img-opts-signature'); }} onContextMenu={(e) => e.preventDefault()}> {data.signatureImage ? <img src={data.signatureImage} className="signature-img" alt="Sign" draggable="false" onContextMenu={(e) => e.preventDefault()} /> : <div id="sig-placeholder" style={{height:'40px', display:'flex', alignItems:'flex-end', justifyContent:'center', color:'#ccc', fontSize:'10px'}}>[ Click to Sign ]</div> } <Editable tagName="div" className="signature-line editable" value={data.signatureName} onChange={v => setData({...data, signatureName:v})} disabled={!isEditing} /> </div> </div>
                    <div className="copyright">&copy; 2025 Raj Resume Builder. All rights reserved.</div>
                </main>
            </div>
        </div>
      </div>
      
      {/* Hidden File Inputs */}
      <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
      <input type="file" className="hidden" ref={sigInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} />
      <input type="file" className="hidden" ref={certUploadRef} accept=".pdf,image/*" onChange={handleCertUpload} />

      {/* Resume Form Modal - Revamped UI/UX */}
      {activeModal === 'resume-form' && (
        <div className="modal-overlay open" style={{alignItems:'flex-start', paddingTop:'40px'}}>
            <div className="modal-box" style={{width: '900px', height: '85vh', maxHeight:'800px', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius:'16px', boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.25)', background: '#f8fafc'}}>
                <div style={{padding: '20px 30px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div> <h3 style={{fontSize:'20px', color:'#1e293b', margin:0, fontWeight: 700, display:'flex', alignItems:'center', gap:'10px'}}> <div style={{width:'36px', height:'36px', background:'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'16px', boxShadow:'0 4px 6px rgba(37, 99, 235, 0.2)'}}> <i className="fa-solid fa-pen-nib"></i> </div> Edit Resume </h3> <div style={{fontSize:'12px', color:'#64748b', marginTop:'4px', marginLeft:'46px', fontWeight:500}}> {calculateFormProgress()}% Completed </div> </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px'}}> <div style={{width:'200px', background:'#f1f5f9', height:'8px', borderRadius:'4px', overflow:'hidden'}}> <div style={{width: `${calculateFormProgress()}%`, height:'100%', background:'linear-gradient(90deg, #10b981, #34d399)', transition:'width 0.6s ease', borderRadius:'4px'}}></div> </div> </div>
                    <button onClick={() => { if(revertData) setData(revertData); setActiveModal(null); }} style={{background:'#f1f5f9', border:'none', color:'#64748b', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s'}}> <i className="fa-solid fa-times"></i> </button>
                </div>
                <div style={{flex: 1, display: 'flex', overflow: 'hidden'}}>
                    <div style={{width: '260px', background: '#fff', borderRight: '1px solid #e2e8f0', overflowY:'auto', padding:'20px'}}>
                        <div style={{fontSize:'11px', textTransform:'uppercase', color:'#94a3b8', fontWeight:700, marginBottom:'15px', paddingLeft:'12px', letterSpacing:'0.5px'}}>Sections</div>
                        <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                            {formTabs.map((tab, idx) => {
                                 const isActive = formTab === tab;
                                 const isComplete = isSectionComplete(tab);
                                 const icons = { personal: 'fa-user', education: 'fa-graduation-cap', experience: 'fa-briefcase', skills: 'fa-laptop-code', misc: 'fa-puzzle-piece' };
                                 return ( <button key={tab} onClick={() => setFormTab(tab)} style={{ width: '100%', textAlign: 'left', padding: '14px 16px', background: isActive ? '#eff6ff' : 'transparent', color: isActive ? '#1d4ed8' : (isComplete ? '#334155' : '#64748b'), fontWeight: isActive ? 600 : 500, borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease', fontSize: '14px' }}> <div style={{display:'flex', alignItems:'center', gap:'12px'}}> <i className={`fa-solid ${icons[tab as keyof typeof icons]}`} style={{width:'18px', textAlign:'center', color: isActive ? '#3b82f6' : '#cbd5e1', fontSize:'15px'}}></i> {tab.charAt(0).toUpperCase() + tab.slice(1)} </div> {isComplete && <i className="fa-solid fa-circle-check" style={{color:'#10b981', fontSize:'14px'}}></i>} </button> )
                            })}
                        </div>
                    </div>
                    <div style={{flex: 1, display:'flex', flexDirection:'column', background:'#f8fafc'}}>
                        <div style={{flex:1, overflowY:'auto', padding:'40px'}}>
                        {formTab === 'personal' && (
                            <div className="fade-in-up modern-container">
                                <div className="modern-section-title"> <div className="modern-section-icon"><i className="fa-solid fa-user"></i></div> Personal Details </div>
                                <div className="modern-card">
                                    <div className="modern-grid-2">
                                        {renderInput("Full Name", data.name, v => setData({...data, name: v}))} {renderInput("Role / Title", data.role, v => setData({...data, role: v}))} {renderInput("Phone", data.phone, v => setData({...data, phone: v}))} {renderInput("Email", data.email, v => setData({...data, email: v}))}
                                        <div style={{gridColumn: '1 / -1'}}> {renderInput("Address", data.address, v => setData({...data, address: v}))} </div>
                                        {renderInput("Father's Name", data.fatherName, v => setData({...data, fatherName: v}))} {renderInput("Date of Birth", data.dob, v => setData({...data, dob: v}), "DD Month YYYY")}
                                        <div className="modern-input-group"> <label className="modern-label">Gender</label> <div className="modern-radio-group"> {['Male', 'Female', 'Other'].map(g => ( <label key={g} className={`modern-radio-label ${data.gender === g ? 'selected' : ''}`}> <input type="radio" name="gender" value={g} checked={data.gender === g} onChange={() => setData({...data, gender: g})} /> {g} </label> ))} </div> </div>
                                        <div className="modern-input-group"> <label className="modern-label">Marital Status</label> <select className="modern-select" value={data.maritalStatus} onChange={e => setData({...data, maritalStatus: e.target.value})}> <option value="Single">Single</option> <option value="Married">Married</option> <option value="Divorced">Divorced</option> <option value="Widowed">Widowed</option> </select> </div>
                                        {renderInput("Nationality", data.nationality, v => setData({...data, nationality: v}))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {formTab === 'education' && (
                            <div className="fade-in-up modern-container">
                                 <div className="modern-section-title"> <div className="modern-section-icon"><i className="fa-solid fa-graduation-cap"></i></div> Education History </div>
                                 {data.education.map((edu, i) => (
                                     <div key={i} className="modern-card">
                                         <div style={{fontWeight: 700, marginBottom: '20px', color: '#334155', display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'15px', borderBottom:'1px solid #f1f5f9'}}>
                                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}> <span style={{background:'#e0f2fe', color:'#0284c7', width:'24px', height:'24px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px'}}>{i+1}</span> {i===0 ? 'Post Graduation' : i===1 ? 'Graduation' : i===2 ? 'Senior Secondary' : 'Secondary'} </div>
                                            {i === 0 && ( <label className="modern-radio-label" style={{padding:'6px 12px', fontSize:'12px'}}> <input type="checkbox" checked={edu.isHidden} onChange={(e) => { const n = [...data.education]; n[0].isHidden = e.target.checked; setData({...data, education: n}); }} /> Hide from Resume </label> )}
                                         </div>
                                         <div className="modern-grid-2"> {renderInput("Qualification", edu.qualification, v => { const e=[...data.education]; e[i].qualification=v; setData({...data, education:e}); }, "e.g. B.A (Hons)")} {renderInput("Board / University", edu.board, v => { const e=[...data.education]; e[i].board=v; setData({...data, education:e}); }, "e.g. CBSE")} {renderInput("Year of Passing", edu.year, v => { const e=[...data.education]; e[i].year=v; setData({...data, education:e}); }, "YYYY")} {renderInput("Score / Grade", edu.score, v => { const e=[...data.education]; e[i].score=v; setData({...data, education:e}); }, "% or CGPA")} </div>
                                     </div>
                                 ))}
                            </div>
                        )}
                        {formTab === 'experience' && (
                            <div className="fade-in-up modern-container">
                                 <div className="modern-section-title"> <div className="modern-section-icon"><i className="fa-solid fa-briefcase"></i></div> Work Experience </div>
                                 {data.experience.map((exp, i) => (
                                     <div key={i} className="modern-card" style={{position:'relative'}}>
                                         <button style={{position:'absolute', top:'20px', right:'20px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'6px', padding:'6px 10px', cursor:'pointer', fontSize:'12px'}} onClick={() => { const newExp = [...data.experience]; newExp.splice(i, 1); setData({...data, experience: newExp}); }}> <i className="fa-solid fa-trash"></i> Remove </button>
                                         <div className="modern-grid-2"> {renderInput("Job Title", exp.title, v => { const ex=[...data.experience]; ex[i].title=v; setData({...data, experience:ex}); })} {renderInput("Company Name", exp.company, v => { const ex=[...data.experience]; ex[i].company=v; setData({...data, experience:ex}); })} </div>
                                     </div>
                                 ))}
                                 <button className="btn" style={{width:'100%', justifyContent:'center', padding:'14px', background:'#fff', border:'1px dashed #cbd5e1', color:'#3b82f6', borderRadius:'12px', fontSize:'14px', fontWeight:600}} onClick={() => setData({...data, experience: [...data.experience, {id: Date.now().toString(), title:'', company:''}]})}> <i className="fa-solid fa-plus-circle"></i> Add New Experience </button>
                            </div>
                        )}
                        {formTab === 'skills' && (
                            <div className="fade-in-up modern-container">
                                 <div className="modern-section-title"> <div className="modern-section-icon"><i className="fa-solid fa-laptop-code"></i></div> Skills & Interests </div>
                                 <div className="modern-card">
                                     <div className="modern-input-group"> <label className="modern-label">Technical Skills (One per line)</label> <textarea className="modern-textarea" style={{height:'120px'}} value={data.techSkills.join('\n')} onChange={e => setData({...data, techSkills: sanitize(e.target.value).split('\n')})} placeholder="e.g. Advanced Excel..."></textarea> </div>
                                     <div className="modern-input-group"> <label className="modern-label">Soft Skills (One per line)</label> <textarea className="modern-textarea" style={{height:'120px'}} value={data.softSkills.join('\n')} onChange={e => setData({...data, softSkills: sanitize(e.target.value).split('\n')})} placeholder="e.g. Leadership..."></textarea> </div>
                                     <div className="modern-grid-2"> {renderInput("Languages (Comma separated)", data.languages.join(', '), v => setData({...data, languages: v.split(',').map(s=>s.trim())}))} {renderInput("Hobbies (Comma separated)", data.hobbies.join(', '), v => setData({...data, hobbies: v.split(',').map(s=>s.trim())}))} </div>
                                 </div>
                            </div>
                        )}
                        {formTab === 'misc' && (
                            <div className="fade-in-up modern-container">
                                 <div className="modern-section-title"> <div className="modern-section-icon"><i className="fa-solid fa-puzzle-piece"></i></div> Miscellaneous </div>
                                 <div className="modern-card">
                                     <div className="modern-input-group"> <label className="modern-label">Career Objective</label> <textarea className="modern-textarea" style={{height:'100px'}} value={data.objective} onChange={e => setData({...data, objective: sanitize(e.target.value)})}></textarea> </div>
                                     <div className="modern-input-group"> <label className="modern-label">Declaration</label> <textarea className="modern-textarea" style={{height:'80px'}} value={data.declaration} onChange={e => setData({...data, declaration: sanitize(e.target.value)})}></textarea> </div>
                                     <div className="modern-grid-2" style={{gridTemplateColumns: '1fr 1fr 1fr'}}> {renderInput("Date", data.date, v => setData({...data, date: v}), "", "100%")} {renderInput("Place", data.place, v => setData({...data, place: v}), "", "100%")} {renderInput("Signature Name", data.signatureName, v => setData({...data, signatureName: v}), "", "100%")} </div>
                                 </div>
                            </div>
                        )}
                        </div>
                        <div style={{padding: '20px 30px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div> <button onClick={() => { if(revertData) setData(revertData); setActiveModal(null); }} className="btn" style={{background:'#fff', color:'#64748b', border:'1px solid #cbd5e1', padding:'12px 24px', borderRadius:'10px'}}> Cancel </button> </div>
                            <div style={{display:'flex', gap:'15px'}}>
                                <button onClick={handlePrevTab} disabled={currentTabIdx === 0} className="btn" style={{ background: currentTabIdx === 0 ? '#f1f5f9' : '#fff', color: currentTabIdx === 0 ? '#cbd5e1' : '#475569', border:'1px solid #e2e8f0', padding:'12px 24px', borderRadius:'10px', cursor: currentTabIdx === 0 ? 'not-allowed' : 'pointer' }}> Back </button>
                                {currentTabIdx < formTabs.length - 1 ? ( <button onClick={handleNextTab} className="btn" style={{padding:'12px 28px', background:'#3b82f6', color:'white', borderRadius:'10px', boxShadow:'0 4px 6px -1px rgba(59, 130, 246, 0.4)'}}> Next Step <i className="fa-solid fa-arrow-right" style={{marginLeft:'8px'}}></i> </button> ) : ( <button onClick={() => setActiveModal(null)} className="btn" style={{padding:'12px 28px', background:'#10b981', color:'white', borderRadius:'10px', boxShadow:'0 4px 10px rgba(16, 185, 129, 0.4)'}}> Finish & Save <i className="fa-solid fa-check" style={{marginLeft:'8px'}}></i> </button> )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Contact Actions Modal */}
      <div className={`modal-overlay ${contactModal ? 'open' : ''}`}>
          <div className="modal-box" style={{width: '320px'}}>
              <h3 style={{marginBottom:'15px'}}>{contactModal?.title}</h3>
              <ul className="action-list"> {contactModal?.actions.map((act, i) => ( <li key={i}> <button className="action-btn" onClick={act.fn}> <i className={act.icon}></i> {act.label} </button> </li> ))} </ul>
              <div className="modal-actions" style={{marginTop:'10px'}}> <button className="btn btn-cancel" onClick={() => setContactModal(null)}>Cancel</button> </div>
          </div>
      </div>

      {/* Details Editor Modal */}
      <div className={`modal-overlay ${activeModal === 'details' ? 'open' : ''}`}>
          <div className="modal-box" style={{width: '600px'}}>
              <h3 style={{marginBottom:'10px', color:'#2c3e50'}}>Edit Points</h3>
              <div className="dm-tabs"> {['work', 'tech', 'soft', 'lang', 'hobby'].map(t => { const icons = { work: 'fa-briefcase', tech: 'fa-code', soft: 'fa-comments', lang: 'fa-language', hobby: 'fa-palette' }; const label = t === 'work' ? 'Work Experience' : t === 'tech' ? 'Tech Skills' : t === 'soft' ? 'Soft Skills' : t === 'lang' ? 'Languages' : 'Hobbies'; return ( <div key={t} className={`dm-tab ${dmTab === t ? 'active' : ''}`} onClick={() => switchDmTab(t)}> <i className={`fa-solid ${icons[t as keyof typeof icons]}`} style={{fontSize:'12px'}}></i> {label} </div> ); })} </div>
              <div className="dm-content"> {localDetails.map((item, i) => ( <div className="dm-row" key={i}> {dmTab === 'work' ? ( <> <input type="text" className="dm-input" placeholder="Job Title" value={item.title || ''} onChange={e => { const newData = [...localDetails]; newData[i].title = e.target.value; setLocalDetails(newData); }} /> <input type="text" className="dm-input" placeholder="Company" value={item.company || ''} onChange={e => { const newData = [...localDetails]; newData[i].company = e.target.value; setLocalDetails(newData); }} /> </> ) : ( <input type="text" className="dm-input" value={item as string} onChange={e => { const newData = [...localDetails]; newData[i] = e.target.value; setLocalDetails(newData); }} /> )} <button className="dm-btn-del" onClick={() => { const newData = [...localDetails]; newData.splice(i, 1); setLocalDetails(newData); }}><i className="fa-solid fa-trash"></i></button> </div> ))} </div>
              <div className="dm-controls"> <span style={{fontSize:'13px', fontWeight:600}}>Bulk Add:</span> <select className="dm-select" value={rowsToAdd} onChange={e => setRowsToAdd(parseInt(e.target.value))}> <option value="1">1</option><option value="3">3</option><option value="5">5</option> </select> <button className="btn btn-blue" style={{padding:'6px 10px'}} onClick={addDmRows}><i className="fa-solid fa-plus"></i> Add</button> </div>
              <div className="modal-actions" style={{marginTop:'20px'}}> <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button> <button className="btn btn-save" onClick={saveDetails}>Save Changes</button> </div>
          </div>
      </div>

      {/* AI Modal - Modern Dashboard Suite */}
<div className={`modal-overlay ${activeModal === 'ai' ? 'open' : ''}`} style={{alignItems: 'center', padding: '20px'}}>
    <style>{`
        /* AI SUITE MODERN STYLES */
        .ai-suite-container { width: 1000px; height: 85vh; max-height: 800px; background: #fff; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display: flex; overflow: hidden; font-family: 'Inter', 'Roboto', sans-serif; }
        .ai-sidebar { width: 260px; background: #f8fafc; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; padding: 24px 16px; flex-shrink: 0; }
        @media (max-width: 768px) { .ai-suite-container { flex-direction: column; height: 95vh; width: 95%; } .ai-sidebar { width: 100%; height: auto; padding: 15px; border-right: none; border-bottom: 1px solid #e2e8f0; flex-direction: row; overflow-x: auto; gap: 10px; align-items: center; } .ai-nav-label { display: block; white-space: nowrap; } .ai-sidebar-brand { display: none; } }
        .ai-sidebar-brand { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 30px; padding-left: 12px; display: flex; align-items: center; gap: 10px; }
        .ai-sidebar-brand i { background: -webkit-linear-gradient(45deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 22px; }
        .ai-nav-btn { padding: 12px 16px; margin-bottom: 6px; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 500; color: #64748b; display: flex; align-items: center; gap: 12px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid transparent; }
        .ai-nav-btn:hover { background: #fff; color: #334155; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .ai-nav-btn.active { background: #fff; color: #4f46e5; font-weight: 600; box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.15); border-color: #e0e7ff; }
        .ai-nav-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #94a3b8; transition: all 0.2s; font-size: 13px; }
        .ai-nav-btn.active .ai-nav-icon { background: #e0e7ff; color: #4f46e5; }
        .ai-main-area { flex: 1; background: #fff; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .ai-header { padding: 20px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); z-index: 10; }
        .ai-title h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
        .ai-title p { font-size: 13px; color: #64748b; margin: 4px 0 0 0; }
        .ai-content-scroll { padding: 32px; overflow-y: auto; height: 100%; }
        .ai-tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        .tool-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 24px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; display: flex; flex-direction: column; height: 100%; }
        .tool-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08); border-color: #e2e8f0; }
        .tool-icon { width: 56px; height: 56px; border-radius: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 8px 16px -4px rgba(0,0,0,0.05); }
        .tool-icon.blue { background: linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%); color: #2563eb; }
        .tool-icon.purple { background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%); color: #9333ea; }
        .tool-icon.green { background: linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%); color: #16a34a; }
        .tool-icon.orange { background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); color: #ea580c; }
        .tool-name { font-size: 17px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
        .tool-desc { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 20px; flex: 1; }
        .tool-action { font-size: 13px; font-weight: 600; color: #4f46e5; display: flex; align-items: center; gap: 6px; margin-top: auto; transition: gap 0.2s; }
        .tool-card:hover .tool-action { gap: 10px; }
        .tool-interface { animation: fadeIn 0.3s ease; height: 100%; display: flex; flex-direction: column; }
        .input-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 6px; margin-bottom: 20px; transition: all 0.2s; }
        .input-box:focus-within { background: #fff; border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        .naked-input { width: 100%; border: none; background: transparent; padding: 12px; outline: none; font-size: 14px; color: #334155; resize: none; font-family: inherit; }
        .naked-select { width: 100%; border: none; background: transparent; padding: 12px; outline: none; font-size: 14px; color: #334155; cursor: pointer; }
        .btn-gradient { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }
        .btn-gradient:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.3); }
        .btn-gradient:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .result-box { margin-top: 24px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; position: relative; overflow: hidden; }
        .result-box::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #4f46e5; }
        .chat-container { display: flex; flex-direction: column; height: 500px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
        .chat-input-area { padding: 16px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; align-items: center; }
        .msg { max-width: 80%; padding: 12px 16px; font-size: 14px; line-height: 1.5; position: relative; }
        .msg.user { align-self: flex-end; background: #4f46e5; color: white; border-radius: 16px 16px 4px 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2); }
        .msg.ai { align-self: flex-start; background: #fff; color: #1e293b; border-radius: 16px 16px 16px 4px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .close-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .close-btn:hover { background: #ef4444; color: white; transform: rotate(90deg); }
    `}</style>

    <div className="ai-suite-container">
        {/* SIDEBAR */}
        <div className="ai-sidebar">
            <div className="ai-sidebar-brand">
                <i className="fa-solid fa-wand-magic-sparkles"></i> AI Studio
            </div>
            <div className={`ai-nav-btn ${aiSection === 'dashboard' ? 'active' : ''}`} onClick={() => setAiSection('dashboard')}>
                <div className="ai-nav-icon"><i className="fa-solid fa-grid-2"></i></div>
                <span className="ai-nav-label">Overview</span>
            </div>
            <div className={`ai-nav-btn ${aiSection === 'improver' ? 'active' : ''}`} onClick={() => { setAiSection('improver'); setAiMode('improver'); setAiResult(''); }}>
                <div className="ai-nav-icon"><i className="fa-solid fa-pen-fancy"></i></div>
                <span className="ai-nav-label">Resume Improver</span>
            </div>
            <div className={`ai-nav-btn ${aiSection === 'chat' ? 'active' : ''}`} onClick={() => { setAiSection('chat'); setAiMode('assistant'); }}>
                <div className="ai-nav-icon"><i className="fa-solid fa-comments"></i></div>
                <span className="ai-nav-label">Career Assistant</span>
            </div>
            <div className={`ai-nav-btn ${aiSection === 'cover-letter' ? 'active' : ''}`} onClick={() => { setAiSection('cover-letter'); setAiResult(''); }}>
                <div className="ai-nav-icon"><i className="fa-solid fa-envelope-open-text"></i></div>
                <span className="ai-nav-label">Cover Letter Gen</span>
            </div>
            <div className={`ai-nav-btn ${aiSection === 'interview' ? 'active' : ''}`} onClick={() => { setAiSection('interview'); }}>
                <div className="ai-nav-icon"><i className="fa-solid fa-user-tie"></i></div>
                <span className="ai-nav-label">Interview Prep</span>
            </div>
            
            <div style={{marginTop:'auto'}}>
                <div style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius:'16px', padding:'20px', color:'white', textAlign:'center'}}>
                    <div style={{fontSize:'12px', opacity:0.8, marginBottom:'8px'}}>Need Help?</div>
                    <div style={{fontSize:'11px', lineHeight:'1.4', opacity:0.6}}>Our AI models are optimized for resume building.</div>
                </div>
            </div>
        </div>

        {/* MAIN AREA */}
        <div className="ai-main-area">
            <div className="ai-header">
                <div className="ai-title">
                    <h3>
                        {aiSection === 'dashboard' ? 'AI Tools Suite' : 
                         aiSection === 'improver' ? 'Resume Improver' : 
                         aiSection === 'chat' ? 'Career Assistant' :
                         aiSection === 'cover-letter' ? 'Cover Letter Generator' : 'Interview Simulator'}
                    </h3>
                    <p>
                        {aiSection === 'dashboard' ? 'Select a tool to enhance your resume' : 
                         aiSection === 'improver' ? 'Polish your content with professional rewriting' : 
                         aiSection === 'chat' ? 'Get instant answers to your career questions' :
                         aiSection === 'cover-letter' ? 'Create a tailored cover letter in seconds' : 'Practice with AI-driven mock interviews'}
                    </p>
                </div>
                <button className="close-btn" onClick={() => setActiveModal(null)}><i className="fa-solid fa-times"></i></button>
            </div>

            <div className="ai-content-scroll">
                
                {/* DASHBOARD VIEW */}
                {aiSection === 'dashboard' && (
                    <div className="ai-tools-grid">
                        <div className="tool-card" onClick={() => { setAiSection('improver'); setAiMode('improver'); setAiResult(''); }}>
                            <div className="tool-icon blue"><i className="fa-solid fa-pen-nib"></i></div>
                            <div className="tool-name">Resume Improver</div>
                            <div className="tool-desc">Rewrites your bullet points to be more professional, impactful, and concise using industry standards.</div>
                            <div className="tool-action">Launch Tool <i className="fa-solid fa-arrow-right"></i></div>
                        </div>
                        <div className="tool-card" onClick={() => { setAiSection('chat'); setAiMode('assistant'); }}>
                            <div className="tool-icon purple"><i className="fa-solid fa-robot"></i></div>
                            <div className="tool-name">Career Assistant</div>
                            <div className="tool-desc">A conversational AI to answer questions about interview prep, career paths, and resume tips.</div>
                            <div className="tool-action">Start Chat <i className="fa-solid fa-arrow-right"></i></div>
                        </div>
                        <div className="tool-card" onClick={() => { setAiSection('cover-letter'); setAiResult(''); }}>
                            <div className="tool-icon green"><i className="fa-solid fa-envelope-open-text"></i></div>
                            <div className="tool-name">Cover Letter Gen</div>
                            <div className="tool-desc">Generate a tailored cover letter based on your resume and a specific job description.</div>
                            <div className="tool-action">Create Letter <i className="fa-solid fa-arrow-right"></i></div>
                        </div>
                        <div className="tool-card" onClick={() => { setAiSection('interview'); }}>
                            <div className="tool-icon orange"><i className="fa-solid fa-user-tie"></i></div>
                            <div className="tool-name">Interview Prep</div>
                            <div className="tool-desc">Mock interview sessions with specific feedback on your answers for any role.</div>
                            <div className="tool-action">Start Practice <i className="fa-solid fa-arrow-right"></i></div>
                        </div>
                    </div>
                )}

                {/* IMPROVER TOOL */}
                {aiSection === 'improver' && (
                    <div className="tool-interface">
                        <div style={{maxWidth: '600px', margin: '0 auto'}}>
                            <div className="input-box">
                                <select className="naked-select" value={aiTarget as string} onChange={(e) => setAiTarget(e.target.value as any)}>
                                    <option value="objective">Target: Career Objective</option>
                                    <option value="techSkills">Target: Technical Skills</option>
                                    <option value="softSkills">Target: Soft Skills</option>
                                    <option value="declaration">Target: Declaration</option>
                                </select>
                            </div>
                            <div className="input-box">
                                <textarea className="naked-input" rows={4} placeholder="Enter instructions (e.g., 'Make it sound more executive' or 'Focus on leadership')..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}></textarea>
                            </div>
                            <button className="btn-gradient" onClick={handleAiImprove} disabled={aiLoading}>
                                {aiLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                {aiLoading ? 'Optimizing...' : 'Generate Improvements'}
                            </button>
                            {aiResult && (
                                <div className="result-box">
                                    <div style={{fontSize:'11px', fontWeight:700, color:'#64748b', marginBottom:'10px', textTransform:'uppercase'}}>AI Suggestion</div>
                                    <div className="editable" dangerouslySetInnerHTML={{__html: aiResult}} style={{fontSize:'14px', lineHeight:'1.6', color:'#334155'}}></div>
                                    <div style={{marginTop:'15px', display:'flex', justifyContent:'flex-end'}}>
                                        <button className="btn-save" onClick={applyAiResult} style={{padding:'8px 16px', borderRadius:'8px'}}><i className="fa-solid fa-check"></i> Apply to Resume</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* COVER LETTER TOOL */}
                {aiSection === 'cover-letter' && (
                    <div className="tool-interface">
                        <div style={{maxWidth: '600px', margin: '0 auto'}}>
                            <div className="input-box">
                                <input type="text" className="naked-input" placeholder="Target Job Title (e.g. Senior Developer)" value={clJobTitle} onChange={e => setClJobTitle(e.target.value)} />
                            </div>
                            <div className="input-box">
                                <input type="text" className="naked-input" placeholder="Company Name" value={clCompany} onChange={e => setClCompany(e.target.value)} />
                            </div>
                            <div className="input-box">
                                <textarea className="naked-input" rows={6} placeholder="Paste Job Description here (optional but recommended)..." value={clDesc} onChange={e => setClDesc(e.target.value)}></textarea>
                            </div>
                            <button className="btn-gradient" onClick={handleCoverLetterGen} disabled={aiLoading || !clJobTitle || !clCompany}>
                                {aiLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-pen-fancy"></i>}
                                {aiLoading ? 'Drafting...' : 'Generate Cover Letter'}
                            </button>
                            {aiResult && (
                                <div className="result-box">
                                    <div style={{fontSize:'11px', fontWeight:700, color:'#64748b', marginBottom:'10px', textTransform:'uppercase'}}>Your Cover Letter</div>
                                    <div className="editable" dangerouslySetInnerHTML={{__html: aiResult}} style={{fontSize:'14px', lineHeight:'1.6', color:'#334155', whiteSpace:'pre-wrap'}}></div>
                                    <div style={{marginTop:'15px', display:'flex', justifyContent:'flex-end'}}>
                                        <button className="btn-blue" onClick={() => navigator.clipboard.writeText(aiResult.replace(/<[^>]*>/g, ''))} style={{padding:'8px 16px', borderRadius:'8px'}}><i className="fa-solid fa-copy"></i> Copy Text</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* INTERVIEW PREP TOOL */}
                {aiSection === 'interview' && (
                    <div className="tool-interface" style={{height:'100%', display:'flex', flexDirection:'column'}}>
                        <div className="chat-container" style={{flex:1, height:'auto'}}>
                            <div className="chat-messages" ref={interviewScrollRef}>
                                {interviewHistory.length === 0 ? (
                                    <div style={{textAlign:'center', marginTop:'40px', color:'#94a3b8'}}>
                                        <div style={{fontSize:'40px', marginBottom:'10px', opacity:0.5}}><i className="fa-solid fa-user-tie"></i></div>
                                        <p>Ready to practice?</p>
                                        <div style={{maxWidth:'300px', margin:'15px auto'}}>
                                            <input type="text" className="naked-input" style={{background:'#eef2ff', borderRadius:'10px', textAlign:'center', border:'1px solid #c7d2fe'}} placeholder="Enter Role (e.g. PM, Dev)" value={interviewRole} onChange={e => setInterviewRole(e.target.value)} />
                                        </div>
                                        <button className="btn-gradient" style={{maxWidth:'200px', margin:'0 auto'}} onClick={startInterview} disabled={aiLoading || !interviewRole}>Start Mock Interview</button>
                                    </div>
                                ) : (
                                    interviewHistory.map((msg, i) => (
                                        <div key={i} className={`msg ${msg.role}`}>
                                            <div dangerouslySetInnerHTML={{__html: msg.text.replace(/\n/g, '<br/>')}}></div>
                                        </div>
                                    ))
                                )}
                                {aiLoading && <div className="msg ai"><i className="fa-solid fa-circle-notch fa-spin"></i> Thinking...</div>}
                            </div>
                            
                            {interviewHistory.length > 0 && (
                                <div className="chat-input-area">
                                    <input type="text" className="naked-input" placeholder="Type your answer..." style={{background:'#f1f5f9', borderRadius:'20px', padding:'10px 15px'}} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInterviewChat()} />
                                    <button className="btn" style={{background:'#4f46e5', color:'white', padding:'10px', borderRadius:'50%', width:'40px', height:'40px', justifyContent:'center', boxShadow:'0 4px 10px rgba(79, 70, 229, 0.3)'}} onClick={handleInterviewChat} disabled={aiLoading || !chatInput.trim()}><i className="fa-solid fa-paper-plane"></i></button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* CHAT TOOL */}
                {aiSection === 'chat' && (
                    <div className="tool-interface" style={{height:'100%', display:'flex', flexDirection:'column'}}>
                        <div className="chat-container" style={{flex:1, height:'auto'}}>
                            <div className="chat-messages" ref={chatScrollRef}>
                                {chatHistory.length === 0 && (
                                    <div style={{textAlign:'center', marginTop:'40px', color:'#94a3b8'}}>
                                        <div style={{fontSize:'40px', marginBottom:'10px', opacity:0.5}}><i className="fa-solid fa-comments"></i></div>
                                        <p>Hello! I'm your career assistant.</p>
                                        <p style={{fontSize:'13px'}}>Ask me anything about your resume or job search.</p>
                                    </div>
                                )}
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`msg ${msg.role}`}>
                                        {msg.image && <img src={msg.image} alt="Upload" style={{maxWidth:'100%', borderRadius:'8px', marginBottom:'8px'}} />}
                                        <div dangerouslySetInnerHTML={{__html: msg.text}}></div>
                                    </div>
                                ))}
                                {aiLoading && <div className="msg ai"><i className="fa-solid fa-circle-notch fa-spin"></i> Thinking...</div>}
                            </div>
                            <div className="chat-input-area">
                                <button className="btn" style={{background:'#f1f5f9', color:'#64748b', padding:'10px', borderRadius:'50%', width:'40px', height:'40px', justifyContent:'center'}} onClick={() => aiImageInputRef.current?.click()}><i className="fa-solid fa-paperclip"></i></button>
                                <input type="file" ref={aiImageInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleAiImageUpload} />
                                {chatImage && (
                                    <div style={{position:'relative', height:'40px', width:'40px'}}>
                                        <img src={chatImage.startsWith('data:application/pdf') ? 'https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg' : chatImage} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'6px'}} />
                                        <div onClick={() => setChatImage(null)} style={{position:'absolute', top:-5, right:-5, background:'red', color:'white', borderRadius:'50%', width:15, height:15, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>x</div>
                                    </div>
                                )}
                                <input type="text" className="naked-input" placeholder="Type your message..." style={{background:'#f1f5f9', borderRadius:'20px', padding:'10px 15px'}} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiChat()} />
                                <button className="btn" style={{background:'#4f46e5', color:'white', padding:'10px', borderRadius:'50%', width:'40px', height:'40px', justifyContent:'center', boxShadow:'0 4px 10px rgba(79, 70, 229, 0.3)'}} onClick={handleAiChat} disabled={aiLoading || (!chatInput.trim() && !chatImage)}><i className="fa-solid fa-paper-plane"></i></button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
</div>
      
      {/* Colors Modal */}
      <div className={`modal-overlay ${activeModal === 'colors' ? 'open' : ''}`}>
          <div className="modal-box" style={{width: '400px'}}>
              <h3 style={{marginBottom:'15px', color:'#2c3e50'}}>Choose Theme</h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', width: '100%', marginBottom: '20px', padding: '10px', background: '#f8fafc', borderRadius: '12px'}}>
                  {PRESET_THEMES.map((theme, idx) => ( <div key={idx} title={theme.name} onClick={() => { updateThemeCSS(theme.sidebarBg, theme.accentBlue, theme.textColor); setData({...data, theme: { sidebarBg: theme.sidebarBg, accentBlue: theme.accentBlue, textColor: theme.textColor }}); }} style={{ width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', background: `conic-gradient(from 270deg, ${theme.sidebarBg} 0deg 180deg, ${theme.accentBlue} 180deg 270deg, #ffffff 270deg 360deg)`, border: '2px solid white', boxShadow: (data.theme.sidebarBg === theme.sidebarBg && data.theme.accentBlue === theme.accentBlue) ? '0 0 0 3px #3498db, 0 5px 15px rgba(0,0,0,0.2)' : '0 2px 5px rgba(0,0,0,0.15)', transform: (data.theme.sidebarBg === theme.sidebarBg && data.theme.accentBlue === theme.accentBlue) ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s ease', margin: '0 auto' }} /> ))}
              </div>
              <h4 style={{fontSize:'14px', marginBottom:'15px', width:'100%', textAlign:'left', color:'#64748b'}}>Custom Colors</h4>
              <div className="color-row"> <span className="color-label">Sidebar Background</span> <div style={{display:'flex', alignItems:'center', gap:'10px'}}> <span style={{fontSize:'12px', color:'#666'}}>{data.theme.sidebarBg}</span> <input type="color" className="color-input" value={data.theme.sidebarBg} onChange={e => { updateThemeCSS(e.target.value, data.theme.accentBlue, data.theme.textColor); setData({...data, theme: {...data.theme, sidebarBg: e.target.value}}); }} /> </div> </div>
              <div className="color-row"> <span className="color-label">Accent Color</span> <div style={{display:'flex', alignItems:'center', gap:'10px'}}> <span style={{fontSize:'12px', color:'#666'}}>{data.theme.accentBlue}</span> <input type="color" className="color-input" value={data.theme.accentBlue} onChange={e => { updateThemeCSS(data.theme.sidebarBg, e.target.value, data.theme.textColor); setData({...data, theme: {...data.theme, accentBlue: e.target.value}}); }} /> </div> </div>
              <div className="color-row"> <span className="color-label">Main Text Color</span> <div style={{display:'flex', alignItems:'center', gap:'10px'}}> <span style={{fontSize:'12px', color:'#666'}}>{data.theme.textColor}</span> <input type="color" className="color-input" value={data.theme.textColor} onChange={e => { updateThemeCSS(data.theme.sidebarBg, data.theme.accentBlue, e.target.value); setData({...data, theme: {...data.theme, textColor: e.target.value}}); }} /> </div> </div>
              <div className="modal-actions"> <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Close</button> <button className="btn btn-remove" onClick={() => { updateThemeCSS(INITIAL_THEME.sidebarBg, INITIAL_THEME.accentBlue, INITIAL_THEME.textColor); setData({...data, theme: INITIAL_THEME}); }}>Reset Default</button> </div>
          </div>
      </div>

      {/* Crop Modal */}
      <div className={`modal-overlay ${activeModal === 'crop' ? 'open' : ''}`}>
          <div className="modal-box">
              <h3 style={{marginBottom:'10px'}}>Crop & Enhance</h3>
              <div className="img-container-crop"><img id="image-to-crop" src={croppingImg || ''} alt="" /></div>
              <div style={{marginBottom:'15px', width:'100%', display:'flex', flexDirection:'column', alignItems:'center'}}> <label style={{fontSize:'12px', fontWeight:600, color:'#64748b', marginBottom:'8px', textTransform:'uppercase'}}>Output Quality</label> <div style={{display:'flex', gap:'8px', background:'#f1f5f9', padding:'6px', borderRadius:'8px'}}> {[1, 2, 4].map(level => ( <button key={level} onClick={() => setEnhanceLevel(level as 1|2|4)} className="btn" style={{ background: enhanceLevel === level ? '#3b82f6' : 'transparent', color: enhanceLevel === level ? 'white' : '#64748b', boxShadow: enhanceLevel === level ? '0 2px 5px rgba(59, 130, 246, 0.3)' : 'none', border: '1px solid', borderColor: enhanceLevel === level ? '#2563eb' : 'transparent', transition: 'all 0.2s', fontSize: '12px' }}> {level}x {level === 1 ? '(Std)' : level === 2 ? '(HD)' : '(4K)'} </button> ))} </div> </div>
              <div className="modal-actions"> <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button> <button className="btn btn-save" onClick={performCrop}>Save Image</button> </div>
          </div>
      </div>

      {/* Image Options Modal */}
      <div className={`modal-overlay ${activeModal === 'img-opts-profile' || activeModal === 'img-opts-signature' ? 'open' : ''}`}>
          <div className="modal-box" style={{width: '300px', textAlign: 'center'}}>
              <h3 style={{marginBottom: '15px'}}>Image Options</h3>
              <div className="modal-actions" style={{flexDirection: 'column'}}> <button className="btn btn-blue" style={{justifyContent: 'center'}} onClick={() => { setActiveModal(null); if(activeModal==='img-opts-profile') fileInputRef.current?.click(); else sigInputRef.current?.click(); }}>Upload / Change</button> <button className="btn btn-remove" style={{justifyContent: 'center'}} onClick={() => { setActiveModal(null); if(activeModal==='img-opts-profile') setData({...data, profileImage: DEFAULT_PROFILE_URI}); else setData({...data, signatureImage: null}); }}>Remove</button> <button className="btn btn-cancel" style={{justifyContent: 'center'}} onClick={() => setActiveModal(null)}>Cancel</button> </div>
          </div>
      </div>

       {/* Admin Security Modal */}
       <div className={`modal-overlay ${activeModal === 'admin-sec' ? 'open' : ''}`}>
           <div className="modal-box" style={{width:'400px'}}>
               <h3 style={{marginBottom:'15px', color:'#2c3e50'}}>Admin Security</h3>
               {adminSecStep === 'verify' && ( <div style={{width:'100%', background:'#eef2ff', padding:'15px', borderRadius:'10px'}}> <div className="input-group" style={{marginBottom:'15px'}}> <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:600}}>Security Question</label> <select className="login-input" value={secQ} onChange={e => setSecQ(e.target.value)} style={{width:'100%', padding:'10px'}}> <option value="1">Best Institute</option> <option value="2">Village Name</option> <option value="4">Primary School Name</option> </select> </div> <div className="input-group" style={{marginBottom:'15px'}}> <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:600}}>Your Answer</label> <input type="text" className="login-input" style={{width:'100%', padding:'10px'}} value={secAns} onChange={e => setSecAns(e.target.value)} /> </div> <div className="input-group"> <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:600}}>Captcha: {captchaVal}</label> <input type="text" className="login-input" style={{width:'100%', padding:'10px'}} placeholder="Enter Code" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} /> </div> <div className="modal-actions"> <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button> <button className="btn btn-save" onClick={verifyAdminSecurity}>Verify</button> </div> </div> )}
               {adminSecStep === 'update' && ( <div style={{width:'100%', background:'#f0fdf4', padding:'15px', borderRadius:'10px'}}> <h4 style={{marginBottom:'10px', color:'#166534'}}>Credentials & API Key</h4> <div style={{marginBottom: '15px'}}> <label style={{display:'block', fontSize:'12px', fontWeight:600, marginBottom:'4px'}}>Update Admin Login (Optional)</label> <input type="text" className="login-input" style={{width:'100%', padding:'8px', marginBottom:'8px'}} placeholder="New Username" value={newAdminUser} onChange={e => setNewAdminUser(e.target.value)} /> <input type="text" className="login-input" style={{width:'100%', padding:'8px'}} placeholder="New Password" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} /> </div> <div style={{marginBottom: '15px', borderTop: '1px solid #ddd', paddingTop: '15px'}}> <label style={{display:'block', fontSize:'12px', fontWeight:600, marginBottom:'4px'}}>AI API Key</label> <input type="password" className="login-input" style={{width:'100%', padding:'8px'}} placeholder="Enter Gemini API Key" value={newApiKey} onChange={e => setNewApiKey(e.target.value)} /> <small style={{display:'block', marginTop:'4px', color:'#666', fontSize:'10px'}}>Default: gen-lang-client-...</small> </div> <div className="modal-actions"> <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button> <button className="btn btn-save" onClick={saveAdminCreds}>Save All</button> </div> </div> )}
           </div>
       </div>

        {/* Guest Manager Modal */}
        <div className={`modal-overlay ${activeModal === 'guest-mgr' ? 'open' : ''}`}>
           <div className="modal-box" style={{width: '500px'}}>
               <h3 style={{marginBottom:'15px', color:'#2c3e50'}}>Manage Guest Access</h3>
               <div style={{width:'100%', background:'#f9f9f9', padding:'15px', borderRadius:'8px', marginBottom:'15px'}}> <h4 style={{marginBottom:'10px', fontSize:'13px'}}>Create New Guest Pass</h4> <div className="guest-form-row"> <input type="text" className="guest-input" placeholder="User" value={newGuestUser} onChange={e => setNewGuestUser(e.target.value)} /> <input type="text" className="guest-input" placeholder="Pass" value={newGuestPass} onChange={e => setNewGuestPass(e.target.value)} /> </div> <div className="guest-perms"> {Object.keys(guestPerms).map(p => ( <label key={p}><input type="checkbox" checked={(guestPerms as any)[p]} onChange={e => setGuestPerms({...guestPerms, [p]: e.target.checked})} /> {p.toUpperCase()}</label> ))} </div> <div className="guest-form-row" style={{alignItems: 'center'}}> <span style={{fontSize:'12px', fontWeight:600, color:'#555'}}>Time (Mins):</span> <input type="number" className="guest-input" value={newGuestTime} onChange={e => setNewGuestTime(parseInt(e.target.value))} style={{maxWidth:'80px'}} /> <button className="btn btn-save" onClick={() => { const expiry = Date.now() + (newGuestTime * 60000); const newGuest = { user: newGuestUser, pass: newGuestPass, expiry, duration: newGuestTime, permissions: guestPerms }; const list = [...guestList, newGuest]; localStorage.setItem('rajResumeGuests', JSON.stringify(list)); setGuestList(list); setNewGuestUser(''); setNewGuestPass(''); }}>Generate</button> </div> </div>
               <div style={{width:'100%', maxHeight:'200px', overflowY:'auto'}}> <table className="guest-table"> <thead><tr><th>User</th><th>Duration</th><th>Action</th></tr></thead> <tbody> {guestList.map((g, i) => ( <tr key={i}> <td>{g.user}</td> <td>{g.duration}m</td> <td><button className="btn btn-remove" style={{padding:'4px 8px'}} onClick={() => { const list = guestList.filter((_, idx) => idx !== i); localStorage.setItem('rajResumeGuests', JSON.stringify(list)); setGuestList(list); }}><i className="fa-solid fa-trash"></i></button></td> </tr> ))} </tbody> </table> </div>
               <div className="modal-actions"> <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Close</button> </div>
           </div>
        </div>

         {/* Social Modal */}
         <div className={`modal-overlay ${activeModal === 'social' ? 'open' : ''}`}>
             <div className="modal-box" style={{width:'500px'}}>
                 <h3 style={{marginBottom:'15px'}}>Manage Social Media</h3>
                 <div style={{width:'100%', marginBottom:'20px'}}> {data.socials.map((item, index) => ( <div key={item.id} className="social-row"> <input type="checkbox" checked={item.enabled} onChange={e => { const newSocials = [...data.socials]; newSocials[index].enabled = e.target.checked; setData({...data, socials: newSocials}); }} /> <div style={{width:'24px', textAlign:'center'}}><i className={item.icon} style={{color:'#3498db'}}></i></div> <input type="text" className="social-input" value={item.url} onChange={e => { const newSocials = [...data.socials]; newSocials[index].url = e.target.value; setData({...data, socials: newSocials}); }} /> </div> ))} </div>
                 <div className="modal-actions"> <button className="btn btn-save" onClick={() => setActiveModal(null)}>Done</button> </div>
             </div>
         </div>

         {/* Cert Upload Modal */}
         <div className={`modal-overlay ${activeModal === 'cert' ? 'open' : ''}`}>
             <div className="modal-box" style={{width:'500px'}}>
                 <h3 style={{marginBottom:'10px', color:'#1e3a8a'}}>Manage Certificates</h3>
                 {certAuthStep === 'login' ? ( <div style={{width: '100%', background: '#f8fafc', padding: '15px', borderRadius: '10px'}}> <h4 style={{marginBottom:'10px', color:'#334155'}}>Verification Required</h4> <div className="input-group" style={{marginBottom:'10px'}}> <input type="text" className="login-input" placeholder="Admin Username" value={certAuthUser} onChange={e => setCertAuthUser(e.target.value)} /> </div> <div className="input-group" style={{marginBottom:'10px'}}> <input type="password" className="login-input" placeholder="Admin Password" value={certAuthPass} onChange={e => setCertAuthPass(e.target.value)} /> </div> <div className="input-group" style={{marginBottom:'10px', display:'flex', gap:'10px', alignItems:'center'}}> <div className="captcha-display" style={{flex:1, fontSize:'16px'}} onClick={() => setCertCaptchaVal(generateCaptcha())}>{certCaptchaVal}</div> <input type="text" className="login-input" style={{flex:1}} placeholder="Captcha" value={certCaptcha} onChange={e => setCertCaptcha(e.target.value)} /> </div> <div className="modal-actions"> <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button> <button className="btn btn-save" onClick={verifyCertAuth}>Access</button> </div> </div> ) : ( <div style={{width:'100%'}}> {[['M.A Certificate', 'ma'], ['B.A Certificate', 'ba'], ['12th Grade', '12'], ['10th Grade', '10']].map(([label, key]) => ( <div key={key} className="input-group" style={{marginBottom:'15px'}}> <label style={{display:'block', fontSize:'13px', fontWeight:600}}>{label}</label> <div style={{display:'flex', gap:'5px'}}> <input type="text" className="login-input" style={{flex:1, padding:'8px'}} placeholder="Link or Data URI" value={certLinks[key as keyof CertLinks] || ''} onChange={e => setCertLinks({...certLinks, [key]: e.target.value})} /> <button className="btn btn-purple" style={{padding:'8px 12px'}} title="Upload File" onClick={() => { setActiveCertKey(key as keyof CertLinks); certUploadRef.current?.click(); }}> <i className="fa-solid fa-upload"></i> </button> </div> </div> ))} <div className="modal-actions"> <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Close</button> <button className="btn btn-save" onClick={() => { localStorage.setItem('rajCertificates', btoa(JSON.stringify(certLinks))); setActiveModal(null); }}>Save Changes</button> </div> </div> )}
             </div>
         </div>
    </div>
  );
};

export default App;