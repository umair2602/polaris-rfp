import React from "react";

type EditReferenceModalProps = {
  open: boolean;
  referenceForm: any;
  setReferenceForm: (v: any) => void;
  onSave: () => void;
  onClose: () => void;
};

export default function EditReferenceModal({
  open,
  referenceForm,
  setReferenceForm,
  onSave,
  onClose,
}: EditReferenceModalProps) {
  if (!open) return null;

  return (
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
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
