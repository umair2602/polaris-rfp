import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Layout from "../../components/Layout";
import TextEditor from "../../components/TextEditor";
import AIModal from "../../components/AIModal";
import Modal from "../../components/ui/Modal";
import { proposalApi, proposalApiPdf, Proposal, aiApi } from "../../lib/api";
import api from "../../lib/api";
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  ChevronDownIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { formatTitleObjectToText, parseTitleTextToObject, renderSectionContent, isContentLibrarySection, getContentLibraryType, getSelectedIds } from "../../utils/proposalHelpers";
import ContentLibraryModal from "../../components/ContentLibraryModal";

export default function ProposalDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiEditingSection, setAiEditingSection] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'docx'>('pdf');
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalMessage, setInfoModalMessage] = useState("");
  const [infoModalVariant, setInfoModalVariant] = useState<'info' | 'success' | 'error'>("info");
  const [showContentLibraryModal, setShowContentLibraryModal] = useState(false);
  const [contentLibrarySection, setContentLibrarySection] = useState<string | null>(null);
  const [contentLibraryType, setContentLibraryType] = useState<'team' | 'references' | 'company'>('team');
  const [isContentLibraryLoading, setIsContentLibraryLoading] = useState(false);

  const openInfo = (title: string, message: string, variant: 'info' | 'success' | 'error' = 'info') => {
    setInfoModalTitle(title);
    setInfoModalMessage(message);
    setInfoModalVariant(variant);
    setInfoModalOpen(true);
  };

  useEffect(() => {
    if (id && typeof id === "string") {
      loadProposal(id);
    }
  }, [id]);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadProposal = async (proposalId: string) => {
    try {
      const response = await proposalApi.get(proposalId);
      const proposalData = (response as any)?.data?.data
        ? (response as any).data.data
        : response.data;
      setProposal(proposalData as Proposal);
    } catch (error) {
      console.error("Error loading proposal:", error);
      setError("Failed to load proposal details");
    } finally {
      setLoading(false);
    }
  };

  // Helpers moved to utils/proposalHelpers

  const startEdit = (sectionName: string, content: any) => {
    setEditingSection(sectionName);
    if (sectionName === 'Title' && content && typeof content === 'object') {
      setEditContent(formatTitleObjectToText(content));
    } else {
      setEditContent(typeof content === 'string' ? content : String(content ?? ''));
    }
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditContent("");
  };

  const saveSection = async () => {
    if (!proposal || !editingSection) return;

    setSaving(true);
    try {
      const isTitle = editingSection === 'Title';
      const newContent = isTitle
        ? parseTitleTextToObject(editContent)
        : editContent;

      const updatedSections = {
        ...proposal.sections,
        [editingSection]: {
          ...proposal.sections[editingSection],
          content: newContent,
          lastModified: new Date().toISOString(),
        },
      };

      const response = await proposalApi.update(proposal._id, {
        sections: updatedSections,
      });
      setProposal(response.data);
      setEditingSection(null);
      setEditContent("");
    } catch (error) {
      console.error("Error saving section:", error);
      openInfo("Save failed", "Failed to save section. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = (sectionName: string) => {
    setSectionToDelete(sectionName);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const performDeleteSection = async () => {
    if (!proposal || !sectionToDelete) return;
    setSaving(true);
    try {
      const updatedSections = { ...proposal.sections };
      delete updatedSections[sectionToDelete];

      const response = await proposalApi.update(proposal._id, {
        sections: updatedSections,
      });
      setProposal(response.data);
      setShowDeleteModal(false);
      setSectionToDelete(null);
      setDeleteError("");
    } catch (error) {
      console.error("Error deleting section:", error);
      setDeleteError("Failed to delete section. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addSection = async () => {
    if (!proposal || !newSectionTitle.trim()) return;

    setSaving(true);
    try {
      const updatedSections = {
        ...proposal.sections,
        [newSectionTitle]: {
          content: "",
          type: "custom",
          lastModified: new Date().toISOString(),
        },
      };

      const response = await proposalApi.update(proposal._id, {
        sections: updatedSections,
      });
      setProposal(response.data);
      setIsAddingSection(false);
      setNewSectionTitle("");
      setEditingSection(newSectionTitle);
      setEditContent("");
    } catch (error) {
      console.error("Error adding section:", error);
      openInfo("Add section failed", "Failed to add section. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadToGoogleDrive = async () => {
    if (!proposal) return;

    setUploading(true);
    try {
      const fileName = `${proposal.title.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_Proposal.json`;

      const response = await api.post(
        `/googledrive/upload-proposal/${proposal._id}`,
        {
          fileName,
        }
      );

      openInfo("Upload successful", `Proposal uploaded to Google Drive. File: ${response.data.file.name}`, "success");
    } catch (error) {
      console.error("Error uploading to Google Drive:", error);
      openInfo("Upload failed", "Failed to upload to Google Drive. Please ensure Google Drive is configured and try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const downloadProposal = async (format: 'pdf' | 'docx' = downloadFormat) => {
    if (!proposal) {
      alert("Proposal not loaded.");
      return;
    }
    
    setDownloading(true);
    setShowDownloadMenu(false);
    
    // Show timeout warning after 10 seconds
    const timeoutWarning = setTimeout(() => {
      if (downloading) {
        console.log(`${format.toUpperCase()} generation is taking longer than expected...`);
      }
    }, 10000);
    
    try {
      console.log(`Starting ${format.toUpperCase()} generation for proposal:`, proposal._id);
      
      let response;
      let mimeType;
      let fileExtension;
      
      if (format === 'pdf') {
        response = await proposalApiPdf.exportPdf(proposal._id);
        mimeType = "application/pdf";
        fileExtension = "pdf";
      } else {
        response = await proposalApiPdf.exportDocx(proposal._id);
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        fileExtension = "docx";
      }
      
      console.log(`${format.toUpperCase()} generation completed, creating download link`);
      
      const blob = new Blob([response.data], { type: mimeType });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${proposal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;
      link.click();
      
      // Clean up the object URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(link.href);
      }, 1000);
      
      console.log(`${format.toUpperCase()} download initiated successfully`);
    } catch (err: any) {
      console.error("Download failed:", err);
      let message = "Unknown error";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      } else if (err?.response?.data?.error) {
        message = err.response.data.error;
      }
      openInfo("Download failed", `Failed to download proposal ${format.toUpperCase()}: ${message}`, "error");
    } finally {
      clearTimeout(timeoutWarning);
      setDownloading(false);
    }
  };

  const generateAISections = async () => {
    if (!proposal) return;

    setGenerating(true);
    try {
      const response = await api.post(`/api/proposals/${proposal._id}/generate-sections`);
      
      // Update the proposal with new sections
      setProposal(response.data.proposal);
      
      openInfo("AI sections", "AI sections generated successfully!", "success");
    } catch (error) {
      console.error("Error generating AI sections:", error);
      openInfo("AI generation failed", "Failed to generate AI sections. Please try again.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const startAIEdit = (sectionName: string) => {
    setAiEditingSection(sectionName);
    setShowAIModal(true);
  };

  const handleAIEdit = async (prompt: string) => {
    if (!proposal || !aiEditingSection) return;

    setIsAILoading(true);
    try {
      const currentContent = proposal.sections[aiEditingSection]?.content || "";
      
      const response = await aiApi.editText({
        text: currentContent,
        prompt,
      });

      if (response.data.success) {
        const updatedSections = {
          ...proposal.sections,
          [aiEditingSection]: {
            ...proposal.sections[aiEditingSection],
            content: response.data.editedText,
            lastModified: new Date().toISOString(),
          },
        };

        const updateResponse = await proposalApi.update(proposal._id, {
          sections: updatedSections,
        });
        setProposal(updateResponse.data);
        setShowAIModal(false);
        setAiEditingSection(null);
      } else {
        throw new Error(response.data.error || "AI edit failed");
      }
    } catch (error: any) {
      console.error("AI edit failed:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "AI edit failed. Please try again.";
      openInfo("AI edit failed", errorMessage, "error");
    } finally {
      setIsAILoading(false);
    }
  };

  const cancelAIEdit = () => {
    setShowAIModal(false);
    setAiEditingSection(null);
  };

  const openContentLibrary = (sectionName: string) => {
    const type = getContentLibraryType(sectionName);
    if (!type) return;
    
    setContentLibrarySection(sectionName);
    setContentLibraryType(type);
    setShowContentLibraryModal(true);
  };

  const handleContentLibrarySelection = async (selectedIds: string[]) => {
    if (!proposal || !contentLibrarySection) return;

    setIsContentLibraryLoading(true);
    try {
      const response = await api.put(
        `/api/proposals/${proposal._id}/content-library/${contentLibrarySection}`,
        {
          selectedIds,
          type: contentLibraryType
        }
      );

      setProposal(response.data);
      setShowContentLibraryModal(false);
      setContentLibrarySection(null);
      
      openInfo("Content updated", "Content library selection updated successfully!", "success");
    } catch (error: any) {
      console.error("Error updating content library selection:", error);
      const errorMessage = error.response?.data?.error || "Failed to update content library selection";
      openInfo("Update failed", errorMessage, "error");
    } finally {
      setIsContentLibraryLoading(false);
    }
  };

  const cancelContentLibrary = () => {
    setShowContentLibraryModal(false);
    setContentLibrarySection(null);
  };

  // Rendering helpers moved to utils/proposalHelpers

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !proposal) {
    return (
      <Layout>
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Proposal not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {error || "The proposal you are looking for does not exist."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const sectionEntries = Object.entries(proposal.sections || {});

  return (
    <Layout>
      <Head>
        <title>{proposal.title} - Proposal Details</title>
      </Head>

      <div>
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
            <div className="py-6 md:flex md:items-center md:justify-between lg:border-t lg:border-gray-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl truncate">
                      {proposal.title}
                    </h1>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      {(proposal as any).rfp?.clientName || "Unknown Client"}
                      <span className="mx-2">•</span>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {proposal.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                <div className="relative" ref={downloadMenuRef}>
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    disabled={downloading}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Generating {downloadFormat.toUpperCase()}...
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon
                          className="-ml-1 mr-2 h-5 w-5"
                          aria-hidden="true"
                        />
                        Download {downloadFormat.toUpperCase()}
                        <ChevronDownIcon
                          className="ml-2 h-4 w-4"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </button>
                  
                  {showDownloadMenu && !downloading && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                      <button
                        onClick={() => {
                          setDownloadFormat('pdf');
                          downloadProposal('pdf');
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <DocumentTextIcon className="mr-3 h-4 w-4" />
                        Download as PDF
                      </button>
                      <button
                        onClick={() => {
                          setDownloadFormat('docx');
                          downloadProposal('docx');
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <DocumentTextIcon className="mr-3 h-4 w-4" />
                        Download as DOCX
                      </button>
                    </div>
                  )}
                </div>
                {/* <button
                  onClick={uploadToGoogleDrive}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon
                        className="-ml-1 mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Upload to Drive
                    </>
                  )}
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Status
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 capitalize">
                          {proposal.status}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarDaysIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Created
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {new Date(proposal.createdAt).toLocaleDateString('en-US')}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Sections
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {sectionEntries.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Section Button */}
            <div className="mb-6">
              {isAddingSection ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Section title"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 bg-gray-100 focus:border-primary-500"
                      onKeyPress={(e) => e.key === "Enter" && addSection()}
                    />
                    <button
                      onClick={addSection}
                      disabled={!newSectionTitle.trim() || saving}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingSection(false);
                        setNewSectionTitle("");
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingSection(true)}
                  className="inline-flex items-center px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Section
                </button>
              )}
            </div>

            {/* Proposal Sections */}
            <div className="space-y-8">
              {sectionEntries.map(
                ([sectionName, sectionData]: [string, any]) => (
                  <div key={sectionName} className="bg-white shadow rounded-lg">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {sectionName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {/* Content Library Button - only show for content library sections, excluding Title */}
                          {isContentLibrarySection(sectionData) && getContentLibraryType(sectionName) && sectionName !== 'Title' && (
                            <button
                              onClick={() => openContentLibrary(sectionName)}
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                              title="Select from Library"
                            >
                              <BookOpenIcon className="h-3 w-3" />
                              <span>Select from Library</span>
                            </button>
                          )}
                          <button
                            onClick={() => startAIEdit(sectionName)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                            title="Ask with AI"
                          >
                            <SparklesIcon className="h-3 w-3" />
                            <span>Ask with AI</span>
                          </button>
                          {editingSection !== sectionName && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() =>
                                  startEdit(
                                    sectionName,
                                    sectionData.content || ""
                                  )
                                }
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Edit section"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteSection(sectionName)}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title="Delete section"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      {editingSection === sectionName ? (
                        <div className="space-y-4">
                          <TextEditor
                            value={editContent}
                            onChange={setEditContent}
                            placeholder="Enter section content..."
                            className="min-h-64"
                          />
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={saveSection}
                              disabled={saving}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                            >
                              {saving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              ) : (
                                <CheckIcon className="h-4 w-4 mr-2" />
                              )}
                              Save Changes
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              <XMarkIcon className="h-4 w-4 mr-2" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="prose max-w-none text-sm text-gray-700 overflow-hidden">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: renderSectionContent(
                                  sectionData.content || "",
                                  sectionName
                                ),
                              }}
                            />
                          </div>
                          {sectionData.lastModified && (
                            <div className="mt-4 text-xs text-gray-400">
                              Last modified:{" "}
                              {new Date(
                                sectionData.lastModified
                              ).toLocaleString('en-US')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {sectionEntries.length === 0 && (
              <div className="text-center py-12 bg-white shadow rounded-lg">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No Content
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This proposal has no sections or content yet.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => setIsAddingSection(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add First Section
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Modal */}
      <AIModal
        isOpen={showAIModal}
        onClose={cancelAIEdit}
        onApply={handleAIEdit}
        isLoading={isAILoading}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete section?"
        footer={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={performDeleteSection}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : null}
              Confirm
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-700">Are you sure you want to delete{sectionToDelete ? ` "${sectionToDelete}"` : ''}?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          {deleteError && (
            <p className="text-sm text-red-600">{deleteError}</p>
          )}
        </div>
      </Modal>

      {/* Info Modal */}
      <Modal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title={infoModalTitle}
        footer={
          <button
            onClick={() => setInfoModalOpen(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            OK
          </button>
        }
      >
        <p className={`text-sm ${infoModalVariant === 'error' ? 'text-red-700' : infoModalVariant === 'success' ? 'text-green-700' : 'text-gray-700'}`}>{infoModalMessage}</p>
      </Modal>

      {/* Content Library Modal */}
      <ContentLibraryModal
        isOpen={showContentLibraryModal}
        onClose={cancelContentLibrary}
        onApply={handleContentLibrarySelection}
        type={contentLibraryType}
        currentSelectedIds={contentLibrarySection ? getSelectedIds(proposal?.sections[contentLibrarySection]) : []}
        isLoading={isContentLibraryLoading}
      />
    </Layout>
  );
}
