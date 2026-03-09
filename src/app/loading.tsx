"use client";

import { motion } from "framer-motion";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
            {/* Ambient glow behind the text */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

            {/* Brand Name with Fade-in, Scale, and Shimmer */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1], // custom spring-like easing
                }}
                className="relative flex items-center justify-center"
            >
                {/* The text */}
                <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer select-none">
                    saidTASKs
                </h1>
            </motion.div>

            {/* Micro-copy */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.5, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                className="mt-6 text-sm text-slate-400 font-medium tracking-wide"
            >
                Assembling your productivity suite...
            </motion.p>

            {/* Thin Progress Bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900"
            >
                <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                        duration: 2.5,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full"
                />
            </motion.div>

            {/* Subtle floating particles */}
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-indigo-400/30"
                    initial={{
                        x: (i - 1) * 120,
                        y: 60,
                        opacity: 0,
                    }}
                    animate={{
                        y: -40,
                        opacity: [0, 0.6, 0],
                    }}
                    transition={{
                        duration: 2.5,
                        delay: 0.8 + i * 0.4,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "easeOut",
                    }}
                />
            ))}
        </div>
    );
}
