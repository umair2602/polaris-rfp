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
  RocketLaunchIcon,
  EyeIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon
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
        {/* Recent RFPs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Recent RFPs</h3>
                  <p className="text-sm text-gray-600">Latest uploaded requests</p>
                </div>
              </div>
              <Button
                as={Link}
                href="/rfps"
                variant="ghost"
                size="sm"
                icon={<EyeIcon className="h-4 w-4" />}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {recentRFPs.length > 0 ? (
              <div className="space-y-4">
                {recentRFPs.map((rfp) => (
                  <div key={rfp._id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors group">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                      <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/rfps/${rfp._id}`} className="text-sm font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                        {rfp.title}
                      </Link>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                          {rfp.clientName}
                        </div>
                        <Badge variant="secondary" size="sm">
                          {rfp.projectType}
                        </Badge>
                      </div>
                    </div>
               
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">No RFPs uploaded yet</p>
                <p className="text-gray-500 text-sm mt-1">Upload your first RFP to get started</p>
                <Button
                  as={Link}
                  href="/rfps/upload"
                  className="mt-4"
                  variant="primary"
                  gradient
                  size="sm"
                  icon={<PlusIcon className="h-4 w-4" />}
                >
                  Upload RFP
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Proposals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <RocketLaunchIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Recent Proposals</h3>
                  <p className="text-sm text-gray-600">Latest proposal submissions</p>
                </div>
              </div>
              <Button
                as={Link}
                href="/proposals"
                variant="ghost"
                size="sm"
                icon={<EyeIcon className="h-4 w-4" />}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {recentProposals.length > 0 ? (
              <div className="space-y-4">
                {recentProposals.map((proposal) => {
                  const getStatusVariant = (status: string) => {
                    switch (status) {
                      case 'draft': return 'warning'
                      case 'submitted': return 'success'
                      case 'in_review': return 'info'
                      default: return 'secondary'
                    }
                  }

                  return (
                    <div key={proposal._id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-colors group">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center group-hover:from-green-200 group-hover:to-emerald-200 transition-colors">
                        <RocketLaunchIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/proposals/${proposal._id}`} className="text-sm font-semibold text-gray-900 hover:text-green-600 transition-colors">
                          {proposal.title}
                        </Link>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant={getStatusVariant(proposal.status)} size="sm">
                            {proposal.status}
                          </Badge>
                          <div className="flex items-center text-xs text-gray-500">
                            <CalendarDaysIcon className="h-4 w-4 mr-1" />
                            {new Date(proposal.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <RocketLaunchIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">No proposals created yet</p>
                <p className="text-gray-500 text-sm mt-1">Create your first proposal from an RFP</p>
                <Button
                  as={Link}
                  href="/proposals"
                  className="mt-4"
                  variant="success"
                  gradient
                  size="sm"
                  icon={<RocketLaunchIcon className="h-4 w-4" />}
                >
                  Create Proposal
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}