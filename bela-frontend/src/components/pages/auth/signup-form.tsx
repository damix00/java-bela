"use client";

import { useForm } from "@tanstack/react-form";
import Button from "@/components/input/button";
import TextInput from "@/components/input/text-input";
import { useState } from "react";
import { apiFetch } from "@/api/client";
import { AuthResponse } from "@/api/types/user";
import { storeAuthData } from "@/actions/auth";
import { toast } from "sonner";

export default function SignupForm() {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        onSubmit: async ({ value }) => {
            setLoading(true);
            try {
                const response = await apiFetch<AuthResponse>("/auth/register", {
                    method: "POST",
                    body: JSON.stringify({
                        username: value.username,
                        email: value.email,
                        password: value.password,
                    }),
                });

                if (!response.data) {
                    throw new Error(
                        response.error || "Registration failed. Please try again.",
                    );
                }

                await storeAuthData(response.data);

                toast.success("Welcome to Belote.gg!", {
                    description: "Your account has been created successfully.",
                });

                window.location.href = "/";

                console.log("Registered user:", response.data);
            } catch (error) {
                console.error("Registration failed:", error);

                let errorMessage =
                    "An unexpected error occurred. Please try again.";

                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === "string") {
                    errorMessage = error;
                }

                toast.error("Registration failed", {
                    description: errorMessage,
                });
            } finally {
                setLoading(false);
            }
        },
    });

    return (
        <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold mb-2">Create Account</h2>
            <p className="text-sm text-foreground-muted mb-6">
                Sign up to start playing Belote.
            </p>
            <form
                className="w-full space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}>
                <form.Field
                    name="username"
                    validators={{
                        onBlur: ({ value }) => {
                            if (!value) return "Username is required";
                            if (value.length < 3)
                                return "Username must be at least 3 characters";
                            if (value.length > 20)
                                return "Username must be at most 20 characters";
                            if (!/^[a-zA-Z0-9_]+$/.test(value))
                                return "Username can only contain letters, numbers, and underscores";
                            return undefined;
                        },
                    }}>
                    {(field) => (
                        <div className="space-y-1">
                            <TextInput
                                label="Username"
                                type="text"
                                placeholder="e.g. john_doe67"
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
                            if (value.length < 8)
                                return "Password must be at least 8 characters";
                            return undefined;
                        },
                    }}>
                    {(field) => (
                        <div className="space-y-1">
                            <TextInput
                                label="Password"
                                type="password"
                                placeholder="Create a password"
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
                    name="confirmPassword"
                    validators={{
                        onBlur: ({ value }) => {
                            if (!value)
                                return "Please confirm your password";
                            const password = form.getFieldValue("password");
                            if (value !== password)
                                return "Passwords don't match";
                            return undefined;
                        },
                    }}>
                    {(field) => (
                        <div className="space-y-1">
                            <TextInput
                                label="Confirm Password"
                                type="password"
                                placeholder="Confirm your password"
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
                <Button type="submit" className="w-full mt-6" loading={loading}>
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
