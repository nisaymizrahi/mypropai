import React from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const EmptyState = ({ icon, title, message, buttonText, onButtonClick }) => (
  <div className="section-card mx-auto max-w-2xl px-8 py-10 text-center sm:px-10">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verdigris-50 text-3xl text-verdigris-600">
      <span>{icon}</span>
    </div>
    <span className="eyebrow mt-6">Ready when you are</span>
    <h3 className="mt-5 font-display text-3xl text-ink-900">{title}</h3>
    <p className="mt-4 text-sm leading-7 text-ink-500">{message}</p>
    <div className="mt-8">
      <button type="button" onClick={onButtonClick} className="primary-action">
        {buttonText}
        <ArrowRightIcon className="ml-2 h-5 w-5" />
      </button>
    </div>
  </div>
);

export default EmptyState;
