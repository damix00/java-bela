"use client";
import Button from "@/components/input/button";
import TextInput from "@/components/input/text-input";

export default function LoginForm() {
    return (
        <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-sm text-foreground-muted mb-6">
                Please log in to your account to continue.
            </p>
            <form className="w-full space-y-4">
                <TextInput
                    label="Email"
                    type="email"
                    placeholder="name@example.com"
                />
                <div className="space-y-1">
                    <TextInput
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                    />
                    <div className="flex justify-end mt-2">
                        <a
                            href="/forgot-password"
                            className="text-xs text-foreground-muted hover:text-primary">
                            Forgot password?
                        </a>
                    </div>
                </div>
                <Button type="submit" className="w-full mt-2">
                    Log In
                </Button>
            </form>
            <p className="text-center text-sm text-foreground-muted mt-6">
                Don't have an account?{" "}
                <a href="/signup" className="text-primary hover:underline">
                    Sign Up
                </a>
            </p>
        </div>
    );
}
