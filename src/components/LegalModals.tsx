import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
        </div>
        <div className="text-slate-300 text-sm leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export const PrivacyPolicyModal: React.FC<{isOpen: boolean; onClose: () => void}> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy">
    <p>NeuralVoid collects minimal data necessary to provide our AI-powered services. This includes email addresses, chat history, and workspace configurations.</p>
    <h3 className="font-semibold text-white">How we store data</h3>
    <p>Data is stored securely in our cloud-hosted databases. We use industry-standard encryption to protect your information.</p>
    <p>You can request to delete your data at any time through your account settings or by contacting our support team.</p>
  </Modal>
);

export const TermsAndConditionsModal: React.FC<{isOpen: boolean; onClose: () => void}> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Terms & Conditions">
    <p>By using NeuralVoid, you agree to these terms. AI responses may contain errors; users are responsible for verifying generated content.</p>
    <h3 className="font-semibold text-white">User Responsibilities</h3>
    <p>Users must not engage in abuse, generate illegal content, or perform attacks on the platform.</p>
  </Modal>
);

export const CookieNoticeModal: React.FC<{isOpen: boolean; onClose: () => void}> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Cookie Notice">
    <p>NeuralVoid uses essential cookies and local storage to maintain your login session and improve platform performance.</p>
  </Modal>
);
