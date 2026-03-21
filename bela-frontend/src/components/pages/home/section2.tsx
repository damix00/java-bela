"use client";

import { TrophyIcon, ZapIcon, EyeIcon, UsersIcon } from "lucide-react";
import { motion } from "motion/react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 100, damping: 15 },
    },
};

export default function HomeSection2() {
    return (
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-20 lg:py-32">
            {/* Header part */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="max-w-xl">
                    <p className="text-primary font-bold text-xs tracking-[0.2em] uppercase mb-4">
                        Craftsmanship
                    </p>
                    <h2 className="font-heading uppercase font-black text-5xl sm:text-6xl md:text-7xl leading-[0.9] tracking-tight">
                        The Table
                        <br />
                        <span className="text-primary">Reimagined.</span>
                    </h2>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        delay: 0.2,
                    }}
                    className="md:w-1/3 flex items-start mt-4 md:mt-12">
                    <p className="text-foreground-muted text-base md:text-lg max-w-md">
                        We've built every aspect of Belote.gg from the ground up
                        with one goal in mind: to create the best competitive
                        Belote experience possible.
                    </p>
                </motion.div>
            </div>

            {/* Bento Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
                <motion.div
                    variants={itemVariants}
                    className="relative overflow-hidden bg-background-secondary rounded-3xl p-6 sm:p-8 md:p-12 md:col-span-7 flex flex-col justify-end min-h-[280px] md:min-h-[400px]">
                    <div className="absolute -top-10 -right-10 md:top-8 md:right-8 lg:top-12 lg:right-12 pointer-events-none transition-transform duration-700 hover:scale-110">
                        <TrophyIcon
                            size={240}
                            className="text-foreground opacity-[0.05] sm:opacity-10"
                        />
                    </div>
                    <div className="relative z-10 w-full sm:w-[90%] lg:w-[85%]">
                        <h3 className="font-heading uppercase font-black text-2xl sm:text-3xl lg:text-4xl mb-3 tracking-tight">
                            Tactical Tournament Engine
                        </h3>
                        <p className="text-foreground-muted text-sm sm:text-base leading-relaxed">
                            Our proprietary matching algorithm ensures you only
                            play against those who challenge your strategic
                            boundaries.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="bg-background-secondary rounded-3xl p-6 sm:p-8 md:p-12 md:col-span-5 flex flex-col justify-between min-h-[260px] md:min-h-[400px] group">
                    <div className="bg-primary-muted w-14 h-14 rounded-full flex items-center justify-center mb-6 lg:mb-8 transition-transform group-hover:scale-110">
                        <ZapIcon size={28} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="font-heading uppercase font-black text-2xl sm:text-3xl mb-3 tracking-tight">
                            Instant Response
                        </h3>
                        <p className="text-foreground-muted text-sm sm:text-base leading-relaxed">
                            Real-time networking infrastructure with
                            zero-latency card play for that true tactile feel.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="bg-background-secondary rounded-3xl p-6 sm:p-8 md:p-12 md:col-span-5 flex flex-col justify-between min-h-[260px] md:min-h-[360px] group">
                    <div className="bg-foreground/5 w-14 h-14 rounded-full flex items-center justify-center mb-6 lg:mb-8 transition-transform group-hover:scale-110">
                        <UsersIcon size={28} className="text-foreground/80" />
                    </div>
                    <div>
                        <h3 className="font-heading uppercase font-black text-2xl sm:text-3xl mb-3 tracking-tight">
                            Play with your Friends
                        </h3>
                        <p className="text-foreground-muted text-sm sm:text-base leading-relaxed">
                            Play against your friends or team up for competitive
                            2v2 matches.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="relative bg-background-secondary rounded-3xl p-6 sm:p-8 md:p-12 md:col-span-7 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 min-h-[280px] md:min-h-[360px] overflow-hidden">
                    <div className="relative z-10 w-full sm:w-[65%] order-2 sm:order-1">
                        <h3 className="font-heading uppercase font-black text-2xl sm:text-3xl lg:text-4xl mb-3 tracking-tight">
                            Climb the Ranks
                        </h3>
                        <p className="text-foreground-muted text-sm sm:text-base leading-relaxed">
                            Ensure your next match is always a nail-biter with
                            our ranking system!
                        </p>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-col gap-3 w-32 sm:w-36 order-1 sm:order-2">
                        <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 1,
                                delay: 0.5,
                                ease: "easeOut",
                            }}
                            className="h-2.5 bg-primary rounded-full shadow-[0_0_15px_rgba(197,255,139,0.5)]"
                        />
                        <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "85%" }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 1,
                                delay: 0.65,
                                ease: "easeOut",
                            }}
                            className="h-2.5 bg-white/20 rounded-full self-start sm:self-end"
                        />
                        <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "50%" }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 1,
                                delay: 0.8,
                                ease: "easeOut",
                            }}
                            className="h-2.5 bg-white/10 rounded-full self-start sm:self-end"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}
