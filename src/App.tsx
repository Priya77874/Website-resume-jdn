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
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string, image?: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatImage, setChatImage] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const aiImageInputRef = useRef<HTMLInputElement>(null);

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

  const handleAiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Image resize logic to prevent payload too large errors
          const reader = new FileReader();
          reader.onload = (ev) => {
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  let width = img.width;
                  let height = img.height;
                  const maxDim = 800; // Resize to max 800px
                  
                  if (width > height) {
                      if (width > maxDim) {
                          height *= maxDim / width;
                          width = maxDim;
                      }
                  } else {
                      if (height > maxDim) {
                          width *= maxDim / height;
                          height = maxDim;
                      }
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                      ctx.drawImage(img, 0, 0, width, height);
                      // High quality compression
                      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                      setChatImage(dataUrl);
                  } else {
                      // Fallback if canvas fails
                      setChatImage(ev.target?.result as string);
                  }
              };
              img.src = ev.target?.result as string;
          };
          reader.readAsDataURL(file);
          e.target.value = ''; // Reset input to allow re-upload of same file
      }
  };

  const handleAiChat = async () => {
      if(!chatInput.trim() && !chatImage) return;
      const userMsg = chatInput;
      const imgToSend = chatImage;

      setChatHistory(prev => [...prev, {role: 'user', text: userMsg, image: imgToSend || undefined}]);
      setChatInput('');
      setChatImage(null);
      setAiLoading(true);
      try {
          const res = await chatWithAi(userMsg, imgToSend || undefined);
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
          
          // Force Background Removal for Signatures (Always runs)
          if (cropType === 'signature') {
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const data = imgData.data;
                  
                  // Contrast enhancement factor to make ink darker and paper whiter before thresholding
                  const contrast = 1.2; // Increase contrast by 20%
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

                      // Calculate luminance (perceived brightness)
                      // Formula: 0.299*R + 0.587*G + 0.114*B
                      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                      
                      // Aggressive threshold for background removal (removes light grey/white/off-white)
                      // Threshold 150 covers white paper, light grey and shadows.
                      if (brightness > 150) {
                          data[i + 3] = 0; // Set Alpha to 0 (Transparent)
                      } else {
                          data[i + 3] = 255; // Set Alpha to 255 (Opaque) - Make ink solid
                          opaqueCount++;
                      }
                  }
                  
                  // If result is empty (too much removed)
                  if (opaqueCount < 50) {
                      alert("Please correct the signature. Please ensure the signature is dark on a light background.");
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
    </div>
  );
};

export default App;