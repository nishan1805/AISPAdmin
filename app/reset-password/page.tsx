"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { resetPasswordSchema } from "@/lib/yup/schema.validation";
import * as yup from "yup";

type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: yupResolver(resetPasswordSchema),
    });

    useEffect(() => {
        // Parse hash parameters instead of query parameters
        const hash = window.location.hash.substring(1); // Remove the '#'
        const params = new URLSearchParams(hash);

        const accessToken = params.get("access_token");
        const type = params.get("type");

        if (!accessToken || type !== "recovery") {
            setTokenValid(false);
            setError("Invalid or expired reset link. Please request a new password reset.");
            return;
        }

        // Set the session with the token
        const setSession = async () => {
            try {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: "", // Not needed for password reset
                });

                if (error) {
                    setTokenValid(false);
                    setError("Invalid or expired reset link. Please request a new password reset.");
                } else {
                    setTokenValid(true);
                }
            } catch (err) {
                setTokenValid(false);
                setError("Invalid or expired reset link. Please request a new password reset.");
            }
        };

        setSession();
    }, []);

    const onSubmit = async (data: ResetPasswordFormData) => {
        try {
            setLoading(true);
            setError(null);

            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (tokenValid === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h1 className="text-2xl font-bold text-slate-700 mb-2">Invalid Reset Link</h1>
                        <p className="text-slate-500 mb-6">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <Button onClick={() => router.push("/login")} className="w-full">
                            Back to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h1 className="text-2xl font-bold text-slate-700 mb-2">Password Updated!</h1>
                        <p className="text-slate-500 mb-6">
                            Your password has been successfully updated. You will be redirected to the login page shortly.
                        </p>
                        <Button onClick={() => router.push("/login")} className="w-full">
                            Go to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (tokenValid === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h1 className="text-2xl font-bold text-slate-700 mb-2">Verifying Link...</h1>
                        <p className="text-slate-500">Please wait while we verify your reset link.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
                {/* Logo and Title */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-20 h-20 mb-4">
                        <img
                            src="/aispur_logo.png"
                            alt="School Logo"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-700 tracking-wide">
                        ACHIEVERS INTERNATIONAL SCHOOL
                    </h1>
                </div>

                {/* Reset Password Form */}
                <div className="border-t border-slate-200 pt-8">
                    <h2 className="text-2xl font-semibold text-slate-900 mb-2">Set New Password</h2>
                    <p className="text-slate-500 mb-6">Enter your new password below</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* New Password */}
                        <div>
                            <Label htmlFor="password" className="text-slate-700">
                                New Password
                            </Label>
                            <div className="relative mt-1.5">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    className={errors.password ? "border-red-500" : ""}
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <Label htmlFor="confirmPassword" className="text-slate-700">
                                Confirm Password
                            </Label>
                            <div className="relative mt-1.5">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    className={errors.confirmPassword ? "border-red-500" : ""}
                                    {...register("confirmPassword")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 text-base font-medium"
                        >
                            {loading ? "Updating Password..." : "Update Password"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}