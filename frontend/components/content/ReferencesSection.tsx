import {
  ClipboardDocumentListIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

export default function ReferencesSection({ ctx }: { ctx: any }) {
  const {
    references,
    selectedReference,
    setSelectedReference,
    showAddReference,
    setShowAddReference,
    referenceForm,
    setReferenceForm,
    addArrayItem,
    updateArrayItem,
    removeArrayItem,
    handleAddReference,
    handleEditReference,
    editingReference,
    handleSaveReference,
    handleDeleteReference,
  } = ctx;

  return (
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
                + Add Reference
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {references.length > 0 ? (
              references.map((reference: any, index: number) => (
                <div
                  key={index}
                  className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedReference === reference
                      ? "bg-primary-50 border-r-2 border-primary-500"
                      : ""
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
                          {reference.organizationName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reference.contactName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {reference.timePeriod}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReference(reference);
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-600 bg-primary-100 rounded hover:bg-primary-200"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditReference(reference);
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReference(reference);
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
                <p className="text-gray-500 text-sm">No references found</p>
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
                    {selectedReference.organizationName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {selectedReference.timePeriod}
                  </p>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Contact Information
                  </h5>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <UserGroupIcon className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">
                          {selectedReference.contactName}
                        </span>
                      </div>
                      {selectedReference.contactTitle && (
                        <p className="text-xs text-gray-600 ml-5">
                          {selectedReference.contactTitle}
                        </p>
                      )}
                      {selectedReference.additionalTitle && (
                        <p className="text-xs text-gray-500 ml-5 italic">
                          {selectedReference.additionalTitle}
                        </p>
                      )}
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

                {selectedReference.scopeOfWork && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Scope of Work
                    </h5>
                    <div className="text-xs text-gray-600 leading-relaxed">
                      {selectedReference.scopeOfWork}
                    </div>
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

      {/* Modals moved to page level */}
    </div>
  );
}
