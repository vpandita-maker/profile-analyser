export type CareerGoal = "Recruiting" | "Fundraising" | "Hiring" | "Personal Brand" | "Job Search";
export type Seniority = "Entry level" | "Mid level" | "Senior" | "Executive" | "Student";
export type Timeline = "Urgent" | "Near term" | "Flexible";
export type Geography = "India" | "US" | "Other";

export interface LinkedInProfile {
  linkedinId: string;
  name: string;
  headline?: string;
  photo?: string;
  email?: string;
  about?: string;
  experience?: string[];
  skills?: string[];
  education?: string[];
  rawProfileText?: string;
  importSource?: "oauth" | "pdf" | "paste";
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

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  headline: string;
  profilePhotoUrl?: string;
  overallScore: number;
  goal: string;
  geography: string;
  seniority: string;
  strengths?: AnalysisItem[];
  weaknesses?: AnalysisItem[];
}
