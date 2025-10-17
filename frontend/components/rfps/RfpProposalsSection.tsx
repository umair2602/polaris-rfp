import Link from "next/link";
import { Proposal } from "../../lib/api";
import {
  DocumentTextIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

interface RfpProposalsSectionProps {
  rfpId: string;
  proposals: Proposal[];
  isLoading: boolean;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "in_review":
      return "bg-yellow-100 text-yellow-800";
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "won":
      return "bg-green-100 text-green-800";
    case "lost":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function RfpProposalsSection({
  rfpId,
  proposals,
  isLoading,
}: RfpProposalsSectionProps) {
  return (
    <div className="mt-4 pl-12 border-l-2 border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 flex items-center">
          <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
          Generated Proposals
        </h4>
        <Link
          href={`/rfps/${rfpId}`}
          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-primary-600 bg-primary-50 hover:bg-primary-100"
        >
          <PlusIcon className="h-3 w-3 mr-1" />
          New Proposals
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {/* Skeleton loaders for 2-3 proposals */}
          {[1, 2].map((index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-3 flex items-center justify-between animate-pulse"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="flex items-center space-x-2">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      ) : proposals?.length > 0 ? (
        <div className="space-y-2">
          {proposals.map((proposal) => (
            <Link
              key={proposal._id}
              href={`/proposals/${proposal._id}`}
              className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 hover:text-primary-600">
                      {proposal.title}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                          proposal.status
                        )}`}
                      >
                        {proposal.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-gray-500">
                        Updated{" "}
                        {new Date(proposal.updatedAt).toLocaleDateString(
                          "en-US"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="inline-flex hover:bg-blue-100 items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-primary-600 bg-primary-100 group-hover:bg-primary-200">
                  View
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <ClipboardDocumentListIcon className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No proposals yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate your first proposal from this RFP.
          </p>
          <div className="mt-3">
            <Link
              href={`/proposals?rfpId=${rfpId}`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Generate Proposal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
