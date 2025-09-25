import React from 'react'

interface DownloadMenuProps {
  isOpen: boolean
  onSelect: (format: 'pdf' | 'docx') => void
  className?: string
}

export default function DownloadMenu({ isOpen, onSelect, className = '' }: DownloadMenuProps) {
  if (!isOpen) return null

  return (
    <div className={`absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 ${className}`}>
      <button
        onClick={() => onSelect('pdf')}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-900"
      >
        Download as PDF
      </button>
      <button
        onClick={() => onSelect('docx')}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-900"
      >
        Download as DOCX
      </button>
    </div>
  )
}


