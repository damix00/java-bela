import Image from "next/image";

import type { User } from "@/api/types/user";

/** The real account image, with an initial for guests and image-less accounts. */
export default function UserAvatar({ user }: { user: User }) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt=""
        width={40}
        height={40}
        unoptimized
        className="size-10 shrink-0 border-[3px] border-cream object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid size-10 shrink-0 place-items-center border-[3px] border-cream bg-rust font-display text-[17px] font-extrabold uppercase text-cream"
    >
      {user.username.charAt(0)}
    </span>
  );
}
