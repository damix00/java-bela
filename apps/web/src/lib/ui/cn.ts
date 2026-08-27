import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Join conditional class names and let later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
