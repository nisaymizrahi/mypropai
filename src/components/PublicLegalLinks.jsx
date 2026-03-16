import React from "react";
import { Link } from "react-router-dom";

const PublicLegalLinks = ({ className = "mt-5 justify-center" }) => (
  <div className={`flex flex-wrap gap-3 text-sm text-ink-500 ${className}`}>
    <Link to="/terms" className="underline decoration-ink-300 underline-offset-4 hover:text-ink-900">
      Terms of Use
    </Link>
    <Link
      to="/privacy"
      className="underline decoration-ink-300 underline-offset-4 hover:text-ink-900"
    >
      Privacy Policy
    </Link>
  </div>
);

export default PublicLegalLinks;
