import React from 'react';
import { Link } from 'react-router-dom';

const ApplicationSuccessPage = () => {
  return (
    <div className="max-w-xl mx-auto text-center p-8 space-y-6">
      <h1 className="text-3xl font-bold text-green-600">Application Submitted!</h1>
      <p className="text-gray-700 text-lg">
        Thank you for applying. Your application has been received. A property manager will review it shortly.
      </p>
      <Link
        to="/"
        className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default ApplicationSuccessPage;
