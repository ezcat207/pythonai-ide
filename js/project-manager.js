// Project Manager module
class ProjectManager {
    constructor() {
        this.currentProject = null;
        this.projects = [];
        this.recentProjects = [];
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadRecentProjects();
        this.initializeDefaultProject();
    }

    setupEventListeners() {
        // Navigation buttons
        const newBtn = document.querySelector('[data-action="new"]');
        const saveBtn = document.querySelector('[data-action="save"]');
        const openBtn = document.querySelector('[data-action="open"]');
        const newProjectBtn = document.querySelector('[data-action="new-project"]');

        if (newBtn) newBtn.addEventListener('click', () => this.newProject());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveCurrentProject());
        if (openBtn) openBtn.addEventListener('click', () => this.showProjectSelector());
        if (newProjectBtn) newProjectBtn.addEventListener('click', () => this.newProject());

        // Listen for authentication events
        document.addEventListener('auth', (e) => {
            if (e.detail.type === 'login' || e.detail.type === 'autoLogin') {
                this.loadUserProjects();
            } else if (e.detail.type === 'logout') {
                this.clearProjects();
            }
        });
    }

    async loadUserProjects() {
        if (!authManager.isLoggedIn()) {
            return;
        }

        try {
            this.isLoading = true;
            this.updateProjectList([]);

            const userId = authManager.getCurrentUser().id;
            const projects = await api.getProjects(userId);
            
            this.projects = projects || [];
            this.updateProjectList(this.projects);
            
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.showError('Failed to load projects');
        } finally {
            this.isLoading = false;
        }
    }

    updateProjectList(projects) {
        const projectList = document.getElementById('projectList');
        if (!projectList) return;

        if (this.isLoading) {
            projectList.innerHTML = '<div class="loading-message">Loading projects...</div>';
            return;
        }

        if (projects.length === 0) {
            projectList.innerHTML = `
                <div class="empty-projects">
                    <i class="fas fa-folder-open"></i>
                    <p>No projects yet</p>
                    <button class="btn-create-first" onclick="projectManager.newProject()">
                        Create your first project
                    </button>
                </div>
            `;
            return;
        }

        const projectsHTML = projects.map(project => `
            <div class="project-item ${this.currentProject?.id === project.id ? 'active' : ''}" 
                 data-project-id="${project.id}" 
                 onclick="projectManager.openProject('${project.id}')">
                <i class="fab fa-python"></i>
                <div class="project-info">
                    <span class="project-name">${project.title}</span>
                    <div class="project-meta">
                        <span class="project-date">${this.formatDate(project.updated_at)}</span>
                        <span class="project-tags">
                            ${project.tags ? project.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                        </span>
                    </div>
                </div>
                <div class="project-actions">
                    <button class="btn-icon small" title="Delete" onclick="event.stopPropagation(); projectManager.deleteProject('${project.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        projectList.innerHTML = projectsHTML;
    }

    async newProject() {
        const projectData = this.createProjectDialog();
        if (!projectData) return;

        try {
            if (authManager.isLoggedIn()) {
                const userId = authManager.getCurrentUser().id;
                const newProject = {
                    user_id: userId,
                    title: projectData.title,
                    description: projectData.description,
                    code: projectData.code,
                    language: 'python',
                    is_public: false,
                    tags: projectData.tags,
                    difficulty_level: 'beginner'
                };

                const result = await api.createProject(newProject);
                if (result && result.length > 0) {
                    this.currentProject = result[0];
                    await this.loadUserProjects();
                    this.openProjectInEditor(this.currentProject);
                    this.showSuccess('Project created successfully!');
                }
            } else {
                // Create local project for guest users
                this.createLocalProject(projectData);
            }
            
        } catch (error) {
            console.error('Failed to create project:', error);
            this.showError('Failed to create project');
        }
    }

    createProjectDialog() {
        const title = prompt('Project name:', `my_project_${Date.now()}.py`);
        if (!title) return null;

        const description = prompt('Project description (optional):', '');
        
        return {
            title: title.endsWith('.py') ? title : `${title}.py`,
            description: description || `Created on ${new Date().toLocaleDateString()}`,
            code: CONFIG.DEFAULT_PROJECT.code,
            tags: ['python', 'beginner']
        };
    }

    createLocalProject(projectData) {
        const localProject = {
            id: `local_${Date.now()}`,
            ...projectData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            isLocal: true
        };

        this.currentProject = localProject;
        this.addToRecentProjects(localProject);
        this.openProjectInEditor(localProject);
        this.showSuccess('Local project created!');
    }

    async openProject(projectId) {
        try {
            let project = this.projects.find(p => p.id === projectId);
            
            if (!project) {
                this.showError('Project not found');
                return;
            }

            this.currentProject = project;
            this.openProjectInEditor(project);
            this.addToRecentProjects(project);
            this.updateProjectList(this.projects);
            
        } catch (error) {
            console.error('Failed to open project:', error);
            this.showError('Failed to open project');
        }
    }

    openProjectInEditor(project) {
        if (window.editor) {
            window.editor.openFile({
                name: project.title,
                content: project.code,
                language: 'python'
            });
        }
    }

    async saveCurrentProject() {
        if (!this.currentProject) {
            return this.newProject();
        }

        try {
            const code = window.editor ? window.editor.getCurrentCode() : '';
            await this.saveProject(this.currentProject.title, code);
            
        } catch (error) {
            console.error('Failed to save project:', error);
            this.showError('Failed to save project');
        }
    }

    async saveProject(title, code) {
        if (!authManager.isLoggedIn()) {
            this.saveLocalProject(title, code);
            return;
        }

        try {
            if (this.currentProject && !this.currentProject.isLocal) {
                // Update existing project
                const updates = {
                    code: code,
                    last_run_at: new Date().toISOString()
                };

                const result = await api.updateProject(this.currentProject.id, updates);
                if (result && result.length > 0) {
                    this.currentProject = result[0];
                    await this.loadUserProjects();
                    this.showSuccess('Project saved!');
                }
            } else {
                // Create new project
                const userId = authManager.getCurrentUser().id;
                const projectData = {
                    user_id: userId,
                    title: title,
                    description: this.currentProject?.description || `Created on ${new Date().toLocaleDateString()}`,
                    code: code,
                    language: 'python',
                    is_public: false,
                    tags: this.currentProject?.tags || ['python'],
                    difficulty_level: 'beginner'
                };

                const result = await api.createProject(projectData);
                if (result && result.length > 0) {
                    this.currentProject = result[0];
                    await this.loadUserProjects();
                    this.showSuccess('Project saved!');
                }
            }
        } catch (error) {
            console.error('Save failed:', error);
            throw error;
        }
    }

    saveLocalProject(title, code) {
        if (this.currentProject) {
            this.currentProject.code = code;
            this.currentProject.updated_at = new Date().toISOString();
            this.addToRecentProjects(this.currentProject);
            this.showSuccess('Project saved locally!');
        }
    }

    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        try {
            await api.deleteProject(projectId);
            
            // Remove from local projects list
            this.projects = this.projects.filter(p => p.id !== projectId);
            
            // Clear current project if it was deleted
            if (this.currentProject?.id === projectId) {
                this.currentProject = null;
                this.initializeDefaultProject();
            }
            
            this.updateProjectList(this.projects);
            this.showSuccess('Project deleted successfully!');
            
        } catch (error) {
            console.error('Failed to delete project:', error);
            this.showError('Failed to delete project');
        }
    }

    showProjectSelector() {
        // Create a modal for project selection
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Open Project</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="project-selector">
                        ${this.renderProjectSelector()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    renderProjectSelector() {
        if (this.projects.length === 0) {
            return `
                <div class="empty-projects">
                    <p>No saved projects found</p>
                    <button onclick="projectManager.newProject(); this.closest('.modal').remove();">
                        Create New Project
                    </button>
                </div>
            `;
        }

        return this.projects.map(project => `
            <div class="project-selector-item" onclick="projectManager.openProject('${project.id}'); this.closest('.modal').remove();">
                <div class="project-icon">
                    <i class="fab fa-python"></i>
                </div>
                <div class="project-details">
                    <h4>${project.title}</h4>
                    <p>${project.description}</p>
                    <div class="project-meta">
                        <span>${this.formatDate(project.updated_at)}</span>
                        <span class="difficulty ${project.difficulty_level}">${project.difficulty_level}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    initializeDefaultProject() {
        this.currentProject = {
            id: null,
            title: CONFIG.DEFAULT_PROJECT.title,
            description: CONFIG.DEFAULT_PROJECT.description,
            code: CONFIG.DEFAULT_PROJECT.code,
            isLocal: true
        };

        if (window.editor) {
            this.openProjectInEditor(this.currentProject);
        }
    }

    addToRecentProjects(project) {
        // Remove if already in recent projects
        this.recentProjects = this.recentProjects.filter(p => p.id !== project.id);
        
        // Add to beginning
        this.recentProjects.unshift(project);
        
        // Keep only the most recent projects
        if (this.recentProjects.length > CONFIG.UI.maxRecentProjects) {
            this.recentProjects = this.recentProjects.slice(0, CONFIG.UI.maxRecentProjects);
        }
        
        this.saveRecentProjects();
    }

    loadRecentProjects() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.RECENT_PROJECTS);
            this.recentProjects = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load recent projects:', error);
            this.recentProjects = [];
        }
    }

    saveRecentProjects() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(this.recentProjects));
        } catch (error) {
            console.error('Failed to save recent projects:', error);
        }
    }

    clearProjects() {
        this.projects = [];
        this.currentProject = null;
        this.updateProjectList([]);
        this.initializeDefaultProject();
    }

    getCurrentProject() {
        return this.currentProject;
    }

    getProjects() {
        return this.projects;
    }

    // Utility methods
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    showSuccess(message) {
        if (window.editor) {
            window.editor.showNotification(message, 'success');
        } else {
            console.log('Success:', message);
        }
    }

    showError(message) {
        if (window.editor) {
            window.editor.showNotification(message, 'error');
        } else {
            console.error('Error:', message);
        }
    }

    // Example projects loader
    loadExampleProject(exampleKey) {
        const example = CONFIG.EXAMPLE_PROJECTS[exampleKey];
        if (!example) return;

        const projectData = {
            title: example.title,
            description: example.description,
            code: example.code,
            tags: example.tags
        };

        if (authManager.isLoggedIn()) {
            this.createServerProject(projectData);
        } else {
            this.createLocalProject(projectData);
        }
    }

    async createServerProject(projectData) {
        try {
            const userId = authManager.getCurrentUser().id;
            const newProject = {
                user_id: userId,
                title: projectData.title,
                description: projectData.description,
                code: projectData.code,
                language: 'python',
                is_public: false,
                tags: projectData.tags,
                difficulty_level: projectData.difficulty_level || 'beginner'
            };

            const result = await api.createProject(newProject);
            if (result && result.length > 0) {
                this.currentProject = result[0];
                await this.loadUserProjects();
                this.openProjectInEditor(this.currentProject);
                this.showSuccess('Example project loaded!');
            }
        } catch (error) {
            console.error('Failed to create example project:', error);
            this.showError('Failed to load example project');
        }
    }
}

