import React from "react";

const LoginPage = () => {
  const handleGoogleLogin = () => {
    window.location.href = "https://mypropai-server.onrender.com/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow rounded text-center space-y-6">
        <h1 className="text-2xl font-bold">Welcome to MyPropAI</h1>
        <p className="text-gray-500">Please sign in to continue</p>
        <button
          onClick={handleGoogleLogin}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
