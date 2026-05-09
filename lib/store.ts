"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalysisResult, ContextAnswers, LinkedInProfile } from "@/lib/types";

const emptyContext: ContextAnswers = {
  goal: "",
  seniority: "",
  industry: "",
  targetRole: "",
  geography: "",
  city: "",
  timeline: "",
  challenges: [],
  targetCompanies: "",
  outcome: "",
  networkSize: "",
  relocation: null,
  wins: ""
};

interface AnalyzerState {
  contextAnswers: ContextAnswers;
  linkedinData: LinkedInProfile | null;
  analysis: AnalysisResult | null;
  analysisId: string | null;
  isUnlocked: boolean;
  setContextAnswers: (answers: Partial<ContextAnswers>) => void;
  toggleChallenge: (challenge: string) => void;
  setLinkedinData: (profile: LinkedInProfile) => void;
  mergeLinkedinData: (profile: Partial<LinkedInProfile>) => void;
  setAnalysis: (analysis: AnalysisResult, analysisId: string) => void;
  clearAnalysis: () => void;
  setUnlocked: (value: boolean) => void;
  resetContext: () => void;
}

export const useAnalyzerStore = create<AnalyzerState>()(
  persist(
    (set) => ({
      contextAnswers: emptyContext,
      linkedinData: null,
      analysis: null,
      analysisId: null,
      isUnlocked: false,
      setContextAnswers: (answers) => set((state) => ({ contextAnswers: { ...state.contextAnswers, ...answers } })),
      toggleChallenge: (challenge) =>
        set((state) => {
          const exists = state.contextAnswers.challenges.includes(challenge);
          return {
            contextAnswers: {
              ...state.contextAnswers,
              challenges: exists
                ? state.contextAnswers.challenges.filter((item) => item !== challenge)
                : [...state.contextAnswers.challenges, challenge]
            }
          };
        }),
      setLinkedinData: (profile) => set({ linkedinData: profile }),
      mergeLinkedinData: (profile) =>
        set((state) => ({
          linkedinData: {
            linkedinId: state.linkedinData?.linkedinId || profile.linkedinId || "profile-user",
            name: state.linkedinData?.name || profile.name || "Profile Member",
            ...state.linkedinData,
            ...profile
          }
        })),
      setAnalysis: (analysis, analysisId) => set({ analysis, analysisId }),
      clearAnalysis: () => set({ analysis: null, analysisId: null, isUnlocked: false }),
      setUnlocked: (value) => set({ isUnlocked: value }),
      resetContext: () => set({ contextAnswers: emptyContext })
    }),
    { name: "linkedin-analyzer-store" }
  )
);
