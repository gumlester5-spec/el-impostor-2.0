import React from 'react';
import { AVATARS } from '../constants';

interface AvatarProps {
  type: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({ type, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
  };

  const currentSize = sizeClasses[size];
  
  // Check if type is a custom image (Base64 or URL)
  const isCustomImage = type.startsWith('data:') || type.startsWith('http') || type.startsWith('blob:');

  if (isCustomImage) {
    return (
      <div className={`${currentSize} rounded-full overflow-hidden border-2 border-slate-600 shadow-md ${className}`}>
        <img src={type} alt="Avatar" className="w-full h-full object-cover" />
      </div>
    );
  }

  const renderIcon = () => {
    switch (type) {
      case AVATARS.USER: // User - Agente secreto
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="url(#gradUser)" />
            <defs>
              <linearGradient id="gradUser" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        );
      case AVATARS.ELMER: // Elmer - Robot geométrico
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
             <circle cx="12" cy="12" r="10" fill="#1e293b" stroke="url(#gradElmer)" strokeWidth="0"/>
             <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8 10C8 9.45 8.45 9 9 9C9.55 9 10 9.45 10 10C10 10.55 9.55 11 9 11C8.45 11 8 10.55 8 10ZM15.5 17C14.5 17 12 16 12 16C12 16 9.5 17 8.5 17C8.1 17 7.75 16.7 7.75 16.3C7.75 16.03 7.9 15.8 8.1 15.65C9.25 14.9 11.5 14 12 14C12.5 14 14.75 14.9 15.9 15.65C16.1 15.8 16.25 16.03 16.25 16.3C16.25 16.7 15.9 17 15.5 17ZM16 10C16 10.55 15.55 11 15 11C14.45 11 14 10.55 14 10C14 9.45 14.45 9 15 9C15.55 9 16 9.45 16 10Z" fill="url(#gradElmer)"/>
             <rect x="7" y="5" width="2" height="4" rx="1" fill="#38bdf8" fillOpacity="0.5"/>
             <rect x="15" y="5" width="2" height="4" rx="1" fill="#38bdf8" fillOpacity="0.5"/>
             <defs>
              <linearGradient id="gradElmer" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        );
      case AVATARS.SANDRA: // Sandra - IA futurista
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20C9.33 20 7 18 7 15C7 13.5 10 13 12 13C14 13 17 13.5 17 15C17 18 14.67 20 12 20Z" fill="url(#gradSandra)" />
            <circle cx="18" cy="6" r="2" fill="#f472b6" fillOpacity="0.8" />
            <circle cx="6" cy="18" r="1" fill="#f472b6" fillOpacity="0.6" />
             <defs>
              <linearGradient id="gradSandra" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f472b6" />
                <stop offset="1" stopColor="#db2777" />
              </linearGradient>
            </defs>
          </svg>
        );
      default:
        // Default fallback if a bad string is passed
        return <div className="w-full h-full bg-gray-500 rounded-full"></div>;
    }
  };

  return (
    <div className={`${currentSize} rounded-full flex items-center justify-center bg-slate-800 shadow-inner ${className}`}>
      {renderIcon()}
    </div>
  );
};