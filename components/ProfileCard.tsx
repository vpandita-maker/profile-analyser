import Image from "next/image";
import { UserRound } from "lucide-react";
import type { LinkedInProfile } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { normalizeLinkedInProfile } from "@/lib/profile-normalize";

export function ProfileCard({ profile }: { profile: LinkedInProfile | null }) {
  const normalizedProfile = normalizeLinkedInProfile(profile);
  const displayName = normalizedProfile?.name || "LinkedIn Member";
  const displayHeadline = normalizedProfile?.headline || "Profile headline ready for optimization";
  const displayPhoto = normalizedProfile?.photo;

  return (
    <Card className="sticky top-0 z-10 flex items-center gap-3 rounded-none border-x-0 border-t-0 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
        {displayPhoto ? (
          <Image src={displayPhoto} alt={displayName} width={48} height={48} className="h-full w-full object-cover" />
        ) : (
          <UserRound className="h-6 w-6" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">{displayName}</p>
        <p className="line-clamp-2 text-xs leading-5 text-slate-500">{displayHeadline}</p>
      </div>
    </Card>
  );
}
