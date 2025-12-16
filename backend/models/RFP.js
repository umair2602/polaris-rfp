const mongoose = require('mongoose')

const rfpSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    submissionDeadline: {
      type: String,
      trim: true,
    },
    projectDeadline: {
      type: String,
      trim: true,
    },
    questionsDeadline: {
      type: String,
      trim: true,
    },
    bidMeetingDate: {
      type: String,
      trim: true,
    },

    bidRegistrationDate: {
      type: String,
      trim: true,
    },
    isDisqualified: {
      type: Boolean,
      default: false,
    },
    budgetRange: {
      type: String,
      trim: true,
    },
    projectType: {
      type: String,
      required: true,
      trim: true,
    },
    keyRequirements: [
      {
        type: String,
        trim: true,
      },
    ],
    evaluationCriteria: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    deliverables: [
      {
        type: String,
        trim: true,
      },
    ],
    timeline: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    timelineMilestones: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    dateWarnings: [
      {
        type: String,
        trim: true,
      },
    ],
    dateMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    projectScope: {
      type: String,
      trim: true,
    },
    contactInformation: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    additionalInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    criticalInformation: [
      {
        type: String,
        trim: true,
      },
    ],
    clarificationQuestions: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        fileName: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        fileType: {
          type: String, // 'pdf', 'doc', 'docx', 'txt', 'image', 'other'
          required: true,
        },
        filePath: {
          type: String, // S3 URL or local file path
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        description: {
          type: String,
          trim: true,
        },
        textContent: {
          type: String, // Extracted text content from PDF, DOC, TXT files
          trim: true,
        },
        textLength: {
          type: Number, // Length of extracted text
        },
      },
    ],
    rawText: {
      type: String,
    },
    parsedSections: {
      type: mongoose.Schema.Types.Mixed,
    },
    sectionTitles: [
      {
        type: String,
        trim: true,
      },
    ],

    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
)

// Simple method to check if any deadline has passed
rfpSchema.methods.checkDisqualification = function () {
  const now = new Date()
  // Only auto-disqualify on proposal submission deadline by default.
  // Other dates (questions, meeting, registration) are handled as warnings.
  const deadlines = [this.submissionDeadline]

  for (const deadline of deadlines) {
    if (!deadline || typeof deadline !== 'string') continue
    const d = this._parseUsDate(deadline)
    if (d && d < now) {
      this.isDisqualified = true
      return true
    }
  }

  // Heuristic: if RFP says a meeting/registration is mandatory and that date is past,
  // treat as disqualified (cannot bid). This relies on raw text presence.
  const raw = typeof this.rawText === 'string' ? this.rawText.toLowerCase() : ''
  const isMandatoryMeeting =
    raw.includes('mandatory') &&
    (raw.includes('pre-bid') ||
      raw.includes('prebid') ||
      raw.includes('pre-proposal') ||
      raw.includes('preproposal') ||
      raw.includes('site visit') ||
      raw.includes('bid conference') ||
      raw.includes('pre proposal conference'))
  const isMandatoryRegistration =
    raw.includes('mandatory') &&
    (raw.includes('registration') ||
      raw.includes('vendor registration') ||
      raw.includes('bid registration') ||
      raw.includes('register'))

  if (isMandatoryMeeting) {
    const meeting = this._parseUsDate(this.bidMeetingDate)
    if (meeting && meeting < now) {
      this.isDisqualified = true
      return true
    }
  }

  if (isMandatoryRegistration) {
    const reg = this._parseUsDate(this.bidRegistrationDate)
    if (reg && reg < now) {
      this.isDisqualified = true
      return true
    }
  }

  this.isDisqualified = false
  return false
}

// Parse MM/DD/YYYY safely. Returns Date or null.
rfpSchema.methods._parseUsDate = function (dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const s = dateStr.trim()
  if (!s || s.toLowerCase() === 'not available') return null
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const mm = parseInt(m[1], 10)
  const dd = parseInt(m[2], 10)
  const yyyy = parseInt(m[3], 10)
  if (!mm || !dd || !yyyy) return null
  const d = new Date(yyyy, mm - 1, dd)
  if (Number.isNaN(d.getTime())) return null
  // Validate round-trip
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd)
    return null
  return d
}

