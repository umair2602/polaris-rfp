import { useState, useEffect } from "react";
import Modal from "./ui/Modal";
import { CheckIcon } from "@heroicons/react/24/outline";
import api from "../lib/api";

interface TeamMember {
  _id: string;
  memberId: string;
  nameWithCredentials: string;
  position: string;
  email?: string;
  companyId?: string;
  biography: string;
  isActive: boolean;
  company?: {
    companyId: string;
    name: string;
    sharedInfo?: string;
  };
}

interface ProjectReference {
  _id: string;
  organizationName: string;
  timePeriod?: string;
  contactName: string;
  contactTitle?: string;
  additionalTitle?: string;
  scopeOfWork: string;
  contactEmail: string;
  contactPhone?: string;
}

interface Company {
  _id: string;
  companyId: string;
  name: string;
  description: string;
  email?: string;
  phone?: string;
  coverLetter?: string;
}

interface ContentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedIds: string[]) => void;
  type: "team" | "references" | "company";
  currentSelectedIds?: string[];
  isLoading?: boolean;
}

export default function ContentLibraryModal({
  isOpen,
  onClose,
  onApply,
  type,
  currentSelectedIds = [],
  isLoading = false,
}: ContentLibraryModalProps) {
  const [items, setItems] = useState<
    (TeamMember | ProjectReference | Company)[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(currentSelectedIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadItems();
      setSelectedIds(currentSelectedIds);
    }
  }, [isOpen, type, currentSelectedIds]);

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      if (type === "team") {
        response = await api.get("/api/content/team");
      } else if (type === "references") {
        response = await api.get("/api/content/references");
      } else if (type === "company") {
        response = await api.get("/api/content/companies");
      }
      if (response) {
        setItems(response.data);
      }
    } catch (err) {
      console.error("Error loading content library items:", err);
      setError("Failed to load content library items");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleApply = () => {
    onApply(selectedIds);
  };

  const getItemId = (item: TeamMember | ProjectReference | Company) => {
    if ("memberId" in item) return item.memberId;
    if ("companyId" in item) return item.companyId;
    return item._id;
  };

  const renderTeamMember = (member: TeamMember) => (
    <div key={member.memberId} className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            {member.nameWithCredentials}
          </h4>
          <p className="text-sm text-gray-600 mb-2">{member.position}</p>
          <p className="text-sm text-gray-700 line-clamp-3">
            {member.biography}
          </p>
        </div>
        <button
          onClick={() => toggleSelection(member.memberId)}
          className={`ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            selectedIds.includes(member.memberId)
              ? "bg-primary-600 border-primary-600 text-white"
              : "border-gray-300 hover:border-primary-500"
          }`}
        >
          {selectedIds.includes(member.memberId) && (
            <CheckIcon className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  const renderReference = (reference: ProjectReference) => (
    <div key={reference._id} className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            {reference.organizationName}
            {reference.timePeriod && (
              <span className="text-sm text-gray-600 ml-2">
                ({reference.timePeriod})
              </span>
            )}
          </h4>
          <p className="text-sm text-gray-600 mb-1">
            Contact: {reference.contactName}
            {reference.contactTitle && `, ${reference.contactTitle}`}
          </p>
          {reference.contactEmail && (
            <p className="text-sm text-gray-600 mb-2">
              Email: {reference.contactEmail}
            </p>
          )}
          <p className="text-sm text-gray-700 line-clamp-3">
            {reference.scopeOfWork}
          </p>
        </div>
        <button
          onClick={() => toggleSelection(reference._id)}
          className={`ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            selectedIds.includes(reference._id)
              ? "bg-primary-600 border-primary-600 text-white"
              : "border-gray-300 hover:border-primary-500"
          }`}
        >
          {selectedIds.includes(reference._id) && (
            <CheckIcon className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  const renderCompany = (company: Company) => (
    <div key={company.companyId} className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{company.name}</h4>
          {company.email && (
            <p className="text-sm text-gray-600 mb-1">Email: {company.email}</p>
          )}
          {company.phone && (
            <p className="text-sm text-gray-600 mb-2">Phone: {company.phone}</p>
          )}
          <p className="text-sm text-gray-700 line-clamp-3">
            {company.description}
          </p>
          {company.coverLetter && (
            <p className="text-xs text-gray-500 mt-2">
              ✓ Has cover letter content
            </p>
          )}
        </div>
        <button
          onClick={() => toggleSelection(company.companyId)}
          className={`ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            selectedIds.includes(company.companyId)
              ? "bg-primary-600 border-primary-600 text-white"
              : "border-gray-300 hover:border-primary-500"
          }`}
        >
          {selectedIds.includes(company.companyId) && (
            <CheckIcon className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  const title =
    type === "team"
      ? "Select Team Members"
      : type === "references"
      ? "Select Project References"
      : "Select Company Profile";
  const emptyMessage =
    type === "team"
      ? "No team members available in the content library."
      : type === "references"
      ? "No project references available in the content library."
      : "No company profiles available in the content library.";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Applying...
              </>
            ) : (
              `Apply Selection (${selectedIds.length})`
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadItems}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {type === "team"
              ? items.map((item) => renderTeamMember(item as TeamMember))
              : type === "references"
              ? items.map((item) => renderReference(item as ProjectReference))
              : items.map((item) => renderCompany(item as Company))}
          </div>
        )}
      </div>
    </Modal>
  );
}
