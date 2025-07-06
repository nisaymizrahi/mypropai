import React from "react";

const LoginPage = () => {
  const handleGoogleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const googleWindow = window.open(
      "https://mypropai-server.onrender.com/api/auth/google",
      "_blank",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const pollTimer = setInterval(() => {
      if (googleWindow?.closed) {
        clearInterval(pollTimer);
        window.location.href = "/login-continue"; // ✅ forces frontend to check session
      }
    }, 500);
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
