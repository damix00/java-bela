"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";

export function HomeHero() {
    const [authModalOpen, setAuthModalOpen] = useState(false);

    return (
        <div className="relative min-h-screen flex flex-col items-center px-4 overflow-hidden">
            {/* Spacer to push content to center */}
            <div className="flex-1" />

            {/* --- Content --- */}
            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-10 py-8">
                {/* Hero Text */}
                <div className="space-y-4">
                    <motion.h1
                        className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-foreground"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 10,
                        }}>
                        Play <span className="text-primary">Belote.</span> Prove
                        Yourself.
                    </motion.h1>
                    <motion.p
                        className="text-md sm:text-lg text-muted-foreground"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 10,
                            delay: 0.2,
                        }}>
                        The competitive Belote platform built for serious
                        players worldwide.
                    </motion.p>
                </div>

                {/* CTA button */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 12,
                        delay: 0.4,
                    }}>
                    <Button
                        size="lg"
                        className="text-lg h-12 px-8"
                        onClick={() => setAuthModalOpen(true)}>
                        Play Now
                    </Button>
                </motion.div>
            </div>

            {/* Spacer to push footer to bottom */}
            <div className="flex-1" />

            {/* Footer - uses flexbox to stay at bottom without overlapping */}
            <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                    delay: 1,
                }}
                className="w-full text-center px-4 py-6 text-xs text-muted-foreground">
                © 2026 Latinary. All rights reserved. Terms and conditions
                apply.
            </motion.footer>

            <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
        </div>
    );
}
