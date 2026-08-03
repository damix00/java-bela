"use client";

import Link from "next/link";
import { GlobeIcon, Share2Icon } from "lucide-react";
import Button from "../input/button";

export default function Footer() {
    return (
        <footer className="w-full border-t border-white/5 bg-background">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left: Logo and copyright */}
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <span className="font-heading font-black text-xl tracking-tight uppercase">
                            Belote.gg
                        </span>
                        <p className="text-xs text-foreground-muted">
                            © 2026 Belote.gg. All rights reserved.
                        </p>
                    </div>

                    {/* Center: Links */}
                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs sm:text-sm text-foreground-muted">
                        <Link
                            href="#"
                            className="hover:text-foreground transition-colors">
                            Privacy Policy
                        </Link>
                        <Link
                            href="#"
                            className="hover:text-foreground transition-colors">
                            Terms of Service
                        </Link>
                        <Link
                            href="#"
                            className="hover:text-foreground transition-colors">
                            Support
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="text">
                            <GlobeIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
