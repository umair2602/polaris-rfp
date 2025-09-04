import { useState, useEffect } from 'react'
import Link from 'next/link'
import { rfpApi, proposalApi, RFP, Proposal } from '../lib/api'
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [recentRFPs, setRecentRFPs] = useState<RFP[]>([])
  const [recentProposals, setRecentProposals] = useState<Proposal[]>([])
  const [stats, setStats] = useState({
    totalRFPs: 0,
    activeProposals: 0,
    completedProposals: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)
      const [rfpsResponse, proposalsResponse] = await Promise.all([
        rfpApi.list(),
        proposalApi.list()
      ])

      const rfps = Array.isArray(rfpsResponse.data?.data) ? rfpsResponse.data.data : 
                   Array.isArray(rfpsResponse.data) ? rfpsResponse.data : []
      const proposals = Array.isArray(proposalsResponse.data?.data) ? proposalsResponse.data.data : 
                       Array.isArray(proposalsResponse.data) ? proposalsResponse.data : []

      setRecentRFPs(rfps.slice(0, 5))
      setRecentProposals(proposals.slice(0, 5))
      
      setStats({
        totalRFPs: rfps.length,
        activeProposals: proposals.filter(p => p.status === 'draft' || p.status === 'in_review').length,
        completedProposals: proposals.filter(p => p.status === 'submitted').length
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load dashboard data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/rfps/upload"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Upload RFP
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total RFPs</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalRFPs}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Proposals</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeProposals}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.completedProposals}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent RFPs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent RFPs</h3>
          </div>
          <div className="px-6 py-4">
            {recentRFPs.length > 0 ? (
              <ul className="space-y-3">
                {recentRFPs.map((rfp) => (
                  <li key={rfp._id} className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/rfps/${rfp._id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                        {rfp.title}
                      </Link>
                      <p className="text-xs text-gray-500">{rfp.clientName} • {rfp.projectType}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No RFPs uploaded yet</p>
            )}
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Proposals</h3>
          </div>
          <div className="px-6 py-4">
            {recentProposals.length > 0 ? (
              <ul className="space-y-3">
                {recentProposals.map((proposal) => (
                  <li key={proposal._id} className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/proposals/${proposal._id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                        {proposal.title}
                      </Link>
                      <p className="text-xs text-gray-500">
                        Status: {proposal.status} • Updated {new Date(proposal.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No proposals created yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}