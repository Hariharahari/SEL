"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { authApi, authValidation, parseApiError } from "@/lib/auth";

interface FormErrors {
  userId?: string;
  password?: string;
  submit?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    authApi.getCurrentUser().then((result) => {
      if (result.success) router.push("/agents");
    });
  }, [router]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!userId.trim()) {
      nextErrors.userId = "User ID is required";
    } else if (!authValidation.isValidLoginInput(userId)) {
      nextErrors.userId = "Enter a valid user ID";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await login(userId.trim(), password);

      if (!result.success) {
        setErrors({ submit: result.error });
        return;
      }

      const currentUser = await authApi.getCurrentUser();
      if (!currentUser.success) {
        setErrors({ submit: currentUser.error });
        return;
      }

      setSuccessMessage(`JWT received for ${currentUser.data.user_id}. Redirecting...`);
      router.push(currentUser.data.role?.toUpperCase() === "ADMIN" ? "/admin/analytics" : "/agents");
    } catch (error) {
      setErrors({ submit: parseApiError(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,120,212,0.20),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_30%)] bg-bg-primary px-4 py-8 text-text-primary">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="flex items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-bg-secondary/95 p-8 shadow-2xl backdrop-blur-sm">
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-card">
                <LogIn className="h-7 w-7" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary">Sign In</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Use your central authentication credentials to continue.
              </p>
            </div>

            {successMessage && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-text-primary">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                <p>{successMessage}</p>
              </div>
            )}

            {errors.submit && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 p-4 text-sm text-text-primary">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
                <p>{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="userId" className="sel-label">
                  User ID
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id="userId"
                    name="userId"
                    type="text"
                    value={userId}
                    onChange={(event) => {
                      setUserId(event.target.value);
                      setErrors((prev) => ({ ...prev, userId: undefined }));
                    }}
                    disabled={isLoading}
                    placeholder="Enter your user ID"
                    className={`sel-input py-3 pl-10 pr-4 ${errors.userId ? "border-error focus:border-error focus:ring-error/10" : ""}`}
                    autoComplete="username"
                  />
                </div>
                {errors.userId && <p className="text-sm text-error">{errors.userId}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="sel-label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    disabled={isLoading}
                    placeholder="Enter your password"
                    className={`sel-input py-3 pl-10 pr-12 ${errors.password ? "border-error focus:border-error focus:ring-error/10" : ""}`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-error">{errors.password}</p>}
              </div>

              <button type="submit" disabled={isLoading} className="sel-button-primary group mt-2 w-full px-6 py-3">
                <span>{isLoading ? "Signing in..." : "Sign In"}</span>
                <LogIn className="h-4 w-4" />
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </form>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs leading-6 text-text-muted">
                JWT tokens come from the configured central auth service. Download profile details are reused once they have been synced to PostgreSQL.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
