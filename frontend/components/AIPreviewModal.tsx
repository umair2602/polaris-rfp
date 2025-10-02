import { PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { rfpApi } from '../lib/api'
import Modal from './ui/Modal'

interface AIPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: () => void
  isLoading?: boolean
  rfpId?: string
}

export default function AIPreviewModal({ isOpen, onClose, onGenerate, isLoading = false, rfpId }: AIPreviewModalProps) {
  const [titles, setTitles] = useState<string[]>([])
  const [loadingTitles, setLoadingTitles] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTitles = async () => {
      if (!isOpen || !rfpId) return
      setLoadingTitles(true)
      setError(null)
      try {
        const res = await rfpApi.getSectionTitles(rfpId)
        setTitles(Array.isArray(res.data?.titles) ? res.data.titles : [])
      } catch (e: any) {
        setError('Failed to load AI section titles')
        setTitles([])
      } finally {
        setLoadingTitles(false)
      }
    }
    fetchTitles()
  }, [isOpen, rfpId])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Section Titles Preview"
      size="lg"
      footer={
        <div className="flex items-center justify-between ">
          <button
            className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 inline"></div>
            ) : (
              <PlusIcon className="h-4 w-4 mr-1 inline" />
            )}
            {isLoading ? 'Generating...' : 'Generate Proposal'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col max-h-[70vh]">
        {/* Header Section */}
        <div className="text-center mb-6 pt-2">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI-Generated Proposal Sections</h3>
          <p className="text-sm text-gray-500">
            The AI will generate a comprehensive proposal with the following sections:
          </p>
        </div>

        {/* Scrollable Sections */}
        <div className="flex-1 overflow-y-auto max-h-80 mb-6 custom-scrollbar">
          <div className="space-y-3 pr-1">
            {loadingTitles && (
              <div className="space-y-3 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loadingTitles && error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            {!loadingTitles && !error && titles.length === 0 && (
              <div className="text-sm text-gray-500">No AI titles available yet.</div>
            )}
            {!loadingTitles && !error && titles.map((title, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 text-2xl">🧩</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                AI Section Titles Only
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  These are AI-generated section titles based on the RFP context. No section content is generated at this stage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
