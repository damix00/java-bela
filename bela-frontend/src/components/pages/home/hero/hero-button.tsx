"use client";

import Button from "@/components/input/button";

export default function HeroButton() {
    return (
        <>
            <div className="hidden sm:flex">
                <Button variant="filled" size="lg">
                    Join the Action
                </Button>
            </div>
            <div className="flex sm:hidden">
                <Button variant="filled" size="md">
                    Join the Action
                </Button>
            </div>
        </>
    );
}
