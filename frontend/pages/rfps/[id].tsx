import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { rfpApi, proposalApi, templateApi, RFP, Template } from '../../lib/api'
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export default function RFPDetail() {
  const router = useRouter()
  const { id } = router.query
  const [rfp, setRfp] = useState<RFP | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null)

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadRFP(id)
    }
  }, [id])

  const loadRFP = async (rfpId: string) => {
    try {
      const [rfpResponse, templatesResponse] = await Promise.all([
        rfpApi.get(rfpId),
        templateApi.list()
      ])
      setRfp(rfpResponse.data)
      const templatesData = templatesResponse.data?.data || templatesResponse.data || []
      setTemplates(Array.isArray(templatesData) ? templatesData : [])
    } catch (error) {
      console.error('Error loading RFP:', error)
      setError('Failed to load RFP details')
    } finally {
      setLoading(false)
    }
  }

  const generateProposal = async (templateId: string) => {
    if (!rfp) return
    
    setGeneratingTemplate(templateId)
    try {
      const response = await proposalApi.createEmpty({
        rfpId: rfp._id,
        templateId,
        title: `Proposal for ${rfp.title}`,
      })
      
      // Navigate to the generated proposal
      router.push(`/proposals/${response.data._id}`)
    } catch (error) {
      console.error('Error creating empty proposal:', error)
      alert('Failed to create proposal. Please try again.')
    } finally {
      setGeneratingTemplate(null)
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

  if (error || !rfp) {
    return (
      <Layout>
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">RFP not found</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'The RFP you are looking for does not exist.'}</p>
          <div className="mt-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>{rfp.title} - RFP Details</title>
      </Head>

      <div>
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
            <div className="py-6 md:flex md:items-center md:justify-between lg:border-t lg:border-gray-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                      {rfp.title}
                    </h1>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      {rfp.clientName}
                      <span className="mx-2">•</span>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {rfp.projectType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Budget Range</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {rfp.budgetRange || 'Not specified'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarDaysIcon className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Deadline</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {rfp.submissionDeadline 
                            ? new Date(rfp.submissionDeadline).toLocaleDateString()
                            : 'Not specified'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Timeline</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {rfp.timeline || 'To be determined'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-6 w-6 text-primary-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Uploaded</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {new Date(rfp.createdAt).toLocaleDateString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Key Requirements */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Key Requirements</h3>
                </div>
                <div className="px-6 py-4">
                  {rfp.keyRequirements && rfp.keyRequirements.length > 0 ? (
                    <ul className="space-y-2">
                      {rfp.keyRequirements.slice(0, 8).map((requirement, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                          </div>
                          <p className="text-sm text-gray-700">{requirement}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No specific requirements identified</p>
                  )}
                </div>
              </div>

              {/* Deliverables */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Expected Deliverables</h3>
                </div>
                <div className="px-6 py-4">
                  {rfp.deliverables && rfp.deliverables.length > 0 ? (
                    <ul className="space-y-2">
                      {rfp.deliverables.slice(0, 6).map((deliverable, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                          </div>
                          <p className="text-sm text-gray-700">{deliverable}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No specific deliverables identified</p>
                  )}
                </div>
              </div>

              {/* Evaluation Criteria */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Evaluation Criteria</h3>
                </div>
                <div className="px-6 py-4">
                  {rfp.evaluationCriteria && rfp.evaluationCriteria.length > 0 ? (
                    <ul className="space-y-2">
                      {rfp.evaluationCriteria.slice(0, 6).map((criteria, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                          </div>
                          <p className="text-sm text-gray-700">
                            {typeof criteria === 'string' ? criteria : criteria.criteria || 'Evaluation criterion'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No evaluation criteria specified</p>
                  )}
                </div>
              </div>

              {/* Special Requirements */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Special Requirements</h3>
                </div>
                <div className="px-6 py-4">
                  {rfp.specialRequirements && rfp.specialRequirements.length > 0 ? (
                    <ul className="space-y-2">
                      {rfp.specialRequirements.slice(0, 5).map((requirement, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                          </div>
                          <p className="text-sm text-gray-700">{requirement}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No special requirements identified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Generate Proposal Section */}
            <div className="mt-8 bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Generate Proposal</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create a customized proposal based on this RFP using one of our templates
                </p>
              </div>
              <div className="px-6 py-4">
                {templates.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{template.sectionCount} sections</p>
                        <p className="text-xs text-gray-400 mt-2">{template.projectType.replace('_', ' ')}</p>
                        <button
                          onClick={() => generateProposal(template.id)}
                          disabled={generatingTemplate !== null}
                          className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingTemplate === template.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Create Empty
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Loading templates...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}