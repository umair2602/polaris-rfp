import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'

interface CreateProposalModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (title: string) => Promise<void> | void
  loading?: boolean
  selectedTemplateType?: string | null
  onTemplateTypeSelect?: (type: string) => void
}

export default function CreateProposalModal({ isOpen, onClose, onCreate, loading = false, selectedTemplateType, onTemplateTypeSelect }: CreateProposalModalProps) {
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!isOpen) setTitle('')
  }, [isOpen])

  const handleSubmit = async () => {
    const t = title.trim()
    if (!t || loading) return
    await onCreate(t)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!loading) onClose() }}
      title="Create Template"
      size="sm"
      footer={(
        <>
          <button
            onClick={() => { if (!loading) onClose() }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            disabled={loading || !title.trim()}
          >
            {loading ? 'Creating...' : 'Create Template'}
          </button>
        </>
      )}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Template Type</label>
          <div className="space-y-2">
            <button
              onClick={() => onTemplateTypeSelect?.('software_development')}
              className={`w-full text-left p-3 rounded-md border ${
                selectedTemplateType === 'software_development' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-gray-900">Software Development Proposal</div>
              <div className="text-sm text-gray-500">software development • 5 sections</div>
            </button>
            <button
              onClick={() => onTemplateTypeSelect?.('strategic_communications')}
              className={`w-full text-left p-3 rounded-md border ${
                selectedTemplateType === 'strategic_communications' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-gray-900">Strategic Communications Proposal</div>
              <div className="text-sm text-gray-500">strategic communications • 7 sections</div>
            </button>
            <button
              onClick={() => onTemplateTypeSelect?.('financial_modeling')}
              className={`w-full text-left p-3 rounded-md border ${
                selectedTemplateType === 'financial_modeling' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-gray-900">Financial Modeling & Analysis Proposal</div>
              <div className="text-sm text-gray-500">financial modeling • 5 sections</div>
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="template-name" className="block text-sm font-medium text-gray-900 mb-2">Template Name</label>
          <input
            id="template-name"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter template name"
            className="mt-1 p-2 block w-full rounded-md border-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-gray-100 text-gray-900"
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && title.trim() && !loading) {
                await handleSubmit()
              }
            }}
          />
        </div>
      </div>
    </Modal>
  )
  
}


