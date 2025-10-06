import {
  CheckIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

// Using a single ctx prop to keep wiring simple during extraction
export default function CompanySection({ ctx }: { ctx: any }) {
  const {
    company,
    editingCompany,
    companyForm,
    setCompanyForm,
    handleEditCompany,
    handleSaveCompany,
    handleCancelCompanyEdit,
  } = ctx;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {company?.name || company?.companyName || "Company Information"}
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
                      value={companyForm.companyName || ""}
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
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {company.name || company.companyName}
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
                  {company.founded?.slice?.(0, 10) || company.foundedYear}
                </p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Location
                </h5>
                <p className="text-sm text-gray-900">
                  {company.location || company.headquarters}
                </p>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Certifications
              </h5>
              <div className="flex flex-wrap gap-2">
                {company.certifications?.map((cert: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Key Achievements
              </h5>
              <ul className="space-y-1">
                {company.keyAchievements?.map(
                  (achievement: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <StarIcon className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {achievement}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Core Values
              </h5>
              <ul className="space-y-1">
                {(company.values || company.coreValues || []).map(
                  (value: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{value}</span>
                    </li>
                  )
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
  );
}
