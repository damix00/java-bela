import type { Transition } from "motion/react";

export const springTransition: Transition = {
    type: "spring",
    stiffness: 100,
    damping: 20,
};

export const fadeUpAnimation = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
};
