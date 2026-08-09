import { lift } from "@/components/pages/home/styles";
import { cn } from "@/lib/cn";

export default function WaitlistForm({
  id,
  inputClass,
  buttonClass,
}: {
  id: string;
  inputClass: string;
  buttonClass: string;
}) {
  return (
    <form className="flex w-full flex-col items-stretch sm:w-auto sm:flex-row">
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <input
        id={id}
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className={cn(
          "w-full rounded-none border-4 border-ink px-5 py-4 font-sans text-[17px] text-ink outline-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-rust sm:border-r-0",
          inputClass,
        )}
      />
      <button
        type="submit"
        className={cn(
          lift,
          "cursor-pointer rounded-none border-4 border-t-0 border-ink px-[26px] py-4 font-display text-[16px] font-extrabold text-cream shadow-hard focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-rust sm:border-t-4",
          buttonClass,
        )}
      >
        {id === "hero-email" ? "Get early access" : "Join the waitlist"}
      </button>
    </form>
  );
}
