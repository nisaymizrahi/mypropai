import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const InvitePage = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_BASE_URL}/tenant-auth/invite/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || 'Failed to set password.');
            }

            setSuccess('Password set successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/tenant-login');
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-brand-gray-800">Set Your Password</h2>
                <p className="text-center text-sm text-brand-gray-600">
                    Welcome! Create a password to activate your tenant portal account.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-brand-gray-700"
                        >
                            New Password
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
                    <div>
                        <label
                            htmlFor="confirm-password"
                            className="block text-sm font-medium text-brand-gray-700"
                        >
                            Confirm New Password
                        </label>
                        <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-brand-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-turquoise focus:border-brand-turquoise"
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                    {success && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{success}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !!success}
                            className="w-full px-4 py-2 font-semibold text-white bg-brand-turquoise rounded-md hover:bg-brand-turquoise-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-turquoise disabled:bg-brand-gray-300"
                        >
                            {isSubmitting ? 'Saving...' : 'Set Password and Activate Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvitePage;
