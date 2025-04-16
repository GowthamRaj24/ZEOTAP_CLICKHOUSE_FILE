# Bidirectional ClickHouse File Connector

A full-stack application that allows for bidirectional data transfer between ClickHouse databases and flat files (CSV/TSV).

## Features

- **ClickHouse to File**: Export data from ClickHouse tables to CSV/TSV files
- **File to ClickHouse**: Import data from CSV/TSV files to ClickHouse tables
- **Table/Column Selection**: Select specific tables and columns for import/export
- **Data Preview**: Preview data before importing or exporting
- **Progress Tracking**: Real-time progress tracking for long-running operations
- **JWT Authentication**: Secure connection to ClickHouse with JWT token-based authentication
- **Responsive UI**: Mobile-friendly design for use on different devices

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
- JWT for secure authentication
- Stream processing for handling large files

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
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
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

Configure the API URL in `/frontend/src/config/appConfig.js`:
```javascript
// Set deployment to false for local development
export const deployment = false;

// API URLs based on environment
export const apiUrls = {
  development: 'http://localhost:5000/api',
  production: 'https://your-production-api-url.com/api'
};
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

### Authentication
1. Navigate to the Connect page
2. Enter your ClickHouse connection details:
   - Host (without https://)
   - Port (usually 8443 for ClickHouse Cloud)
   - Database name (default if not specified)
   - Username and password
3. Click "Connect to ClickHouse"
4. Upon successful connection, a JWT token is generated and stored in the browser

### ClickHouse to File Export
1. Navigate to the "ClickHouse → File" page
2. Select the table and columns to export
3. Click "Preview Data" to see what will be exported
4. Click "Start Export" to begin the export process
5. Once completed, click "Download CSV" to save the file

### File to ClickHouse Import
1. Navigate to the "File → ClickHouse" page
2. Select a CSV or TSV file (up to 100MB recommended)
3. Enter a target table name (a new table will be created if it doesn't exist)
4. Click "Preview Data" to verify the content
5. Click "Import CSV to ClickHouse" to start the import
6. View the results or any error messages in the "Import Status" section

## Advanced Error Handling

The application features robust error handling, particularly for file imports:

### File to ClickHouse Import

- **Validation Checks**: Performs extensive validation on file format, table names, and data types
- **Detailed Error Messages**: Provides specific error messages with underlying technical details
- **Error Solutions**: Suggests solutions for common issues like field length limits
- **Immediate Error Stoppage**: Stops processing immediately when errors occur instead of continuing with partial imports
- **Error Recovery Information**: Shows how many records were processed before an error occurred
- **Common Error Handling**:
  - Field value too long: Identifies when text exceeds ClickHouse's 65,535 character limit
  - Column mismatches: Detects when CSV headers don't match table structure
  - Data parsing errors: Alerts when data can't be converted to expected types
  - Memory limitations: Warns when the import exceeds available resources

Example error feedback:
```
Import failed: Some fields in your CSV file exceed ClickHouse's string length limits.

Processed 3000 rows before the error occurred.

Suggested solution: Try preprocessing your data to truncate very long values. 
ClickHouse has a limit of approximately 65,535 characters per string field.
```

## Performance Optimizations

- **Streaming Data Processing**: Files are processed as streams to handle large datasets efficiently
- **Batched Inserts**: Data is inserted in batches of 1,000 rows for optimal performance
- **Memory Management**: Careful memory usage to prevent out-of-memory errors
- **ClickHouse Session Settings**: Optimized settings for better insert performance
- **Automatic Header Sanitization**: Column names are sanitized to ensure compatibility

## Security Features

- **JWT Authentication**: Secure token-based authentication for ClickHouse connections
- **Input Validation**: Thorough validation of all inputs to prevent injection attacks
- **File Cleanup**: Automatic removal of temporary files after processing
- **Escaped Values**: Proper escaping of values to prevent SQL injection
- **Authorization Middleware**: Protected routes that require authentication

## Project Structure

```
bidirectional-clickhouse/
├── backend/
│   ├── config/         # Configuration files and DB setup
│   ├── controllers/    # Request handlers for different operations
│   ├── middleware/     # Authentication and request processing middleware
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic for data processing
│   ├── uploads/        # Temporary storage for files
│   └── utils/          # Utility functions (JWT, error handling)
├── frontend/
│   ├── public/         # Static assets
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── config/     # Frontend configuration
│       ├── pages/      # Page components (FileToClickHouse, ClickHouseToFile)
│       └── services/   # API service functions
└── README.md           # Project documentation
```

## Deployment

The application is currently deployed at:
- Frontend: https://zeotap-clickhouse-file.onrender.com
- Backend API: https://zeotap-clickhouse-file.onrender.com/api

### Deployment Configuration

For production deployment, update the following:

1. In `/frontend/src/config/appConfig.js`:
   ```javascript
   export const deployment = true;
   ```

2. Ensure environment variables are properly set in your hosting environment

## Troubleshooting

### Common Issues

1. **Connection Failed**: Ensure your ClickHouse credentials are correct and the server is accessible.
2. **Import Errors**: Check the error details and suggested solutions. Common issues include:
   - Very long text fields exceeding ClickHouse limits
   - Mismatched column names between CSV headers and ClickHouse tables
   - Data that can't be parsed into the expected types
3. **Memory Issues**: Try with smaller files or reduce batch size for very large imports

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
