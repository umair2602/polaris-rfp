import {
  FolderIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

export default function ProjectsSection({ ctx }: { ctx: any }) {
  const {
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
    handleSaveProject,
    handleDeleteProject,
  } = ctx;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Projects List */}
      <div className="lg:col-span-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Past Projects
              </h3>
              <button
                onClick={() => setShowAddProject(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
              >
                + Add Project
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {projects.length > 0 ? (
              projects.map((project: any, index: number) => (
                <div
                  key={index}
                  className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedProject === project
                      ? "bg-primary-50 border-r-2 border-primary-500"
                      : ""
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <FolderIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {project.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {project.clientName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {project.industry} • {project.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-600 bg-primary-100 rounded hover:bg-primary-200"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProject(project);
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project);
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
                <p className="text-gray-500 text-sm">No projects found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Details Panel */}
      <div className="lg:col-span-1">
        <div className="bg-white shadow rounded-lg sticky top-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Project Details
            </h3>
          </div>
          <div className="px-6 py-4">
            {selectedProject ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <FolderIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">
                    {selectedProject.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {selectedProject.clientName}
                  </p>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Description
                  </h5>
                  <p className="text-sm text-gray-600">
                    {selectedProject.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </h5>
                    <p className="text-xs text-gray-600">
                      {selectedProject.industry}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </h5>
                    <p className="text-xs text-gray-600">
                      {selectedProject.duration}
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Key Outcomes
                  </h5>
                  <ul className="space-y-1">
                    {selectedProject.keyOutcomes
                      ?.slice(0, 3)
                      .map((outcome: string, index: number) => (
                        <li key={index} className="flex items-start space-x-1">
                          <StarIcon className="h-3 w-3 text-yellow-400 mt-1 flex-shrink-0" />
                          <span className="text-xs text-gray-600">
                            {outcome}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Technologies
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedProject.technologies
                      ?.slice(0, 6)
                      .map((tech: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Select a project to view its details
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
