import {
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  EyeIcon,
  FolderIcon,
  LinkIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Head from "next/head";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useToast } from "../components/ui/Toast";
import { contentApi } from "../lib/api";
import CompanySection from "../components/content/CompanySection";
import TeamSection from "../components/content/TeamSection";
import ProjectsSection from "../components/content/ProjectsSection";
import ReferencesSection from "../components/content/ReferencesSection";
import AddMemberModal from "../components/content/modals/AddMemberModal";
import EditMemberModal from "../components/content/modals/EditMemberModal";
import AddProjectModal from "../components/content/modals/AddProjectModal";
import EditProjectModal from "../components/content/modals/EditProjectModal";
import AddReferenceModal from "../components/content/modals/AddReferenceModal";
import EditReferenceModal from "../components/content/modals/EditReferenceModal";

export default function ContentLibrary() {
  const toast = useToast();
  const [company, setCompany] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "company" | "team" | "projects" | "references"
  >("company");
  const [editingCompany, setEditingCompany] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [companyForm, setCompanyForm] = useState<any>({});
  const [memberForm, setMemberForm] = useState<any>({
    name: "",
    title: "",
    experienceYears: "",
    education: [""],
    certifications: [""],
    responsibilities: [""],
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedReference, setSelectedReference] = useState<any>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddReference, setShowAddReference] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingReference, setEditingReference] = useState<any>(null);
  const [projectForm, setProjectForm] = useState<any>({
    title: "",
    clientName: "",
    description: "",
    industry: "",
    projectType: "",
    duration: "",
    budget: "",
    keyOutcomes: [""],
    technologies: [""],
    challenges: [""],
    solutions: [""],
    files: [],
  });
  const [referenceForm, setReferenceForm] = useState<any>({
    clientName: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    industry: "",
    projectTypes: [""],
    relationshipYears: "",
    projectValue: "",
    testimonial: "",
    isPublic: true,
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const [
        companyResponse,
        teamResponse,
        projectsResponse,
        referencesResponse,
      ] = await Promise.all([
        contentApi.getCompany(),
        contentApi.getTeam(),
        contentApi.getProjects?.() || Promise.resolve({ data: [] }),
        contentApi.getReferences(),
      ]);
      setCompany(companyResponse.data || null);
      setTeam(Array.isArray(teamResponse.data) ? teamResponse.data : []);
      setProjects(
        Array.isArray(projectsResponse.data) ? projectsResponse.data : []
      );
      setReferences(
        Array.isArray(referencesResponse.data) ? referencesResponse.data : []
      );
    } catch (error) {
      console.error("Error loading content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = () => {
    setCompanyForm({
      ...company,
      companyName: company?.name || company?.companyName || "",
    });
    setEditingCompany(true);
  };

  const handleSaveCompany = async () => {
    try {
      const payload: any = {
        ...company,
        name: companyForm.companyName ?? company?.name,
        description: companyForm.description ?? company?.description,
      };
      const { data } = await contentApi.updateCompany(payload);
      setCompany(data || payload);
      setEditingCompany(false);
      toast.success("Company information updated successfully!");
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company information");
    }
  };

  const handleCancelCompanyEdit = () => {
    setCompanyForm({});
    setEditingCompany(false);
  };

  const handleEditMember = (member: any) => {
    setMemberForm({ ...member });
    setEditingMember(member);
    setSelectedMember(member);
  };

  const handleSaveMember = async () => {
    try {
      const memberId = editingMember?.memberId || memberForm.memberId;
      if (!memberId) throw new Error("Missing memberId");
      const { data } = await contentApi.updateTeamMember(memberId, memberForm);
      setTeam(team.map((m) => (m.memberId === memberId ? data : m)));
      setSelectedMember(data);
      setEditingMember(null);
      toast.success("Team member updated successfully!");
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Failed to update team member");
    }
  };

  const handleAddMember = async () => {
    try {
      const { data } = await contentApi.createTeamMember(memberForm);
      setTeam([...team, data]);
      setMemberForm({
        name: "",
        title: "",
        experienceYears: "",
        education: [""],
        certifications: [""],
        responsibilities: [""],
      });
      setShowAddMember(false);
      toast.success("Team member added successfully!");
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add team member");
    }
  };

  const handleDeleteMember = async (memberToDelete: any) => {
    try {
      if (!memberToDelete?.memberId) throw new Error("Missing memberId");
      await contentApi.deleteTeamMember(memberToDelete.memberId);
      setTeam(
        team.filter((member) => member.memberId !== memberToDelete.memberId)
      );
      if (selectedMember === memberToDelete) {
        setSelectedMember(null);
      }
      toast.success("Team member deleted successfully!");
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error("Failed to delete team member");
    }
  };

  const addArrayItem = (field: string, setState: any, state: any) => {
    setState({
      ...state,
      [field]: [...state[field], ""],
    });
  };

  const updateArrayItem = (
    field: string,
    index: number,
    value: string,
    setState: any,
    state: any
  ) => {
    const updated = [...state[field]];
    updated[index] = value;
    setState({
      ...state,
      [field]: updated,
    });
  };

  const removeArrayItem = (
    field: string,
    index: number,
    setState: any,
    state: any
  ) => {
    setState({
      ...state,
      [field]: state[field].filter((_: any, i: number) => i !== index),
    });
  };

  // Project handlers
  const handleAddProject = async () => {
    try {
      const { data } = await contentApi.createProject(projectForm);
      setProjects([...projects, data]);
      setProjectForm({
        title: "",
        clientName: "",
        description: "",
        industry: "",
        projectType: "",
        duration: "",
        budget: "",
        keyOutcomes: [""],
        technologies: [""],
        challenges: [""],
        solutions: [""],
        files: [],
      });
      setShowAddProject(false);
      toast.success("Project added successfully!");
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Failed to add project");
    }
  };

  const handleEditProject = (project: any) => {
    setProjectForm({ ...project });
    setEditingProject(project);
    setSelectedProject(project);
  };

  const handleSaveProject = async () => {
    try {
      const id = editingProject?._id || projectForm?._id || editingProject?.id;
      if (!id) throw new Error("Missing project id");
      const { data } = await contentApi.updateProject(id, projectForm);
      setProjects(projects.map((p) => (p._id === id ? data : p)));
      setSelectedProject(data);
      setEditingProject(null);
      toast.success("Project updated successfully!");
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  const handleDeleteProject = async (projectToDelete: any) => {
    try {
      const id = projectToDelete?._id || projectToDelete?.id;
      if (!id) throw new Error("Missing project id");
      await contentApi.deleteProject(id);
      setProjects(
        projects.filter((project) => (project._id || project.id) !== id)
      );
      if (selectedProject === projectToDelete) {
        setSelectedProject(null);
      }
      toast.success("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  // Reference handlers
  const handleAddReference = async () => {
    try {
      const { data } = await contentApi.createReference(referenceForm);
      setReferences([...references, data]);
      setReferenceForm({
        clientName: "",
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        industry: "",
        projectTypes: [""],
        relationshipYears: "",
        projectValue: "",
        testimonial: "",
        isPublic: true,
      });
      setShowAddReference(false);
      toast.success("Reference added successfully!");
    } catch (error) {
      console.error("Error adding reference:", error);
      toast.error("Failed to add reference");
    }
  };

  const handleEditReference = (reference: any) => {
    setReferenceForm({ ...reference });
    setEditingReference(reference);
    setSelectedReference(reference);
  };

  const handleSaveReference = async () => {
    try {
      const id =
        editingReference?._id || referenceForm?._id || editingReference?.id;
      if (!id) throw new Error("Missing reference id");
      const { data } = await contentApi.updateReference(id, referenceForm);
      setReferences(references.map((r) => (r._id === id ? data : r)));
      setSelectedReference(data);
      setEditingReference(null);
      toast.success("Reference updated successfully!");
    } catch (error) {
      console.error("Error updating reference:", error);
      toast.error("Failed to update reference");
    }
  };

  const handleDeleteReference = async (referenceToDelete: any) => {
    try {
      const id = referenceToDelete?._id || referenceToDelete?.id;
      if (!id) throw new Error("Missing reference id");
      await contentApi.deleteReference(id);
      setReferences(
        references.filter((reference) => (reference._id || reference.id) !== id)
      );
      if (selectedReference === referenceToDelete) {
        setSelectedReference(null);
      }
      toast.success("Reference deleted successfully!");
    } catch (error) {
      console.error("Error deleting reference:", error);
      toast.error("Failed to delete reference");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Content Library - RFP Proposal System</title>
      </Head>

      <div>
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Content Library
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage company information and team member profiles
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("company")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "company"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4 mr-2 inline" />
                Company Information
              </button>
              <button
                onClick={() => setActiveTab("team")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "team"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <UserGroupIcon className="h-4 w-4 mr-2 inline" />
                Team Members ({team.length})
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "projects"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FolderIcon className="h-4 w-4 mr-2 inline" />
                Past Projects ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab("references")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "references"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <ClipboardDocumentListIcon className="h-4 w-4 mr-2 inline" />
                References ({references.length})
              </button>
            </nav>
          </div>
        </div>

        <div className="mt-8">
          {activeTab === "company" && (
            <CompanySection
              ctx={{
                company,
                editingCompany,
                companyForm,
                setCompanyForm,
                handleEditCompany,
                handleSaveCompany,
                handleCancelCompanyEdit,
              }}
            />
          )}

          {activeTab === "team" && (
            <TeamSection
              ctx={{
                team,
                selectedMember,
                setSelectedMember,
                showAddMember,
                setShowAddMember,
                memberForm,
                setMemberForm,
                addArrayItem,
                updateArrayItem,
                removeArrayItem,
                handleAddMember,
                handleEditMember,
                editingMember,
                setEditingMember,
                handleSaveMember,
                handleDeleteMember,
              }}
            />
          )}

          {activeTab === "projects" && (
            <ProjectsSection
              ctx={{
                projects,
                selectedProject,
                setSelectedProject,
                showAddProject,
                setShowAddProject,
                projectForm,
                setProjectForm,
                addArrayItem,
                updateArrayItem,
                removeArrayItem,
                handleAddProject,
                handleEditProject,
                editingProject,
                setEditingProject,
                handleSaveProject,
                handleDeleteProject,
              }}
            />
          )}

          {activeTab === "references" && (
            <ReferencesSection
              ctx={{
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
                setEditingReference,
                handleSaveReference,
                handleDeleteReference,
              }}
            />
          )}
        </div>

        <AddMemberModal
          open={showAddMember}
          memberForm={memberForm}
          setMemberForm={setMemberForm}
          addArrayItem={addArrayItem}
          updateArrayItem={updateArrayItem}
          removeArrayItem={removeArrayItem}
          onAdd={handleAddMember}
          onClose={() => setShowAddMember(false)}
        />

        <EditMemberModal
          open={Boolean(editingMember)}
          memberForm={memberForm}
          setMemberForm={setMemberForm}
          onSave={handleSaveMember}
          onClose={() => setEditingMember(null)}
        />

        <AddProjectModal
          open={showAddProject}
          projectForm={projectForm}
          setProjectForm={setProjectForm}
          addArrayItem={addArrayItem}
          updateArrayItem={updateArrayItem}
          removeArrayItem={removeArrayItem}
          onAdd={handleAddProject}
          onClose={() => setShowAddProject(false)}
        />

        <EditProjectModal
          open={Boolean(editingProject)}
          projectForm={projectForm}
          setProjectForm={setProjectForm}
          onSave={handleSaveProject}
          onClose={() => setEditingProject(null)}
        />

        <AddReferenceModal
          open={showAddReference}
          referenceForm={referenceForm}
          setReferenceForm={setReferenceForm}
          addArrayItem={addArrayItem}
          updateArrayItem={updateArrayItem}
          removeArrayItem={removeArrayItem}
          onAdd={handleAddReference}
          onClose={() => setShowAddReference(false)}
        />

        <EditReferenceModal
          open={Boolean(editingReference)}
          referenceForm={referenceForm}
          setReferenceForm={setReferenceForm}
          onSave={handleSaveReference}
          onClose={() => setEditingReference(null)}
        />
      </div>
    </Layout>
  );
}
