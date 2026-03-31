"use client";

import { useForm } from "@tanstack/react-form";
import Button from "@/components/input/button";
import TextInput from "@/components/input/text-input";
import { useState } from "react";
import { apiFetch } from "@/api/client";
import { AuthResponse } from "@/api/types/user";
import { storeAuthData } from "@/actions/auth";
import { toast } from "sonner";

export default function LoginForm() {
    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        onSubmit: async ({ value }) => {
            setLoading(true);
            try {
                const response = await apiFetch<AuthResponse>("/auth/login", {
                    method: "POST",
                    body: JSON.stringify({
                        email: value.email,
                        password: value.password,
                    }),
                });

                if (!response.data) {
                    throw new Error(
                        response.error ||
                            "Login failed. Please check your credentials.",
                    );
                }

                await storeAuthData(response.data);

                window.location.href = "/";

                console.log("Logged in user:", response.data);
            } catch (error) {
                console.error("Login failed:", error);

                let errorMessage =
                    "An unexpected error occurred. Please try again.";

                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === "string") {
                    errorMessage = error;
                }

                toast.error("Login failed", {
                    description: errorMessage,
                });
            } finally {
                setLoading(false);
            }
        },
    });

    const [loading, setLoading] = useState(false);

    return (
        <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-sm text-foreground-muted mb-6">
                Please log in to your account to continue.
            </p>
            <form
                className="w-full space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}>
                <form.Field
                    name="email"
                    validators={{
                        onBlur: ({ value }) => {
                            if (!value) return "Email is required";
                            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                                return "Invalid email address";
                            return undefined;
                        },
                    }}>
                    {(field) => (
                        <div className="space-y-1">
                            <TextInput
                                label="Email"
                                type="email"
                                placeholder="name@example.com"
                                value={field.state.value}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <p className="text-xs text-red-500">
                                    {field.state.meta.errors.join(", ")}
                                </p>
                            )}
                        </div>
                    )}
                </form.Field>
                <form.Field
                    name="password"
                    validators={{
                        onBlur: ({ value }) => {
                            if (!value) return "Password is required";
                            if (value.length < 6)
                                return "Password must be at least 6 characters";
                            return undefined;
                        },
                    }}>
                    {(field) => (
                        <div className="space-y-1">
                            <TextInput
                                label="Password"
                                type="password"
                                placeholder="Enter your password"
                                value={field.state.value}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <p className="text-xs text-red-500">
                                    {field.state.meta.errors.join(", ")}
                                </p>
                            )}
                            <div className="flex justify-end mt-2">
                                <a
                                    href="/forgot-password"
                                    className="text-xs text-foreground-muted hover:text-primary">
                                    Forgot password?
                                </a>
                            </div>
                        </div>
                    )}
                </form.Field>
                <Button type="submit" className="w-full mt-2" loading={loading}>
                    Log In
                </Button>
            </form>
            <p className="text-center text-sm text-foreground-muted mt-6">
                Don't have an account?{" "}
                <a href="/signup" className="text-primary hover:underline">
                    Sign Up
                </a>{" "}
                or{" "}
                <span
                    onClick={async () => {
                        const response = await apiFetch<AuthResponse>(
                            "/auth/login/anonymous",
                            {
                                method: "POST",
                            },
                        );

                        if (!response.data) {
                            throw new Error(
                                response.error ||
                                    "Login failed. Please check your credentials.",
                            );
                        }

                        await storeAuthData(response.data);

                        window.location.href = "/";

                        console.log("Logged in user:", response.data);
                    }}
                    className="text-primary hover:underline select-none cursor-pointer">
                    Continue as Guest
                </span>
                .
            </p>
        </div>
    );
}
