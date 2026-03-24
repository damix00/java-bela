"use client";
import Button from "@/components/input/button";
import TextInput from "@/components/input/text-input";

export default function SignupForm() {
    return (
        <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold mb-2">Create Account</h2>
            <p className="text-sm text-foreground-muted mb-6">
                Sign up to start playing Belote.
            </p>
            <form className="w-full space-y-4">
                <TextInput
                    label="Username"
                    type="text"
                    placeholder="Enter your username"
                />
                <TextInput
                    label="Email"
                    type="email"
                    placeholder="name@example.com"
                />
                <TextInput
                    label="Password"
                    type="password"
                    placeholder="Create a password"
                />
                <TextInput
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                />
                <Button type="submit" className="w-full mt-6">
                    Sign Up
                </Button>
            </form>
            <p className="text-center text-sm text-foreground-muted mt-6">
                Already have an account?{" "}
                <a href="/login" className="text-primary hover:underline">
                    Log In
                </a>
            </p>
        </div>
    );
}
