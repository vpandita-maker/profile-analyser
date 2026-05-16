"use client";

export function ShareFooter({ onShared: _ }: { onShared?: () => void }) {
  return (
    <footer
      className="w-full border-t border-[#0A66C2]/30 bg-white"
      style={{ boxShadow: "0 -4px 16px rgba(10,102,194,0.12)" }}
    >
      <div className="landing-container py-3 text-center text-xs font-semibold text-[#666666]">
        iHeartLinkedIn by{" "}
        <a
          href="https://www.linkedin.com/in/vanshpandita-real/?skipRedirect=true"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0A66C2] hover:underline"
        >
          Vansh Pandita
        </a>
      </div>
    </footer>
  );
}
