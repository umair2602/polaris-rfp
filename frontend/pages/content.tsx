import {
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  EyeIcon,
  FolderIcon,
  LinkIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { contentApi } from '../lib/api'

export default function ContentLibrary() {
  const [company, setCompany] = useState<any>(null)
  const [team, setTeam] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'company' | 'team' | 'projects' | 'references'
  >('company')
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
    responsibilities: [''],
  })
  const [projects, setProjects] = useState<any[]>([])
  const [references, setReferences] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [selectedReference, setSelectedReference] = useState<any>(null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAddReference, setShowAddReference] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [editingReference, setEditingReference] = useState<any>(null)
  const [projectForm, setProjectForm] = useState<any>({
    title: '',
    clientName: '',
    description: '',
    industry: '',
    projectType: '',
    duration: '',
    budget: '',
    keyOutcomes: [''],
    technologies: [''],
    challenges: [''],
    solutions: [''],
    files: [],
  })
  const [referenceForm, setReferenceForm] = useState<any>({
    clientName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    industry: '',
    projectTypes: [''],
    relationshipYears: '',
    projectValue: '',
    testimonial: '',
    isPublic: true,
  })

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      const [
        companyResponse,
        teamResponse,
        projectsResponse,
        referencesResponse,
      ] = await Promise.all([
        contentApi.getCompany(),
        contentApi.getTeam(),
        contentApi.getProjects?.() || Promise.resolve({ data: [] }),
        contentApi.getReferences(),
      ])
      setCompany(companyResponse.data || null)
      setTeam(Array.isArray(teamResponse.data) ? teamResponse.data : [])
      setProjects(
        Array.isArray(projectsResponse.data) ? projectsResponse.data : [],
      )
      setReferences(
        Array.isArray(referencesResponse.data) ? referencesResponse.data : [],
      )
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
      const updatedTeam = team.map((member) =>
        member === editingMember ? memberForm : member,
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
        responsibilities: [''],
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
        setTeam(team.filter((member) => member !== memberToDelete))
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
      [field]: [...state[field], ''],
    })
  }

  const updateArrayItem = (
    field: string,
    index: number,
    value: string,
    setState: any,
    state: any,
  ) => {
    const updated = [...state[field]]
    updated[index] = value
    setState({
      ...state,
      [field]: updated,
    })
  }

  const removeArrayItem = (
    field: string,
    index: number,
    setState: any,
    state: any,
  ) => {
    setState({
      ...state,
      [field]: state[field].filter((_: any, i: number) => i !== index),
    })
  }

  // Project handlers
  const handleAddProject = async () => {
    try {
      const newProject = { ...projectForm, id: Date.now().toString() }
      setProjects([...projects, newProject])
      setProjectForm({
        title: '',
        clientName: '',
        description: '',
        industry: '',
        projectType: '',
        duration: '',
        budget: '',
        keyOutcomes: [''],
        technologies: [''],
        challenges: [''],
        solutions: [''],
        files: [],
      })
      setShowAddProject(false)
      alert('Project added successfully!')
    } catch (error) {
      console.error('Error adding project:', error)
      alert('Failed to add project')
    }
  }

  const handleEditProject = (project: any) => {
    setProjectForm({ ...project })
    setEditingProject(project)
    setSelectedProject(project)
  }

  const handleSaveProject = async () => {
    try {
      const updatedProjects = projects.map((project) =>
        project === editingProject ? projectForm : project,
      )
      setProjects(updatedProjects)
      setSelectedProject(projectForm)
      setEditingProject(null)
      alert('Project updated successfully!')
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project')
    }
  }

  const handleDeleteProject = async (projectToDelete: any) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        setProjects(projects.filter((project) => project !== projectToDelete))
        if (selectedProject === projectToDelete) {
          setSelectedProject(null)
        }
        alert('Project deleted successfully!')
      } catch (error) {
        console.error('Error deleting project:', error)
        alert('Failed to delete project')
      }
    }
  }

  // Reference handlers
  const handleAddReference = async () => {
    try {
      const newReference = { ...referenceForm, id: Date.now().toString() }
      setReferences([...references, newReference])
      setReferenceForm({
        clientName: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        industry: '',
        projectTypes: [''],
        relationshipYears: '',
        projectValue: '',
        testimonial: '',
        isPublic: true,
      })
      setShowAddReference(false)
      alert('Reference added successfully!')
    } catch (error) {
      console.error('Error adding reference:', error)
      alert('Failed to add reference')
    }
  }

  const handleEditReference = (reference: any) => {
    setReferenceForm({ ...reference })
    setEditingReference(reference)
    setSelectedReference(reference)
  }

  const handleSaveReference = async () => {
    try {
      const updatedReferences = references.map((reference) =>
        reference === editingReference ? referenceForm : reference,
      )
      setReferences(updatedReferences)
      setSelectedReference(referenceForm)
      setEditingReference(null)
      alert('Reference updated successfully!')
    } catch (error) {
      console.error('Error updating reference:', error)
      alert('Failed to update reference')
    }
  }

  const handleDeleteReference = async (referenceToDelete: any) => {
    if (confirm('Are you sure you want to delete this reference?')) {
      try {
        setReferences(
          references.filter((reference) => reference !== referenceToDelete),
        )
        if (selectedReference === referenceToDelete) {
          setSelectedReference(null)
        }
        alert('Reference deleted successfully!')
      } catch (error) {
        console.error('Error deleting reference:', error)
        alert('Failed to delete reference')
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
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FolderIcon className="h-4 w-4 mr-2 inline" />
                Past Projects ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab('references')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'references'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClipboardDocumentListIcon className="h-4 w-4 mr-2 inline" />
                References ({references.length})
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
                            <label className="block text-sm font-medium text-gray-700">
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={companyForm.companyName || ''}
                              onChange={(e) =>
                                setCompanyForm({
                                  ...companyForm,
                                  companyName: e.target.value,
                                })
                              }
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Description
                            </label>
                            <textarea
                              value={companyForm.description || ''}
                              onChange={(e) =>
                                setCompanyForm({
                                  ...companyForm,
                                  description: e.target.value,
                                })
                              }
                              rows={3}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {company.companyName}
                          </h4>
                          <p className="text-sm text-gray-600 mt-2">
                            {company.description}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Founded
                        </h5>
                        <p className="text-sm text-gray-900">
                          {company.foundedYear}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Location
                        </h5>
                        <p className="text-sm text-gray-900">
                          {company.headquarters}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Certifications
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {company.certifications?.map(
                          (cert: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                            >
                              {cert}
                            </span>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Key Achievements
                      </h5>
                      <ul className="space-y-1">
                        {company.keyAchievements?.map(
                          (achievement: string, index: number) => (
                            <li
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <StarIcon className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                {achievement}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Core Values
                      </h5>
                      <ul className="space-y-1">
                        {company.coreValues?.map(
                          (value: string, index: number) => (
                            <li
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">
                                {value}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Loading company information...
                  </p>
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
                            selectedMember === member
                              ? 'bg-primary-50 border-r-2 border-primary-500'
                              : ''
                          }`}
                          onClick={() => setSelectedMember(member)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <UserGroupIcon className="h-5 w-5 text-primary-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {member.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {member.title}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {member.experienceYears}+ years experience
                                </p>
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
                        <p className="text-gray-500 text-sm">
                          No team members found
                        </p>
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
                          <h4 className="font-medium text-gray-900">
                            {selectedMember.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {selectedMember.title}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <BriefcaseIcon className="h-4 w-4 mr-1" />
                            Experience
                          </h5>
                          <p className="text-sm text-gray-600">
                            {selectedMember.experienceYears}+ years
                          </p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <AcademicCapIcon className="h-4 w-4 mr-1" />
                            Education
                          </h5>
                          <ul className="space-y-1">
                            {selectedMember.education?.map(
                              (edu: string, index: number) => (
                                <li
                                  key={index}
                                  className="text-sm text-gray-600"
                                >
                                  {edu}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Certifications
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {selectedMember.certifications?.map(
                              (cert: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                >
                                  {cert}
                                </span>
                              ),
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Key Responsibilities
                          </h5>
                          <ul className="space-y-1">
                            {selectedMember.responsibilities
                              ?.slice(0, 4)
                              .map((resp: string, index: number) => (
                                <li
                                  key={index}
                                  className="flex items-start space-x-1"
                                >
                                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-xs text-gray-600">
                                    {resp}
                                  </span>
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

          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Projects List */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Past Projects
                      </h3>
                      <button
                        onClick={() => setShowAddProject(true)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Add Project
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {projects.length > 0 ? (
                      projects.map((project, index) => (
                        <div
                          key={index}
                          className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedProject === project
                              ? 'bg-primary-50 border-r-2 border-primary-500'
                              : ''
                          }`}
                          onClick={() => setSelectedProject(project)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <FolderIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {project.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {project.clientName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {project.industry} • {project.duration}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedProject(project)
                                }}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-600 bg-primary-100 rounded hover:bg-primary-200"
                              >
                                <EyeIcon className="h-3 w-3 mr-1" />
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditProject(project)
                                }}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
                              >
                                <PencilIcon className="h-3 w-3 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteProject(project)
                                }}
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
                        <p className="text-gray-500 text-sm">
                          No projects found
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Details Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white shadow rounded-lg sticky top-6">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Project Details
                    </h3>
                  </div>
                  <div className="px-6 py-4">
                    {selectedProject ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                            <FolderIcon className="h-8 w-8 text-blue-600" />
                          </div>
                          <h4 className="font-medium text-gray-900">
                            {selectedProject.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {selectedProject.clientName}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Description
                          </h5>
                          <p className="text-sm text-gray-600">
                            {selectedProject.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">
                              Industry
                            </h5>
                            <p className="text-xs text-gray-600">
                              {selectedProject.industry}
                            </p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">
                              Duration
                            </h5>
                            <p className="text-xs text-gray-600">
                              {selectedProject.duration}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Key Outcomes
                          </h5>
                          <ul className="space-y-1">
                            {selectedProject.keyOutcomes
                              ?.slice(0, 3)
                              .map((outcome: string, index: number) => (
                                <li
                                  key={index}
                                  className="flex items-start space-x-1"
                                >
                                  <StarIcon className="h-3 w-3 text-yellow-400 mt-1 flex-shrink-0" />
                                  <span className="text-xs text-gray-600">
                                    {outcome}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Technologies
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {selectedProject.technologies
                              ?.slice(0, 6)
                              .map((tech: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                                >
                                  {tech}
                                </span>
                              ))}
                          </div>
                        </div>

                        {selectedProject.files &&
                          selectedProject.files.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                Project Files
                              </h5>
                              <div className="space-y-1">
                                {selectedProject.files
                                  .slice(0, 3)
                                  .map((file: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-center space-x-2"
                                    >
                                      <DocumentTextIcon className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs text-gray-600">
                                        {file.name}
                                      </span>
                                      <button className="text-xs text-primary-600 hover:text-primary-800">
                                        <LinkIcon className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FolderIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Select a project to view its details
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'references' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* References List */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Client References
                      </h3>
                      <button
                        onClick={() => setShowAddReference(true)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Add Reference
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {references.length > 0 ? (
                      references.map((reference, index) => (
                        <div
                          key={index}
                          className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedReference === reference
                              ? 'bg-primary-50 border-r-2 border-primary-500'
                              : ''
                          }`}
                          onClick={() => setSelectedReference(reference)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <ClipboardDocumentListIcon className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {reference.clientName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {reference.contactPerson}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {reference.industry} •{' '}
                                  {reference.relationshipYears} years
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedReference(reference)
                                }}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-600 bg-primary-100 rounded hover:bg-primary-200"
                              >
                                <EyeIcon className="h-3 w-3 mr-1" />
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditReference(reference)
                                }}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
                              >
                                <PencilIcon className="h-3 w-3 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteReference(reference)
                                }}
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
                        <p className="text-gray-500 text-sm">
                          No references found
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reference Details Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white shadow rounded-lg sticky top-6">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Reference Details
                    </h3>
                  </div>
                  <div className="px-6 py-4">
                    {selectedReference ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="flex-shrink-0 h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                            <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600" />
                          </div>
                          <h4 className="font-medium text-gray-900">
                            {selectedReference.clientName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {selectedReference.industry}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Contact Information
                          </h5>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <UserGroupIcon className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {selectedReference.contactPerson}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <EnvelopeIcon className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {selectedReference.contactEmail}
                              </span>
                            </div>
                            {selectedReference.contactPhone && (
                              <div className="flex items-center space-x-2">
                                <PhoneIcon className="h-3 w-3 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {selectedReference.contactPhone}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">
                              Relationship
                            </h5>
                            <p className="text-xs text-gray-600">
                              {selectedReference.relationshipYears} years
                            </p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">
                              Project Value
                            </h5>
                            <p className="text-xs text-gray-600">
                              {selectedReference.projectValue}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Project Types
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {selectedReference.projectTypes?.map(
                              (type: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded flex items-center"
                                >
                                  <TagIcon className="h-2 w-2 mr-1" />
                                  {type}
                                </span>
                              ),
                            )}
                          </div>
                        </div>

                        {selectedReference.testimonial && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              Testimonial
                            </h5>
                            <blockquote className="text-xs text-gray-600 italic border-l-2 border-gray-200 pl-3">
                              "{selectedReference.testimonial}"
                            </blockquote>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ClipboardDocumentListIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Select a reference to view details
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add Team Member
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        value={memberForm.name}
                        onChange={(e) =>
                          setMemberForm({ ...memberForm, name: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        value={memberForm.title}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            title: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      value={memberForm.experienceYears}
                      onChange={(e) =>
                        setMemberForm({
                          ...memberForm,
                          experienceYears: e.target.value,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Education
                    </label>
                    {memberForm.education.map((edu: string, index: number) => (
                      <div key={index} className="flex mb-2">
                        <input
                          type="text"
                          value={edu}
                          onChange={(e) =>
                            updateArrayItem(
                              'education',
                              index,
                              e.target.value,
                              setMemberForm,
                              memberForm,
                            )
                          }
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Education qualification"
                        />
                        <button
                          onClick={() =>
                            removeArrayItem(
                              'education',
                              index,
                              setMemberForm,
                              memberForm,
                            )
                          }
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        addArrayItem('education', setMemberForm, memberForm)
                      }
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      + Add Education
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certifications
                    </label>
                    {memberForm.certifications.map(
                      (cert: string, index: number) => (
                        <div key={index} className="flex mb-2">
                          <input
                            type="text"
                            value={cert}
                            onChange={(e) =>
                              updateArrayItem(
                                'certifications',
                                index,
                                e.target.value,
                                setMemberForm,
                                memberForm,
                              )
                            }
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Certification"
                          />
                          <button
                            onClick={() =>
                              removeArrayItem(
                                'certifications',
                                index,
                                setMemberForm,
                                memberForm,
                              )
                            }
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ),
                    )}
                    <button
                      onClick={() =>
                        addArrayItem(
                          'certifications',
                          setMemberForm,
                          memberForm,
                        )
                      }
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Team Member
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        value={memberForm.name}
                        onChange={(e) =>
                          setMemberForm({ ...memberForm, name: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        value={memberForm.title}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            title: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      value={memberForm.experienceYears}
                      onChange={(e) =>
                        setMemberForm({
                          ...memberForm,
                          experienceYears: e.target.value,
                        })
                      }
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

        {/* Add Project Modal */}
        {showAddProject && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add Past Project
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Title
                      </label>
                      <input
                        type="text"
                        value={projectForm.title}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            title: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={projectForm.clientName}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            clientName: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={projectForm.description}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={projectForm.industry}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            industry: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Type
                      </label>
                      <input
                        type="text"
                        value={projectForm.projectType}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            projectType: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={projectForm.duration}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            duration: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Outcomes
                    </label>
                    {projectForm.keyOutcomes.map(
                      (outcome: string, index: number) => (
                        <div key={index} className="flex mb-2">
                          <input
                            type="text"
                            value={outcome}
                            onChange={(e) =>
                              updateArrayItem(
                                'keyOutcomes',
                                index,
                                e.target.value,
                                setProjectForm,
                                projectForm,
                              )
                            }
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Key outcome or achievement"
                          />
                          <button
                            onClick={() =>
                              removeArrayItem(
                                'keyOutcomes',
                                index,
                                setProjectForm,
                                projectForm,
                              )
                            }
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ),
                    )}
                    <button
                      onClick={() =>
                        addArrayItem('keyOutcomes', setProjectForm, projectForm)
                      }
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      + Add Outcome
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technologies Used
                    </label>
                    {projectForm.technologies.map(
                      (tech: string, index: number) => (
                        <div key={index} className="flex mb-2">
                          <input
                            type="text"
                            value={tech}
                            onChange={(e) =>
                              updateArrayItem(
                                'technologies',
                                index,
                                e.target.value,
                                setProjectForm,
                                projectForm,
                              )
                            }
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Technology or tool"
                          />
                          <button
                            onClick={() =>
                              removeArrayItem(
                                'technologies',
                                index,
                                setProjectForm,
                                projectForm,
                              )
                            }
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ),
                    )}
                    <button
                      onClick={() =>
                        addArrayItem(
                          'technologies',
                          setProjectForm,
                          projectForm,
                        )
                      }
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      + Add Technology
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddProject(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProject}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Add Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        {editingProject && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Project
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Title
                      </label>
                      <input
                        type="text"
                        value={projectForm.title}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            title: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={projectForm.clientName}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            clientName: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={projectForm.description}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={projectForm.industry}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            industry: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Type
                      </label>
                      <input
                        type="text"
                        value={projectForm.projectType}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            projectType: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={projectForm.duration}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            duration: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProject}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Reference Modal */}
        {showAddReference && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add Client Reference
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={referenceForm.clientName}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            clientName: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={referenceForm.industry}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            industry: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={referenceForm.contactPerson}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            contactPerson: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={referenceForm.contactEmail}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            contactEmail: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={referenceForm.contactPhone}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            contactPhone: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Relationship Years
                      </label>
                      <input
                        type="number"
                        value={referenceForm.relationshipYears}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            relationshipYears: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Value
                      </label>
                      <input
                        type="text"
                        value={referenceForm.projectValue}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            projectValue: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Types
                    </label>
                    {referenceForm.projectTypes.map(
                      (type: string, index: number) => (
                        <div key={index} className="flex mb-2">
                          <input
                            type="text"
                            value={type}
                            onChange={(e) =>
                              updateArrayItem(
                                'projectTypes',
                                index,
                                e.target.value,
                                setReferenceForm,
                                referenceForm,
                              )
                            }
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Project type or service area"
                          />
                          <button
                            onClick={() =>
                              removeArrayItem(
                                'projectTypes',
                                index,
                                setReferenceForm,
                                referenceForm,
                              )
                            }
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ),
                    )}
                    <button
                      onClick={() =>
                        addArrayItem(
                          'projectTypes',
                          setReferenceForm,
                          referenceForm,
                        )
                      }
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      + Add Project Type
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Testimonial
                    </label>
                    <textarea
                      value={referenceForm.testimonial}
                      onChange={(e) =>
                        setReferenceForm({
                          ...referenceForm,
                          testimonial: e.target.value,
                        })
                      }
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Client testimonial or feedback"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={referenceForm.isPublic}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            isPublic: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Make this reference publicly visible
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddReference(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReference}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Add Reference
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Reference Modal */}
        {editingReference && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Reference
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={referenceForm.clientName}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            clientName: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={referenceForm.industry}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            industry: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={referenceForm.contactPerson}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            contactPerson: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={referenceForm.contactEmail}
                        onChange={(e) =>
                          setReferenceForm({
                            ...referenceForm,
                            contactEmail: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Testimonial
                    </label>
                    <textarea
                      value={referenceForm.testimonial}
                      onChange={(e) =>
                        setReferenceForm({
                          ...referenceForm,
                          testimonial: e.target.value,
                        })
                      }
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingReference(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReference}
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
