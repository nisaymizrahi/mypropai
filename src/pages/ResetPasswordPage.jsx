import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import BrandLogo from "../components/BrandLogo";
import PublicLegalLinks from "../components/PublicLegalLinks";
import { resetPasswordWithToken, validatePasswordResetToken } from "../utils/api";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus("invalid");
        setError("This reset link is missing its token.");
        return;
      }

      try {
        setStatus("checking");
        await validatePasswordResetToken(token);
        setStatus("ready");
      } catch (validationError) {
        setStatus("invalid");
        setError(validationError.message || "This reset link is invalid or expired.");
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPasswordWithToken({ token, newPassword });
      setStatus("success");
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (submitError) {
      setError(submitError.message || "Unable to reset your password.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Password reset" />
          </Link>

          <Link to="/login" className="ghost-action">
            Back to login
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10 lg:py-12">
          <section className="auth-card w-full max-w-[520px] p-6">
            <span className="eyebrow">Secure reset</span>
            <h1 className="mt-4 font-display text-[2.3rem] leading-none text-ink-900">
              Choose a new password
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              This link expires automatically. Once you save a new password, you can sign back in
              right away.
            </p>

            {status === "checking" ? (
              <div className="mt-8 flex items-center justify-center px-6 py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-verdigris-100 border-t-verdigris-500" />
              </div>
            ) : null}

            {status === "invalid" ? (
              <div className="section-card mt-6 p-4 text-sm leading-6 text-clay-700">
                {error || "This reset link is invalid or expired."}
                <div className="mt-3">
                  <Link to="/forgot-password" className="font-semibold text-ink-900 underline underline-offset-4">
                    Request a new reset link
                  </Link>
                </div>
              </div>
            ) : null}

            {status === "success" ? (
              <div className="section-card mt-6 p-4 text-sm leading-6 text-verdigris-700">
                Password reset successfully. Redirecting you to login.
              </div>
            ) : null}

            {status === "ready" ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="newPassword" className="auth-label">
                    New password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="auth-input"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="auth-label">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="auth-input"
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error ? <div className="section-card p-4 text-sm text-red-700">{error}</div> : null}

                <button type="submit" disabled={isSubmitting} className="primary-action w-full">
                  {isSubmitting ? "Saving..." : "Reset password"}
                  {!isSubmitting ? <ArrowRightIcon className="ml-2 h-4 w-4" /> : null}
                </button>
              </form>
            ) : null}

            <PublicLegalLinks className="mt-6 justify-center" />
          </section>
        </main>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
