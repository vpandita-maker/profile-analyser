import Image from "next/image";
import { UserRound } from "lucide-react";
import type { LinkedInProfile } from "@/lib/types";
import { Card } from "@/components/ui/Card";

export function ProfileCard({ profile }: { profile: LinkedInProfile | null }) {
  return (
    <Card className="sticky top-0 z-10 flex items-center gap-3 rounded-none border-x-0 border-t-0 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
        {profile?.photo ? (
          <Image src={profile.photo} alt={profile.name} width={48} height={48} className="h-full w-full object-cover" />
        ) : (
          <UserRound className="h-6 w-6" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">{profile?.name || "LinkedIn Member"}</p>
        <p className="line-clamp-2 text-xs leading-5 text-slate-500">{profile?.headline || "Profile headline ready for optimization"}</p>
      </div>
    </Card>
  );
}
