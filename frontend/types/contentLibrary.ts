export interface TeamMember {
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

export interface ProjectReference {
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

export interface Company {
  _id: string;
  companyId: string;
  name: string;
  description: string;
  email?: string;
  phone?: string;
  coverLetter?: string;
}

export interface ContentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedIds: string[]) => void;
  type: "team" | "references" | "company";
  currentSelectedIds?: string[];
  isLoading?: boolean;
}
