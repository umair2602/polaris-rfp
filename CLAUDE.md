# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive RFP (Request for Proposal) proposal generation system for Eighth Generation Consulting. The system helps quickly create high-quality, winning proposals by leveraging template structures, content libraries, and intelligent customization based on RFP requirements.

## Development Commands

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
```bash
# Run with Docker Compose
docker-compose up -d postgres mongodb

# Or run migrations manually
cd backend
alembic upgrade head
```

### Docker Development
```bash
# Start all services
docker-compose up

# Rebuild services
docker-compose up --build

# Run specific service
docker-compose up backend
```

### Testing
```bash
# Backend tests
cd backend && pytest

# Frontend tests  
cd frontend && npm test

# Linting
cd backend && flake8 .
cd frontend && npm run lint
```

## Architecture

### Backend (Python FastAPI)
- **FastAPI** web framework with automatic API documentation
- **PostgreSQL** for structured data (RFPs, proposals, templates)
- **MongoDB** for document storage and unstructured content
- **SQLAlchemy** ORM with Alembic for database migrations
- **OpenAI API** integration for AI-powered content analysis
- **ReportLab** for professional PDF generation

### Frontend (Next.js React)
- **Next.js 14** with TypeScript for type safety
- **Tailwind CSS** for responsive styling
- **Axios** for API communication
- **React Hook Form** for form management
- **Headless UI** for accessible components

### Key Services
- **RFPAnalyzer**: Parses PDF documents and extracts requirements using PyPDF2/pdfplumber
- **TemplateManager**: Manages proposal templates for different project types
- **ContentLibrary**: Stores reusable company assets and team profiles
- **ProposalGenerator**: Assembles customized proposals using AI assistance
- **PDFGenerator**: Creates professional PDF output with proper formatting

### Database Models
- **RFP**: Stores parsed RFP documents with extracted requirements
- **Proposal**: Generated proposals with sections and customizations
- **ProposalTemplate**: Template definitions for different project types
- **CompanyProfile/TeamMember/ProjectReference**: Content library components

### API Structure
- `/api/rfp/*` - RFP upload, analysis, and management
- `/api/proposals/*` - Proposal generation, editing, and export
- `/api/templates/*` - Template management and customization
- `/api/content/*` - Content library access
- `/api/auth/*` - JWT authentication

### Template Types
- **Software Development**: Based on SFA 006 requirements with technical methodology
- **Strategic Communications**: Based on SFA 005 with stakeholder engagement focus
- **Financial Modeling**: Analytical approach with economic impact modeling

## Environment Configuration

### Backend Environment (.env)
```
DATABASE_URL=postgresql://username:password@localhost/rfp_system
MONGODB_URL=mongodb://localhost:27017/rfp_system
SECRET_KEY=your-super-secret-key
OPENAI_API_KEY=your-openai-api-key
```

### Frontend Environment
```
API_BASE_URL=https://cvsmuhhazj.us-east-1.awsapprunner.com
```

## Authentication

- JWT-based authentication with configurable expiration
- Default admin user: `admin` / `admin123` (change in production)
- Protected routes require valid JWT token
- Token stored in localStorage for persistence

## File Upload Handling

- RFP PDFs uploaded to `backend/uploads/rfps/`
- Temporary files cleaned up after processing
- Support for PDF text extraction with fallback parsing
- File size limits and type validation

## AI Integration

- OpenAI API for content analysis and generation
- Graceful degradation when API unavailable
- Content refinement and requirement extraction
- Template customization suggestions

## Key Features

1. **RFP Analysis**: Automatic PDF parsing and requirement extraction
2. **Template System**: Multiple project-specific templates 
3. **Content Library**: Reusable company information and team profiles
4. **Proposal Generation**: AI-assisted content creation
5. **PDF Export**: Professional formatting with company branding
6. **Collaboration**: Multi-user editing and approval workflows

## Development Notes

- Use absolute imports for components: `@/components/*`
- Follow TypeScript strict mode requirements
- Maintain responsive design principles
- Handle loading states and error conditions
- Implement proper form validation
- Use React Hook Form for complex forms
- Maintain consistent API error handling