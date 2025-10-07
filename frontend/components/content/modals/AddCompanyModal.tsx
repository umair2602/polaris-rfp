import { XMarkIcon } from "@heroicons/react/24/outline";

interface AddCompanyModalProps {
  showAddCompany: boolean;
  setShowAddCompany: (show: boolean) => void;
  companyForm: any;
  setCompanyForm: (form: any) => void;
  handleAddCompany: () => void;
  addArrayItem: (field: string) => void;
  updateArrayItem: (field: string, index: number, value: string) => void;
  removeArrayItem: (field: string, index: number) => void;
}

export default function AddCompanyModal({
  showAddCompany,
  setShowAddCompany,
  companyForm,
  setCompanyForm,
  handleAddCompany,
  addArrayItem,
  updateArrayItem,
  removeArrayItem,
}: AddCompanyModalProps) {
  if (!showAddCompany) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 bg-gray-600 bg-opacity-50 z-[9999] flex items-center justify-center p-4"
      style={{ margin: 0, padding: '1rem' }}
    >
      <div 
        className="w-full max-w-4xl bg-white shadow-xl rounded-lg max-h-[90vh] overflow-y-auto p-6"
        style={{ margin: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Add New Company
            </h3>
            <button
              onClick={() => setShowAddCompany(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyForm.name || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      name: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tagline
                </label>
                <input
                  type="text"
                  value={companyForm.tagline || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      tagline: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                value={companyForm.description || ""}
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

            {/* Company Details */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Founded Date
                </label>
                <input
                  type="date"
                  value={companyForm.founded || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      founded: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={companyForm.location || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      location: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  value={companyForm.website || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      website: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={companyForm.email || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      email: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={companyForm.phone || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      phone: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Core Capabilities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Core Capabilities
              </label>
              <div className="space-y-2">
                {(companyForm.coreCapabilities || []).map((capability: string, index: number) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={capability}
                      onChange={(e) => updateArrayItem("coreCapabilities", index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter capability"
                    />
                    <button
                      onClick={() => removeArrayItem("coreCapabilities", index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem("coreCapabilities")}
                  className="text-primary-600 hover:text-primary-800 text-sm"
                >
                  + Add Capability
                </button>
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications
              </label>
              <div className="space-y-2">
                {(companyForm.certifications || []).map((cert: string, index: number) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => updateArrayItem("certifications", index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter certification"
                    />
                    <button
                      onClick={() => removeArrayItem("certifications", index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem("certifications")}
                  className="text-primary-600 hover:text-primary-800 text-sm"
                >
                  + Add Certification
                </button>
              </div>
            </div>

            {/* Industry Focus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry Focus
              </label>
              <div className="space-y-2">
                {(companyForm.industryFocus || []).map((industry: string, index: number) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => updateArrayItem("industryFocus", index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter industry"
                    />
                    <button
                      onClick={() => removeArrayItem("industryFocus", index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem("industryFocus")}
                  className="text-primary-600 hover:text-primary-800 text-sm"
                >
                  + Add Industry
                </button>
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mission Statement
                </label>
                <textarea
                  value={companyForm.missionStatement || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      missionStatement: e.target.value,
                    })
                  }
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vision Statement
                </label>
                <textarea
                  value={companyForm.visionStatement || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      visionStatement: e.target.value,
                    })
                  }
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Values */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Core Values
              </label>
              <div className="space-y-2">
                {(companyForm.values || []).map((value: string, index: number) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateArrayItem("values", index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter value"
                    />
                    <button
                      onClick={() => removeArrayItem("values", index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem("values")}
                  className="text-primary-600 hover:text-primary-800 text-sm"
                >
                  + Add Value
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Company Statistics
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Years in Business
                  </label>
                  <input
                    type="number"
                    value={companyForm.statistics?.yearsInBusiness || ""}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        statistics: {
                          ...companyForm.statistics,
                          yearsInBusiness: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Projects Completed
                  </label>
                  <input
                    type="number"
                    value={companyForm.statistics?.projectsCompleted || ""}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        statistics: {
                          ...companyForm.statistics,
                          projectsCompleted: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Clients Satisfied
                  </label>
                  <input
                    type="number"
                    value={companyForm.statistics?.clientsSatisfied || ""}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        statistics: {
                          ...companyForm.statistics,
                          clientsSatisfied: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Team Members
                  </label>
                  <input
                    type="number"
                    value={companyForm.statistics?.teamMembers || ""}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        statistics: {
                          ...companyForm.statistics,
                          teamMembers: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Social Media
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={companyForm.socialMedia?.linkedin || ""}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        socialMedia: {
                          ...companyForm.socialMedia,
                          linkedin: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={companyForm.socialMedia?.twitter || ""}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        socialMedia: {
                          ...companyForm.socialMedia,
                          twitter: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={companyForm.socialMedia?.facebook || ""}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        socialMedia: {
                          ...companyForm.socialMedia,
                          facebook: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cover Letter
              </label>
              <textarea
                value={companyForm.coverLetter || ""}
                onChange={(e) =>
                  setCompanyForm({
                    ...companyForm,
                    coverLetter: e.target.value,
                  })
                }
                rows={6}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your company's cover letter template..."
              />
            </div>

            {/* Firm Qualifications and Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Firm Qualifications and Experience
              </label>
              <textarea
                value={companyForm.firmQualificationsAndExperience || ""}
                onChange={(e) =>
                  setCompanyForm({
                    ...companyForm,
                    firmQualificationsAndExperience: e.target.value,
                  })
                }
                rows={8}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your firm's qualifications, experience, and expertise..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddCompany(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCompany}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Company
            </button>
          </div>
      </div>
    </div>
  );
}
