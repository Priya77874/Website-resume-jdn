import React, { useState, useEffect, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Editable } from './components/Editable';
import { rewriteContent, chatWithAi } from './services/geminiService';
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

// Admin Credentials Verification Constants (Matches LoginScreen)
const DEFAULT_USER_ENC = "MTAxNzEwMjk="; // 10171029
const DEFAULT_PASS_ENC = "UmFqQDIwMDQwNg=="; // Raj@200406

const DEFAULT_PROFILE_URI = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect fill='%23f0f0f0' width='150' height='150'/%3E%3Ctext fill='%23999999' font-family='sans-serif' font-size='20' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EPhoto%3C/text%3E%3C/svg%3E";

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
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTarget, setAiTarget] = useState<keyof ResumeData>('objective');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  // Load Data
  useEffect(() => {
    const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const saved = localStorage.getItem('rajResumeData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure date is updated to today's date
        const updatedData = { ...INITIAL_DATA, ...parsed, date: currentDate };
        setData(updatedData);
        setHistory([ updatedData ]); 
      } catch (e) { console.error("Load error", e); }
    } else {
        // Force update date even if using initial data
        setData(prev => ({...prev, date: currentDate}));
    }
    
    // Load Certificates
    const savedCerts = localStorage.getItem('rajCertificates');
    if(savedCerts) {
      try { setCertLinks(JSON.parse(atob(savedCerts))); } catch(e) {}
    }

    // Load Colors
    const savedColors = localStorage.getItem('rajResumeColors');
    if(savedColors) {
        const c = JSON.parse(savedColors);
        updateThemeCSS(c.sidebar, c.accent, c.text);
        setData(prev => ({...prev, theme: {sidebarBg: c.sidebar, accentBlue: c.accent, textColor: c.text}}));
    }
    
    // Automatic Geolocation Update
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const json = await response.json();
          const city = json.address.city || json.address.town || json.address.village || json.address.state_district;
          if (city) {
            setData(prev => ({...prev, place: city}));
          }
        } catch (e) {
          // Silent fail or default
        }
      });
    }

    // Resize
    const handleResize = () => fitToScreen();
    window.addEventListener('resize', handleResize);
    setTimeout(fitToScreen, 100);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save Data & Manage History
  useEffect(() => {
    localStorage.setItem('rajResumeData', JSON.stringify(data));
    
    if(isTimeTraveling.current) {
        isTimeTraveling.current = false;
        return;
    }

    const handler = setTimeout(() => {
        setHistory(prev => {
            const upToCurrent = prev.slice(0, historyIndex + 1);
            const currentHead = upToCurrent[upToCurrent.length - 1];
            
            // Push only if meaningful change
            if (JSON.stringify(currentHead) !== JSON.stringify(data)) {
                 return [...upToCurrent, data];
            }
            return prev;
        });
    }, 800); // 800ms debounce for history

    return () => clearTimeout(handler);
  }, [data]);

  // Sync index when history grows
  useEffect(() => {
      setHistoryIndex(history.length - 1);
  }, [history.length]);

  // Security, Timer & Dynamic Link Rotation
  useEffect(() => {
    // Advanced Security: Block Shortcuts & Context Menu
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspect)
      // Block Ctrl+U (View Source), Ctrl+S (Save), Ctrl+P (Print)
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
        (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'p'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
    };
    
    // Prevent Touch Context (Long Press on Mobile)
    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 1) { // Block multi-touch
            e.preventDefault();
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('touchstart', handleTouchStart, {passive: false});

    let timer: any;
    if (authMode === 'guest' && guestUser) {
        timer = setInterval(() => {
            const diff = guestUser.expiry - Date.now();
            if (diff <= 0) {
                logout();
                return;
            }
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${m}:${s < 10 ? '0'+s : s}`);
        }, 1000);
    }

    // Auto-update Dynamic Security Params Every 5 Seconds
    const rotater = setInterval(() => {
         // Generate fake IP for visual trust
         const ip = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
         setSecureIP(ip);
         
         // Generate Cryptographic Token for Link
         const randomBytes = new Uint8Array(16);
         window.crypto.getRandomValues(randomBytes);
         const token = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
         setSecureToken(token);
    }, 5000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('touchstart', handleTouchStart);
      if (timer) clearInterval(timer);
      clearInterval(rotater);
    }
  }, [authMode, guestUser]);

  // SECURITY: Inactivity Timeout Effect
  useEffect(() => {
      if (authMode === 'none') return;
      
      let inactivityTimer: ReturnType<typeof setTimeout>;
      const resetInactivity = () => {
          clearTimeout(inactivityTimer);
          // 10 Minutes timeout for security
          inactivityTimer = setTimeout(() => {
              alert("Session expired due to inactivity for security.");
              logout();
          }, 10 * 60 * 1000); 
      };
      
      // Events to track activity
      window.addEventListener('mousemove', resetInactivity);
      window.addEventListener('keydown', resetInactivity);
      window.addEventListener('click', resetInactivity);
      
      resetInactivity(); // Start timer
      
      return () => {
          window.removeEventListener('mousemove', resetInactivity);
          window.removeEventListener('keydown', resetInactivity);
          window.removeEventListener('click', resetInactivity);
          clearTimeout(inactivityTimer);
      };
  }, [authMode]);

  // Scroll Chat to bottom
  useEffect(() => {
    if(chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, aiMode]);

  const updateThemeCSS = (sidebar: string, accent: string, text: string) => {
      document.documentElement.style.setProperty('--sidebar-bg', sidebar);
      document.documentElement.style.setProperty('--accent-blue', accent);
      document.documentElement.style.setProperty('--text-color', text);
  };

  const fitToScreen = () => {
       const container = document.getElementById('resume-container');
       const viewport = document.getElementById('viewport');
       if (container && viewport) {
          const width = viewport.offsetWidth;
          const availableWidth = width - (width < 600 ? 0 : 40);
          const scale = Math.min(1, availableWidth / 794);
          setZoomLevel(scale);
       }
  };

  const logout = () => {
    setAuthMode('none');
    setGuestUser(null);
    setIsEditing(false);
    setToolbarOpen(false);
    document.body.classList.remove('guest-mode');
  };

  // SECURITY: Sanitization Function
  const sanitize = (val: string) => {
      return val.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                .replace(/<[^>]+>/g, ""); // Strip HTML tags for simple inputs
  };

  const canEdit = authMode === 'admin' || (authMode === 'guest' && guestUser?.permissions.edit);

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let cap = "";
    for(let i=0; i<6; i++) cap += chars[Math.floor(Math.random() * chars.length)];
    return cap;
  };

  const performUndo = () => {
      if (historyIndex > 0) {
          isTimeTraveling.current = true;
          const prevIndex = historyIndex - 1;
          setHistoryIndex(prevIndex);
          setData(history[prevIndex]);
      }
  };

  const performRedo = () => {
      if (historyIndex < history.length - 1) {
          isTimeTraveling.current = true;
          const nextIndex = historyIndex + 1;
          setHistoryIndex(nextIndex);
          setData(history[nextIndex]);
      }
  };

  // --- Handlers ---

  const downloadPDF = () => {
    const element = document.getElementById('resume-content');
    if (!element || !window.html2pdf) return;
    
    // Temporarily reset transform for clean capture
    const originalTransform = element.style.transform;
    const originalMargin = element.style.margin;
    
    element.style.transform = 'scale(1)';
    element.style.margin = '0';
    
    // Hide signature placeholder if present
    const sigPlaceholder = document.getElementById('sig-placeholder');
    if(sigPlaceholder) sigPlaceholder.style.display = 'none';

    // Hide Watermark
    const watermark = document.querySelector('.security-watermark') as HTMLElement;
    let originalWatermarkDisplay = '';
    if(watermark) {
        originalWatermarkDisplay = watermark.style.display;
        watermark.style.display = 'none';
    }

    const opt = {
      margin: 0,
      filename: 'Raj_Resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
      enableLinks: true // Ensure links are active in PDF
    };
    
    window.html2pdf().set(opt).from(element).save().then(() => {
        // Restore
        element.style.transform = originalTransform;
        element.style.margin = originalMargin;
        if(sigPlaceholder) sigPlaceholder.style.display = 'flex';
        if(watermark) watermark.style.display = originalWatermarkDisplay;
    });
  };

  const downloadJPG = () => {
      const element = document.getElementById('resume-content');
      if(!element || !window.html2canvas) return;
      
      const originalTransform = element.style.transform;
      const originalMargin = element.style.margin;
      
      element.style.transform = 'scale(1)';
      element.style.margin = '0';

      const sigPlaceholder = document.getElementById('sig-placeholder');
      if(sigPlaceholder) sigPlaceholder.style.display = 'none';

      // Hide Watermark
      const watermark = document.querySelector('.security-watermark') as HTMLElement;
      let originalWatermarkDisplay = '';
      if(watermark) {
          originalWatermarkDisplay = watermark.style.display;
          watermark.style.display = 'none';
      }

      window.html2canvas(element, {scale: 2, useCORS: true}).then(canvas => {
          const link = document.createElement('a');
          link.download = 'Raj_Resume.jpg';
          link.href = canvas.toDataURL('image/jpeg', 0.9);
          link.click();
          
          element.style.transform = originalTransform;
          element.style.margin = originalMargin;
          if(sigPlaceholder) sigPlaceholder.style.display = 'flex';
          if(watermark) watermark.style.display = originalWatermarkDisplay;
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
    } catch (e) {
      alert(e instanceof Error ? e.message : "AI Error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiChat = async () => {
      if(!chatInput.trim()) return;
      const userMsg = chatInput;
      setChatHistory(prev => [...prev, {role: 'user', text: userMsg}]);
      setChatInput('');
      setAiLoading(true);
      try {
          const res = await chatWithAi(userMsg);
          setChatHistory(prev => [...prev, {role: 'ai', text: res}]);
      } catch(e) {
          setChatHistory(prev => [...prev, {role: 'ai', text: "Error: Unable to get response."}]);
      } finally {
          setAiLoading(false);
      }
  };

  const applyAiResult = () => {
      if (Array.isArray(data[aiTarget])) {
         const list = aiResult.split(/<br>|\n/).map(s => s.replace(/<[^>]*>/g, '').trim()).filter(s => s);
         setData(prev => ({ ...prev, [aiTarget]: list }));
      } else {
         setData(prev => ({ ...prev, [aiTarget]: aiResult }));
      }
      setActiveModal(null);
      setAiResult('');
  };

  // Contact Handlers
  const handlePhoneClick = () => {
    if (isEditing) return;
    const clean = data.phone.replace(/\D/g, '');
    setContactModal({
        title: "Phone Options",
        actions: [
            { label: "Call", icon: "fa-solid fa-phone", fn: () => window.location.href = `tel:${clean}` },
            { label: "WhatsApp", icon: "fa-brands fa-whatsapp", fn: () => window.open(`https://wa.me/91${clean}`, '_blank') },
            { label: "Copy Number", icon: "fa-solid fa-copy", fn: () => { navigator.clipboard.writeText(data.phone); setContactModal(null); } }
        ]
    });
  };

  const handleEmailClick = () => {
    if (isEditing) return;
    setContactModal({
        title: "Email Options",
        actions: [
            { label: "Mail App", icon: "fa-solid fa-envelope", fn: () => window.location.href = `mailto:${data.email}` },
            { label: "Gmail", icon: "fa-brands fa-google", fn: () => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${data.email}`, '_blank') },
            { label: "Outlook", icon: "fa-brands fa-microsoft", fn: () => window.open(`https://outlook.live.com/mail/0/deeplink/compose?to=${data.email}`, '_blank') },
            { label: "Copy Email", icon: "fa-solid fa-copy", fn: () => { navigator.clipboard.writeText(data.email); setContactModal(null); } }
        ]
    });
  };

  const handleAddressClick = () => {
    if (isEditing) return;
    const encoded = encodeURIComponent(data.address);
    setContactModal({
        title: "Location Options",
        actions: [
            { label: "Open in Maps", icon: "fa-solid fa-map-location-dot", fn: () => window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank') },
            { label: "Copy Address", icon: "fa-solid fa-copy", fn: () => { navigator.clipboard.writeText(data.address); setContactModal(null); } }
        ]
    });
  };

  // Details Modal Handlers
  const openDetailsModal = () => {
      setDmTab('work');
      setLocalDetails([...data.experience]); // Start with work
      setActiveModal('details');
  };

  const switchDmTab = (tab: string) => {
      setDmTab(tab);
      // Load current data into local state
      if(tab === 'work') setLocalDetails([...data.experience]);
      else if(tab === 'tech') setLocalDetails([...data.techSkills]);
      else if(tab === 'soft') setLocalDetails([...data.softSkills]);
      else if(tab === 'lang') setLocalDetails([...data.languages]);
      else if(tab === 'hobby') setLocalDetails([...data.hobbies]);
  };

  const addDmRows = () => {
      const newItems = [];
      for(let i=0; i<rowsToAdd; i++) {
          if(dmTab === 'work') newItems.push({id: Date.now()+i, title:'', company:''});
          else newItems.push('');
      }
      setLocalDetails([...localDetails, ...newItems]);
  };

  const saveDetails = () => {
      const filtered = dmTab === 'work' 
        ? localDetails.filter((i:any) => i.title || i.company)
        : localDetails.filter((i:any) => i && i.trim() !== '');

      if(dmTab === 'work') setData({...data, experience: filtered});
      else if(dmTab === 'tech') setData({...data, techSkills: filtered});
      else if(dmTab === 'soft') setData({...data, softSkills: filtered});
      else if(dmTab === 'lang') setData({...data, languages: filtered});
      else if(dmTab === 'hobby') setData({...data, hobbies: filtered});
      
      setActiveModal(null);
  };

  // Cert Logic - Updated for Dynamic Security
  const handleCertClick = (key: keyof CertLinks) => {
      if(isEditing) return;
      const base = certLinks[key];
      
      if(base) {
          // If it's a Base64/Data URI (Uploaded file)
          // Generate a UNIQUE Blob URL for this click only
          if(base.startsWith('data:')) {
              // Convert base64 to blob
              try {
                  const arr = base.split(',');
                  const match = arr[0].match(/:(.*?);/);
                  if (!match) return;
                  const mime = match[1];
                  const bstr = atob(arr[1]);
                  let n = bstr.length;
                  const u8arr = new Uint8Array(n);
                  while(n--){
                      u8arr[n] = bstr.charCodeAt(n);
                  }
                  const blob = new Blob([u8arr], {type:mime});
                  const blobUrl = URL.createObjectURL(blob);
                  
                  // Open unique blob url
                  const w = window.open(blobUrl, '_blank');
                  
                  // Revoke after 1 min to ensure it's "temp" and secure
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
              } catch(e) {
                  alert("Certificate file corrupted.");
              }
              return;
          }
          
          // If it's a Web URL: Append Dynamic Security Params (5s rotation)
          // This "encodes" the link making it unique every time it's clicked
          const separator = base?.includes('?') ? '&' : '?';
          // Params: _token (random), _ts (time), _s (node), _v (version)
          const dynamicUrl = `${base}${separator}_token=${secureToken}&_ts=${Date.now()}&_node=${secureIP}&_security=high`;
          const w = window.open(dynamicUrl, '_blank');
          if(w) w.opener = null;
      }
  };

  // Cert Auth Verification
  const verifyCertAuth = () => {
      if(certCaptcha.trim().toUpperCase() !== certCaptchaVal) {
          alert("Incorrect Captcha");
          setCertCaptchaVal(generateCaptcha());
          return;
      }

      const stored = localStorage.getItem('rajAdminConfig');
      const creds = stored ? JSON.parse(stored) : { user: DEFAULT_USER_ENC, pass: DEFAULT_PASS_ENC };
      
      const u = btoa(certAuthUser);
      const p = btoa(certAuthPass);

      if (u === creds.user && p === creds.pass) {
          setCertAuthStep('manage');
      } else {
          alert("Invalid Credentials");
          setCertCaptchaVal(generateCaptcha());
      }
  };
  
  // Cert File Upload
  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0] && activeCertKey) {
          const file = e.target.files[0];
          if(file.size > 2 * 1024 * 1024) { // 2MB Limit Warning
              if(!confirm("File is large (>2MB). Saving might fail or slow down browser. Continue?")) return;
          }
          const reader = new FileReader();
          reader.onload = (ev) => {
              const res = ev.target?.result as string;
              setCertLinks(prev => ({...prev, [activeCertKey]: res}));
          };
          reader.readAsDataURL(file);
      }
  };

  // Image Logic
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'signature') => {
      if(e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setCroppingImg(ev.target?.result as string);
              setCropType(type);
              setActiveModal('crop');
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  useEffect(() => {
      if(activeModal === 'crop' && croppingImg && window.Cropper) {
          const img = document.getElementById('image-to-crop') as HTMLImageElement;
          if(cropperRef.current) cropperRef.current.destroy();
          cropperRef.current = new window.Cropper(img, {aspectRatio: cropType === 'profile' ? 1 : NaN, viewMode: 1});
      }
  }, [activeModal, croppingImg]);

  const performCrop = () => {
      if(cropperRef.current) {
          // Use transparent fill to handle edge cases where crop might exceed image bounds
          const canvas = cropperRef.current.getCroppedCanvas({
              width: 300,
              fillColor: 'transparent'
          });
          
          // Advanced Background Removal for Signatures
          if (cropType === 'signature') {
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const data = imgData.data;
                  
                  // Contrast enhancement factor
                  const contrast = 1.2; 
                  const intercept = 128 * (1 - contrast);
                  let opaqueCount = 0;

                  for (let i = 0; i < data.length; i += 4) {
                      let r = data[i];
                      let g = data[i + 1];
                      let b = data[i + 2];
                      
                      // Apply contrast
                      r = r * contrast + intercept;
                      g = g * contrast + intercept;
                      b = b * contrast + intercept;

                      // Clamp values
                      r = Math.min(255, Math.max(0, r));
                      g = Math.min(255, Math.max(0, g));
                      b = Math.min(255, Math.max(0, b));

                      // Calculate luminance
                      // Formula: 0.299*R + 0.587*G + 0.114*B
                      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                      
                      // Threshold for background removal
                      if (brightness > 150) {
                          data[i + 3] = 0; // Transparent
                      } else {
                          data[i + 3] = 255; // Opaque
                          opaqueCount++;
                      }
                  }
                  
                  if (opaqueCount < 50) {
                      alert("Please ensure the signature is dark on a light background.");
                      return;
                  }
                  
                  ctx.putImageData(imgData, 0, 0);
              }
          }

          const url = canvas.toDataURL('image/png');
          if(cropType === 'profile') setData({...data, profileImage: url});
          else setData({...data, signatureImage: url});
          setActiveModal(null);
      }
  };

  // Verify Admin Security Logic
  const verifyAdminSecurity = () => {
      if(captchaInput.trim().toUpperCase() !== captchaVal) {
          alert("Incorrect Captcha");
          setCaptchaVal(generateCaptcha());
          return;
      }
      
      let correctAnsEnc = "";
      if (secQ === "1") correctAnsEnc = SEC_ANS_1;
      else if (secQ === "2") correctAnsEnc = SEC_ANS_2;
      else if (secQ === "4") correctAnsEnc = SEC_ANS_4;
      
      const correctAns = atob(correctAnsEnc);
      if(secAns.trim().toLowerCase() !== correctAns.toLowerCase()) {
          alert("Incorrect Answer");
          setCaptchaVal(generateCaptcha());
          return;
      }
      
      setAdminSecStep('update');
      // Load current API key
      const storedKey = localStorage.getItem('rajAiApiKey') || "";
      setNewApiKey(storedKey);
  };

  const saveAdminCreds = () => {
      if(!newAdminUser && !newAdminPass && !newApiKey) return;
      
      // Update Credentials if provided
      if(newAdminUser && newAdminPass) {
          const creds = { user: btoa(newAdminUser), pass: btoa(newAdminPass) };
          localStorage.setItem('rajAdminConfig', JSON.stringify(creds));
          alert("Credentials Updated. Please Re-login.");
          logout();
      }

      // Update API Key
      if(newApiKey) {
          localStorage.setItem('rajAiApiKey', newApiKey);
          alert("API Key Updated Successfully");
      }
      
      setActiveModal(null);
  };
  
  // Resume Form Navigation
  const formTabs = ['personal', 'education', 'experience', 'skills', 'misc'];
  const currentTabIdx = formTabs.indexOf(formTab);

  const handleNextTab = () => {
    if (currentTabIdx < formTabs.length - 1) setFormTab(formTabs[currentTabIdx + 1]);
  };
  
  const handlePrevTab = () => {
    if (currentTabIdx > 0) setFormTab(formTabs[currentTabIdx - 1]);
  };

  // --- UI Helpers for Fill Details Modal ---
  
  const calculateFormProgress = () => {
      let filled = 0;
      let total = 0;
      
      // Personal (10 fields)
      const pKeys: (keyof ResumeData)[] = ['name', 'role', 'phone', 'email', 'address', 'fatherName', 'dob', 'gender', 'nationality', 'maritalStatus'];
      total += pKeys.length;
      pKeys.forEach(k => { if(data[k]) filled++; });
      
      // Education (4 entries x 4 fields = 16)
      total += 16;
      data.education.forEach(e => {
          if(e.qualification) filled++;
          if(e.board) filled++;
          if(e.year) filled++;
          if(e.score) filled++;
      });
      
      // Experience (at least 1)
      total += 2;
      if(data.experience.length > 0 && data.experience[0].title) filled++;
      if(data.experience.length > 0 && data.experience[0].company) filled++;
      
      // Skills (4 fields)
      total += 4;
      if(data.techSkills.length > 0 && data.techSkills[0]) filled++;
      if(data.softSkills.length > 0 && data.softSkills[0]) filled++;
      if(data.languages.length > 0 && data.languages[0]) filled++;
      if(data.hobbies.length > 0 && data.hobbies[0]) filled++;
      
      return Math.min(100, Math.round((filled / total) * 100));
  };
  
  const isSectionComplete = (section: string) => {
      if(section === 'personal') return !!(data.name && data.phone && data.email);
      if(section === 'education') return !!(data.education[2].qualification && data.education[2].score);
      if(section === 'experience') return data.experience.length > 0 && !!data.experience[0].title;
      if(section === 'skills') return data.techSkills.length > 0;
      if(section === 'misc') return !!data.declaration;
      return false;
  };

  const renderInput = (label: string, value: string, onChange: (val: string) => void, placeholder = "") => (
      <div className="input-group" style={{marginBottom:'15px'}}>
          <label style={{display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:600, color:'#475569', marginBottom:'6px'}}>
              <span>{label}</span>
              {value ? <i className="fa-solid fa-check-circle" style={{color:'#22c55e'}}></i> : <span style={{color:'#ef4444'}}>*</span>}
          </label>
          <input 
              type="text" 
              className="login-input" 
              style={{
                  width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #e2e8f0',
                  transition: 'all 0.2s', fontSize:'14px', outline:'none', background: '#f8fafc'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = '#fff'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
              placeholder={placeholder || `Enter ${label}`}
              value={value} 
              onChange={e => onChange(sanitize(e.target.value))} 
          />
      </div>
  );

  if (authMode === 'none') {
    return <LoginScreen 
      onAdminLogin={() => { setAuthMode('admin'); setToolbarOpen(true); document.body.classList.remove('guest-mode'); }} 
      onGuestLogin={(g) => { setGuestUser(g); setAuthMode('guest'); setToolbarOpen(true); document.body.classList.add('guest-mode'); if(g.permissions.toggle) document.body.classList.add('allow-toggle'); if(!g.permissions.edit) document.body.classList.add('guest-no-edit'); if(!g.permissions.img) document.body.classList.add('guest-no-img-edit'); }} 
    />;
  }

  return (
    <div id="protected-content">
      
      {/* Floating Settings Button */}
      {(!guestUser || guestUser.permissions.toggle) && (
        <div 
            onClick={() => setToolbarOpen(!toolbarOpen)}
            className={`settings-toggle ${toolbarOpen ? '' : 'timer-active'}`}
            title="Toggle Toolbar"
        >
            {authMode === 'guest' && !toolbarOpen ? <><i className="fa-solid fa-clock"></i> {timeLeft}</> : <i className={`fa-solid ${toolbarOpen ? 'fa-times' : 'fa-gear'}`}></i>}
        </div>
      )}

      {/* Admin Toolbar */}
      <div className={`toolbar ${toolbarOpen ? 'active' : ''}`} id="admin-toolbar">
        <div className="toolbar-header">
            <div className="toolbar-top-row">
                <div className="toolbar-title">
                    Raj Resume Builder <span style={{fontSize:'12px', fontWeight:400}}>({authMode === 'admin' ? 'Admin Mode' : 'Guest Mode'})</span>
                </div>
                <button className="btn btn-cancel" onClick={() => setToolbarOpen(false)}><i className="fa-solid fa-times"></i></button>
            </div>
            {authMode === 'guest' && <div id="guest-timer-display" style={{display:'block'}}><i className="fa-solid fa-clock"></i> <span id="time-val">{timeLeft}</span></div>}
        </div>
        
        <div className="tools">
            {canEdit && (
                <>
                    <button className={`btn ${isEditing ? 'btn-save' : 'btn-edit'}`} onClick={() => setIsEditing(!isEditing)}>
                        <i className={`fa-solid ${isEditing ? 'fa-check' : 'fa-pen-to-square'}`}></i> {isEditing ? 'Save Changes' : 'Edit Details'}
                    </button>
                    <button className="btn btn-blue" onClick={() => {
                        setRevertData(JSON.parse(JSON.stringify(data)));
                        setFormTab('personal');
                        setActiveModal('resume-form');
                    }}>
                        <i className="fa-solid fa-file-pen"></i> Fill Details
                    </button>
                    <button className="btn btn-purple" onClick={openDetailsModal}><i className="fa-solid fa-list-check"></i> Edit Points</button>
                    <button className="btn btn-ai" onClick={() => setActiveModal('ai')}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i> AI Assistant
                    </button>
                </>
            )}

            <button className="btn btn-undo" onClick={performUndo} disabled={historyIndex <= 0} style={{opacity: historyIndex <= 0 ? 0.5 : 1}}>
                <i className="fa-solid fa-rotate-left"></i> Undo
            </button>
            <button className="btn btn-redo" onClick={performRedo} disabled={historyIndex >= history.length - 1} style={{opacity: historyIndex >= history.length - 1 ? 0.5 : 1}}>
                <i className="fa-solid fa-rotate-right"></i> Redo
            </button>

            <button className="btn btn-purple" onClick={() => setActiveModal('colors')}>
                <i className="fa-solid fa-palette"></i> Theme Colors
            </button>
            
            {authMode === 'admin' && (
                <>
                    <button className="btn btn-cert" onClick={() => { setCertAuthStep('login'); setCertCaptchaVal(generateCaptcha()); setActiveModal('cert'); }}><i className="fa-solid fa-certificate"></i> Manage Certificates</button>
                    <button className="btn btn-guest-mgr" onClick={() => { setGuestList(JSON.parse(localStorage.getItem('rajResumeGuests')||'[]')); setActiveModal('guest-mgr'); }}><i className="fa-solid fa-user-clock"></i> Guest Manager</button>
                    <button className="btn btn-security" onClick={() => { setAdminSecStep('verify'); setCaptchaVal(generateCaptcha()); setActiveModal('admin-sec'); }}><i className="fa-solid fa-lock"></i> Admin Security</button>
                </>
            )}

            {(!guestUser || guestUser.permissions.ma) && (
                <button className="btn btn-blue" onClick={() => { 
                    const newData = {...data};
                    newData.education[0].isHidden = !newData.education[0].isHidden;
                    setData(newData);
                }}>
                    <i className="fa-solid fa-graduation-cap"></i> Toggle M.A.
                </button>
            )}

            {(!guestUser || guestUser.permissions.social) && (
                <button className="btn btn-blue" onClick={() => setActiveModal('social')}>
                    <i className="fa-brands fa-linkedin"></i> Manage Socials
                </button>
            )}

            {(!guestUser || guestUser.permissions.pdf) && (
                <button className="btn btn-pdf" onClick={downloadPDF}><i className="fa-solid fa-file-pdf"></i> PDF</button>
            )}

            {(!guestUser || guestUser.permissions.jpg) && (
                <button className="btn btn-jpg" onClick={downloadJPG}><i className="fa-solid fa-image"></i> JPG</button>
            )}

            <button className="btn btn-remove" onClick={logout} style={{backgroundColor:'#2c3e50'}}>
                <i className="fa-solid fa-right-from-bracket"></i> Log Out
            </button>
        </div>
      </div>

      {/* VIEWPORT */}
      <div id="viewport">
        <div 
            id="resume-container"
            style={{ 
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                margin: '0 auto' 
            }}
        >
            <div id="resume-content" style={{width: '794px', height: '1123px', background: 'white', display: 'flex', fontFamily: "'Roboto', sans-serif", boxShadow:'0 0 30px rgba(0,0,0,0.5)', position: 'relative'}}>
                

                {/* SIDEBAR */}
                <aside className="sidebar">
                    <div className="profile-photo-container" onClick={() => { if(canEdit || (guestUser && guestUser.permissions.img)) setActiveModal('img-opts-profile'); }}>
                        <img src={data.profileImage} alt="Profile" className="profile-photo" />
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-header editable">Contact</div>
                        
                        <a 
                            href={`https://wa.me/91${data.phone.replace(/\D/g, '')}`} 
                            className="contact-item" 
                            onClick={(e) => { e.preventDefault(); handlePhoneClick(); }}
                            style={{textDecoration:'none', color:'inherit'}}
                            title="Click for options (Web) or WhatsApp (PDF)"
                        >
                            <i className="fa-solid fa-phone contact-icon"></i>
                            <Editable tagName="span" className="editable" value={data.phone} onChange={v => setData({...data, phone: v})} disabled={!isEditing} />
                        </a>
                        
                        <a 
                            href={`mailto:${data.email}`} 
                            className="contact-item" 
                            onClick={(e) => { e.preventDefault(); handleEmailClick(); }}
                            style={{textDecoration:'none', color:'inherit'}}
                            title="Click for options (Web) or Mail (PDF)"
                        >
                            <i className="fa-solid fa-envelope contact-icon"></i>
                            <Editable tagName="span" className="editable" value={data.email} onChange={v => setData({...data, email: v})} disabled={!isEditing} style={{wordBreak:'break-all'}} />
                        </a>
                        
                         <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`}
                            className="contact-item" 
                            onClick={(e) => { e.preventDefault(); handleAddressClick(); }}
                            style={{textDecoration:'none', color:'inherit'}}
                            title="Click for options (Web) or Maps (PDF)"
                        >
                            <i className="fa-solid fa-location-dot contact-icon"></i>
                            <Editable tagName="span" className="editable" value={data.address} onChange={v => setData({...data, address: v})} disabled={!isEditing} />
                        </a>
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-header editable">Personal Info</div>
                        <table className="info-table">
                            <tbody>
                                {[
                                    ['Father\'s Name', 'fatherName'],
                                    ['DOB', 'dob'],
                                    ['Gender', 'gender'],
                                    ['Nationality', 'nationality'],
                                    ['Marital Status', 'maritalStatus'],
                                ].map(([label, key]) => (
                                    <tr key={key}>
                                        <td className="info-label">{label}</td>
                                        <td><Editable className="editable" value={(data as any)[key]} onChange={v => setData({...data, [key]: v})} disabled={!isEditing} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-header editable">Languages</div>
                        <ul className="lang-list">
                            {data.languages.map((l, i) => (
                                <li key={i}><Editable className="editable" value={l} onChange={v => { const n=[...data.languages]; n[i]=v; setData({...data, languages: n}); }} disabled={!isEditing} /></li>
                            ))}
                        </ul>
                    </div>

                    <div className="sidebar-section">
                         <div className="sidebar-header editable">Hobbies</div>
                         <ul className="hobbies-list">
                            {data.hobbies.map((h, i) => (
                                <li key={i}><Editable className="editable" value={h} onChange={v => { const n=[...data.hobbies]; n[i]=v; setData({...data, hobbies: n}); }} disabled={!isEditing} /></li>
                            ))}
                        </ul>
                    </div>

                    {data.socials.some(s => s.enabled) && (
                        <div className="social-links-container" style={{marginTop:'auto'}}>
                             <div className="sidebar-header editable" style={{border:'none', fontSize:'14px', marginBottom:'5px'}}>Social Links</div>
                             {data.socials.filter(s => s.enabled).map(s => (
                                 <a key={s.id} className="social-item" href={s.url} target="_blank" rel="noreferrer">
                                     <i className={s.icon}></i> {s.url.replace(/^https?:\/\/(www\.)?/, '').substring(0, 22)}...
                                 </a>
                             ))}
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT */}
                <main className="main-content">
                    <div className="main-section">
                        <Editable tagName="div" className="header-name editable" value={data.name} onChange={v => setData({...data, name: v})} disabled={!isEditing} />
                        <Editable tagName="div" className="header-role editable" value={data.role} onChange={v => setData({...data, role: v})} disabled={!isEditing} />
                    </div>

                    <div className="main-section">
                        <div className="section-title"><i className="fa-solid fa-bullseye"></i> <span className="editable">Career Objective</span></div>
                        <Editable className="content-text editable" value={data.objective} onChange={v => setData({...data, objective: v})} disabled={!isEditing} />
                    </div>

                    <div className="main-section">
                        <div className="section-title"><i className="fa-solid fa-graduation-cap"></i> <span className="editable">Academic Qualification</span></div>
                        <table className="edu-table">
                            <thead><tr><th style={{width:'35%'}}>Qualification</th><th style={{width:'40%'}}>Board / University</th><th style={{width:'15%'}}>Year</th><th style={{width:'10%'}}>Score</th></tr></thead>
                            <tbody>
                                <tr id="ma-row" className={data.education[0].isHidden ? "hidden-row" : ""}>
                                    <td onClick={() => handleCertClick('ma')} className={certLinks.ma ? "cert-linked" : ""} title={certLinks.ma ? `Secure Node: ${secureIP}` : ''}>
                                        <Editable className="editable" value={data.education[0].qualification} onChange={v => {const e=[...data.education]; e[0].qualification=v; setData({...data, education:e})}} disabled={!isEditing} />
                                    </td>
                                    <td><Editable className="editable" value={data.education[0].board} onChange={v => {const e=[...data.education]; e[0].board=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                    <td><Editable className="editable" value={data.education[0].year} onChange={v => {const e=[...data.education]; e[0].year=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                    <td><Editable className="editable" value={data.education[0].score} onChange={v => {const e=[...data.education]; e[0].score=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                </tr>
                                <tr>
                                    <td onClick={() => handleCertClick('ba')} className={certLinks.ba ? "cert-linked" : ""} title={certLinks.ba ? `Secure Node: ${secureIP}` : ''}>
                                        <Editable className="editable" value={data.education[1].qualification} onChange={v => {const e=[...data.education]; e[1].qualification=v; setData({...data, education:e})}} disabled={!isEditing} />
                                    </td>
                                    <td><Editable className="editable" value={data.education[1].board} onChange={v => {const e=[...data.education]; e[1].board=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                    <td><Editable className="editable" value={data.education[1].year} onChange={v => {const e=[...data.education]; e[1].year=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                    <td><Editable className="editable" value={data.education[1].score} onChange={v => {const e=[...data.education]; e[1].score=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                </tr>
                                <tr>
                                    <td onClick={() => handleCertClick('12')} className={certLinks['12'] ? "cert-linked" : ""} title={certLinks['12'] ? `Secure Node: ${secureIP}` : ''}>
                                        <Editable className="editable" value={data.education[2].qualification} onChange={v => {const e=[...data.education]; e[2].qualification=v; setData({...data, education:e})}} disabled={!isEditing} />
                                    </td>
                                    <td><Editable className="editable" value={data.education[2].board} onChange={v => {const e=[...data.education]; e[2].board=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                    <td><Editable className="editable" value={data.education[2].year} onChange={v => {const e=[...data.education]; e[2].year=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                    <td><Editable className="editable" value={data.education[2].score} onChange={v => {const e=[...data.education]; e[2].score=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                </tr>
                                 <tr>
                                    <td onClick={() => handleCertClick('10')} className={certLinks['10'] ? "cert-linked" : ""} title={certLinks['10'] ? `Secure Node: ${secureIP}` : ''}>
                                        <Editable className="editable" value={data.education[3].qualification} onChange={v => {const e=[...data.education]; e[3].qualification=v; setData({...data, education:e})}} disabled={!isEditing} />
                                    </td>
                                    <td><Editable className="editable" value={data.education[3].board} onChange={v => {const e=[...data.education]; e[3].board=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                    <td><Editable className="editable" value={data.education[3].year} onChange={v => {const e=[...data.education]; e[3].year=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                    <td><Editable className="editable" value={data.education[3].score} onChange={v => {const e=[...data.education]; e[3].score=v; setData({...data, education:e})}} disabled={!isEditing} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="main-section">
                        <div className="section-title"><i className="fa-solid fa-briefcase"></i> <span className="editable">Work Experience</span></div>
                        <div className="job-container">
                            {data.experience.map((exp, i) => (
                                <div key={i} className="job-entry">
                                    <Editable className="job-title editable" value={exp.title} onChange={v => {const ex=[...data.experience]; ex[i].title=v; setData({...data, experience:ex})}} disabled={!isEditing} />
                                    <Editable className="job-company editable" value={exp.company} onChange={v => {const ex=[...data.experience]; ex[i].company=v; setData({...data, experience:ex})}} disabled={!isEditing} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="main-section">
                        <div className="section-title"><i className="fa-solid fa-laptop-code"></i> <span className="editable">Technical Skills</span></div>
                        <ul className="bullet-list">
                            {data.techSkills.map((s, i) => (
                                <li key={i}><Editable className="editable" value={s} onChange={v => {const n=[...data.techSkills]; n[i]=v; setData({...data, techSkills:n})}} disabled={!isEditing} /></li>
                            ))}
                        </ul>
                    </div>

                     <div className="main-section">
                        <div className="section-title"><i className="fa-solid fa-user-gear"></i> <span className="editable">Soft Skills & Strengths</span></div>
                        <ul className="bullet-list">
                            {data.softSkills.map((s, i) => (
                                <li key={i}><Editable className="editable" value={s} onChange={v => {const n=[...data.softSkills]; n[i]=v; setData({...data, softSkills:n})}} disabled={!isEditing} /></li>
                            ))}
                        </ul>
                    </div>

                    <div className="main-section">
                        <div className="section-title"><i className="fa-solid fa-check-circle"></i> <span className="editable">Declaration</span></div>
                        <Editable className="content-text editable" value={data.declaration} onChange={v => setData({...data, declaration:v})} disabled={!isEditing} />
                    </div>

                    <div className="bottom-row">
                        <div className="place-date-group">
                            <p><strong className="editable">Date:</strong> <span className="editable">{data.date}</span></p>
                            <p><strong className="editable">Place:</strong> <Editable tagName="span" className="editable" value={data.place} onChange={v => setData({...data, place:v})} disabled={!isEditing} /></p>
                        </div>
                        <div className="signature-box" onClick={() => { if(canEdit || (guestUser && guestUser.permissions.img)) setActiveModal('img-opts-signature'); }}>
                            {data.signatureImage ? <img src={data.signatureImage} className="signature-img" alt="Sign" /> : <div id="sig-placeholder" style={{height:'40px', display:'flex', alignItems:'flex-end', justifyContent:'center', color:'#ccc', fontSize:'10px'}}>[ Click to Sign ]</div>}
                            <Editable tagName="div" className="signature-line editable" value={data.signatureName} onChange={v => setData({...data, signatureName:v})} disabled={!isEditing} />
                        </div>
                    </div>

                    <div className="copyright">&copy; 2025 Raj Resume Builder. All rights reserved.</div>

                </main>
            </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
      <input type="file" className="hidden" ref={sigInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} />
      <input type="file" className="hidden" ref={certUploadRef} accept=".pdf,image/*" onChange={handleCertUpload} />

      {/* MODALS */}
      
      {/* Resume Form Modal - Revamped UI/UX */}
      {activeModal === 'resume-form' && (
        <div className="modal-overlay open" style={{alignItems:'flex-start', paddingTop:'40px'}}>
            <div className="modal-box" style={{width: '900px', height: '85vh', maxHeight:'800px', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius:'16px', boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
                
                {/* Header */}
                <div style={{
                    padding: '15px 25px', 
                    background: '#fff', 
                    borderBottom: '1px solid #e2e8f0', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{fontSize:'18px', color:'#1e293b', margin:0, display:'flex', alignItems:'center', gap:'10px'}}>
                            <span style={{background:'#eff6ff', color:'#3b82f6', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px'}}>
                                <i className="fa-solid fa-pen-nib"></i>
                            </span>
                            Edit Resume
                        </h3>
                        <div style={{fontSize:'11px', color:'#64748b', marginTop:'4px', marginLeft:'42px'}}>Completion: {calculateFormProgress()}%</div>
                    </div>
                    <div style={{width:'200px', background:'#f1f5f9', height:'6px', borderRadius:'3px', overflow:'hidden'}}>
                         <div style={{width: `${calculateFormProgress()}%`, height:'100%', background:'#22c55e', transition:'width 0.5s ease'}}></div>
                    </div>
                    <button 
                        onClick={() => {
                             if(revertData) setData(revertData);
                             setActiveModal(null);
                        }}
                        style={{background:'transparent', border:'none', color:'#64748b', fontSize:'18px', cursor:'pointer'}}
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div style={{flex: 1, display: 'flex', overflow: 'hidden'}}>
                    {/* Sidebar Navigation */}
                    <div style={{width: '240px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', overflowY:'auto'}}>
                        <div style={{padding:'20px'}}>
                            <div style={{fontSize:'11px', textTransform:'uppercase', color:'#94a3b8', fontWeight:700, marginBottom:'10px', paddingLeft:'10px'}}>Sections</div>
                            {formTabs.map((tab, idx) => {
                                 const isActive = formTab === tab;
                                 const isComplete = isSectionComplete(tab);
                                 const icons = {
                                     personal: 'fa-user',
                                     education: 'fa-graduation-cap',
                                     experience: 'fa-briefcase',
                                     skills: 'fa-laptop-code',
                                     misc: 'fa-puzzle-piece'
                                 };
                                 return (
                                    <button 
                                        key={tab}
                                        onClick={() => setFormTab(tab)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '12px 15px',
                                            marginBottom: '8px',
                                            background: isActive ? '#fff' : 'transparent',
                                            color: isActive ? '#2563eb' : (isComplete ? '#0f172a' : '#64748b'),
                                            fontWeight: isActive ? 600 : 500,
                                            borderRadius: '8px',
                                            border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                                            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                            <i className={`fa-solid ${icons[tab as keyof typeof icons]}`} style={{width:'16px', textAlign:'center', color: isActive ? '#2563eb' : '#94a3b8'}}></i>
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </div>
                                        {isComplete && <i className="fa-solid fa-check" style={{color:'#22c55e', fontSize:'12px'}}></i>}
                                    </button>
                                 )
                            })}
                        </div>
                    </div>

                    {/* Main Form Content Area */}
                    <div style={{flex: 1, display:'flex', flexDirection:'column', background:'#fff'}}>
                        <div style={{flex:1, overflowY:'auto', padding:'30px'}}>
                        {formTab === 'personal' && (
                            <div className="fade-in-up">
                                <h3 style={{marginBottom: '20px', color:'#0f172a', display:'flex', alignItems:'center', gap:'10px'}}>
                                    <i className="fa-solid fa-user-circle" style={{color:'#3b82f6'}}></i> Personal Details
                                </h3>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                                    {renderInput("Full Name", data.name, v => setData({...data, name: v}))}
                                    {renderInput("Role / Title", data.role, v => setData({...data, role: v}))}
                                    {renderInput("Phone", data.phone, v => setData({...data, phone: v}))}
                                    {renderInput("Email", data.email, v => setData({...data, email: v}))}
                                    <div style={{gridColumn: '1 / -1'}}>
                                        {renderInput("Address", data.address, v => setData({...data, address: v}))}
                                    </div>
                                    {renderInput("Father's Name", data.fatherName, v => setData({...data, fatherName: v}))}
                                    {renderInput("Date of Birth", data.dob, v => setData({...data, dob: v}), "DD Month YYYY")}
                                    {renderInput("Gender", data.gender, v => setData({...data, gender: v}))}
                                    {renderInput("Nationality", data.nationality, v => setData({...data, nationality: v}))}
                                    {renderInput("Marital Status", data.maritalStatus, v => setData({...data, maritalStatus: v}))}
                                </div>
                            </div>
                        )}

                        {formTab === 'education' && (
                            <div className="fade-in-up">
                                 <h3 style={{marginBottom: '20px', color:'#0f172a', display:'flex', alignItems:'center', gap:'10px'}}>
                                    <i className="fa-solid fa-graduation-cap" style={{color:'#3b82f6'}}></i> Education
                                 </h3>
                                 <div style={{background:'#eff6ff', padding:'10px', borderRadius:'8px', marginBottom:'20px', fontSize:'13px', color:'#1e40af', display:'flex', alignItems:'center', gap:'10px'}}>
                                     <i className="fa-solid fa-info-circle"></i> Entries are displayed in order on the resume.
                                 </div>
                                 {data.education.map((edu, i) => (
                                     <div key={i} style={{marginBottom: '20px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                                         <div style={{fontWeight: 600, marginBottom: '15px', color: '#334155', display:'flex', justifyContent:'space-between'}}>
                                            <span>Level: {i===0 ? 'Post Graduation' : i===1 ? 'Graduation' : i===2 ? 'Senior Secondary' : 'Secondary'}</span>
                                            <span style={{fontSize:'12px', color:'#94a3b8'}}>Entry #{i+1}</span>
                                         </div>
                                         <div style={{display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr', gap:'15px'}}>
                                            {renderInput("Qualification", edu.qualification, v => { const e=[...data.education]; e[i].qualification=v; setData({...data, education:e}); }, "e.g. B.A (Hons)")}
                                            {renderInput("Board / University", edu.board, v => { const e=[...data.education]; e[i].board=v; setData({...data, education:e}); }, "e.g. CBSE")}
                                            {renderInput("Year", edu.year, v => { const e=[...data.education]; e[i].year=v; setData({...data, education:e}); }, "YYYY")}
                                            {renderInput("Score", edu.score, v => { const e=[...data.education]; e[i].score=v; setData({...data, education:e}); }, "% or CGPA")}
                                         </div>
                                     </div>
                                 ))}
                            </div>
                        )}

                        {formTab === 'experience' && (
                            <div className="fade-in-up">
                                 <h3 style={{marginBottom: '20px', color:'#0f172a', display:'flex', alignItems:'center', gap:'10px'}}>
                                    <i className="fa-solid fa-briefcase" style={{color:'#3b82f6'}}></i> Work Experience
                                 </h3>
                                 {data.experience.map((exp, i) => (
                                     <div key={i} style={{marginBottom: '15px', display:'flex', gap:'15px', alignItems:'flex-start', padding:'15px', border:'1px solid #f1f5f9', borderRadius:'10px'}}>
                                         <div style={{flex:1}}>
                                             {renderInput("Job Title", exp.title, v => { const ex=[...data.experience]; ex[i].title=v; setData({...data, experience:ex}); })}
                                         </div>
                                         <div style={{flex:1}}>
                                             {renderInput("Company Name", exp.company, v => { const ex=[...data.experience]; ex[i].company=v; setData({...data, experience:ex}); })}
                                         </div>
                                         <button className="btn btn-remove" style={{marginTop:'28px', padding:'10px'}} onClick={() => {
                                             const newExp = [...data.experience]; newExp.splice(i, 1); setData({...data, experience: newExp});
                                         }}><i className="fa-solid fa-trash"></i></button>
                                     </div>
                                 ))}
                                 <button className="btn btn-blue" style={{width:'100%', justifyContent:'center', padding:'12px'}} onClick={() => setData({...data, experience: [...data.experience, {id: Date.now().toString(), title:'', company:''}]})}>
                                     <i className="fa-solid fa-plus"></i> Add New Experience
                                 </button>
                            </div>
                        )}

                        {formTab === 'skills' && (
                            <div className="fade-in-up">
                                 <h3 style={{marginBottom: '20px', color:'#0f172a', display:'flex', alignItems:'center', gap:'10px'}}>
                                    <i className="fa-solid fa-laptop-code" style={{color:'#3b82f6'}}></i> Skills & Interests
                                 </h3>
                                 
                                 <div className="input-group" style={{marginBottom:'25px'}}>
                                     <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'#475569', marginBottom:'8px'}}>Technical Skills (One per line)</label>
                                     <textarea 
                                        className="login-input" 
                                        style={{width:'100%', height:'100px', padding:'12px', outline:'none', borderRadius:'8px', border:'1px solid #e2e8f0', fontFamily:'inherit'}} 
                                        value={data.techSkills.join('\n')} 
                                        onChange={e => setData({...data, techSkills: sanitize(e.target.value).split('\n')})}
                                        placeholder="e.g. Advanced Excel..."
                                     ></textarea>
                                 </div>
                                 
                                 <div className="input-group" style={{marginBottom:'25px'}}>
                                     <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'#475569', marginBottom:'8px'}}>Soft Skills (One per line)</label>
                                     <textarea 
                                        className="login-input"
                                        style={{width:'100%', height:'100px', padding:'12px', outline:'none', borderRadius:'8px', border:'1px solid #e2e8f0', fontFamily:'inherit'}}
                                        value={data.softSkills.join('\n')} 
                                        onChange={e => setData({...data, softSkills: sanitize(e.target.value).split('\n')})}
                                        placeholder="e.g. Leadership..."
                                     ></textarea>
                                 </div>
                                 
                                 <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                                     {renderInput("Languages (Comma separated)", data.languages.join(', '), v => setData({...data, languages: v.split(',').map(s=>s.trim())}))}
                                     {renderInput("Hobbies (Comma separated)", data.hobbies.join(', '), v => setData({...data, hobbies: v.split(',').map(s=>s.trim())}))}
                                 </div>
                            </div>
                        )}

                        {formTab === 'misc' && (
                            <div className="fade-in-up">
                                 <h3 style={{marginBottom: '20px', color:'#0f172a', display:'flex', alignItems:'center', gap:'10px'}}>
                                    <i className="fa-solid fa-puzzle-piece" style={{color:'#3b82f6'}}></i> Miscellaneous
                                 </h3>
                                 
                                 <div className="input-group" style={{marginBottom:'25px'}}>
                                     <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'#475569', marginBottom:'8px'}}>Career Objective</label>
                                     <textarea 
                                        className="login-input" 
                                        style={{width:'100%', height:'80px', padding:'12px', outline:'none', borderRadius:'8px', border:'1px solid #e2e8f0', fontFamily:'inherit'}}
                                        value={data.objective} 
                                        onChange={e => setData({...data, objective: sanitize(e.target.value)})}
                                     ></textarea>
                                 </div>
                                 
                                 <div className="input-group" style={{marginBottom:'25px'}}>
                                     <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'#475569', marginBottom:'8px'}}>Declaration</label>
                                     <textarea 
                                        className="login-input" 
                                        style={{width:'100%', height:'60px', padding:'12px', outline:'none', borderRadius:'8px', border:'1px solid #e2e8f0', fontFamily:'inherit'}}
                                        value={data.declaration} 
                                        onChange={e => setData({...data, declaration: sanitize(e.target.value)})}
                                     ></textarea>
                                 </div>
                                 
                                 <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}>
                                     {renderInput("Date", data.date, v => setData({...data, date: v}))}
                                     {renderInput("Place", data.place, v => setData({...data, place: v}))}
                                     {renderInput("Signature Name", data.signatureName, v => setData({...data, signatureName: v}))}
                                 </div>
                            </div>
                        )}
                        </div>

                        {/* Footer Actions */}
                        <div style={{
                            padding: '20px 30px', 
                            borderTop: '1px solid #e2e8f0', 
                            background: '#fff', 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                 <button 
                                    onClick={() => {
                                        if(revertData) setData(revertData);
                                        setActiveModal(null);
                                    }}
                                    className="btn"
                                    style={{background:'#fff', color:'#ef4444', border:'1px solid #fee2e2', padding:'10px 20px'}}
                                 >
                                    Cancel
                                 </button>
                            </div>
                            <div style={{display:'flex', gap:'12px'}}>
                                <button 
                                    onClick={handlePrevTab}
                                    disabled={currentTabIdx === 0}
                                    className="btn"
                                    style={{
                                        background: currentTabIdx === 0 ? '#f1f5f9' : '#fff', 
                                        color: currentTabIdx === 0 ? '#cbd5e1' : '#475569', 
                                        border:'1px solid #e2e8f0', 
                                        padding:'10px 20px',
                                        cursor: currentTabIdx === 0 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Back
                                </button>
                                
                                {currentTabIdx < formTabs.length - 1 ? (
                                    <button 
                                        onClick={handleNextTab}
                                        className="btn btn-blue"
                                        style={{padding:'10px 25px'}}
                                    >
                                        Next Step <i className="fa-solid fa-arrow-right" style={{marginLeft:'8px'}}></i>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setActiveModal(null)}
                                        className="btn btn-save"
                                        style={{padding:'10px 25px', boxShadow:'0 4px 12px rgba(34, 197, 94, 0.3)'}}
                                    >
                                        Finish & Save <i className="fa-solid fa-check" style={{marginLeft:'8px'}}></i>
                                    </button>
                                )}
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
              <ul className="action-list">
                  {contactModal?.actions.map((act, i) => (
                      <li key={i}>
                          <button className="action-btn" onClick={act.fn}>
                              <i className={act.icon}></i> {act.label}
                          </button>
                      </li>
                  ))}
              </ul>
              <div className="modal-actions" style={{marginTop:'10px'}}>
                  <button className="btn btn-cancel" onClick={() => setContactModal(null)}>Cancel</button>
              </div>
          </div>
      </div>

      {/* Details Editor Modal */}
      <div className={`modal-overlay ${activeModal === 'details' ? 'open' : ''}`}>
          <div className="modal-box" style={{width: '600px'}}>
              <h3 style={{marginBottom:'10px', color:'#2c3e50'}}>Edit Points</h3>
              
              <div className="dm-tabs">
                  {['work', 'tech', 'soft', 'lang', 'hobby'].map(t => {
                      const icons = {
                          work: 'fa-briefcase',
                          tech: 'fa-code',
                          soft: 'fa-comments',
                          lang: 'fa-language',
                          hobby: 'fa-palette'
                      };
                      const label = t === 'work' ? 'Work Experience' : t === 'tech' ? 'Tech Skills' : t === 'soft' ? 'Soft Skills' : t === 'lang' ? 'Languages' : 'Hobbies';
                      return (
                          <div key={t} className={`dm-tab ${dmTab === t ? 'active' : ''}`} onClick={() => switchDmTab(t)}>
                              <i className={`fa-solid ${icons[t as keyof typeof icons]}`} style={{fontSize:'12px'}}></i> {label}
                          </div>
                      );
                  })}
              </div>

              <div className="dm-content">
                  {localDetails.map((item, i) => (
                      <div className="dm-row" key={i}>
                          {dmTab === 'work' ? (
                              <>
                                <input type="text" className="dm-input" placeholder="Job Title" value={item.title || ''} onChange={e => {
                                    const newData = [...localDetails]; newData[i].title = e.target.value; setLocalDetails(newData);
                                }} />
                                <input type="text" className="dm-input" placeholder="Company" value={item.company || ''} onChange={e => {
                                    const newData = [...localDetails]; newData[i].company = e.target.value; setLocalDetails(newData);
                                }} />
                              </>
                          ) : (
                              <input type="text" className="dm-input" value={item as string} onChange={e => {
                                  const newData = [...localDetails]; newData[i] = e.target.value; setLocalDetails(newData);
                              }} />
                          )}
                          <button className="dm-btn-del" onClick={() => {
                              const newData = [...localDetails]; newData.splice(i, 1); setLocalDetails(newData);
                          }}><i className="fa-solid fa-trash"></i></button>
                      </div>
                  ))}
              </div>

              <div className="dm-controls">
                  <span style={{fontSize:'13px', fontWeight:600}}>Bulk Add:</span>
                  <select className="dm-select" value={rowsToAdd} onChange={e => setRowsToAdd(parseInt(e.target.value))}>
                      <option value="1">1</option><option value="3">3</option><option value="5">5</option>
                  </select>
                  <button className="btn btn-blue" style={{padding:'6px 10px'}} onClick={addDmRows}><i className="fa-solid fa-plus"></i> Add</button>
              </div>

              <div className="modal-actions" style={{marginTop:'20px'}}>
                  <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button className="btn btn-save" onClick={saveDetails}>Save Changes</button>
              </div>
          </div>
      </div>
      
      {/* AI Modal - Dual Mode */}
      <div className={`modal-overlay ${activeModal === 'ai' ? 'open' : ''}`}>
          <div className="modal-box" style={{width: '600px', maxHeight: '80vh'}}>
              <h3 style={{marginBottom: '10px', color: '#6366f1'}}><i className="fa-solid fa-robot"></i> AI Assistant</h3>
              
              <div className="dm-tabs" style={{marginBottom:'15px', paddingBottom:'5px', borderBottom:'1px solid #e2e8f0'}}>
                  <div className={`dm-tab ${aiMode === 'improver' ? 'active' : ''}`} onClick={() => setAiMode('improver')}>
                      <i className="fa-solid fa-pen-nib"></i> Resume Improver
                  </div>
                  <div className={`dm-tab ${aiMode === 'assistant' ? 'active' : ''}`} onClick={() => setAiMode('assistant')}>
                      <i className="fa-solid fa-comments"></i> General Assistant
                  </div>
              </div>

              <div style={{width:'100%', overflowY:'auto', flex:1}}>
                  {aiMode === 'improver' ? (
                      <div>
                          <div style={{marginBottom:'20px'}}>
                                <label style={{display:'block', marginBottom:'8px', fontSize:'13px', fontWeight:600}}>Target Section</label>
                                <select className="login-input" style={{padding:'10px'}} value={aiTarget as string} onChange={(e) => setAiTarget(e.target.value as any)}>
                                    <option value="objective">Career Objective</option>
                                    <option value="techSkills">Technical Skills</option>
                                    <option value="softSkills">Soft Skills</option>
                                    <option value="declaration">Declaration</option>
                                </select>
                          </div>
                          <div style={{marginBottom:'20px'}}>
                                <label style={{display:'block', marginBottom:'8px', fontSize:'13px', fontWeight:600}}>Instruction</label>
                                <textarea className="login-input" rows={3} placeholder="Make it more professional..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}></textarea>
                          </div>
                          <button className="btn btn-ai" style={{width:'100%', justifyContent:'center'}} onClick={handleAiImprove} disabled={aiLoading}>
                              <i className="fa-solid fa-bolt"></i> {aiLoading ? 'Thinking...' : 'Generate Improvement'}
                          </button>

                          {aiResult && (
                              <div style={{marginTop:'20px', background:'#f8fafc', padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0'}}>
                                  <label style={{fontWeight:600, color:'#475569', marginBottom:'5px', display:'block'}}>AI Suggestion:</label>
                                  <div className="editable" style={{border:'1px solid #ddd', padding:'10px', borderRadius:'8px', background:'#fff', minHeight:'60px', fontSize:'13px', marginBottom:'10px'}} dangerouslySetInnerHTML={{__html: aiResult}}></div>
                                  <div className="modal-actions" style={{justifyContent: 'flex-end', marginTop:0}}>
                                      <button className="btn btn-save" onClick={applyAiResult}>Apply to Resume</button>
                                  </div>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div style={{display:'flex', flexDirection:'column', height:'400px'}}>
                          <div ref={chatScrollRef} style={{flex:1, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'15px', overflowY:'auto', marginBottom:'15px', display:'flex', flexDirection:'column', gap:'10px'}}>
                              {chatHistory.length === 0 && <div style={{textAlign:'center', color:'#94a3b8', fontSize:'13px', marginTop:'20px'}}>Ask anything about career guidance, interview tips, or resume help.</div>}
                              {chatHistory.map((msg, i) => (
                                  <div key={i} style={{alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth:'80%'}}>
                                      <div style={{
                                          background: msg.role === 'user' ? '#3b82f6' : '#fff',
                                          color: msg.role === 'user' ? '#fff' : '#334155',
                                          padding:'10px 14px',
                                          borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                          fontSize:'14px',
                                          border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none',
                                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                      }}>
                                          {msg.text}
                                      </div>
                                  </div>
                              ))}
                              {aiLoading && <div style={{alignSelf:'flex-start', color:'#64748b', fontSize:'12px', marginLeft:'10px'}}><i className="fa-solid fa-circle-notch fa-spin"></i> Typing...</div>}
                          </div>
                          <div style={{display:'flex', gap:'10px'}}>
                              <input 
                                  type="text" 
                                  className="login-input" 
                                  style={{flex:1}} 
                                  placeholder="Type your question..." 
                                  value={chatInput} 
                                  onChange={e => setChatInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleAiChat()}
                              />
                              <button className="btn btn-blue" onClick={handleAiChat} disabled={aiLoading || !chatInput.trim()}>
                                  <i className="fa-solid fa-paper-plane"></i>
                              </button>
                          </div>
                      </div>
                  )}
              </div>
              <div className="modal-actions" style={{marginTop:'20px'}}>
                  <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Close</button>
              </div>
          </div>
      </div>

      {/* Colors Modal */}
      <div className={`modal-overlay ${activeModal === 'colors' ? 'open' : ''}`}>
          <div className="modal-box" style={{width: '400px'}}>
              <h3 style={{marginBottom:'15px', color:'#2c3e50'}}>Choose Theme</h3>
              
              {/* Presets Grid */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', width: '100%', marginBottom: '20px', padding: '10px', background: '#f8fafc', borderRadius: '12px'}}>
                  {PRESET_THEMES.map((theme, idx) => (
                      <div 
                          key={idx}
                          title={theme.name}
                          onClick={() => { 
                              updateThemeCSS(theme.sidebarBg, theme.accentBlue, theme.textColor); 
                              setData({...data, theme: { sidebarBg: theme.sidebarBg, accentBlue: theme.accentBlue, textColor: theme.textColor }}); 
                          }}
                          style={{
                              width: '50px', 
                              height: '50px', 
                              borderRadius: '50%', 
                              cursor: 'pointer',
                              background: `conic-gradient(from 270deg, ${theme.sidebarBg} 0deg 180deg, ${theme.accentBlue} 180deg 270deg, #ffffff 270deg 360deg)`,
                              border: '2px solid white',
                              boxShadow: (data.theme.sidebarBg === theme.sidebarBg && data.theme.accentBlue === theme.accentBlue) 
                                  ? '0 0 0 3px #3498db, 0 5px 15px rgba(0,0,0,0.2)' 
                                  : '0 2px 5px rgba(0,0,0,0.15)',
                              transform: (data.theme.sidebarBg === theme.sidebarBg && data.theme.accentBlue === theme.accentBlue) ? 'scale(1.1)' : 'scale(1)',
                              transition: 'all 0.2s ease',
                              margin: '0 auto'
                          }}
                      />
                  ))}
              </div>

              <h4 style={{fontSize:'14px', marginBottom:'15px', width:'100%', textAlign:'left', color:'#64748b'}}>Custom Colors</h4>
              
              <div className="color-row">
                  <span className="color-label">Sidebar Background</span>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <span style={{fontSize:'12px', color:'#666'}}>{data.theme.sidebarBg}</span>
                      <input type="color" className="color-input" value={data.theme.sidebarBg} onChange={e => { updateThemeCSS(e.target.value, data.theme.accentBlue, data.theme.textColor); setData({...data, theme: {...data.theme, sidebarBg: e.target.value}}); }} />
                  </div>
              </div>
              <div className="color-row">
                  <span className="color-label">Accent Color</span>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <span style={{fontSize:'12px', color:'#666'}}>{data.theme.accentBlue}</span>
                      <input type="color" className="color-input" value={data.theme.accentBlue} onChange={e => { updateThemeCSS(data.theme.sidebarBg, e.target.value, data.theme.textColor); setData({...data, theme: {...data.theme, accentBlue: e.target.value}}); }} />
                  </div>
              </div>
              <div className="color-row">
                  <span className="color-label">Main Text Color</span>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <span style={{fontSize:'12px', color:'#666'}}>{data.theme.textColor}</span>
                      <input type="color" className="color-input" value={data.theme.textColor} onChange={e => { updateThemeCSS(data.theme.sidebarBg, data.theme.accentBlue, e.target.value); setData({...data, theme: {...data.theme, textColor: e.target.value}}); }} />
                  </div>
              </div>
              <div className="modal-actions">
                  <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Close</button>
                  <button className="btn btn-remove" onClick={() => { updateThemeCSS(INITIAL_THEME.sidebarBg, INITIAL_THEME.accentBlue, INITIAL_THEME.textColor); setData({...data, theme: INITIAL_THEME}); }}>Reset Default</button>
              </div>
          </div>
      </div>

      {/* Crop Modal */}
      <div className={`modal-overlay ${activeModal === 'crop' ? 'open' : ''}`}>
          <div className="modal-box">
              <h3 style={{marginBottom:'10px'}}>Crop Image</h3>
              <div className="img-container-crop"><img id="image-to-crop" src={croppingImg || ''} alt="" /></div>
              <div className="modal-actions">
                  <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button className="btn btn-save" onClick={performCrop}>Crop & Save</button>
              </div>
          </div>
      </div>

      {/* Image Options Modal */}
      <div className={`modal-overlay ${activeModal === 'img-opts-profile' || activeModal === 'img-opts-signature' ? 'open' : ''}`}>
          <div className="modal-box" style={{width: '300px', textAlign: 'center'}}>
              <h3 style={{marginBottom: '15px'}}>Image Options</h3>
              <div className="modal-actions" style={{flexDirection: 'column'}}>
                  <button className="btn btn-blue" style={{justifyContent: 'center'}} onClick={() => { setActiveModal(null); if(activeModal==='img-opts-profile') fileInputRef.current?.click(); else sigInputRef.current?.click(); }}>Upload / Change</button>
                  <button className="btn btn-remove" style={{justifyContent: 'center'}} onClick={() => { setActiveModal(null); if(activeModal==='img-opts-profile') setData({...data, profileImage: DEFAULT_PROFILE_URI}); else setData({...data, signatureImage: null}); }}>Remove</button>
                  <button className="btn btn-cancel" style={{justifyContent: 'center'}} onClick={() => setActiveModal(null)}>Cancel</button>
              </div>
          </div>
      </div>

       {/* Admin Security Modal */}
       <div className={`modal-overlay ${activeModal === 'admin-sec' ? 'open' : ''}`}>
           <div className="modal-box" style={{width:'400px'}}>
               <h3 style={{marginBottom:'15px', color:'#2c3e50'}}>Admin Security</h3>
               {adminSecStep === 'verify' && (
                   <div style={{width:'100%', background:'#eef2ff', padding:'15px', borderRadius:'10px'}}>
                       <div className="input-group" style={{marginBottom:'15px'}}>
                           <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:600}}>Security Question</label>
                           <select className="login-input" value={secQ} onChange={e => setSecQ(e.target.value)} style={{width:'100%', padding:'10px'}}>
                               <option value="1">Best Institute</option>
                               <option value="2">Village Name</option>
                               <option value="4">Primary School Name</option>
                           </select>
                       </div>
                       <div className="input-group" style={{marginBottom:'15px'}}>
                           <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:600}}>Your Answer</label>
                           <input type="text" className="login-input" style={{width:'100%', padding:'10px'}} value={secAns} onChange={e => setSecAns(e.target.value)} />
                       </div>
                       <div className="input-group">
                           <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:600}}>Captcha: {captchaVal}</label>
                           <input type="text" className="login-input" style={{width:'100%', padding:'10px'}} placeholder="Enter Code" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} />
                       </div>
                       <div className="modal-actions">
                           <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                           <button className="btn btn-save" onClick={verifyAdminSecurity}>Verify</button>
                       </div>
                   </div>
               )}
               {adminSecStep === 'update' && (
                    <div style={{width:'100%', background:'#f0fdf4', padding:'15px', borderRadius:'10px'}}>
                        <h4 style={{marginBottom:'10px', color:'#166534'}}>Credentials & API Key</h4>
                        
                        <div style={{marginBottom: '15px'}}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:600, marginBottom:'4px'}}>Update Admin Login (Optional)</label>
                            <input type="text" className="login-input" style={{width:'100%', padding:'8px', marginBottom:'8px'}} placeholder="New Username" value={newAdminUser} onChange={e => setNewAdminUser(e.target.value)} />
                            <input type="text" className="login-input" style={{width:'100%', padding:'8px'}} placeholder="New Password" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} />
                        </div>

                        <div style={{marginBottom: '15px', borderTop: '1px solid #ddd', paddingTop: '15px'}}>
                             <label style={{display:'block', fontSize:'12px', fontWeight:600, marginBottom:'4px'}}>AI API Key</label>
                             <input type="password" className="login-input" style={{width:'100%', padding:'8px'}} placeholder="Enter Gemini API Key" value={newApiKey} onChange={e => setNewApiKey(e.target.value)} />
                             <small style={{display:'block', marginTop:'4px', color:'#666', fontSize:'10px'}}>Default: gen-lang-client-...</small>
                        </div>

                        <div className="modal-actions">
                           <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                           <button className="btn btn-save" onClick={saveAdminCreds}>Save All</button>
                        </div>
                    </div>
               )}
           </div>
       </div>

        {/* Guest Manager Modal */}
        <div className={`modal-overlay ${activeModal === 'guest-mgr' ? 'open' : ''}`}>
           <div className="modal-box" style={{width: '500px'}}>
               <h3 style={{marginBottom:'15px', color:'#2c3e50'}}>Manage Guest Access</h3>
               <div style={{width:'100%', background:'#f9f9f9', padding:'15px', borderRadius:'8px', marginBottom:'15px'}}>
                   <h4 style={{marginBottom:'10px', fontSize:'13px'}}>Create New Guest Pass</h4>
                   <div className="guest-form-row">
                       <input type="text" className="guest-input" placeholder="User" value={newGuestUser} onChange={e => setNewGuestUser(e.target.value)} />
                       <input type="text" className="guest-input" placeholder="Pass" value={newGuestPass} onChange={e => setNewGuestPass(e.target.value)} />
                   </div>
                   <div className="guest-perms">
                       {Object.keys(guestPerms).map(p => (
                           <label key={p}><input type="checkbox" checked={(guestPerms as any)[p]} onChange={e => setGuestPerms({...guestPerms, [p]: e.target.checked})} /> {p.toUpperCase()}</label>
                       ))}
                   </div>
                   <div className="guest-form-row" style={{alignItems: 'center'}}>
                       <span style={{fontSize:'12px', fontWeight:600, color:'#555'}}>Time (Mins):</span>
                       <input type="number" className="guest-input" value={newGuestTime} onChange={e => setNewGuestTime(parseInt(e.target.value))} style={{maxWidth:'80px'}} />
                       <button className="btn btn-save" onClick={() => {
                           const expiry = Date.now() + (newGuestTime * 60000);
                           const newGuest = { user: newGuestUser, pass: newGuestPass, expiry, duration: newGuestTime, permissions: guestPerms };
                           const list = [...guestList, newGuest];
                           localStorage.setItem('rajResumeGuests', JSON.stringify(list));
                           setGuestList(list);
                           setNewGuestUser(''); setNewGuestPass('');
                       }}>Generate</button>
                   </div>
               </div>
               <div style={{width:'100%', maxHeight:'200px', overflowY:'auto'}}>
                   <table className="guest-table">
                       <thead><tr><th>User</th><th>Duration</th><th>Action</th></tr></thead>
                       <tbody>
                           {guestList.map((g, i) => (
                               <tr key={i}>
                                   <td>{g.user}</td>
                                   <td>{g.duration}m</td>
                                   <td><button className="btn btn-remove" style={{padding:'4px 8px'}} onClick={() => {
                                       const list = guestList.filter((_, idx) => idx !== i);
                                       localStorage.setItem('rajResumeGuests', JSON.stringify(list));
                                       setGuestList(list);
                                   }}><i className="fa-solid fa-trash"></i></button></td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
               <div className="modal-actions">
                   <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Close</button>
               </div>
           </div>
        </div>

         {/* Social Modal */}
         <div className={`modal-overlay ${activeModal === 'social' ? 'open' : ''}`}>
             <div className="modal-box" style={{width:'500px'}}>
                 <h3 style={{marginBottom:'15px'}}>Manage Social Media</h3>
                 <div style={{width:'100%', marginBottom:'20px'}}>
                     {data.socials.map((item, index) => (
                         <div key={item.id} className="social-row">
                             <input type="checkbox" checked={item.enabled} onChange={e => {
                                 const newSocials = [...data.socials];
                                 newSocials[index].enabled = e.target.checked;
                                 setData({...data, socials: newSocials});
                             }} />
                             <div style={{width:'24px', textAlign:'center'}}><i className={item.icon} style={{color:'#3498db'}}></i></div>
                             <input type="text" className="social-input" value={item.url} onChange={e => {
                                 const newSocials = [...data.socials];
                                 newSocials[index].url = e.target.value;
                                 setData({...data, socials: newSocials});
                             }} />
                         </div>
                     ))}
                 </div>
                 <div className="modal-actions">
                     <button className="btn btn-save" onClick={() => setActiveModal(null)}>Done</button>
                 </div>
             </div>
         </div>

         {/* Cert Upload Modal */}
         <div className={`modal-overlay ${activeModal === 'cert' ? 'open' : ''}`}>
             <div className="modal-box" style={{width:'500px'}}>
                 <h3 style={{marginBottom:'10px', color:'#1e3a8a'}}>Manage Certificates</h3>
                 
                 {/* Cert Auth Step */}
                 {certAuthStep === 'login' ? (
                     <div style={{width: '100%', background: '#f8fafc', padding: '15px', borderRadius: '10px'}}>
                         <h4 style={{marginBottom:'10px', color:'#334155'}}>Verification Required</h4>
                         <div className="input-group" style={{marginBottom:'10px'}}>
                             <input type="text" className="login-input" placeholder="Admin Username" value={certAuthUser} onChange={e => setCertAuthUser(e.target.value)} />
                         </div>
                         <div className="input-group" style={{marginBottom:'10px'}}>
                             <input type="password" className="login-input" placeholder="Admin Password" value={certAuthPass} onChange={e => setCertAuthPass(e.target.value)} />
                         </div>
                         <div className="input-group" style={{marginBottom:'10px', display:'flex', gap:'10px', alignItems:'center'}}>
                             <div className="captcha-display" style={{flex:1, fontSize:'16px'}} onClick={() => setCertCaptchaVal(generateCaptcha())}>{certCaptchaVal}</div>
                             <input type="text" className="login-input" style={{flex:1}} placeholder="Captcha" value={certCaptcha} onChange={e => setCertCaptcha(e.target.value)} />
                         </div>
                         <div className="modal-actions">
                             <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                             <button className="btn btn-save" onClick={verifyCertAuth}>Access</button>
                         </div>
                     </div>
                 ) : (
                    /* Cert Management Step */
                    <div style={{width:'100%'}}>
                         {[['M.A Certificate', 'ma'], ['B.A Certificate', 'ba'], ['12th Grade', '12'], ['10th Grade', '10']].map(([label, key]) => (
                             <div key={key} className="input-group" style={{marginBottom:'15px'}}>
                                 <label style={{display:'block', fontSize:'13px', fontWeight:600}}>{label}</label>
                                 <div style={{display:'flex', gap:'5px'}}>
                                    <input type="text" className="login-input" style={{flex:1, padding:'8px'}} placeholder="Link or Data URI" value={certLinks[key as keyof CertLinks] || ''} onChange={e => setCertLinks({...certLinks, [key]: e.target.value})} />
                                    <button className="btn btn-purple" style={{padding:'8px 12px'}} title="Upload File" onClick={() => { setActiveCertKey(key as keyof CertLinks); certUploadRef.current?.click(); }}>
                                        <i className="fa-solid fa-upload"></i>
                                    </button>
                                 </div>
                             </div>
                         ))}
                         
                         <div className="modal-actions">
                             <button className="btn btn-cancel" onClick={() => setActiveModal(null)}>Close</button>
                             <button className="btn btn-save" onClick={() => {
                                 localStorage.setItem('rajCertificates', btoa(JSON.stringify(certLinks)));
                                 setActiveModal(null);
                             }}>Save Changes</button>
                         </div>
                    </div>
                 )}
             </div>
         </div>

      {/* Hidden File Inputs */}
      <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
      <input type="file" className="hidden" ref={sigInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} />
      <input type="file" className="hidden" ref={certUploadRef} accept=".pdf,image/*" onChange={handleCertUpload} />
    </div>
  );
};

export default App;