import Link from "next/link";
import Button from "../input/button";
import Logo from "../brand/logo";

export default function Titlebar() {
    return (
        <div className="fixed top-0 left-0 w-screen h-titlebar flex items-center justify-between px-8 z-20 bg-linear-to-t from-transparent to-background md:to-transparent">
            <Link href="/">
                <Logo />
            </Link>
            <div className="flex flex-row gap-4">
                <Link href="/login">
                    <Button variant="ghostPrimary">Login</Button>
                </Link>
                <Link href="/signup">
                    <Button variant="filled">Sign Up</Button>
                </Link>
            </div>
        </div>
    );
}
