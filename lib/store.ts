"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isFallbackHeadline, isFallbackName, normalizeLinkedInProfile } from "@/lib/profile-normalize";
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
  workPreference: "",
  wins: ""
};

interface AnalyzerState {
  contextAnswers: ContextAnswers;
  linkedinData: LinkedInProfile | null;
  analysis: AnalysisResult | null;
  analysisId: string | null;
  isUnlocked: boolean;
  isFullyUnlocked: boolean;
  userEmail: string | null;
  previousScore: number | null;
  setContextAnswers: (answers: Partial<ContextAnswers>) => void;
  toggleChallenge: (challenge: string) => void;
  setLinkedinData: (profile: LinkedInProfile) => void;
  mergeLinkedinData: (profile: Partial<LinkedInProfile>) => void;
  setAnalysis: (analysis: AnalysisResult, analysisId: string) => void;
  clearAnalysis: () => void;
  setUnlocked: (value: boolean) => void;
  setFullyUnlocked: (value: boolean) => void;
  setUserEmail: (email: string) => void;
  setPreviousScore: (score: number | null) => void;
  resetContext: () => void;
}

function normalized(profile: LinkedInProfile | null) {
  return normalizeLinkedInProfile(profile) || profile;
}

function chooseText(incoming?: string, existing?: string, fallback?: string, isFallback?: (value?: string) => boolean) {
  if (incoming && !isFallback?.(incoming)) return incoming;
  if (existing && !isFallback?.(existing)) return existing;
  return incoming || existing || fallback || "";
}

export const useAnalyzerStore = create<AnalyzerState>()(
  persist(
    (set) => ({
      contextAnswers: emptyContext,
      linkedinData: null,
      analysis: null,
      analysisId: null,
      isUnlocked: false,
      isFullyUnlocked: false,
      userEmail: null,
      previousScore: null,
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
      setLinkedinData: (profile) => set({ linkedinData: normalized(profile) }),
      mergeLinkedinData: (profile) =>
        set((state) => ({
          linkedinData: normalized({
            linkedinId: profile.linkedinId || state.linkedinData?.linkedinId || "profile-user",
            ...state.linkedinData,
            ...profile,
            name: chooseText(profile.name, state.linkedinData?.name, "LinkedIn Member", isFallbackName),
            headline: chooseText(profile.headline, state.linkedinData?.headline, "", isFallbackHeadline),
            photo: profile.photo || state.linkedinData?.photo,
            about: profile.about || state.linkedinData?.about,
            experience: profile.experience?.length ? profile.experience : state.linkedinData?.experience,
            education: profile.education?.length ? profile.education : state.linkedinData?.education,
            skills: profile.skills?.length ? profile.skills : state.linkedinData?.skills,
            rawProfileText: profile.rawProfileText || state.linkedinData?.rawProfileText
          } as LinkedInProfile)
        })),
      setAnalysis: (analysis, analysisId) => set({ analysis, analysisId }),
      clearAnalysis: () => set({ analysis: null, analysisId: null, isUnlocked: false, isFullyUnlocked: false, previousScore: null }),
      setUnlocked: (value) => set({ isUnlocked: value }),
      setFullyUnlocked: (value) => set({ isFullyUnlocked: value }),
      setUserEmail: (email) => set({ userEmail: email }),
      setPreviousScore: (score) => set({ previousScore: score }),
      resetContext: () => set({ contextAnswers: emptyContext })
    }),
    { name: "linkedin-analyzer-store" }
  )
);
