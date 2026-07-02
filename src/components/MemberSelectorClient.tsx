"use client";

import { MemberSelector } from "./MemberSelector";

export function MemberSelectorClient({ 
  members 
}: { 
  members: { id: number; name: string; color: string; role: string }[] 
}) {
  return <MemberSelector members={members} />;
}
