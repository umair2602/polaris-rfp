# Code Refactoring - Visual Overview

## Before Refactoring

```
┌─────────────────────────────────────┐
│   aiProposalGenerator.js            │
│   --------------------------------   │
│   • fetchCompanyInfo()              │
│   • fetchTeamMembers()              │
│   • fetchProjectReferences()        │
│   • formatTitleSection()            │
│   • formatCoverLetterSection()      │
│   • formatTeamMembersSection()      │
│   • formatReferencesSection()       │
│   • formatExperienceSection()       │
│   • shouldUseContentLibrary()       │
│   • generateAIProposalSections()    │
│   • formatAISections()              │
│   • validateAISections()            │
│   • cleanContent()                  │
│   • ... (15 functions total)        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ aiTemplateProposalGenerator.js      │
│   --------------------------------   │
│   • fetchCompanyInfo()        ❌    │
│   • fetchTeamMembers()        ❌    │
│   • fetchProjectReferences()  ❌    │
│   • formatTitleSection()      ❌    │
│   • formatCoverLetterSection()❌    │
│   • formatTeamMembersSection()❌    │
│   • formatReferencesSection() ❌    │
│   • formatExperienceSection() ❌    │
│   • shouldUseContentLibrary() ❌    │
│   • selectRelevantTeamMembers()     │
│   • selectRelevantReferences()      │
│   • generateAIProposalFromTemplate()│
│   • ... (14 functions total)        │
└─────────────────────────────────────┘

❌ = Duplicated Code (~700 lines)
```

## After Refactoring

```
┌─────────────────────────────────────┐
│  sharedSectionFormatters.js (NEW)   │
│  --------------------------------    │
│  ✅ fetchCompanyInfo()               │
│  ✅ fetchTeamMembers()               │
│  ✅ fetchProjectReferences()         │
│  ✅ formatTitleSection()             │
│  ✅ formatCoverLetterSection()       │
│  ✅ formatTeamMembersSection()       │
│  ✅ formatReferencesSection()        │
│  ✅ formatExperienceSection()        │
│  ✅ shouldUseContentLibrary()        │
└─────────────────────────────────────┘
                ▲            ▲
                │            │
                │            │
    ┌───────────┘            └───────────┐
    │                                    │
┌───┴────────────────────┐    ┌──────────┴────────────────┐
│ aiProposalGenerator.js │    │ aiTemplateProposalGenerator│
│ ---------------------  │    │ -------------------------- │
│ (imports from shared)  │    │ (imports from shared)      │
│                        │    │                            │
│ • generateAI...()      │    │ • generateAI...()          │
│ • formatAISections()   │    │ • selectRelevant...()      │
│ • validateAISections() │    │ • fallbackTeam...()        │
│ • cleanContent()       │    │ • fallbackReference...()   │
│ • ... (8 functions)    │    │ • ... (5 functions)        │
└────────────────────────┘    └────────────────────────────┘

✅ = Shared Code (Single Source of Truth)
```

## Function Distribution

### Shared Module (sharedSectionFormatters.js)
**Purpose:** Content library data access and section formatting

| Function | Responsibility |
|----------|----------------|
| `fetchCompanyInfo()` | Retrieve company from database |
| `fetchTeamMembers()` | Retrieve team members from database |
| `fetchProjectReferences()` | Retrieve references from database |
| `formatTitleSection()` | Format title page with contact info |
| `formatCoverLetterSection()` | Generate cover letter |
| `formatTeamMembersSection()` | Format team member listings |
| `formatReferencesSection()` | Format project references |
| `formatExperienceSection()` | Format company experience/qualifications |
| `shouldUseContentLibrary()` | Determine section data source |

### AI Proposal Generator (aiProposalGenerator.js)
**Purpose:** RFP-driven AI proposal generation

| Function | Responsibility |
|----------|----------------|
| `generateAIProposalSections()` | Main AI generation orchestrator |
| `formatAISections()` | Format AI output for database |
| `validateAISections()` | Validate AI-generated content |
| `cleanContent()` | Clean and sanitize content |
| `cleanKeyPersonnelContent()` | Clean personnel section |
| `extractSectionsFromMarkdown()` | Parse markdown to sections |
| `extractTitleContactInfo()` | Extract contact data |
| `cleanGeneratedContent()` | Remove AI artifacts |

### Template Proposal Generator (aiTemplateProposalGenerator.js)
**Purpose:** Template-based AI proposal generation with smart selection

| Function | Responsibility |
|----------|----------------|
| `generateAIProposalFromTemplate()` | Main template generation orchestrator |
| `selectRelevantTeamMembers()` | AI-powered team selection |
| `selectRelevantReferences()` | AI-powered reference selection |
| `fallbackTeamSelection()` | Keyword-based team selection |
| `fallbackReferenceSelection()` | Keyword-based reference selection |

## Import Relationships

```
┌──────────────────────┐
│  proposals.js        │
│  (routes)            │
└──────────────────────┘
        ↓
    ┌───────────────────────────────┐
    │ Imports from:                 │
    │ • aiProposalGenerator.js      │
    │ • aiTemplateProposalGenerator │
    │ • sharedSectionFormatters ✨  │
    └───────────────────────────────┘

┌──────────────────────────┐
│ aiProposalGenerator.js   │
└──────────────────────────┘
        ↓
    Imports from:
    • sharedSectionFormatters ✨

┌─────────────────────────────────┐
│ aiTemplateProposalGenerator.js  │
└─────────────────────────────────┘
        ↓
    Imports from:
    • sharedSectionFormatters ✨
    • aiProposalGenerator.js

✨ = New import relationship
```

## Benefits Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Total Lines** | ~2,000 | ~1,300 | -35% |
| **Duplicated Functions** | 9 | 0 | -100% |
| **Duplicated Lines** | ~700 | 0 | -100% |
| **Module Coupling** | High | Low | Better |
| **Maintainability** | Medium | High | Better |
| **Testability** | Medium | High | Better |

## Key Improvements

1. **Single Source of Truth** - All section formatting logic in one place
2. **DRY Principle** - Don't Repeat Yourself - eliminated all duplication
3. **Separation of Concerns** - Each module has clear, distinct responsibility
4. **Easier Testing** - Shared functions can be tested independently
5. **Better Maintainability** - Changes only need to be made once
6. **Reduced Bugs** - No risk of divergent implementations
7. **Clearer Architecture** - Logical grouping of related functionality
