import Button from "../input/button";

export default function Titlebar() {
    return (
        <div className="fixed top-0 left-0 w-screen h-titlebar flex items-center justify-between px-8 z-20 bg-linear-to-t from-transparent to-background md:to-transparent">
            <h1 className="font-heading uppercase font-black text-xl tracking-tight">
                Belote.gg
            </h1>
            <div className="flex flex-row gap-4">
                <Button variant="ghost">Login</Button>
                <Button variant="filled">Sign Up</Button>
            </div>
        </div>
    );
}
