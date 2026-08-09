import { Button } from "@/components/controls/Button";
import TextInput from "@/components/controls/TextInput";
import { cn } from "@/lib/cn";

type WaitlistFormProps = {
  /** Unique per instance — the page renders this form twice. */
  id: string;
  submitLabel: string;
  inputTone?: "white" | "cream";
  buttonTone?: "rust" | "forest";
  /** Widths differ between the hero and the closing band. */
  inputClassName?: string;
};

export default function WaitlistForm({
  id,
  submitLabel,
  inputTone = "white",
  buttonTone = "rust",
  inputClassName,
}: WaitlistFormProps) {
  return (
    <form className="flex w-full flex-col items-stretch sm:w-auto sm:flex-row">
      <TextInput
        id={id}
        name="email"
        type="email"
        label="Email address"
        hideLabel
        required
        placeholder="you@example.com"
        tone={inputTone}
        // Butts up against the button once they sit side by side.
        className={cn("sm:border-r-0", inputClassName)}
      />
      <Button
        type="submit"
        tone={buttonTone}
        className="border-t-0 sm:border-t-4"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
