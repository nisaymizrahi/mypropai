import React from "react";

const LoginPage = () => {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5001/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h2 className="text-2xl font-semibold mb-4">Welcome to MyPropAI</h2>
        <button
          onClick={handleGoogleLogin}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
