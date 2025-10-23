import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({ isOpen, onClose, title, children, footer, size = "sm" }: ModalProps) {
  if (!isOpen) return null;

  const maxWidth = size === "lg" ? "max-w-3xl" : size === "md" ? "max-w-xl" : "max-w-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${maxWidth} mx-4`}>
        {(title || title === "") && (
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        <div className="px-6 py-5">
          {children}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
          {footer}
        </div>
      </div>
    </div>
  );
}


