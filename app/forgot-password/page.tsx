"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import * as yup from "yup";

const forgotPasswordSchema = yup.object({
    email: yup.string().email("Invalid email format").required("Email is required"),
});

type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: yupResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            setLoading(true);
            setError(null);

            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/reset-password`,
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h1 className="text-2xl font-bold text-slate-700 mb-2">Check Your Email</h1>
                        <p className="text-slate-500 mb-6">
                            We've sent you a password reset link. Please check your email and follow the instructions.
                        </p>
                        <Button onClick={() => router.push("/login")} className="w-full">
                            Back to Login
                        </Button>
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

                {/* Forgot Password Form */}
                <div className="border-t border-slate-200 pt-8">
                    <div className="flex items-center mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/login")}
                            className="p-0 h-auto text-slate-500 hover:text-slate-700"
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            Back to Login
                        </Button>
                    </div>

                    <h2 className="text-2xl font-semibold text-slate-900 mb-2">Forgot Password?</h2>
                    <p className="text-slate-500 mb-6">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <Label htmlFor="email" className="text-slate-700">
                                Email Address
                            </Label>
                            <div className="relative mt-1.5">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className={errors.email ? "border-red-500" : ""}
                                    {...register("email")}
                                />
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
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
                            {loading ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}