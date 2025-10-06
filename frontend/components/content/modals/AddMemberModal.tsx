import { TrashIcon } from "@heroicons/react/24/outline";
import React from "react";

type AddMemberModalProps = {
  open: boolean;
  memberForm: any;
  setMemberForm: (v: any) => void;
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

export default function AddMemberModal({
  open,
  memberForm,
  setMemberForm,
  addArrayItem,
  updateArrayItem,
  removeArrayItem,
  onAdd,
  onClose,
}: AddMemberModalProps) {
  if (!open) return null;

  return (
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
                    setMemberForm({ ...memberForm, title: e.target.value })
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
                        "education",
                        index,
                        e.target.value,
                        setMemberForm,
                        memberForm
                      )
                    }
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Education qualification"
                  />
                  <button
                    onClick={() =>
                      removeArrayItem(
                        "education",
                        index,
                        setMemberForm,
                        memberForm
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
                  addArrayItem("education", setMemberForm, memberForm)
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
              {memberForm.certifications.map((cert: string, index: number) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={cert}
                    onChange={(e) =>
                      updateArrayItem(
                        "certifications",
                        index,
                        e.target.value,
                        setMemberForm,
                        memberForm
                      )
                    }
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Certification"
                  />
                  <button
                    onClick={() =>
                      removeArrayItem(
                        "certifications",
                        index,
                        setMemberForm,
                        memberForm
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
                  addArrayItem("certifications", setMemberForm, memberForm)
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
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}
