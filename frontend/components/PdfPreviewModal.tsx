import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string | null;
  loading?: boolean;
  error?: string | null;
  title?: string;
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  url,
  loading = false,
  error = null,
  title = "Proposal PDF Preview",
}: PdfPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-2">
        {(title || title === "") && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        <div className="px-0 py-0">
          {loading && (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-b-transparent border-gray-500"></div>
            </div>
          )}
          {!loading && error && (
            <div className="p-6 text-red-600">{error}</div>
          )}
          {!loading && !error && url && (
            <div className="relative h-[70vh] bg-white overflow-hidden">
              <div className="w-full h-full">
                <iframe
                  src={`${url}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full bg-white block"
                  title="PDF Preview"
                  style={{ 
                    backgroundColor: 'white',
                    border: 'none',
                    outline: 'none',
                    width: 'calc(100% + 16px)',
                    height: 'calc(100% + 16px)'
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3 rounded-b-lg">
          <button
            className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}