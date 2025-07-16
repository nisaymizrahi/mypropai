import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, changePassword, createStripeConnectAccount } from '../utils/api';
import { useLocation, Link } from 'react-router-dom';

const AccountCenter = () => {
    const { user, loading } = useAuth();
    const location = useLocation();
    
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [isProfileSaving, setIsProfileSaving] = useState(false);

    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name, email: user.email });
        }
        
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('stripe_success')) {
            toast.success("Stripe account connected successfully!");
        }
    }, [user, location]);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsProfileSaving(true);
        try {
            await updateUserProfile(profileData);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to update profile.');
        } finally {
            setIsProfileSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setIsPasswordSaving(true);
        try {
            const data = await changePassword(passwordData);
            toast.success(data.message);
            setPasswordData({ currentPassword: '', newPassword: '' });
        } catch (error) {
            toast.error(error.message || 'Failed to change password.');
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const handleStripeConnect = async () => {
        setIsConnecting(true);
        try {
            const { url } = await createStripeConnectAccount();
            window.location.href = url;
        } catch (error) {
            toast.error("Could not connect to Stripe. Please try again.");
            setIsConnecting(false);
        }
    };

    if (loading) {
        return <div>Loading account details...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-brand-gray-900">Account Center</h1>
            
            {/* Profile Information Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Full Name</label>
                            <input name="name" type="text" value={profileData.name || ''} onChange={handleProfileChange} className="mt-1 block w-full border rounded-md p-2"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Email Address</label>
                            <input name="email" type="email" value={profileData.email || ''} onChange={handleProfileChange} className="mt-1 block w-full border rounded-md p-2"/>
                        </div>
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isProfileSaving} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50">
                            {isProfileSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Payments & Billing Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Payments & Billing</h2>
                {user?.stripeOnboardingComplete ? (
                    <div className="p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
                        <p className="font-semibold">✓ Stripe Account Connected</p>
                        <p className="text-sm">You are ready to accept payments for application fees and rental income.</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-brand-gray-600 mb-4">
                            Connect your own Stripe account to securely accept payments for application fees and rental income directly into your bank account.
                        </p>
                        <button onClick={handleStripeConnect} disabled={isConnecting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50">
                            {isConnecting ? 'Connecting...' : 'Connect with Stripe'}
                        </button>
                    </div>
                )}
            </div>

            {/* Change Password Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Current Password</label>
                            <input name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} className="mt-1 block w-full border rounded-md p-2"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">New Password</label>
                            <input name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} className="mt-1 block w-full border rounded-md p-2"/>
                        </div>
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isPasswordSaving} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50">
                            {isPasswordSaving ? 'Saving...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountCenter;
