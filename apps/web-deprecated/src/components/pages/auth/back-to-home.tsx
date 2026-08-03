"use client";

import Button from "@/components/input/button";
import { ChevronLeft } from "lucide-react";

export default function BackToHome() {
    return (
        <Button
            href="/"
            variant="textPrimary"
            className="absolute top-6 left-6 z-50 gap-2">
            <ChevronLeft size={16} />
            Back to Home
        </Button>
    );
}
