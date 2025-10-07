import React from "react";

type EditMemberModalProps = {
  open: boolean;
  memberForm: any;
  setMemberForm: (v: any) => void;
  onSave: () => void;
  onClose: () => void;
};

export default function EditMemberModal({
  open,
  memberForm,
  setMemberForm,
  onSave,
  onClose,
}: EditMemberModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Edit Team Member
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name & Credentials
              </label>
              <input
                type="text"
                value={memberForm.nameWithCredentials}
                onChange={(e) =>
                  setMemberForm({ 
                    ...memberForm, 
                    nameWithCredentials: e.target.value 
                  })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., Saxon Metzger, MBA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Position/Title
              </label>
              <input
                type="text"
                value={memberForm.position}
                onChange={(e) =>
                  setMemberForm({ 
                    ...memberForm, 
                    position: e.target.value 
                  })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., Project Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Professional Biography (Bullet Points)
              </label>
              <textarea
                value={memberForm.biography}
                onChange={(e) => {
                  let value = e.target.value;
                  
                  // Ensure it starts with a bullet point if not empty
                  if (value && !value.startsWith('• ')) {
                    value = '• ' + value;
                  }
                  
                  setMemberForm({ 
                    ...memberForm, 
                    biography: value 
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const textarea = e.target as HTMLTextAreaElement;
                    const cursorPosition = textarea.selectionStart;
                    const currentValue = memberForm.biography || '';
                    
                    // Insert new line with bullet point
                    const newValue = 
                      currentValue.slice(0, cursorPosition) + 
                      '\n• ' + 
                      currentValue.slice(cursorPosition);
                    
                    setMemberForm({ 
                      ...memberForm, 
                      biography: newValue 
                    });
                    
                    // Set cursor position after the bullet point
                    setTimeout(() => {
                      textarea.selectionStart = textarea.selectionEnd = cursorPosition + 3;
                    }, 0);
                  }
                }}
                onFocus={(e) => {
                  const textarea = e.target as HTMLTextAreaElement;
                  // If empty, start with a bullet point
                  if (!memberForm.biography) {
                    setMemberForm({ 
                      ...memberForm, 
                      biography: '• ' 
                    });
                    setTimeout(() => {
                      textarea.selectionStart = textarea.selectionEnd = 2;
                    }, 0);
                  }
                }}
                rows={8}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono"
                placeholder="• Start typing here..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Press Enter to automatically create a new bullet point
              </p>
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
