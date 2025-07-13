import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ title, description, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
    </div>
);

const Homepage = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-brand-turquoise">MyPropAI</h1>
                    <div className="space-x-4">
                        <button onClick={() => navigate('/tenant-login')} className="text-gray-600 hover:text-brand-turquoise font-semibold">
                            Tenant Login
                        </button>
                        <button onClick={() => navigate('/login')} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md hover:bg-brand-turquoise-600">
                            Manager Login
                        </button>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    Smarter Property & Investment Management
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                    From deal analysis to tenant communication, MyPropAI provides the tools you need to manage your real estate portfolio like a pro.
                </p>
                <div className="mt-8">
                    <button onClick={() => navigate('/login')} className="text-lg bg-brand-turquoise text-white font-semibold px-8 py-3 rounded-md hover:bg-brand-turquoise-600">
                        Get Started
                    </button>
                </div>
            </main>

            {/* Features Section */}
            <section className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">All The Tools You Need</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon="📊"
                            title="Investment Analysis"
                            description="Analyze fix & flip or fix & rent deals with detailed financial breakdowns to ensure your investments are profitable."
                        />
                        <FeatureCard 
                            icon="🛠️"
                            title="Project Management Hub"
                            description="Track your renovation projects with an interactive schedule, budget vs. actuals, and document management."
                        />
                        <FeatureCard 
                            icon="👥"
                            title="Tenant & Lease Management"
                            description="Oversee all your rental units, manage leases, and communicate with tenants through a dedicated portal."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p>&copy; 2025 MyPropAI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Homepage;