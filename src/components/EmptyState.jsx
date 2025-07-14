import React from 'react';

const EmptyState = ({ icon, title, message, buttonText, onButtonClick }) => {
  return (
    <div className="text-center bg-white p-12 rounded-lg shadow-sm border">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-turquoise-100">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-brand-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-brand-gray-500">{message}</p>
      <div className="mt-6">
        <button
          type="button"
          onClick={onButtonClick}
          className="inline-flex items-center rounded-md bg-brand-turquoise px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-turquoise-600"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default EmptyState;