import React from 'react';
import { LoadingSpinner } from './LoadingSpinner.jsx';
import { UI_CONFIG } from '../../constants/uiConfig.js';

const StatusIcon = ({ status }) => {
  switch (status) {
    case UI_CONFIG.LOADING_STATES.LOADING:
      return <LoadingSpinner />;

    case UI_CONFIG.LOADING_STATES.SUCCESS:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="#00838F">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.414a1 1 0 011.414-1.414L8 11.293l6.293-6.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );

    case UI_CONFIG.LOADING_STATES.ERROR:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="#DC2626">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );

    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#00838F">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M10.708 2.372a2.382 2.382 0 0 0 -.71 .686l-4.892 7.26c-1.981 3.314 -1.22 7.466 1.767 9.882c2.969 2.402 7.286 2.402 10.254 0c2.987 -2.416 3.748 -6.569 1.795 -9.836l-4.919 -7.306c-.722 -1.075 -2.192 -1.376 -3.295 -.686z" />
        </svg>
      );
  }
};

export const StatusButton = ({
  onClick,
  disabled = false,
  status = UI_CONFIG.LOADING_STATES.IDLE,
  children,
  className = ''
}) => {
  const baseClasses = `
    bg-green-500 text-white px-4 py-2 rounded cursor-pointer
    hover:bg-green-800 hover:text-white
    disabled:bg-gray-300 disabled:cursor-not-allowed
    flex items-center gap-2
  `;

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${className}`}
      disabled={disabled || status === UI_CONFIG.LOADING_STATES.LOADING}
    >
      {children}
      <StatusIcon status={status} />
    </button>
  );
};