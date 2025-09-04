import Head from 'next/head'
import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { proposalApi, Proposal } from '../lib/api'
import Link from 'next/link'
import { 
  DocumentTextIcon,
  CalendarDaysIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
  const [proposalForm, setProposalForm] = useState({ title: '', status: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProposals()
  }, [])

  const loadProposals = async () => {
    try {
      const response = await proposalApi.list()
      setProposals(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProposal = (proposal: Proposal) => {
    setProposalForm({ title: proposal.title, status: proposal.status })
    setEditingProposal(proposal)
  }

  const handleSaveProposal = async () => {
    if (!editingProposal) return
    try {
      // In a real app, this would make an API call
      const updatedProposals = proposals.map(p => 
        p._id === editingProposal._id ? { ...p, ...proposalForm } : p
      )
      setProposals(updatedProposals)
      setEditingProposal(null)
      alert('Proposal updated successfully!')
    } catch (error) {
      console.error('Error updating proposal:', error)
      alert('Failed to update proposal')
    }
  }

  const handleDeleteProposal = async (proposal: Proposal) => {
    if (confirm(`Are you sure you want to delete "${proposal.title}"?`)) {
      try {
        // In a real app, this would make an API call
        setProposals(proposals.filter(p => p._id !== proposal._id))
        alert('Proposal deleted successfully!')
      } catch (error) {
        console.error('Error deleting proposal:', error)
        alert('Failed to delete proposal')
      }
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Proposals - RFP Proposal System</title>
      </Head>

      <div>
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Proposals
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Generated proposals based on RFP requirements
            </p>
          </div>
        </div>

        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
          {proposals.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {proposals.map((proposal) => (
                <li key={proposal._id} className="hover:bg-gray-50 transition-colors">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="flex-1 min-w-0">
                          {editingProposal?._id === proposal._id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={proposalForm.title}
                                onChange={(e) => setProposalForm({...proposalForm, title: e.target.value})}
                                className="block w-full text-sm border border-gray-300 rounded px-2 py-1"
                              />
                              <select
                                value={proposalForm.status}
                                onChange={(e) => setProposalForm({...proposalForm, status: e.target.value})}
                                className="block text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="draft">Draft</option>
                                <option value="in_review">In Review</option>
                                <option value="submitted">Submitted</option>
                              </select>
                            </div>
                          ) : (
                            <>
                              <Link 
                                href={`/proposals/${proposal._id}`}
                                className="text-sm font-medium text-primary-600 truncate hover:text-primary-800 block"
                              >
                                {proposal.title}
                              </Link>
                              {(proposal as any).rfp && (
                                <p className="text-xs text-gray-500 mt-1">
                                  For: {(proposal as any).rfp.clientName || 'Unknown Client'}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          proposal.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          proposal.status === 'submitted' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {proposal.status}
                        </span>
                        {editingProposal?._id === proposal._id ? (
                          <div className="flex space-x-1">
                            <button
                              onClick={handleSaveProposal}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckIcon className="h-3 w-3 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingProposal(null)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <XMarkIcon className="h-3 w-3 mr-1" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-1">
                            <Link
                              href={`/proposals/${proposal._id}`}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-primary-600 bg-primary-100 hover:bg-primary-200"
                            >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              View
                            </Link>
                            <button
                              onClick={() => handleEditProposal(proposal)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200"
                            >
                              <PencilIcon className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProposal(proposal)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-600 bg-red-100 hover:bg-red-200"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between sm:items-center">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          Created {new Date(proposal.createdAt).toLocaleDateString()}
                        </div>
                        {proposal.updatedAt !== proposal.createdAt && (
                          <div className="flex items-center">
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Updated {new Date(proposal.updatedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-400 sm:mt-0">
                        {Object.keys(proposal.sections || {}).length} sections
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Proposals</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload an RFP first, then generate proposals based on the requirements.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}