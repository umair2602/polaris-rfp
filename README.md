# RFP Proposal Generation System

A comprehensive system for Eighth Generation Consulting to quickly create high-quality, winning proposals by leveraging template structures, content libraries, and intelligent customization.

## Architecture

- **Backend**: FastAPI (Python) with PostgreSQL/MongoDB
- **Frontend**: Next.js with React
- **AI**: OpenAI API integration
- **Export**: PDF generation with ReportLab

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Development Commands

- **Backend tests**: `cd backend && pytest`
- **Frontend tests**: `cd frontend && npm test`
- **Lint backend**: `cd backend && flake8 .`
- **Lint frontend**: `cd frontend && npm run lint`
- **Type check**: `cd backend && mypy .`

## Project Structure

```
backend/           # FastAPI backend
├── app/
│   ├── models/    # Data models
│   ├── services/  # Business logic
│   ├── api/       # API endpoints
│   └── core/      # Configuration
frontend/          # Next.js frontend
├── components/    # React components
├── pages/         # Next.js pages
└── lib/          # Utilities
docs/             # Documentation
```