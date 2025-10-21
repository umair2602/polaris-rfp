import { useState, useEffect } from 'react'
import Link from 'next/link'
import { rfpApi, proposalApi, RFP, Proposal } from '../lib/api'
import Card, { CardHeader, CardBody } from './ui/Card'
import Button from './ui/Button'
import Badge from './ui/Badge'
import { LoadingScreen } from './ui/LoadingSpinner'
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import RecentRFPs from './RecentRFPs'
import RecentProposals from './RecentProposals'

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
        activeProposals: proposals.filter((p: Proposal) => p.status === 'draft' || p.status === 'in_review').length,
        completedProposals: proposals.filter((p: Proposal) => p.status === 'submitted').length
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load dashboard data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
        <CardBody>
          <div className="text-center py-12">
            <div className="text-red-600 mb-4 text-lg font-semibold">{error}</div>
            <Button 
              onClick={loadDashboardData}
              variant="danger"
              gradient
            >
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back! Here's what's happening with your proposals.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            as={Link}
            href="/rfps/upload"
            variant="primary"
            gradient
            icon={<PlusIcon className="h-5 w-5" />}
          >
            Upload RFP
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hover gradient>
          <CardBody>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <DocumentTextIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total RFPs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalRFPs}</p>
                <div className="flex items-center mt-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">All time</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover gradient>
          <CardBody>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Proposals</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeProposals}</p>
                <div className="flex items-center mt-2">
                  <ChartBarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600 font-medium">In progress</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover gradient>
          <CardBody>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedProposals}</p>
                <div className="flex items-center mt-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">Submitted</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentRFPs recentRFPs={recentRFPs} />
        <RecentProposals recentProposals={recentProposals} />
      </div>
    </div>
  )
}