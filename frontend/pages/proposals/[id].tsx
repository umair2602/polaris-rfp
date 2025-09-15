import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import TextEditor from '../../components/TextEditor'
import { proposalApi, Proposal } from '../../lib/api'
import api from '../../lib/api'
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'

export default function ProposalDetail() {
  const router = useRouter()
  const { id } = router.query
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadProposal(id)
    }
  }, [id])

  const loadProposal = async (proposalId: string) => {
    try {
      const response = await proposalApi.get(proposalId)
      setProposal(response.data)
    } catch (error) {
      console.error('Error loading proposal:', error)
      setError('Failed to load proposal details')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (sectionName: string, content: string) => {
    setEditingSection(sectionName)
    setEditContent(content)
  }

  const cancelEdit = () => {
    setEditingSection(null)
    setEditContent('')
  }

  const saveSection = async () => {
    if (!proposal || !editingSection) return
    
    setSaving(true)
    try {
      const updatedSections = {
        ...proposal.sections,
        [editingSection]: {
          ...proposal.sections[editingSection],
          content: editContent,
          lastModified: new Date().toISOString()
        }
      }

      const response = await proposalApi.update(proposal._id, { sections: updatedSections })
      setProposal(response.data)
      setEditingSection(null)
      setEditContent('')
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Failed to save section. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const deleteSection = async (sectionName: string) => {
    if (!proposal) return
    if (!confirm(`Are you sure you want to delete the "${sectionName}" section?`)) return

    setSaving(true)
    try {
      const updatedSections = { ...proposal.sections }
      delete updatedSections[sectionName]

      const response = await proposalApi.update(proposal._id, { sections: updatedSections })
      setProposal(response.data)
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('Failed to delete section. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addSection = async () => {
    if (!proposal || !newSectionTitle.trim()) return
    
    setSaving(true)
    try {
      const updatedSections = {
        ...proposal.sections,
        [newSectionTitle]: {
          content: '',
          type: 'custom',
          lastModified: new Date().toISOString()
        }
      }

      const response = await proposalApi.update(proposal._id, { sections: updatedSections })
      setProposal(response.data)
      setIsAddingSection(false)
      setNewSectionTitle('')
      setEditingSection(newSectionTitle)
      setEditContent('')
    } catch (error) {
      console.error('Error adding section:', error)
      alert('Failed to add section. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const uploadToGoogleDrive = async () => {
    if (!proposal) return
    
    setUploading(true)
    try {
      const fileName = `${proposal.title.replace(/[^a-z0-9]/gi, '_')}_Proposal.json`
      
      const response = await api.post(`/googledrive/upload-proposal/${proposal._id}`, {
        fileName
      })
      
      alert(`Proposal uploaded successfully to Google Drive!\nFile: ${response.data.file.name}`)
    } catch (error) {
      console.error('Error uploading to Google Drive:', error)
      alert('Failed to upload to Google Drive. Please ensure Google Drive is configured and try again.')
    } finally {
      setUploading(false)
    }
  }

  // Helper function to render content with proper table formatting
  const renderSectionContent = (content: string, sectionName: string) => {
    if (!content) return 'No content available'
    
    // Check if this section contains table data (Budget Estimate or Project Timeline)
    const isTableSection = sectionName.toLowerCase().includes('budget') || 
                          sectionName.toLowerCase().includes('timeline') ||
                          content.includes('|') // Contains pipe characters (markdown table)
    
    if (isTableSection && content.includes('|')) {
      return renderMarkdownTable(content)
    }
    
    // Regular content formatting
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^• (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  }

  // Helper function to render markdown tables as proper HTML tables
  const renderMarkdownTable = (content: string) => {
    const lines = content.split('\n')
    let tableHtml = ''
    let inTable = false
    let tableRows: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.includes('|') && !line.match(/^[\s\-\|]+$/)) {
        // This is a table row (not a separator line)
        if (!inTable) {
          inTable = true
          tableRows = []
        }
        tableRows.push(line)
      } else if (inTable && line.match(/^[\s\-\|]+$/)) {
        // This is a table separator line, skip it
        continue
      } else if (inTable && line === '') {
        // End of table
        tableHtml += formatTableRows(tableRows)
        inTable = false
        tableRows = []
      } else if (!inTable) {
        // Regular content
        const formattedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
        tableHtml += formattedLine ? `<p>${formattedLine}</p>` : '<br>'
      }
    }
    
    // Handle table at end of content
    if (inTable && tableRows.length > 0) {
      tableHtml += formatTableRows(tableRows)
    }
    
    return tableHtml
  }

  // Helper function to format table rows into proper HTML table
  const formatTableRows = (rows: string[]) => {
    if (rows.length === 0) return ''
    
    const headerRow = rows[0]
    const dataRows = rows.slice(1)
    
    const parseRow = (row: string) => {
      return row.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '')
    }
    
    const headerCells = parseRow(headerRow)
    
    let tableHtml = '<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200 my-4">'
    
    // Header
    tableHtml += '<thead class="bg-gray-50">'
    tableHtml += '<tr>'
    headerCells.forEach(cell => {
      const formattedCell = cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      tableHtml += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${formattedCell}</th>`
    })
    tableHtml += '</tr>'
    tableHtml += '</thead>'
    
    // Body
    tableHtml += '<tbody class="bg-white divide-y divide-gray-200">'
    dataRows.forEach((row, index) => {
      const cells = parseRow(row)
      tableHtml += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`
      cells.forEach(cell => {
        const formattedCell = cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        tableHtml += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formattedCell}</td>`
      })
      tableHtml += '</tr>'
    })
    tableHtml += '</tbody>'
    tableHtml += '</table></div>'
    
    return tableHtml
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

  if (error || !proposal) {
    return (
      <Layout>
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Proposal not found</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'The proposal you are looking for does not exist.'}</p>
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

  const sectionEntries = Object.entries(proposal.sections || {})

  return (
    <Layout>
      <Head>
        <title>{proposal.title} - Proposal Details</title>
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
                      {proposal.title}
                    </h1>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      {(proposal as any).rfp?.clientName || 'Unknown Client'}
                      <span className="mx-2">•</span>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {proposal.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                <button
                  onClick={uploadToGoogleDrive}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Upload to Drive
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Status</dt>
                        <dd className="text-lg font-medium text-gray-900 capitalize">
                          {proposal.status}
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
                      <CalendarDaysIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Created</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {new Date(proposal.createdAt).toLocaleDateString()}
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
                      <DocumentTextIcon className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Sections</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {sectionEntries.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Section Button */}
            <div className="mb-6">
              {isAddingSection ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Section title"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      onKeyPress={(e) => e.key === 'Enter' && addSection()}
                    />
                    <button
                      onClick={addSection}
                      disabled={!newSectionTitle.trim() || saving}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingSection(false)
                        setNewSectionTitle('')
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingSection(true)}
                  className="inline-flex items-center px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Section
                </button>
              )}
            </div>

            {/* Proposal Sections */}
            <div className="space-y-8">
              {sectionEntries.map(([sectionName, sectionData]: [string, any]) => (
                <div key={sectionName} className="bg-white shadow rounded-lg">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {sectionName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sectionData.type === 'generated' 
                            ? 'bg-green-100 text-green-800' 
                            : sectionData.type === 'custom'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {sectionData.type}
                        </span>
                        {editingSection !== sectionName && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => startEdit(sectionName, sectionData.content || '')}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Edit section"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteSection(sectionName)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete section"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    {editingSection === sectionName ? (
                      <div className="space-y-4">
                        <TextEditor
                          value={editContent}
                          onChange={setEditContent}
                          placeholder="Enter section content..."
                          className="min-h-64"
                        />
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={saveSection}
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                          >
                            {saving ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            ) : (
                              <CheckIcon className="h-4 w-4 mr-2" />
                            )}
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            <XMarkIcon className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="prose max-w-none text-sm text-gray-700">
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: renderSectionContent(sectionData.content || '', sectionName)
                            }} 
                          />
                        </div>
                        {sectionData.lastModified && (
                          <div className="mt-4 text-xs text-gray-400">
                            Last modified: {new Date(sectionData.lastModified).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {sectionEntries.length === 0 && (
              <div className="text-center py-12 bg-white shadow rounded-lg">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Content</h3>
                <p className="mt-1 text-sm text-gray-500">This proposal has no sections or content yet.</p>
                <div className="mt-4">
                  <button
                    onClick={() => setIsAddingSection(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add First Section
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}