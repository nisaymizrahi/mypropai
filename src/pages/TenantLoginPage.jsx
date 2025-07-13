import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const TenantLoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_BASE_URL}/tenant-auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || 'Failed to log in.');
            }

            // Store the tenant's token in localStorage under a specific key
            localStorage.setItem('tenantToken', data.token);

            // Redirect to the tenant dashboard
            navigate('/tenant-dashboard');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-brand-gray-800">Tenant Portal Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-brand-gray-700"
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-brand-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-turquoise focus:border-brand-turquoise"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-brand-gray-700"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-brand-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-turquoise focus:border-brand-turquoise"
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 font-semibold text-white bg-brand-turquoise rounded-md hover:bg-brand-turquoise-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-turquoise disabled:bg-brand-gray-300"
                        >
                            {isSubmitting ? 'Logging In...' : 'Log In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TenantLoginPage;