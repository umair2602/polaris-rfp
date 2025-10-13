import Head from 'next/head'
import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { rfpApi, RFP } from '../lib/api'
import Link from 'next/link'
import Modal from '../components/ui/Modal'
import { 
  DocumentTextIcon, 
  PlusIcon, 
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

export default function RFPs() {
  const [rfps, setRfps] = useState<RFP[]>([])
  const [filteredRfps, setFilteredRfps] = useState<RFP[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProjectType, setSelectedProjectType] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [rfpToDelete, setRfpToDelete] = useState<RFP | null>(null)

  useEffect(() => {
    loadRFPs()
  }, [])

  const loadRFPs = async () => {
    try {
      const response = await rfpApi.list()
      const rfpData = Array.isArray((response as any).data?.data)
        ? (response as any).data.data
        : Array.isArray(response.data)
        ? response.data
        : []
      setRfps(rfpData)
      setFilteredRfps(rfpData)
    } catch (error) {
      console.error('Error loading RFPs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = rfps

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(rfp =>
        rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfp.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by project type
    if (selectedProjectType !== 'all') {
      filtered = filtered.filter(rfp => rfp.projectType === selectedProjectType)
    }

    setFilteredRfps(filtered)
  }, [rfps, searchTerm, selectedProjectType])

  const projectTypes = Array.from(new Set(rfps.map(rfp => rfp.projectType)))

  const handleDeleteRFP = (rfp: RFP) => {
    setRfpToDelete(rfp)
    setShowDeleteModal(true)
  }

  const confirmDeleteRFP = async () => {
    if (!rfpToDelete) return
    try {
      await rfpApi.delete(rfpToDelete._id)
      const updatedRfps = rfps.filter(r => r._id !== rfpToDelete._id)
      setRfps(updatedRfps)
      setFilteredRfps(updatedRfps)
    } catch (error) {
      console.error('Error deleting RFP:', error)
    } finally {
      setShowDeleteModal(false)
      setRfpToDelete(null)
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
        <title>RFPs - RFP Proposal System</title>
      </Head>

      <div>
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              RFPs
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage uploaded RFP documents and their analysis
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/rfps/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Upload RFP
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search RFPs by title or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-gray-100 text-gray-900"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <select
                  value={selectedProjectType}
                  onChange={(e) => setSelectedProjectType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 appearance-none bg-grey-100 "
                >
                  <option value="all">All Project Types</option>
                  {projectTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {(searchTerm || selectedProjectType !== 'all') && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredRfps.length} of {rfps.length} RFPs
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedProjectType('all')
                }}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          {filteredRfps.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredRfps.map((rfp) => (
                <li key={rfp._id} className="hover:bg-gray-50 transition-colors">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mr-3">
                          <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <Link 
                          href={`/rfps/${rfp._id}`}
                          className="text-sm font-medium text-primary-600 truncate hover:text-primary-800"
                        >
                          {rfp.title}
                        </Link>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {rfp.projectType.replace('_', ' ')}
                        </span>
                        <div className="flex space-x-1">
                          <Link
                            href={`/rfps/${rfp._id}`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-primary-600 bg-primary-100 hover:bg-primary-200"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() => handleDeleteRFP(rfp)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-600 bg-red-100 hover:bg-red-200"
                            title="Delete RFP"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between sm:items-center">
                      <div className="sm:flex sm:space-x-6">
                        <p className="flex items-center text-sm text-gray-500">
                          <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                          {rfp.clientName}
                        </p>
                        {rfp.budgetRange && (
                          <p className="flex items-center text-sm text-gray-500 sm:mt-0">
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            {rfp.budgetRange}
                          </p>
                        )}
                        {rfp.submissionDeadline && (
                          <p className="flex items-center text-sm text-gray-500 sm:mt-0">
                            <CalendarDaysIcon className="h-4 w-4 mr-1" />
                            Due {new Date(rfp.submissionDeadline).toLocaleDateString('en-US')}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-400 sm:mt-0">
                        Uploaded {new Date(rfp.createdAt).toLocaleDateString('en-US')}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No RFPs</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by uploading your first RFP.</p>
              <div className="mt-6">
                <Link
                  href="/rfps/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Upload RFP
                </Link>
              </div>
            </div>
          )}
        </div>
        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setRfpToDelete(null) }}
          title={rfpToDelete ? `Delete "${rfpToDelete.title}"?` : 'Delete RFP'}
          size="sm"
          footer={
            <div className="flex items-center space-x-3">
              <button
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
                onClick={() => { setShowDeleteModal(false); setRfpToDelete(null) }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700"
                onClick={confirmDeleteRFP}
              >
                Delete
              </button>
            </div>
          }
        >
          <p className="text-gray-700">This action cannot be undone.</p>
        </Modal>
      </div>
    </Layout>
  )
}