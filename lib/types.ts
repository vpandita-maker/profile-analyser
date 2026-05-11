export type CareerGoal = "Job Search" | "Internship Search";
export type Seniority = "Entry level" | "Mid level" | "Senior" | "Executive" | "Student";
export type Timeline = "Urgent" | "Near term" | "Flexible";
export type Geography = "India" | "US" | "Other";
export type WorkPreference = "Remote" | "Hybrid" | "In office";

export interface LinkedInProfile {
  linkedinId: string;
  profileUrl?: string;
  name: string;
  headline?: string;
  photo?: string;
  email?: string;
  about?: string;
  experience?: string[];
  skills?: string[];
  education?: string[];
  location?: string;
  country?: string;
  city?: string;
  industry?: string;
  currentRole?: string;
  currentCompany?: string;
  isStudent?: boolean;
  rawProfileText?: string;
  importSource?: "scrape";
}

export interface ContextAnswers {
  goal: CareerGoal | "";
  seniority: Seniority | "";
  industry: string;
  targetRole: string;
  geography: Geography | "";
  city: string;
  timeline: Timeline | "";
  challenges: string[];
  targetCompanies: string;
  outcome: string;
  networkSize: string;
  relocation: boolean | null;
  workPreference: WorkPreference | "";
  wins: string;
}

export interface AnalysisItem {
  title: string;
  score: number;
  explanation: string;
}

export interface FixItem {
  title: string;
  current: string;
  recommended: string;
  whyMatters: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  scoreBump?: number;
}

export interface AnalysisResult {
  overallScore: number;
  categoryScores: {
    headline: number;
    about: number;
    experience: number;
    skills: number;
    positioning: number;
  };
  strengths: AnalysisItem[];
  weaknesses: AnalysisItem[];
  topFixes: FixItem[];
  secondaryFixes: FixItem[];
}
