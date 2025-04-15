# Bidirectional ClickHouse File Connector

A full-stack application that allows for bidirectional data transfer between ClickHouse databases and flat files (CSV/TSV).

## Features

- **ClickHouse to File**: Export data from ClickHouse tables to CSV/TSV files
- **File to ClickHouse**: Import data from CSV/TSV files to ClickHouse tables
- **Table/Column Selection**: Select specific tables and columns for import/export
- **Data Preview**: Preview data before importing or exporting
- **Progress Tracking**: Real-time progress tracking for long-running operations

## Technology Stack

### Frontend
- React.js with Vite
- TailwindCSS for styling
- React Router for navigation
- Axios for API requests
- React Toastify for notifications

### Backend
- Node.js with Express
- ClickHouse client for database interactions
- Multer for file uploads
- CSV Parser/Writer for file processing

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Access to a ClickHouse database (local or remote)

## Installation

### Clone the repository
```bash
git clone <repository-url>
cd bidirectional-clickhouse
```

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following variables:
```
PORT=3001
NODE_ENV=development
CLICKHOUSE_HOST=your_clickhouse_host
CLICKHOUSE_PORT=your_clickhouse_port
CLICKHOUSE_DB=your_clickhouse_db
CLICKHOUSE_USER=your_clickhouse_user
CLICKHOUSE_PASSWORD=your_clickhouse_password
```

### Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env.development` file in the frontend directory:
```
VITE_API_URL=http://localhost:3001
```

## Running the Application

### Start the Backend
```bash
cd backend
npm run dev  # For development with hot reload
# or
npm start    # For production
```

### Start the Frontend
```bash
cd frontend
npm run dev  # For development
# or
npm run build # For production build
npm run preview # To preview production build
```

## Usage

1. **ClickHouse to File Export**:
   - Connect to your ClickHouse database
   - Select the table and columns to export
   - Choose the export format (CSV/TSV)
   - Start the export process
   - Download the exported file when ready

2. **File to ClickHouse Import**:
   - Connect to your ClickHouse database
   - Upload a CSV/TSV file
   - Map columns from the file to ClickHouse table columns
   - Preview data to ensure mapping is correct
   - Start the import process

## Project Structure

```
bidirectional-clickhouse/
├── backend/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── uploads/        # Uploaded files storage
│   └── utils/          # Utility functions
├── frontend/
│   ├── public/         # Static assets
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── pages/      # Page components
│       └── services/   # API service functions
└── README.md           # Project documentation
```

## Deployment

### Backend Deployment
The backend can be deployed to any Node.js hosting service like Heroku, Render, or AWS.

```bash
cd backend
npm run build
```

### Frontend Deployment
The frontend can be deployed to static hosting services like Netlify, Vercel, or GitHub Pages.

```bash
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
