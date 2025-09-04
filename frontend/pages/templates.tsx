import Head from 'next/head'
import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { templateApi, Template } from '../lib/api'
import { 
  CogIcon, 
  EyeIcon, 
  DocumentTextIcon,
  InformationCircleIcon,
  PlusIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'

export default function Templates() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateDetails, setTemplateDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await templateApi.list()
      const templatesData = response.data?.data || response.data || []
      setTemplates(Array.isArray(templatesData) ? templatesData : [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplateDetails = async (templateId: string) => {
    setLoadingDetails(true)
    try {
      const response = await templateApi.get(templateId)
      setTemplateDetails(response.data)
    } catch (error) {
      console.error('Error loading template details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    loadTemplateDetails(template.id)
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
        <title>Templates - RFP Proposal System</title>
      </Head>

      <div>
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Proposal Templates
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pre-built templates for different types of projects
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Create Template
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Templates List */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {templates.length > 0 ? templates.map((template) => (
                <div 
                  key={template.id} 
                  className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-primary-500 shadow-lg' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CogIcon className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {template.name}
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {template.projectType.replace('_', ' ')}
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {template.sectionCount} sections
                      </p>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/templates/${template.id}`)
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-primary-600 bg-primary-100 hover:bg-primary-200"
                        >
                          <PencilSquareIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-gray-600 bg-gray-100 hover:bg-gray-200">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 text-center py-12 bg-white rounded-lg shadow">
                  <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Templates</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No proposal templates are available yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Template Details Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg sticky top-6">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center">
                  <InformationCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Template Details
                  </h3>
                </div>
              </div>
              <div className="px-6 py-4">
                {selectedTemplate ? (
                  <div>
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedTemplate.projectType.replace('_', ' ')}
                      </p>
                    </div>

                    {loadingDetails ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    ) : templateDetails ? (
                      <div>
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Sections ({templateDetails.sections?.length || 0})</h5>
                          <ul className="space-y-2">
                            {(templateDetails.sections || []).map((section: any, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-gray-900">{section.name || section.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {(section.contentType || 'static').replace('_', ' ')} • {section.isRequired || section.required ? 'Required' : 'Optional'}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            This template is optimized for {selectedTemplate.projectType.replace('_', ' ')} projects 
                            and includes {templateDetails.sections?.length || 0} structured sections.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CogIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Select a template to view its structure and sections
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}