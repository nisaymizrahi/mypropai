import React from "react";

// NEW: SVG Icon for the Google login button
const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.816 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);


const LoginPage = () => {
  const handleGoogleLogin = () => {
    // This correctly points to your backend authentication route
    window.location.href = `${process.env.REACT_APP_API_BASE_URL || 'https://mypropai-server.onrender.com'}/auth/google`;
  };

  return (
    // NEW: Main container with dark background
    <div className="min-h-screen flex items-center justify-center bg-brand-slate-300 p-4">
      {/* NEW: Redesigned login card */}
      <div className="w-full max-w-md bg-brand-slate-200 p-8 rounded-lg shadow-2xl border border-brand-dark-800 text-center">
        <h1 className="text-3xl font-bold text-brand-blue tracking-wider mb-2">MyPropAI</h1>
        <p className="text-brand-dark-300 mb-8">
          Your AI-Powered Real Estate Investment Co-Pilot
        </p>
        
        {/* NEW: Redesigned Google login button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full inline-flex items-center justify-center bg-white text-gray-700 font-medium px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 shadow-md"
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
