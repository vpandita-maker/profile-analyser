type GTag = (...args: unknown[]) => void;

function gtag(...args: unknown[]) {
  (window as Window & { gtag?: GTag }).gtag?.(...args);
}

export const analytics = {
  analysisStarted: (role: string, industry: string) =>
    gtag("event", "analysis_started", { target_role: role, industry }),

  analysisCompleted: (score: number, role: string, industry: string) =>
    gtag("event", "analysis_completed", { score, target_role: role, industry }),

  unlockPageViewed: (isFullyUnlocked: boolean) =>
    gtag("event", "unlock_page_viewed", { already_unlocked: isFullyUnlocked }),

  inviteSent: () =>
    gtag("event", "invite_sent"),

  inviteAccepted: () =>
    gtag("event", "invite_accepted"),
};
