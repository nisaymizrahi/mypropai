import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, changePassword } from '../utils/api';

const AccountCenter = () => {
    const { user, loading } = useAuth();
    
    // State for the profile form
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [profileMessage, setProfileMessage] = useState('');
    const [isProfileSaving, setIsProfileSaving] = useState(false);

    // State for the password form
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [passwordMessage, setPasswordMessage] = useState('');
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name, email: user.email });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsProfileSaving(true);
        setProfileMessage('');
        try {
            await updateUserProfile(profileData);
            setProfileMessage('Profile updated successfully!');
        } catch (error) {
            setProfileMessage(error.message || 'Failed to update profile.');
        } finally {
            setIsProfileSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setIsPasswordSaving(true);
        setPasswordMessage('');
        try {
            const data = await changePassword(passwordData);
            setPasswordMessage(data.message);
            setPasswordData({ currentPassword: '', newPassword: '' }); // Clear fields
        } catch (error) {
            setPasswordMessage(error.message || 'Failed to change password.');
        } finally {
            setIsPasswordSaving(false);
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
                            <input name="name" type="text" value={profileData.name} onChange={handleProfileChange} className="mt-1 block w-full border rounded-md p-2"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Email Address</label>
                            <input name="email" type="email" value={profileData.email} onChange={handleProfileChange} className="mt-1 block w-full border rounded-md p-2"/>
                        </div>
                    </div>
                    {profileMessage && <p className={`text-sm ${profileMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{profileMessage}</p>}
                    <div className="text-right">
                        <button type="submit" disabled={isProfileSaving} className="bg-brand-turquoise text-white px-4 py-2 rounded-md disabled:opacity-50">
                            {isProfileSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
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
                    {passwordMessage && <p className={`text-sm ${passwordMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{passwordMessage}</p>}
                    <div className="text-right">
                        <button type="submit" disabled={isPasswordSaving} className="bg-brand-turquoise text-white px-4 py-2 rounded-md disabled:opacity-50">
                            {isPasswordSaving ? 'Saving...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountCenter;