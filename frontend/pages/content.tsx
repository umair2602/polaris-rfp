import Head from 'next/head'
import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { contentApi } from '../lib/api'
import { 
  UserGroupIcon, 
  BuildingOfficeIcon,
  EyeIcon,
  StarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function ContentLibrary() {
  const [company, setCompany] = useState<any>(null)
  const [team, setTeam] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'company' | 'team'>('company')
  const [editingCompany, setEditingCompany] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [companyForm, setCompanyForm] = useState<any>({})
  const [memberForm, setMemberForm] = useState<any>({
    name: '',
    title: '',
    experienceYears: '',
    education: [''],
    certifications: [''],
    responsibilities: ['']
  })

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      const [companyResponse, teamResponse] = await Promise.all([
        contentApi.getCompany(),
        contentApi.getTeam()
      ])
      setCompany(companyResponse.data || null)
      setTeam(Array.isArray(teamResponse.data) ? teamResponse.data : [])
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCompany = () => {
    setCompanyForm({ ...company })
    setEditingCompany(true)
  }

  const handleSaveCompany = async () => {
    try {
      // In a real app, this would make an API call
      setCompany(companyForm)
      setEditingCompany(false)
      alert('Company information updated successfully!')
    } catch (error) {
      console.error('Error updating company:', error)
      alert('Failed to update company information')
    }
  }

  const handleCancelCompanyEdit = () => {
    setCompanyForm({})
    setEditingCompany(false)
  }

  const handleEditMember = (member: any) => {
    setMemberForm({ ...member })
    setEditingMember(member)
    setSelectedMember(member)
  }

  const handleSaveMember = async () => {
    try {
      // In a real app, this would make an API call
      const updatedTeam = team.map(member => 
        member === editingMember ? memberForm : member
      )
      setTeam(updatedTeam)
      setSelectedMember(memberForm)
      setEditingMember(null)
      alert('Team member updated successfully!')
    } catch (error) {
      console.error('Error updating member:', error)
      alert('Failed to update team member')
    }
  }

  const handleAddMember = async () => {
    try {
      // In a real app, this would make an API call
      const newMember = { ...memberForm, id: Date.now().toString() }
      setTeam([...team, newMember])
      setMemberForm({
        name: '',
        title: '',
        experienceYears: '',
        education: [''],
        certifications: [''],
        responsibilities: ['']
      })
      setShowAddMember(false)
      alert('Team member added successfully!')
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Failed to add team member')
    }
  }

  const handleDeleteMember = async (memberToDelete: any) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        // In a real app, this would make an API call
        setTeam(team.filter(member => member !== memberToDelete))
        if (selectedMember === memberToDelete) {
          setSelectedMember(null)
        }
        alert('Team member deleted successfully!')
      } catch (error) {
        console.error('Error deleting member:', error)
        alert('Failed to delete team member')
      }
    }
  }

  const addArrayItem = (field: string, setState: any, state: any) => {
    setState({
      ...state,
      [field]: [...state[field], '']
    })
  }

  const updateArrayItem = (field: string, index: number, value: string, setState: any, state: any) => {
    const updated = [...state[field]]
    updated[index] = value
    setState({
      ...state,
      [field]: updated
    })
  }

  const removeArrayItem = (field: string, index: number, setState: any, state: any) => {
    setState({
      ...state,
      [field]: state[field].filter((_: any, i: number) => i !== index)
    })
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
        <title>Content Library - RFP Proposal System</title>
      </Head>

      <div>
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Content Library
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage company information and team member profiles
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('company')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'company'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4 mr-2 inline" />
                Company Information
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'team'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserGroupIcon className="h-4 w-4 mr-2 inline" />
                Team Members ({team.length})
              </button>
            </nav>
          </div>
        </div>

        <div className="mt-8">
          {activeTab === 'company' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {company?.companyName || 'Company Information'}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    {editingCompany ? (
                      <>
                        <button
                          onClick={handleSaveCompany}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                        >
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelCompanyEdit}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <XMarkIcon className="h-3 w-3 mr-1" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditCompany}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-primary-600 bg-primary-100 hover:bg-primary-200"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-6">
                {company ? (
                  <div className="space-y-6">
                    <div>
                      {editingCompany ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Company Name</label>
                            <input
                              type="text"
                              value={companyForm.companyName || ''}
                              onChange={(e) => setCompanyForm({...companyForm, companyName: e.target.value})}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                              value={companyForm.description || ''}
                              onChange={(e) => setCompanyForm({...companyForm, description: e.target.value})}
                              rows={3}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{company.companyName}</h4>
                          <p className="text-sm text-gray-600 mt-2">{company.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Founded</h5>
                        <p className="text-sm text-gray-900">{company.foundedYear}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Location</h5>
                        <p className="text-sm text-gray-900">{company.headquarters}</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Certifications</h5>
                      <div className="flex flex-wrap gap-2">
                        {company.certifications?.map((cert: string, index: number) => (
                          <span key={index} className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Key Achievements</h5>
                      <ul className="space-y-1">
                        {company.keyAchievements?.map((achievement: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <StarIcon className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Core Values</h5>
                      <ul className="space-y-1">
                        {company.coreValues?.map((value: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">{value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Loading company information...</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Team Members List */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Team Members
                      </h3>
                      <button
                        onClick={() => setShowAddMember(true)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Add Member
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {team.length > 0 ? (
                      team.map((member, index) => (
                        <div 
                          key={index} 
                          className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedMember === member ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                          }`}
                          onClick={() => setSelectedMember(member)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <UserGroupIcon className="h-5 w-5 text-primary-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.title}</p>
                                <p className="text-xs text-gray-400">{member.experienceYears}+ years experience</p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button 
                                onClick={() => setSelectedMember(member)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-600 bg-primary-100 rounded hover:bg-primary-200"
                              >
                                <EyeIcon className="h-3 w-3 mr-1" />
                                View
                              </button>
                              <button
                                onClick={() => handleEditMember(member)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
                              >
                                <PencilIcon className="h-3 w-3 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-4">
                        <p className="text-gray-500 text-sm">No team members found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Details Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white shadow rounded-lg sticky top-6">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Member Details
                    </h3>
                  </div>
                  <div className="px-6 py-4">
                    {selectedMember ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
                            <UserGroupIcon className="h-8 w-8 text-primary-600" />
                          </div>
                          <h4 className="font-medium text-gray-900">{selectedMember.name}</h4>
                          <p className="text-sm text-gray-500">{selectedMember.title}</p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <BriefcaseIcon className="h-4 w-4 mr-1" />
                            Experience
                          </h5>
                          <p className="text-sm text-gray-600">{selectedMember.experienceYears}+ years</p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <AcademicCapIcon className="h-4 w-4 mr-1" />
                            Education
                          </h5>
                          <ul className="space-y-1">
                            {selectedMember.education?.map((edu: string, index: number) => (
                              <li key={index} className="text-sm text-gray-600">{edu}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Certifications</h5>
                          <div className="flex flex-wrap gap-1">
                            {selectedMember.certifications?.map((cert: string, index: number) => (
                              <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Key Responsibilities</h5>
                          <ul className="space-y-1">
                            {selectedMember.responsibilities?.slice(0, 4).map((resp: string, index: number) => (
                              <li key={index} className="flex items-start space-x-1">
                                <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-xs text-gray-600">{resp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <UserGroupIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Select a team member to view their details
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Team Member</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={memberForm.name}
                        onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={memberForm.title}
                        onChange={(e) => setMemberForm({...memberForm, title: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
                    <input
                      type="number"
                      value={memberForm.experienceYears}
                      onChange={(e) => setMemberForm({...memberForm, experienceYears: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                    {memberForm.education.map((edu: string, index: number) => (
                      <div key={index} className="flex mb-2">
                        <input
                          type="text"
                          value={edu}
                          onChange={(e) => updateArrayItem('education', index, e.target.value, setMemberForm, memberForm)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Education qualification"
                        />
                        <button
                          onClick={() => removeArrayItem('education', index, setMemberForm, memberForm)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayItem('education', setMemberForm, memberForm)}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      + Add Education
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                    {memberForm.certifications.map((cert: string, index: number) => (
                      <div key={index} className="flex mb-2">
                        <input
                          type="text"
                          value={cert}
                          onChange={(e) => updateArrayItem('certifications', index, e.target.value, setMemberForm, memberForm)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Certification"
                        />
                        <button
                          onClick={() => removeArrayItem('certifications', index, setMemberForm, memberForm)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayItem('certifications', setMemberForm, memberForm)}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      + Add Certification
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {editingMember && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Team Member</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={memberForm.name}
                        onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={memberForm.title}
                        onChange={(e) => setMemberForm({...memberForm, title: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
                    <input
                      type="number"
                      value={memberForm.experienceYears}
                      onChange={(e) => setMemberForm({...memberForm, experienceYears: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMember}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}