// Compute date sanity warnings + meta (does not persist automatically)
rfpSchema.methods.computeDateSanity = function () {
  const now = new Date()
  const raw = typeof this.rawText === 'string' ? this.rawText : ''
  const rawLower = raw.toLowerCase()

  // Find the predominant year used in the document text (simple heuristic)
  const yearCounts = {}
  const years = raw.match(/\b20\d{2}\b/g) || []
  years.forEach((y) => {
    yearCounts[y] = (yearCounts[y] || 0) + 1
  })
  let dominantYear = null
  for (const [y, c] of Object.entries(yearCounts)) {
    if (!dominantYear || c > yearCounts[dominantYear]) dominantYear = y
  }

  const fields = [
    { key: 'submissionDeadline', label: 'Submission deadline' },
    { key: 'questionsDeadline', label: 'Questions deadline' },
    { key: 'bidMeetingDate', label: 'Bid meeting date' },
    { key: 'bidRegistrationDate', label: 'Bid registration date' },
    { key: 'projectDeadline', label: 'Project deadline' },
  ]

  const warnings = []
  const meta = {
    dominantYear: dominantYear ? parseInt(dominantYear, 10) : null,
    dates: {},
    mandatory: {
      meeting: false,
      registration: false,
    },
  }

  meta.mandatory.meeting =
    rawLower.includes('mandatory') &&
    (rawLower.includes('pre-bid') ||
      rawLower.includes('prebid') ||
      rawLower.includes('pre-proposal') ||
      rawLower.includes('preproposal') ||
      rawLower.includes('site visit') ||
      rawLower.includes('bid conference') ||
      rawLower.includes('pre proposal conference'))
  meta.mandatory.registration =
    rawLower.includes('mandatory') &&
    (rawLower.includes('vendor registration') ||
      rawLower.includes('bid registration') ||
      (rawLower.includes('registration') && rawLower.includes('deadline')))

  const parsed = {}
  fields.forEach(({ key, label }) => {
    const value = this[key]
    const d = this._parseUsDate(value)
    parsed[key] = d
    meta.dates[key] = {
      value: typeof value === 'string' ? value : null,
      parsed: d ? d.toISOString() : null,
      daysUntil: d
        ? Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }

    if (
      value &&
      typeof value === 'string' &&
      value.trim() &&
      value.toLowerCase() !== 'not available' &&
      !d
    ) {
      warnings.push(
        `${label} is present but not in MM/DD/YYYY format: "${value}"`,
      )
    }

    if (d) {
      // Past date warnings
      if (d < now) {
        warnings.push(`${label} appears to be in the past (${value}).`)
        // Year-typo heuristic: if doc dominant year is +1 and only year differs
        if (meta.dominantYear && d.getFullYear() === meta.dominantYear - 1) {
          warnings.push(
            `${label} year (${d.getFullYear()}) differs from predominant document year (${
              meta.dominantYear
            }). Possible year typo.`,
          )
        }
      } else {
        // Upcoming soon warning
        const days = meta.dates[key].daysUntil
        if (typeof days === 'number' && days <= 7) {
          warnings.push(`${label} is due soon (${value}, ${days} days).`)
        }
      }
    }
  })

  // Business-centric timing warnings
  if (parsed.questionsDeadline && parsed.questionsDeadline < now) {
    warnings.push(
      `Question period appears to be closed (questions deadline: ${this.questionsDeadline}).`,
    )
  }
  if (
    meta.mandatory.meeting &&
    parsed.bidMeetingDate &&
    parsed.bidMeetingDate < now
  ) {
    warnings.push(
      `Mandatory meeting appears to be missed (bid meeting: ${this.bidMeetingDate}).`,
    )
  }
  if (
    meta.mandatory.registration &&
    parsed.bidRegistrationDate &&
    parsed.bidRegistrationDate < now
  ) {
    warnings.push(
      `Mandatory registration appears to be missed (registration: ${this.bidRegistrationDate}).`,
    )
  }

  // Cross-field ordering sanity
  const sub = parsed.submissionDeadline
  const q = parsed.questionsDeadline
  if (sub && q && q > sub) {
    warnings.push(
      `Questions deadline (${this.questionsDeadline}) is after submission deadline (${this.submissionDeadline}).`,
    )
  }

  return { warnings, meta }
}

