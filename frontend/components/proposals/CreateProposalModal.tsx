import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'

interface CreateProposalModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (title: string) => Promise<void> | void
  loading?: boolean
}

export default function CreateProposalModal({ isOpen, onClose, onCreate, loading = false }: CreateProposalModalProps) {
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
      title="Write a title"
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
            {loading ? 'Creating...' : 'Create'}
          </button>
        </>
      )}
    >
      <div>
        <label htmlFor="proposal-title" className="block text-sm font-medium text-gray-900 mb-2">Title</label>
        <input
          id="proposal-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Write a title"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-gray-100 text-gray-900"
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && title.trim() && !loading) {
              await handleSubmit()
            }
          }}
        />
        {/* <p className="mt-2 text-xs text-gray-500">Write a title</p> */}
      </div>
    </Modal>
  )
}