// Add CSS for project selector
const projectSelectorStyles = `
.project-selector {
    max-height: 400px;
    overflow-y: auto;
}

.project-selector-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.project-selector-item:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-light);
}

.project-icon {
    flex-shrink: 0;
}

.project-icon i {
    font-size: 24px;
    color: var(--python-color);
}

.project-details h4 {
    margin-bottom: 4px;
    color: var(--text-primary);
    font-size: 14px;
}

.project-details p {
    color: var(--text-secondary);
    font-size: 12px;
    margin-bottom: 8px;
}

.project-meta {
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 11px;
}

.project-meta .difficulty {
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 600;
    text-transform: uppercase;
}

.project-meta .difficulty.beginner {
    background: var(--success-color);
    color: white;
}

.project-meta .difficulty.intermediate {
    background: var(--warning-color);
    color: white;
}

.project-meta .difficulty.advanced {
    background: var(--danger-color);
    color: white;
}

.empty-projects {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-secondary);
}

.empty-projects i {
    font-size: 48px;
    margin-bottom: 16px;
    color: var(--text-muted);
}

.empty-projects p {
    margin-bottom: 16px;
    font-size: 14px;
}

.btn-create-first {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease;
}

.btn-create-first:hover {
    background: var(--primary-hover);
}

.loading-message {
    text-align: center;
    padding: 20px;
    color: var(--text-secondary);
}

.project-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
}

.project-date {
    font-size: 11px;
    color: var(--text-muted);
}

.project-tags {
    display: flex;
    gap: 4px;
}

.tag {
    background: var(--bg-quaternary);
    color: var(--text-secondary);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
}
`;

// Add styles to document
const projectStyleSheet = document.createElement('style');
projectStyleSheet.textContent = projectSelectorStyles;
document.head.appendChild(projectStyleSheet);

// Initialize project manager
const projectManager = new ProjectManager();

// Make projectManager available globally
window.projectManager = projectManager;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectManager;
}