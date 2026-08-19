import type { ComponentProps } from "react";

import Input from "@/components/controls/Input";
import { cn } from "@/lib/cn";

type TextInputProps = Omit<ComponentProps<typeof Input>, "id"> & {
    id: string;
    /** Always rendered for screen readers; `hideLabel` only hides it visually. */
    label: string;
    hideLabel?: boolean;
};

export default function TextInput({
    id,
    label,
    hideLabel = false,
    ...props
}: TextInputProps) {
    return (
        <>
            <label htmlFor={id} className={cn(hideLabel && "sr-only")}>
                {label}
            </label>
            <Input id={id} {...props} />
        </>
    );
}
