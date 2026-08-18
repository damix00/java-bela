import MockLabel from "@/components/pages/table/blocks/MockLabel";
import SuitBadge from "@/components/pages/table/blocks/SuitBadge";
import { mockTable } from "@/components/pages/table/mock-data";
import { cn } from "@/lib/cn";

type FriendListProps = {
  freeLabel: string;
  busyLabel: string;
};

/**
 * Who could fill the two open seats.
 *
 * Ruled with a 2px line rather than the 4px the rest of the page is drawn
 * with: these are rows inside one block, not four blocks stacked, and the
 * heavy rule would split them into four.
 */
export default function FriendList({ freeLabel, busyLabel }: FriendListProps) {
  return (
    <div className="border-4 border-ink bg-cream shadow-hard [&>*+*]:border-t-2 [&>*+*]:border-canvas">
      {mockTable.friends.map((friend) => (
        <div
          key={friend.name}
          className={cn(
            "flex items-center gap-[10px] px-3 py-[13px]",
            // Already in a match: dimmed whole, so the row reads as unavailable
            // at a glance rather than needing its status read.
            friend.busy && "opacity-45",
          )}
        >
          <SuitBadge suit={friend.suit} tone={friend.tone} size="sm" />
          <span className="mr-auto truncate font-display text-[16px] font-extrabold tracking-[-.02em] text-ink">
            {friend.name}
          </span>
          {/* Set tighter than the table's other labels, and never wrapped. It
              shares a narrow row with a username, and Croatian's "slobodan" is
              half again as long as "free" — at the standard size it eats the
              name it is meant to annotate. */}
          <MockLabel className="text-[10px] tracking-[.1em] whitespace-nowrap text-stone">
            {friend.busy ? busyLabel : freeLabel}
          </MockLabel>
        </div>
      ))}
    </div>
  );
}
