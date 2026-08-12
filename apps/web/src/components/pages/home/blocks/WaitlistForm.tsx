import { Button } from "@/components/controls/Button";
import TextInput from "@/components/controls/TextInput";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";
import { pressOnButton } from "@/lib/styles";

type WaitlistFormProps = {
  /** Unique per instance — the page renders this form twice. */
  id: string;
  submitLabel: string;
  /** Field label and placeholder; the submit label differs per instance. */
  copy: Dictionary["form"];
  inputTone?: "white" | "cream";
  buttonTone?: "rust" | "forest";
  /** Widths differ between the hero and the closing band. */
  inputClassName?: string;
};

export default function WaitlistForm({
  id,
  submitLabel,
  copy,
  inputTone = "white",
  buttonTone = "rust",
  inputClassName,
}: WaitlistFormProps) {
  return (
    // Input and button read as one welded block, so the block — not the
    // button alone — is what sits above the shadow and moves on press.
    <form
      className={cn(
        pressOnButton,
        "flex w-full flex-col items-stretch shadow-hard sm:w-auto sm:flex-row",
      )}
    >
      <TextInput
        id={id}
        name="email"
        type="email"
        label={copy.emailLabel}
        hideLabel
        required
        placeholder={copy.emailPlaceholder}
        tone={inputTone}
        // Butts up against the button once they sit side by side.
        className={cn("sm:border-r-0", inputClassName)}
      />
      <Button
        type="submit"
        tone={buttonTone}
        joined
        className="border-t-0 sm:border-t-4"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
