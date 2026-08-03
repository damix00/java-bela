"use client";

import { motion } from "motion/react";
import Button from "@/components/input/button";

export default function HomeSection3() {
    return (
        <section className="w-full bg-background-secondary py-24 lg:py-32 flex flex-col items-center text-center">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col items-center">
                {/* Avatars */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex -space-x-4">
                        <motion.img
                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                            whileInView={{ opacity: 1, x: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1, type: "spring" }}
                            className="w-14 h-14 rounded-full border-[3px] border-background-secondary object-cover bg-neutral-800"
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4"
                            alt="Avatar 1"
                        />
                        <motion.img
                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                            whileInView={{ opacity: 1, x: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-14 h-14 rounded-full border-[3px] border-background-secondary object-cover bg-neutral-800 relative z-[1]"
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=c0aede"
                            alt="Avatar 2"
                        />
                        <motion.img
                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                            whileInView={{ opacity: 1, x: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className="w-14 h-14 rounded-full border-[3px] border-background-secondary object-cover bg-neutral-800 relative z-[2]"
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=ffd5dc"
                            alt="Avatar 3"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                            whileInView={{ opacity: 1, x: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="w-14 h-14 rounded-full border-[3px] border-background-secondary bg-primary relative z-[3] flex items-center justify-center text-on-primary font-bold text-sm">
                            +12k
                        </motion.div>
                    </div>
                </div>

                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        delay: 0.1,
                    }}
                    className="font-heading uppercase font-black text-4xl sm:text-5xl md:text-6xl mb-6 tracking-tight">
                    Ready for the next deal?
                </motion.h2>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        delay: 0.2,
                    }}
                    className="text-foreground-muted text-base sm:text-lg mb-10 max-w-2xl">
                    Join thousands of Belote enthusiasts in the world's most
                    premium card lounge. Your seat is waiting.
                </motion.p>

                {/* Action Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        delay: 0.3,
                    }}>
                    <Button size="lg">Claim My Seat</Button>
                </motion.div>
            </div>
        </section>
    );
}