// Compute a lightweight fit score + reasons for Finder/triage (does not persist).
rfpSchema.methods.computeFitScore = function () {
  const now = new Date()
  const reasons = []
  let score = 100

  const raw = typeof this.rawText === 'string' ? this.rawText.toLowerCase() : ''

  const sub = this._parseUsDate(this.submissionDeadline)
  const q = this._parseUsDate(this.questionsDeadline)
  const meeting = this._parseUsDate(this.bidMeetingDate)
  const reg = this._parseUsDate(this.bidRegistrationDate)

  // Hard disqualifiers
  if (sub && sub < now) {
    return {
      score: 0,
      reasons: ['Submission deadline passed.'],
      disqualified: true,
    }
  }

  // Timing urgency
  if (sub) {
    const days = Math.ceil(
      (sub.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (days <= 2) {
      score -= 35
      reasons.push(`Very little time left before submission (${days} days).`)
    } else if (days <= 7) {
      score -= 15
      reasons.push(`Tight turnaround (${days} days until submission).`)
    }
  } else {
    score -= 15
    reasons.push('Submission deadline not identified.')
  }

  if (q && q < now) {
    score -= 10
    reasons.push('Question period appears to be closed.')
  }

  // Mandatory meeting/registration heuristics (same signals as date sanity)
  const mandatoryMeeting =
    raw.includes('mandatory') &&
    (raw.includes('pre-bid') ||
      raw.includes('prebid') ||
      raw.includes('pre-proposal') ||
      raw.includes('preproposal') ||
      raw.includes('site visit') ||
      raw.includes('bid conference') ||
      raw.includes('pre proposal conference'))
  if (mandatoryMeeting) {
    reasons.push('Mandatory meeting detected in RFP text.')
    if (meeting && meeting < now) {
      return {
        score: 0,
        reasons: [...reasons, 'Mandatory meeting date appears to be missed.'],
        disqualified: true,
      }
    }
  }

  const mandatoryRegistration =
    raw.includes('mandatory') &&
    (raw.includes('vendor registration') ||
      raw.includes('bid registration') ||
      (raw.includes('registration') && raw.includes('deadline')))
  if (mandatoryRegistration) {
    reasons.push('Mandatory registration detected in RFP text.')
    if (reg && reg < now) {
      return {
        score: 0,
        reasons: [
          ...reasons,
          'Mandatory registration deadline appears to be missed.',
        ],
        disqualified: true,
      }
    }
  }

  // Other common disqualifier flags (not deterministically disqualifying without human confirmation)
  const flags = [
    {
      key: 'bid bond',
      penalty: 10,
      msg: 'Bid bond mentioned (verify ability to provide).',
    },
    {
      key: 'performance bond',
      penalty: 10,
      msg: 'Performance bond mentioned (verify ability to provide).',
    },
    {
      key: 'license',
      penalty: 5,
      msg: 'Licensing requirement mentioned (verify eligibility).',
    },
    {
      key: 'certification',
      penalty: 5,
      msg: 'Certification requirement mentioned (verify eligibility).',
    },
    {
      key: 'registration',
      penalty: 3,
      msg: 'Registration requirement mentioned (verify status).',
    },
  ]
  flags.forEach((f) => {
    if (raw.includes(f.key)) {
      score -= f.penalty
      reasons.push(f.msg)
    }
  })

  score = Math.max(0, Math.min(100, score))
  return { score, reasons, disqualified: false }
}

// Pre-save hook to automatically check disqualification
rfpSchema.pre('save', function (next) {
  this.checkDisqualification()
  next()
})

// Indexes
rfpSchema.index({ projectType: 1 })
rfpSchema.index({ clientName: 1 })
rfpSchema.index({ createdAt: -1 })
rfpSchema.index({ isDisqualified: 1 })

module.exports = mongoose.model('RFP', rfpSchema)
