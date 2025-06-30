const sideLinks = document.querySelectorAll('.sideLinks li');
const managerContent = document.querySelector('.managerContent');

// Set default dashboard content
function setDefaultContent() {
    managerContent.innerHTML = `
        <div class="managerPanelHead">
            <div class="routePath">
                <i class="fa-solid fa-gauge"></i>
                <h2>Dashboard</h2>
            </div>
            <div class="searchManager">
                <input type="text" placeholder="Search...">
                <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <button class="createTask">
                <i class="fa-solid fa-plus"></i>
                <span>Create Task</span>
            </button>
        </div>
        <div class="managerDisplayer">
            <div class="currentTasks" id="tasksContainer">
                <!-- Tasks will be dynamically created here -->
                <div class="taskCreateForm" id="taskCreateForm" style="display: none;">
                    <div class="formHeader">
                        <h3>Create New Task</h3>
                        <button class="closeForm" id="closeFormBtn">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <form id="newTaskForm">
                        <div class="formGroup">
                            <label for="taskTitle">Task Title:</label>
                            <input type="text" id="taskTitle" name="taskTitle" required>
                        </div>
                        <div class="formGroup">
                            <label for="taskPriority">Priority:</label>
                            <select id="taskPriority" name="taskPriority" required>
                                <option value="">Select Priority</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div class="formGroup">
                            <label for="taskStatus">Status:</label>
                            <select id="taskStatus" name="taskStatus" required>
                                <option value="">Select Status</option>
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div class="formGroup">
                            <label for="taskPages">Number of Pages:</label>
                            <input type="number" id="taskPages" name="taskPages" min="1" value="1" required>
                        </div>
                        <div class="formActions">
                            <button type="submit" class="submitTask">Create Task</button>
                            <button type="button" class="cancelTask" id="cancelTaskBtn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Initialize with default content on page load
setDefaultContent();

// Migrate localStorage data to server if needed
migrateLocalStorageToServer().then(() => {
    loadExistingTasks();
});

// Function to migrate localStorage data to server
async function migrateLocalStorageToServer() {
    try {
        // Check if localStorage has data
        const storedData = localStorage.getItem('mrmanager_tasks');
        if (!storedData) {
            console.log('No localStorage data to migrate');
            return;
        }

        const localData = JSON.parse(storedData);
        if (!localData.tasks || localData.tasks.length === 0) {
            console.log('No tasks in localStorage to migrate');
            return;
        }

        console.log(`Found ${localData.tasks.length} tasks in localStorage, migrating to server...`);

        // Check if server is available and has data
        const serverResponse = await fetch('/api/tasks');
        if (serverResponse.ok) {
            const serverTasks = await serverResponse.json();
            if (serverTasks.length > 0) {
                console.log('Server already has data, skipping migration');
                return;
            }

            // Migrate each task to server
            for (const task of localData.tasks) {
                await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(task)
                });
            }

            console.log('Successfully migrated localStorage data to server');
            
            // Clear localStorage after successful migration
            localStorage.removeItem('mrmanager_tasks');
            console.log('Cleared localStorage data after migration');
        }
    } catch (error) {
        console.log('Migration failed, server may not be available:', error);
    }
}

// Function to load and display existing tasks
async function loadExistingTasks() {
    await loadTasks();
    
    // Get tasks container
    const tasksContainer = document.getElementById('tasksContainer');
    if (tasksContainer && taskData.tasks.length > 0) {
        const formElement = document.getElementById('taskCreateForm');
        
        // Create task cards for existing tasks
        taskData.tasks.forEach(task => {
            const taskCard = createTaskCard(
                task.title, 
                task.priority, 
                task.status, 
                task.totalPages, 
                task.currentPage || 0,
                task.id
            );
            formElement.insertAdjacentHTML('beforebegin', taskCard);
        });
    }
}

// Function to create a new task card
function createTaskCard(title, priority, status, totalPages, currentPage = 0, taskId = null) {
    const priorityConfig = {
        high: { icon: 'fa-solid fa-circle-exclamation', text: 'High' },
        medium: { icon: 'fa-solid fa-circle-minus', text: 'Medium' },
        low: { icon: 'fa-solid fa-circle', text: 'Low' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.low;
    const buttonText = currentPage === 0 ? 'Start' : 'Continue';
    const progressPercentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
    
    return `
        <div class="taskCard" data-task-id="${taskId || ''}">
            <div class="taskHead">
                <h3>${title}</h3>
                <div priority="${priority}" class="taskPriority">
                    <i class="${config.icon}"></i>
                    <span>${config.text}</span>
                </div>
            </div>
            <p class="taskStatus">${status}</p>
            <div class="taskDetails">
                <div class="progress">
                    <div class="progressBar" style="width: ${progressPercentage}%;"><p>${currentPage}/${totalPages}</p></div>
                </div>
                <button class="continueTask" data-title="${title}" data-priority="${priority}" data-status="${status}" data-total-pages="${totalPages}" data-current-page="${currentPage}" data-task-id="${taskId || ''}">
                    <i class="fa-solid fa-play"></i>
                    <p>${buttonText}</p>
                </button>
            </div>
        </div>
    `;
}

// Set tasks content with toggle functionality
function setTasksContent() {
    managerContent.innerHTML = `
        <div class="managerPanelHead">
            <div class="routePath">
                <i class="fa-solid fa-list"></i>
                <h2>Tasks</h2>
            </div>
            <div class="searchManager">
                <input type="text" placeholder="Search tasks...">
                <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <div class="viewToggle">
                <button class="toggleBtn active" data-view="card">
                    <i class="fa-solid fa-th-large"></i>
                    Card
                </button>
                <button class="toggleBtn" data-view="list">
                    <i class="fa-solid fa-list"></i>
                    List
                </button>
            </div>
            <button class="createTask">
                <i class="fa-solid fa-plus"></i>
                <span>Create Task</span>
            </button>
        </div>
        <div class="managerDisplayer">
            <div class="taskView" id="taskView">
                <div class="currentTasks" id="tasksContainer">
                    <!-- Tasks will be dynamically created here -->
                    <div class="taskCreateForm" id="taskCreateForm" style="display: none;">
                        <div class="formHeader">
                            <h3>Create New Task</h3>
                            <button class="closeForm" id="closeFormBtn">
                                <i class="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form id="newTaskForm">
                            <div class="formGroup">
                                <label for="taskTitle">Task Title:</label>
                                <input type="text" id="taskTitle" name="taskTitle" required>
                            </div>
                            <div class="formGroup">
                                <label for="taskPriority">Priority:</label>
                                <select id="taskPriority" name="taskPriority" required>
                                    <option value="">Select Priority</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div class="formGroup">
                                <label for="taskStatus">Status:</label>
                                <select id="taskStatus" name="taskStatus" required>
                                    <option value="">Select Status</option>
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div class="formGroup">
                                <label for="taskPages">Number of Pages:</label>
                                <input type="number" id="taskPages" name="taskPages" min="1" value="1" required>
                            </div>
                            <div class="formActions">
                                <button type="submit" class="submitTask">Create Task</button>
                                <button type="button" class="cancelTask" id="cancelTaskBtn">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Function to load tasks with toggle functionality
async function loadTasksWithToggle() {
    await loadTasks();
    
    // Get tasks container
    const tasksContainer = document.getElementById('tasksContainer');
    if (tasksContainer && taskData.tasks.length > 0) {
        const formElement = document.getElementById('taskCreateForm');
        
        // Create task cards for existing tasks
        taskData.tasks.forEach(task => {
            const taskCard = createTaskCardForTasks(
                task.title, 
                task.priority, 
                task.status, 
                task.totalPages, 
                task.currentPage || 0,
                task.id,
                task.documentContent
            );
            formElement.insertAdjacentHTML('beforebegin', taskCard);
        });
    }
    
    // Add toggle functionality
    setupViewToggle();
}

// Function to create task card specifically for tasks page
function createTaskCardForTasks(title, priority, status, totalPages, currentPage = 0, taskId = null, documentContent = null) {
    const priorityConfig = {
        high: { icon: 'fa-solid fa-circle-exclamation', text: 'High' },
        medium: { icon: 'fa-solid fa-circle-minus', text: 'Medium' },
        low: { icon: 'fa-solid fa-circle', text: 'Low' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.low;
    const buttonText = currentPage === 0 ? 'Start' : 'Continue';
    const progressPercentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
    
    // Calculate word count from document content
    let wordCount = 0;
    if (documentContent) {
        Object.values(documentContent).forEach(pageContent => {
            const textContent = pageContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            wordCount += textContent.split(' ').filter(word => word.length > 0).length;
        });
    }
    
    return `
        <div class="taskCard" data-task-id="${taskId || ''}" data-view="card">
            <div class="taskHead">
                <h3>${title}</h3>
                <div priority="${priority}" class="taskPriority">
                    <i class="${config.icon}"></i>
                    <span>${config.text}</span>
                </div>
            </div>
            <div class="taskActions">
                <button class="actionBtn editTask" data-task-id="${taskId || ''}" title="Edit Task">
                    <i class="fa-solid fa-edit"></i>
                </button>
                <button class="actionBtn deleteTask" data-task-id="${taskId || ''}" title="Delete Task">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="taskDetails">
                <div class="progress">
                    <div class="progressBar" style="width: ${progressPercentage}%;"><p>${currentPage}/${totalPages}</p></div>
                </div>
                <button class="continueTask" data-title="${title}" data-priority="${priority}" data-status="${status}" data-total-pages="${totalPages}" data-current-page="${currentPage}" data-task-id="${taskId || ''}">
                    <i class="fa-solid fa-play"></i>
                    <p>${buttonText}</p>
                </button>
            </div>
            
            <!-- List view content (hidden by default) -->
            <div class="listContent" style="display: none;">
                <div class="listTitle">
                    <h3>${title}</h3>
                    <span class="wordCount">${wordCount} words</span>
                </div>
                <div class="listActions">
                    <button class="actionBtn editTask" data-task-id="${taskId || ''}" title="Edit Task">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="actionBtn deleteTask" data-task-id="${taskId || ''}" title="Delete Task">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Function to setup view toggle functionality
function setupViewToggle() {
    const toggleButtons = document.querySelectorAll('.toggleBtn');
    const taskCards = document.querySelectorAll('.taskCard');
    const tasksContainer = document.getElementById('tasksContainer');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewType = btn.dataset.view;
            
            // Update active button
            toggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Switch view
            if (viewType === 'list') {
                tasksContainer.classList.add('listView');
                taskCards.forEach(card => {
                    const taskHead = card.querySelector('.taskHead');
                    const taskActions = card.querySelector('.taskActions');
                    const taskDetails = card.querySelector('.taskDetails');
                    const listContent = card.querySelector('.listContent');
                    
                    if (taskHead) taskHead.style.display = 'none';
                    if (taskActions) taskActions.style.display = 'none';
                    if (taskDetails) taskDetails.style.display = 'none';
                    if (listContent) listContent.style.display = 'flex';
                });
            } else {
                tasksContainer.classList.remove('listView');
                taskCards.forEach(card => {
                    const taskHead = card.querySelector('.taskHead');
                    const taskActions = card.querySelector('.taskActions');
                    const taskDetails = card.querySelector('.taskDetails');
                    const listContent = card.querySelector('.listContent');
                    
                    if (taskHead) taskHead.style.display = '';
                    if (taskActions) taskActions.style.display = '';
                    if (taskDetails) taskDetails.style.display = '';
                    if (listContent) listContent.style.display = 'none';
                });
            }
        });
    });
}

// Function to handle create task button clicks
function handleCreateTaskClick() {
    const taskForm = document.getElementById('taskCreateForm');
    const taskCards = document.querySelectorAll('.taskCard');
    
    if (taskForm) {
        taskForm.style.display = 'block';
        // Hide all task cards when form is shown
        taskCards.forEach(card => {
            card.style.display = 'none';
        });
    }
}

// Function to hide the task form
function hideTaskForm() {
    const taskForm = document.getElementById('taskCreateForm');
    const taskCards = document.querySelectorAll('.taskCard');
    
    if (taskForm) {
        taskForm.style.display = 'none';
        // Show all task cards when form is hidden
        taskCards.forEach(card => {
            card.style.display = 'block';
        });
        // Reset form
        document.getElementById('newTaskForm').reset();
    }
}

// Function to handle form submission
function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const totalPages = parseInt(document.getElementById('taskPages').value) || 1;
    
    if (title && priority && status && totalPages) {
        // Hide the form and show the text editor
        hideTaskForm();
        showTextEditor(title, priority, status, totalPages);
    }
}

// Function to show the text editor
function showTextEditor(title, priority, status, totalPages, existingTask = null) {
    const managerContent = document.querySelector('.managerContent');
    managerContent.innerHTML = `
        <div class="taskDocPage">
            <div class="editorHeader">
                <div class="taskInfo">
                    <h2>${title}</h2>
                    <span class="editorTaskStatus">${status}</span>
                </div>
                <div class="editorControls">
                    <button class="saveDoc">
                        <i class="fa-solid fa-floppy-disk"></i>
                        Save
                    </button>
                    <button class="finishDoc">
                        <i class="fa-solid fa-check"></i>
                        Finish & Return
                    </button>
                </div>
            </div>
            
            <div class="editorToolbar">
                <div class="formatGroup">
                    <button class="toolBtn" data-command="bold" title="Bold">
                        <i class="fa-solid fa-bold"></i>
                    </button>
                    <button class="toolBtn" data-command="italic" title="Italic">
                        <i class="fa-solid fa-italic"></i>
                    </button>
                    <button class="toolBtn" data-command="underline" title="Underline">
                        <i class="fa-solid fa-underline"></i>
                    </button>
                </div>
                
                <div class="formatGroup">
                    <button class="toolBtn" data-command="insertUnorderedList" title="Bullet List">
                        <i class="fa-solid fa-list-ul"></i>
                    </button>
                    <button class="toolBtn" data-command="insertOrderedList" title="Numbered List">
                        <i class="fa-solid fa-list-ol"></i>
                    </button>
                </div>
                
                <div class="formatGroup">
                    <button class="toolBtn" data-command="formatBlock" data-value="h1" title="Heading 1">H1</button>
                    <button class="toolBtn" data-command="formatBlock" data-value="h2" title="Heading 2">H2</button>
                    <button class="toolBtn" data-command="formatBlock" data-value="h3" title="Heading 3">H3</button>
                </div>
                
                <div class="formatGroup">
                    <button class="toolBtn" data-command="indent" title="Quote">
                        <i class="fa-solid fa-quote-right"></i>
                    </button>
                    <button class="toolBtn" id="codeBtn" title="Code Block">
                        <i class="fa-solid fa-code"></i>
                    </button>
                    <button class="toolBtn" id="imageBtn" title="Insert Image">
                        <i class="fa-solid fa-image"></i>
                    </button>
                </div>
            </div>
            
            <div class="pageNavigation">
                <button class="navBtn" id="prevPage" disabled>
                    <i class="fa-solid fa-chevron-left"></i>
                    Previous
                </button>
                <span class="pageInfo">Page <span id="currentPageNum">1</span> of ${totalPages}</span>
                <button class="navBtn" id="nextPage" ${totalPages === 1 ? 'disabled' : ''}>
                    Next
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="documentPages" id="documentPages">
                ${generatePages(totalPages)}
            </div>
        </div>
    `;
    
    // Initialize editor functionality and load content if editing existing task
    initializeEditor(title, priority, status, totalPages, existingTask);
}

// Function to generate A4 pages
function generatePages(totalPages) {
    let pagesHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        pagesHTML += `
            <div class="a4Page" id="page-${i}" ${i === 1 ? 'style="display: block;"' : 'style="display: none;"'}>
                <div class="pageHeader">
                    <span class="pageNumber">Page ${i}</span>
                </div>
                <div class="pageContent" contenteditable="true" data-page="${i}">
                    <p>Start writing your document here...</p>
                </div>
            </div>
        `;
    }
    return pagesHTML;
}

// Function to initialize editor functionality
function initializeEditor(title, priority, status, totalPages, existingTask) {
    let currentPage = 1;
    let currentTaskId = existingTask ? existingTask.id : null;
    
    // Load existing document content if editing an existing task
    if (existingTask && existingTask.id) {
        loadDocumentContent(existingTask.id);
    }
    
    // Function to load document content from server
    async function loadDocumentContent(taskId) {
        try {
            console.log('Loading document content for task:', taskId);
            const response = await fetch(`/api/tasks/${taskId}/document`);
            if (response.ok) {
                const data = await response.json();
                console.log('Loaded document content:', data.documentContent);
                
                // Populate pages with loaded content
                Object.keys(data.documentContent).forEach(pageKey => {
                    const pageNumber = pageKey.replace('page_', '');
                    const pageElement = document.querySelector(`.pageContent[data-page="${pageNumber}"]`);
                    if (pageElement) {
                        pageElement.innerHTML = data.documentContent[pageKey];
                    }
                });
            } else {
                console.log('No existing document content found');
            }
        } catch (error) {
            console.log('Error loading document content:', error);
        }
    }
    
    // Page navigation
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            document.getElementById(`page-${currentPage}`).style.display = 'none';
            currentPage--;
            document.getElementById(`page-${currentPage}`).style.display = 'block';
            document.getElementById('currentPageNum').textContent = currentPage;
            updateNavigationButtons();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages) {
            document.getElementById(`page-${currentPage}`).style.display = 'none';
            currentPage++;
            document.getElementById(`page-${currentPage}`).style.display = 'block';
            document.getElementById('currentPageNum').textContent = currentPage;
            updateNavigationButtons();
        }
    });
    
    function updateNavigationButtons() {
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    }
    
    // Toolbar functionality
    document.querySelectorAll('.toolBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            const value = btn.dataset.value;
            
            if (command) {
                document.execCommand(command, false, value);
            }
        });
    });
    
    // Custom code block functionality
    document.getElementById('codeBtn').addEventListener('click', () => {
        const selection = window.getSelection().toString();
        if (selection) {
            document.execCommand('insertHTML', false, `<code style="background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace;">${selection}</code>`);
        }
    });
    
    // Image insertion
    document.getElementById('imageBtn').addEventListener('click', () => {
        // Create a hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageUrl = e.target.result;
                    document.execCommand('insertHTML', false, `<img src="${imageUrl}" style="max-width: 100%; height: auto; margin: 10px 0;" alt="Uploaded image">`);
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Trigger file selection
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    });
    
    // Save functionality
    document.querySelector('.saveDoc').addEventListener('click', async () => {
        console.log('Save button clicked');
        const documentContent = getDocumentContent();
        console.log('Document content:', documentContent);
        
        const taskInfo = {
            title,
            priority,
            status,
            totalPages,
            currentPage: 0,
            documentContent,
            progress: 0
        };
        
        console.log('Task info to save:', taskInfo);
        
        if (currentTaskId) {
            // Update existing task
            console.log('Updating existing task with ID:', currentTaskId);
            const result = await updateTaskInJSON(currentTaskId, taskInfo);
            console.log('Update result:', result);
        } else {
            // Create new task
            console.log('Creating new task');
            const savedTask = await saveTaskToJSON(taskInfo);
            console.log('Saved task:', savedTask);
            if (savedTask) {
                currentTaskId = savedTask.id;
            }
        }
        
        // Show save confirmation
        const saveBtn = document.querySelector('.saveDoc');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
        saveBtn.style.backgroundColor = '#4caf50';
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.backgroundColor = '';
        }, 2000);
    });
    
    // Finish and return functionality
    document.querySelector('.finishDoc').addEventListener('click', async () => {
        // Save the document before finishing
        const documentContent = getDocumentContent();
        const taskInfo = {
            title,
            priority,
            status: 'Completed',
            totalPages,
            currentPage: totalPages,
            documentContent,
            progress: 100
        };
        
        if (currentTaskId) {
            await updateTaskInJSON(currentTaskId, taskInfo);
        } else {
            const savedTask = await saveTaskToJSON(taskInfo);
            if (savedTask) {
                currentTaskId = savedTask.id;
            }
        }
        
        // Create the task card and return to dashboard
        setDefaultContent();
        await loadExistingTasks(); // Reload all tasks to show updated data
    });
}

// Task data storage and API functions
let taskData = {
    tasks: []
};

// Function to load existing tasks from JSON file
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
            const tasks = await response.json();
            taskData.tasks = tasks;
        } else {
            throw new Error('Failed to fetch from server');
        }
    } catch (error) {
        console.log('Server not available, checking localStorage...');
        // Fallback to localStorage
        const storedData = localStorage.getItem('mrmanager_tasks');
        if (storedData) {
            taskData = JSON.parse(storedData);
        }
    }
}

// Function to save task data using POST method
async function saveTaskToJSON(taskInfo) {
    try {
        // Add timestamp and unique ID
        const newTask = {
            id: Date.now().toString(),
            ...taskInfo,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask)
        });
        
        if (response.ok) {
            console.log('Task saved successfully to server');
            const savedTask = await response.json();
            taskData.tasks.push(savedTask);
            return savedTask;
        } else {
            throw new Error('Failed to save task to server');
        }
    } catch (error) {
        console.error('Error saving task to server:', error);
        console.log('Falling back to localStorage...');
        
        // Fallback: save to localStorage
        const newTask = {
            id: Date.now().toString(),
            ...taskInfo,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        taskData.tasks.push(newTask);
        localStorage.setItem('mrmanager_tasks', JSON.stringify(taskData));
        console.log('Task saved to localStorage');
        return newTask;
    }
}

// Function to update existing task
async function updateTaskInJSON(taskId, updatedData) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...updatedData,
                lastModified: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            console.log('Task updated successfully');
            return await response.json();
        } else {
            throw new Error('Failed to update task');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        // Fallback: update in localStorage
        const taskIndex = taskData.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            taskData.tasks[taskIndex] = { ...taskData.tasks[taskIndex], ...updatedData, lastModified: new Date().toISOString() };
            localStorage.setItem('mrmanager_tasks', JSON.stringify(taskData));
        }
        return null;
    }
}

// Function to get document content from all pages
function getDocumentContent() {
    const pages = document.querySelectorAll('.pageContent');
    console.log('Found pages:', pages.length);
    const documentContent = {};
    
    pages.forEach((page, index) => {
        const content = page.innerHTML;
        console.log(`Page ${index + 1} content:`, content);
        documentContent[`page_${index + 1}`] = content;
    });
    
    console.log('Final document content:', documentContent);
    return documentContent;
}

// Initialize data loading
loadTasks();

// Event delegation for dynamically created buttons and form handling
document.addEventListener('click', (e) => {
    if (e.target.closest('.createTask')) {
        handleCreateTaskClick();
    } else if (e.target.closest('.closeForm') || e.target.closest('.cancelTask')) {
        hideTaskForm();
    } else if (e.target.closest('.continueTask')) {
        const button = e.target.closest('.continueTask');
        handleContinueTaskClick(button);
    } else if (e.target.closest('.editTask')) {
        const button = e.target.closest('.editTask');
        handleEditTaskClick(button);
    } else if (e.target.closest('.deleteTask')) {
        const button = e.target.closest('.deleteTask');
        handleDeleteTaskClick(button);
    }
});

// Handle form submission
document.addEventListener('submit', (e) => {
    if (e.target.id === 'newTaskForm') {
        handleTaskFormSubmit(e);
    }
});

sideLinks.forEach(link => {
    link.addEventListener('click', () => {
        sideLinks.forEach(item => item.classList.remove('active'));
        link.classList.add('active');
        
        const linkText = link.innerText.trim().toLowerCase();
        const showCreateTaskButton = linkText === 'dashboard' || linkText === 'tasks';
        const showCreateProjectButton = linkText === 'projects';
        
        // Handle different navigation sections
        if (linkText === 'dashboard') {
            // Load the full dashboard with tasks
            setDefaultContent();
            loadExistingTasks();
        } else if (linkText === 'tasks') {
            // Load tasks page with list/card toggle functionality
            setTasksContent();
            loadTasksWithToggle();
        } else {
            // For other sections (Projects, Settings), just show the header
            managerContent.innerHTML = `
            <div class="managerPanelHead">
                <div class="routePath">
                    ${link.querySelector('i').outerHTML}
                    <h2>${link.innerText}</h2>
                </div>
                <div class="searchManager">
                    <input type="text" placeholder="Search...">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </div>
                ${showCreateTaskButton ? `
                <button class="createTask">
                    <i class="fa-solid fa-plus"></i>
                    <span>Create Task</span>
                </button>
                ` : ''}
                ${showCreateProjectButton ? `
                <button class="createProject">
                    <i class="fa-solid fa-plus"></i>
                    <span>Create Project</span>
                </button>
                ` : ''}
            </div>
            <div class="managerDisplayer">
                <div style="text-align: center; padding: 40px; color: var(--secondary);">
                    <h3>${link.innerText} section coming soon...</h3>
                </div>
            </div>
            `;
        }
    });
});

// Function to handle continue task button clicks
function handleContinueTaskClick(button) {
    const title = button.dataset.title;
    const priority = button.dataset.priority;
    const status = button.dataset.status;
    const totalPages = parseInt(button.dataset.totalPages);
    const currentPage = parseInt(button.dataset.currentPage) || 0;
    const taskId = button.dataset.taskId;
    
    // Find the existing task data
    const existingTask = taskData.tasks.find(task => task.id === taskId);
    
    // Open the text editor with existing task data
    showTextEditor(title, priority, status, totalPages, existingTask);
}

// Function to handle edit task button clicks
function handleEditTaskClick(button) {
    const taskId = button.dataset.taskId;
    const existingTask = taskData.tasks.find(task => task.id === taskId);
    
    if (existingTask) {
        // Open the text editor with existing task data
        showTextEditor(
            existingTask.title, 
            existingTask.priority, 
            existingTask.status, 
            existingTask.totalPages, 
            existingTask
        );
    }
}

// Function to handle delete task button clicks
async function handleDeleteTaskClick(button) {
    const taskId = button.dataset.taskId;
    const taskElement = button.closest('.taskCard');
    
    // Show confirmation dialog
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        try {
            // Try to delete from server
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log('Task deleted successfully from server');
                // Remove from local data
                taskData.tasks = taskData.tasks.filter(task => task.id !== taskId);
                // Remove from DOM
                taskElement.remove();
            } else {
                throw new Error('Failed to delete task from server');
            }
        } catch (error) {
            console.error('Error deleting task from server:', error);
            console.log('Falling back to localStorage...');
            
            // Fallback: delete from localStorage
            taskData.tasks = taskData.tasks.filter(task => task.id !== taskId);
            localStorage.setItem('mrmanager_tasks', JSON.stringify(taskData));
            // Remove from DOM
            taskElement.remove();
            console.log('Task deleted from localStorage');
        }
    }
}