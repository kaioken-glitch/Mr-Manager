# MrManager - Task Management System

A comprehensive task management system with a built-in document editor and persistent storage.

## Features

- 📝 Rich text document editor with A4 page layout
- 📊 Task progress tracking by pages
- 🎨 Priority-based color coding (High/Medium/Low)
- 💾 Persistent storage with JSON file and API
- 🖼️ Image upload support
- 📱 Responsive design

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### 3. Access the Application
Open your browser and go to:
```
http://localhost:3000
```

## API Endpoints

The server provides the following REST API endpoints:

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update existing task
- `DELETE /api/tasks/:id` - Delete task

### Projects (Future use)
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project

## Data Storage

Tasks are stored in `mrmanager.json` with the following structure:

```json
{
  "tasks": [
    {
      "id": "1234567890",
      "title": "Task Title",
      "priority": "high|medium|low",
      "status": "Not Started|In Progress|Pending|Completed",
      "totalPages": 5,
      "currentPage": 2,
      "progress": 40,
      "documentContent": {
        "page_1": "<p>Page 1 content...</p>",
        "page_2": "<p>Page 2 content...</p>"
      },
      "createdAt": "2025-06-30T12:00:00.000Z",
      "lastModified": "2025-06-30T12:30:00.000Z"
    }
  ],
  "projects": [],
  "lastUpdated": "2025-06-30T12:30:00.000Z",
  "version": "1.0.0"
}
```

## Fallback Storage

If the server is not running, the application automatically falls back to localStorage for data persistence.

## Usage

1. **Create Task**: Click "Create Task" → Fill form → Start writing
2. **Edit Document**: Use the rich text editor with formatting tools
3. **Save Progress**: Click "Save" to store your work
4. **Navigate Pages**: Use Previous/Next buttons for multi-page documents
5. **Complete Task**: Click "Finish & Return" when done

## File Structure

```
MrManager/
├── index.html          # Main application page
├── index.css           # Styles
├── app.js             # Frontend JavaScript
├── server.js          # Node.js API server
├── package.json       # Dependencies
├── mrmanager.json     # Data storage
└── README.md          # This file
```

## Development

To modify the application:

1. Frontend changes: Edit `index.html`, `index.css`, or `app.js`
2. Backend changes: Edit `server.js`
3. The server serves static files, so changes are reflected immediately

## Troubleshooting

### Server won't start
- Make sure Node.js is installed
- Run `npm install` to install dependencies
- Check if port 3000 is available

### Tasks not saving
- Check browser console for errors
- Verify server is running on http://localhost:3000
- Fallback to localStorage if server issues persist

### Images not loading
- Ensure image files are accessible
- Check file size (images are base64 encoded)
- Verify image format is supported (jpg, png, gif, etc.)
