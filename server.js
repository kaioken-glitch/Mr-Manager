const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const JSON_FILE_PATH = './mrmanager.json';
const DOCUMENTS_DIR = './documents';

// Ensure documents directory exists
async function ensureDocumentsDir() {
    try {
        await fs.access(DOCUMENTS_DIR);
    } catch (error) {
        await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
        console.log('📁 Created documents directory');
    }
}

// Helper function to get document file path
function getDocumentPath(taskId) {
    return path.join(DOCUMENTS_DIR, `task_${taskId}.html`);
}

// Helper function to save document content to file
async function saveDocumentFile(taskId, content) {
    try {
        const filePath = getDocumentPath(taskId);
        await fs.writeFile(filePath, content, 'utf8');
        return filePath;
    } catch (error) {
        console.error('Error saving document file:', error);
        return null;
    }
}

// Helper function to load document content from file
async function loadDocumentFile(taskId) {
    try {
        const filePath = getDocumentPath(taskId);
        const content = await fs.readFile(filePath, 'utf8');
        return content;
    } catch (error) {
        console.error('Error loading document file:', error);
        return null;
    }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for images
app.use(express.static('.')); // Serve static files from current directory

// Helper function to read JSON file
async function readJSONFile() {
    try {
        const data = await fs.readFile(JSON_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return default structure
        return {
            tasks: [],
            projects: [],
            lastUpdated: new Date().toISOString(),
            version: "1.0.0"
        };
    }
}

// Helper function to write JSON file
async function writeJSONFile(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        await fs.writeFile(JSON_FILE_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing to JSON file:', error);
        return false;
    }
}

// API Routes

// GET all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const data = await readJSONFile();
        res.json(data.tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// GET single task by ID
app.get('/api/tasks/:id', async (req, res) => {
    try {
        const data = await readJSONFile();
        const task = data.tasks.find(t => t.id === req.params.id);
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// POST create new task
app.post('/api/tasks', async (req, res) => {
    try {
        await ensureDocumentsDir();
        const data = await readJSONFile();
        
        const { documentContent, ...taskData } = req.body;
        
        const newTask = {
            id: Date.now().toString(),
            ...taskData,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Save document content to separate file if provided
        if (documentContent) {
            const documentPath = await saveDocumentFile(newTask.id, JSON.stringify(documentContent));
            if (documentPath) {
                newTask.documentPath = documentPath;
            }
        }
        
        data.tasks.push(newTask);
        
        const success = await writeJSONFile(data);
        if (success) {
            res.status(201).json(newTask);
        } else {
            res.status(500).json({ error: 'Failed to save task' });
        }
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT update existing task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        await ensureDocumentsDir();
        const data = await readJSONFile();
        const taskIndex = data.tasks.findIndex(t => t.id === req.params.id);
        
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const { documentContent, ...taskData } = req.body;
        
        // Update task while preserving ID and created date
        data.tasks[taskIndex] = {
            ...data.tasks[taskIndex],
            ...taskData,
            id: req.params.id, // Ensure ID doesn't change
            lastModified: new Date().toISOString()
        };
        
        // Save document content to separate file if provided
        if (documentContent) {
            const documentPath = await saveDocumentFile(req.params.id, JSON.stringify(documentContent));
            if (documentPath) {
                data.tasks[taskIndex].documentPath = documentPath;
            }
        }
        
        const success = await writeJSONFile(data);
        if (success) {
            res.json(data.tasks[taskIndex]);
        } else {
            res.status(500).json({ error: 'Failed to update task' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// GET document content for a specific task
app.get('/api/tasks/:id/document', async (req, res) => {
    try {
        const documentContent = await loadDocumentFile(req.params.id);
        if (documentContent) {
            res.json({ documentContent: JSON.parse(documentContent) });
        } else {
            res.status(404).json({ error: 'Document not found' });
        }
    } catch (error) {
        console.error('Error loading document:', error);
        res.status(500).json({ error: 'Failed to load document' });
    }
});

// DELETE task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const data = await readJSONFile();
        const taskIndex = data.tasks.findIndex(t => t.id === req.params.id);
        
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const deletedTask = data.tasks.splice(taskIndex, 1)[0];
        
        // Delete associated document file
        try {
            const documentPath = getDocumentPath(req.params.id);
            await fs.unlink(documentPath);
            console.log(`Deleted document file: ${documentPath}`);
        } catch (error) {
            console.log('No document file to delete or error deleting:', error.message);
        }
        
        const success = await writeJSONFile(data);
        if (success) {
            res.json({ message: 'Task deleted successfully', task: deletedTask });
        } else {
            res.status(500).json({ error: 'Failed to delete task' });
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// GET all projects (for future use)
app.get('/api/projects', async (req, res) => {
    try {
        const data = await readJSONFile();
        res.json(data.projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// POST create new project (for future use)
app.post('/api/projects', async (req, res) => {
    try {
        const data = await readJSONFile();
        const newProject = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        data.projects.push(newProject);
        
        const success = await writeJSONFile(data);
        if (success) {
            res.status(201).json(newProject);
        } else {
            res.status(500).json({ error: 'Failed to save project' });
        }
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, async () => {
    await ensureDocumentsDir();
    console.log(`🚀 MrManager API Server running on http://localhost:${PORT}`);
    console.log(`📁 JSON file location: ${path.resolve(JSON_FILE_PATH)}`);
    console.log(`📄 Documents directory: ${path.resolve(DOCUMENTS_DIR)}`);
    console.log(`📊 Dashboard available at: http://localhost:${PORT}/index.html`);
});

module.exports = app;
