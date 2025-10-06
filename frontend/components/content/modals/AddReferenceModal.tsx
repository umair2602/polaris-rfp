import { TrashIcon } from "@heroicons/react/24/outline";
import React from "react";

type AddReferenceModalProps = {
  open: boolean;
  referenceForm: any;
  setReferenceForm: (v: any) => void;
  addArrayItem: (field: string, setState: any, state: any) => void;
  updateArrayItem: (
    field: string,
    index: number,
    value: string,
    setState: any,
    state: any
  ) => void;
  removeArrayItem: (
    field: string,
    index: number,
    setState: any,
    state: any
  ) => void;
  onAdd: () => void;
  onClose: () => void;
};

export default function AddReferenceModal({
  open,
  referenceForm,
  setReferenceForm,
  addArrayItem,
  updateArrayItem,
  removeArrayItem,
  onAdd,
  onClose,
}: AddReferenceModalProps) {
  if (!open) return null;

  return (
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
              {(Array.isArray(referenceForm.projectTypes) &&
              referenceForm.projectTypes.length
                ? referenceForm.projectTypes
                : [""]
              ).map((type: string, index: number) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={type}
                    onChange={(e) =>
                      updateArrayItem(
                        "projectTypes",
                        index,
                        e.target.value,
                        setReferenceForm,
                        referenceForm
                      )
                    }
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Project type or service area"
                  />
                  <button
                    onClick={() =>
                      removeArrayItem(
                        "projectTypes",
                        index,
                        setReferenceForm,
                        referenceForm
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
                  addArrayItem("projectTypes", setReferenceForm, referenceForm)
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
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Add Reference
          </button>
        </div>
      </div>
    </div>
  );
}
