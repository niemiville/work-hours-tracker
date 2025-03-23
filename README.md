# Work Hours Tracker

A full-stack application for tracking work hours with PostgreSQL database, Node.js backend, and React frontend.

## Docker Setup

This application is fully containerized and can be run using Docker and Docker Compose.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running the Application

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd work-hours-tracker
   ```

2. Start the application:
   ```bash
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3001/api

### Services

The application consists of three main services:

1. **Database (PostgreSQL)**
   - Persists data in a named volume
   - Automatically runs initialization scripts to create tables
   - Accessible on port 5432 (if needed for direct access)

2. **Backend (Node.js)**
   - RESTful API built with Express
   - JWT authentication
   - Connected to the database service
   - Exposed on port 3001

3. **Frontend (React)**
   - Single page application built with React
   - Served by Nginx
   - Exposed on port 80

### Environment Variables

The following environment variables can be modified in the docker-compose.yml file:

#### Database
- `POSTGRES_USER`: Database username (default: user)
- `POSTGRES_PASSWORD`: Database password (default: password)
- `POSTGRES_DB`: Database name (default: workhours)

#### Backend
- `DB_HOST`: Database host (default: db)
- `DB_USER`: Database username (default: user)
- `DB_PASSWORD`: Database password (default: password)
- `DB_NAME`: Database name (default: workhours)
- `DB_PORT`: Database port (default: 5432)
- `PORT`: Backend port (default: 3001)

#### Frontend
- `VITE_API_URL`: Backend API URL (default: http://localhost:3001/api)

### Development

For local development without Docker:

1. **Database**: Set up a PostgreSQL database and run the scripts in `database/tables.sql`.
2. **Backend**: Navigate to the `backend` directory, install dependencies with `npm install`, and start with `npm run dev`.
3. **Frontend**: Navigate to the `frontend` directory, install dependencies with `npm install`, and start with `npm run dev`.

### Data Persistence

The PostgreSQL database data is stored in a Docker volume named `pgdata`, ensuring that your data persists across container restarts.
