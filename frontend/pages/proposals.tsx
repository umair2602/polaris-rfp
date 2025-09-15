import Head from 'next/head'
import Layout from '../components/Layout'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { LoadingScreen } from '../components/ui/LoadingSpinner'
import { useState, useEffect } from 'react'
import { proposalApi, Proposal } from '../lib/api'
import api from '../lib/api'
import Link from 'next/link'
import { 
  DocumentTextIcon,
  CalendarDaysIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline'

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
  const [proposalForm, setProposalForm] = useState({ title: '', status: '' })
  const [loading, setLoading] = useState(true)
  const [uploadingProposalId, setUploadingProposalId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

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

  const uploadToGoogleDrive = async (proposal: Proposal) => {
    setUploadingProposalId(proposal._id)
    try {
      const fileName = `${proposal.title.replace(/[^a-z0-9]/gi, '_')}_Proposal.json`
      
      const response = await api.post(`/googledrive/upload-proposal/${proposal._id}`, {
        fileName
      })
      
      alert(`Proposal "${proposal.title}" uploaded successfully to Google Drive!\nFile: ${response.data.file.name}`)
    } catch (error) {
      console.error('Error uploading to Google Drive:', error)
      alert('Failed to upload to Google Drive. Please ensure Google Drive is configured and try again.')
    } finally {
      setUploadingProposalId(null)
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'warning'
      case 'submitted': return 'success'
      case 'in_review': return 'info'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <Layout>
        <LoadingScreen message="Loading proposals..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Proposals - RFP Proposal System</title>
      </Head>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Proposals
            </h1>
            <p className="text-lg text-gray-600">
              Manage and track your proposal submissions
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="info" size="lg">
              {filteredProposals.length} Proposals
            </Badge>
            <Button
              variant="primary"
              gradient
              icon={<PlusIcon className="h-5 w-5" />}
            >
              New Proposal
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search proposals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                  />
                </div>
                
                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Proposals Content */}
        {filteredProposals.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-16">
                <div className="relative">
                  <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-300" />
                  <div className="absolute top-0 right-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <PlusIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {searchQuery || statusFilter !== 'all' ? 'No matching proposals' : 'No proposals yet'}
                </h3>
                <p className="mt-2 text-gray-600">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Upload an RFP first, then generate proposals based on the requirements.'
                  }
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button
                    className="mt-4"
                    variant="primary"
                    gradient
                    icon={<PlusIcon className="h-4 w-4" />}
                  >
                    Create First Proposal
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProposals.map((proposal) => (
              <Card key={proposal._id} hover className="group">
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={getStatusVariant(proposal.status)} size="sm">
                        {proposal.status}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button
                          as={Link}
                          href={`/proposals/${proposal._id}`}
                          variant="ghost"
                          size="sm"
                          icon={<EyeIcon className="h-4 w-4" />}
                        />
                        <Button
                          onClick={() => handleEditProposal(proposal)}
                          variant="ghost"
                          size="sm"
                          icon={<PencilIcon className="h-4 w-4" />}
                        />
                        <Button
                          onClick={() => uploadToGoogleDrive(proposal)}
                          loading={uploadingProposalId === proposal._id}
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          icon={<CloudArrowUpIcon className="h-4 w-4" />}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        <Link href={`/proposals/${proposal._id}`}>
                          {proposal.title}
                        </Link>
                      </h3>
                      {(proposal as any).rfp && (
                        <p className="text-sm text-gray-600 mt-1">
                          For: {(proposal as any).rfp.clientName || 'Unknown Client'}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          {Object.keys(proposal.sections || {}).length} sections
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Proposal</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sections</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProposals.map((proposal) => (
                      <tr key={proposal._id} className="hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-pink-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                              <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                <Link href={`/proposals/${proposal._id}`}>
                                  {proposal.title}
                                </Link>
                              </p>
                              {(proposal as any).rfp && (
                                <p className="text-sm text-gray-600">
                                  For: {(proposal as any).rfp.clientName || 'Unknown Client'}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusVariant(proposal.status)} size="sm">
                            {proposal.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {Object.keys(proposal.sections || {}).length} sections
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              as={Link}
                              href={`/proposals/${proposal._id}`}
                              variant="ghost"
                              size="sm"
                              icon={<EyeIcon className="h-4 w-4" />}
                            >
                              View
                            </Button>
                            <Button
                              onClick={() => handleEditProposal(proposal)}
                              variant="ghost"
                              size="sm"
                              icon={<PencilIcon className="h-4 w-4" />}
                            />
                            <Button
                              onClick={() => uploadToGoogleDrive(proposal)}
                              loading={uploadingProposalId === proposal._id}
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              icon={<CloudArrowUpIcon className="h-4 w-4" />}
                            />
                            <Button
                              onClick={() => handleDeleteProposal(proposal)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              icon={<TrashIcon className="h-4 w-4" />}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </Layout>
  )
}