import React, { useState, useEffect } from 'react';

export const CookieConsentManager: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('neuralvoid_cookie_consent');
    if (consent === null) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('neuralvoid_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('neuralvoid_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0f1e] border-t border-slate-800 z-40 flex items-center justify-between gap-4 shadow-xl">
      <p className="text-slate-300 text-sm">We use cookies to improve your experience. Do you accept them?</p>
      <div className="flex gap-2">
        <button onClick={handleDecline} className="px-3 py-1 text-sm bg-slate-800 text-slate-300 rounded hover:bg-slate-700">Decline</button>
        <button onClick={handleAccept} className="px-3 py-1 text-sm bg-sky-600 text-white rounded hover:bg-sky-500">Accept</button>
      </div>
    </div>
  );
};
