import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGoogleSignup = () => {
        window.location.href = `${API_BASE_URL}/auth/google`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.name || !formData.email || !formData.password) {
            setError('All fields are required.');
            return;
        }
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to create account.');
            }
            
            login(data.token); // Use the login function from AuthContext
            navigate('/dashboard'); // Redirect to dashboard on successful signup

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-brand-turquoise hover:text-brand-turquoise-500">
                            Log In
                        </Link>
                    </p>
                </div>

                <button
                    onClick={handleGoogleSignup}
                    type="button"
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10c5.523 0 10-4.477 10-10S15.523 0 10 0zM8.28 15.654c-2.428 0-4.394-1.966-4.394-4.394s1.966-4.394 4.394-4.394c1.15 0 2.203.454 2.984 1.201l-1.254 1.223a2.492 2.492 0 00-1.73-.722c-1.428 0-2.588 1.16-2.588 2.588s1.16 2.588 2.588 2.588c1.657 0 2.146-1.07 2.25-1.654H8.28v-2.02h4.24c.067.36.104.73.104 1.13 0 2.56-1.72 4.42-4.344 4.42z" clipRule="evenodd" />
                    </svg>
                    Sign Up with Google
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Full Name</label>
                        <input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Email Address</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Password</label>
                        <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" required />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button type="submit" disabled={isSubmitting} className="w-full bg-brand-turquoise text-white py-2 rounded-md font-semibold hover:bg-brand-turquoise-600 disabled:bg-opacity-50">
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;