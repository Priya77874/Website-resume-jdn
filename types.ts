export interface ThemeColors {
  sidebarBg: string;
  accentBlue: string;
  textColor: string;
}

export interface SocialItem {
  id: string;
  name: string;
  icon: string;
  url: string;
  enabled: boolean;
}

export interface EducationItem {
  id: string;
  qualification: string;
  board: string;
  year: string;
  score: string;
  link?: string;
  isHidden?: boolean;
}

export interface WorkItem {
  id: string;
  title: string;
  company: string;
}

export interface ResumeData {
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  fatherName: string;
  dob: string;
  gender: string;
  nationality: string;
  maritalStatus: string;
  languages: string[];
  hobbies: string[];
  socials: SocialItem[];
  objective: string;
  education: EducationItem[];
  experience: WorkItem[];
  techSkills: string[];
  softSkills: string[];
  declaration: string;
  date: string;
  place: string;
  signatureName: string;
  profileImage: string;
  signatureImage: string | null;
  theme: ThemeColors;
}

export interface GuestPermissions {
  pdf: boolean;
  jpg: boolean;
  social: boolean;
  ma: boolean; 
  edit: boolean;
  img: boolean; 
  toggle: boolean; 
}

export interface GuestUser {
  user: string;
  pass?: string; // Stored in vanilla JS array
  expiry: number;
  duration: number; // Stored for reference in vanilla JS
  permissions: GuestPermissions;
}

// Certificate Links Interface
export interface CertLinks {
  ma?: string;
  ba?: string;
  '12'?: string;
  '10'?: string;
}
