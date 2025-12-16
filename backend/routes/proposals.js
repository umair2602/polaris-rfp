const express = require('express')
const Proposal = require('../models/Proposal')
const RFP = require('../models/RFP')
const Company = require('../models/Company')
const PDFDocument = require('pdfkit')
const path = require('path')
const AIProposalGenerator = require('../services/aiProposalGenerator')
const TemplateGenerator = require('../services/templateGenerator')
const DocxGenerator = require('../services/docxGenerator')
const PdfGenerator = require('../services/pdfGenerator')
const { Packer } = require('docx')
const router = express.Router()
const Template = require('../models/Template')

// Generate new proposal with AI
router.post('/generate', async (req, res) => {
  try {
    const { rfpId, templateId, title, companyId, customContent = {} } = req.body

    // Validate required fields
    if (!rfpId || !templateId || !title) {
      return res.status(400).json({
        error: 'Missing required fields: rfpId, templateId, title',
      })
    }

    // Get RFP data
    const rfp = await RFP.findById(rfpId)
    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' })
    }

    // Propagate selected companyId into customContent so generators can use it
    const effectiveCustomContent = {
      ...(customContent || {}),
      ...(companyId ? { companyId } : {}),
    }

    let sections

    // If templateId is a special AI flow, keep existing behavior using RFP-driven sections
    if (templateId === 'ai-template') {
      sections = await AIProposalGenerator.generateAIProposalSections(
        rfp,
        templateId,
        effectiveCustomContent,
      )
    } else {
      // Load template and generate content strictly from template sections
      const template = await Template.findById(templateId)
      if (!template) {
        return res.status(404).json({ error: 'Template not found' })
      }

      sections = await TemplateGenerator.generateAIProposalFromTemplate(
        rfp.toObject ? rfp.toObject() : rfp,
        template.toObject ? template.toObject() : template,
        effectiveCustomContent,
      )
    }

    // Create proposal
    const proposal = new Proposal({
      rfpId,
      companyId: companyId || null,
      templateId,
      title,
      sections,
      customContent: effectiveCustomContent,
      lastModifiedBy: 'system',
    })

    await proposal.save()
    await proposal.populate('rfpId', 'title clientName projectType')

    res.status(201).json(proposal)
  } catch (error) {
    console.error('Error generating proposal:', error)
    res.status(500).json({
      error: 'Failed to generate proposal',
      message: error.message,
    })
  }
})

// Generate proposal sections using AI
router.post('/:id/generate-sections', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate(
      'rfpId',
      'title clientName projectType keyRequirements deliverables budgetRange submissionDeadline location contactInformation rawText',
    )

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' })
    }

    if (!AIProposalGenerator.openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    // Generate AI sections
    const sections = await AIProposalGenerator.generateAIProposalSections(
      proposal.rfpId,
      proposal.templateId,
      {},
    )

    // Update proposal with new sections
    proposal.sections = sections
    proposal.lastModifiedBy = 'ai-generation'
    await proposal.save()

    res.json({
      message: 'Sections generated successfully',
      sections: sections,
      proposal: proposal,
    })
  } catch (error) {
    console.error('Error generating AI sections:', error)
    res.status(500).json({
      error: 'Failed to generate AI sections',
      message: error.message,
    })
  }
})

// Get all proposals
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const proposals = await Proposal.find()
      .populate('rfpId', 'title clientName projectType')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-sections') // Exclude large sections data

    const total = await Proposal.countDocuments()

    res.json({
      data: proposals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching proposals:', error)
    res.status(500).json({ error: 'Failed to fetch proposals' })
  }
})

// Get single proposal
router.get('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate(
      'rfpId',
      'title clientName projectType keyRequirements deliverables',
    )

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' })
    }

    res.json(proposal)
  } catch (error) {
    console.error('Error fetching proposal:', error)
    res.status(500).json({ error: 'Failed to fetch proposal' })
  }
})

// Update proposal
router.put('/:id', async (req, res) => {
  try {
    const allowedUpdates = [
      'title',
      'status',
      'sections',
      'customContent',
      'budgetBreakdown',
      'timelineDetails',
      'teamAssignments',
    ]

    const updates = {}
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    updates.lastModifiedBy = 'system'

    const proposal = await Proposal.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('rfpId', 'title clientName projectType')

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' })
    }

    res.json(proposal)
  } catch (error) {
    console.error('Error updating proposal:', error)
    res.status(500).json({ error: 'Failed to update proposal' })
  }
})

// Delete proposal
router.delete('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndDelete(req.params.id)

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' })
    }

    res.json({ message: 'Proposal deleted successfully' })
  } catch (error) {
    console.error('Error deleting proposal:', error)
    res.status(500).json({ error: 'Failed to delete proposal' })
  }
})

// (Removed earlier duplicate export-pdf route that stripped bold formatting)

router.get('/:id/export-pdf', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate(
      'rfpId',
      'title clientName projectType keyRequirements deliverables budgetRange submissionDeadline location contactInformation',
    )

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' })
    }

    // Get company information (prefer proposal-selected company)
    const company = proposal.companyId
      ? await Company.findOne({ companyId: proposal.companyId }).lean()
      : await Company.findOne().sort({ createdAt: -1 }).lean()

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${proposal.title.replace(/\s+/g, '_')}.pdf"`,
    )

    // Generate PDF using PdfGenerator service
    const pdfGenerator = new PdfGenerator()
    pdfGenerator.generatePdf(proposal, company, res)
  } catch (error) {
    console.error('Error exporting proposal as PDF:', error)
    res.status(500).json({ error: 'Failed to export proposal PDF' })
  }
})

// Export proposal as DOCX
router.get('/:id/export-docx', async (req, res) => {
  console.log('🚀 Starting DOCX export request...')
  console.log('📋 Request params:', req.params)

  try {
    console.log('🔍 Looking up proposal with ID:', req.params.id)
    const proposal = await Proposal.findById(req.params.id).populate(
      'rfpId',
      'title clientName projectType keyRequirements deliverables budgetRange submissionDeadline location contactInformation',
    )

    if (!proposal) {
      console.error('❌ Proposal not found for ID:', req.params.id)
      return res.status(404).json({ error: 'Proposal not found' })
    }

    console.log('✅ Proposal found:', {
      id: proposal._id,
      title: proposal.title,
      hasRfpId: !!proposal.rfpId,
      rfpId: proposal.rfpId?._id,
      sectionsCount: Object.keys(proposal.sections || {}).length,
    })

    console.log('🏢 Looking up company information...')
    const company = proposal.companyId
      ? (await Company.findOne({ companyId: proposal.companyId }).lean()) || {}
      : (await Company.findOne().sort({ createdAt: -1 }).lean()) || {}
    console.log('✅ Company data retrieved:', {
      hasCompany: !!company,
      companyId: company?._id,
      companyName: company?.name,
      companyKeys: company ? Object.keys(company) : [],
    })

    console.log('📄 Creating DocxGenerator instance...')
    const docxGenerator = new DocxGenerator() // <-- now uses officegen inside
    console.log('✅ DocxGenerator created')

    console.log('📝 Starting DOCX generation with officegen...')
    const buffer = await docxGenerator.generateDocx(proposal, company)
    console.log(
      '✅ DOCX document generated successfully, size:',
      buffer.length,
      'bytes',
    )

    // Ensure filename is safe
    const filename =
      (proposal.title || 'proposal')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '') + '.docx'
    console.log('📁 Generated filename:', filename)

    // Set headers before sending
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    console.log('📤 Sending DOCX buffer to response...')
    res.send(buffer)
    console.log('🎉 DOCX export completed successfully')
  } catch (error) {
    console.error('❌ Error exporting proposal as DOCX:', error)
    res.status(500).json({
      error: 'Failed to export proposal DOCX',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
})

// Update content library selection for a section
router.put('/:id/content-library/:sectionName', async (req, res) => {
  try {
    const { id, sectionName } = req.params
    const { selectedIds, type } = req.body // type: 'team', 'references', or 'company'

    const proposal = await Proposal.findById(id)
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' })
    }

    let content = ''

    if (type === 'company') {
      const Company = require('../models/Company')
      const SharedSectionFormatters = require('../services/sharedSectionFormatters')

      if (selectedIds.length > 0) {
        const selectedCompany = await Company.findOne({
          companyId: selectedIds[0], // Only use first selected company
        }).lean()

        if (selectedCompany) {
          // Get RFP data from the proposal
          const RFP = require('../models/RFP')
          const rfp = await RFP.findById(proposal.rfpId)

          // Determine section type based on section name
          const sectionTitle = sectionName.toLowerCase()
          if (sectionTitle === 'title') {
            // Title section returns an object, not a string
            const titleData = SharedSectionFormatters.formatTitleSection(
              selectedCompany,
              rfp || {},
            )
            content = titleData // Store the object directly
          } else if (
            sectionTitle.includes('cover letter') ||
            sectionTitle.includes('introduction letter') ||
            sectionTitle.includes('transmittal letter')
          ) {
            content = SharedSectionFormatters.formatCoverLetterSection(
              selectedCompany,
              rfp || {},
            )
          } else {
            // This is an experience/qualifications section
            content = await SharedSectionFormatters.formatExperienceSection(
              selectedCompany,
              rfp || {},
            )
          }
        } else {
          content = 'Selected company not found.'
        }
      } else {
        content = 'No company selected.'
      }
    } else if (type === 'team') {
      const TeamMember = require('../models/TeamMember')
      const selectedMembers = await TeamMember.find({
        memberId: { $in: selectedIds },
        isActive: true,
      }).lean()

      if (selectedMembers.length > 0) {
        content =
          'Our experienced team brings together diverse expertise and proven track record to deliver exceptional results.\n\n'
        selectedMembers.forEach((member) => {
          content += `**${member.nameWithCredentials}** - ${member.position}\n\n`
          content += `${member.biography}\n\n`
        })
      } else {
        content = 'No team members selected.'
      }
    } else if (type === 'references') {
      const ProjectReference = require('../models/ProjectReference')
      const selectedReferences = await ProjectReference.find({
        _id: { $in: selectedIds },
        isActive: true,
        isPublic: true,
      }).lean()

      if (selectedReferences.length > 0) {
        content =
          'Below are some of our recent project references that demonstrate our capabilities and client satisfaction:\n\n'
        selectedReferences.forEach((reference) => {
          content += `**${reference.organizationName}**`
          if (reference.timePeriod) {
            content += ` (${reference.timePeriod})`
          }
          content += '\n\n'

          content += `**Contact:** ${reference.contactName}`
          if (reference.contactTitle) {
            content += `, ${reference.contactTitle}`
          }
          if (reference.additionalTitle) {
            content += ` - ${reference.additionalTitle}`
          }
          content += ` of ${reference.organizationName}\n\n`

          if (reference.contactEmail) {
            content += `**Email:** ${reference.contactEmail}\n\n`
          }

          if (reference.contactPhone) {
            content += `**Phone:** ${reference.contactPhone}\n\n`
          }

          content += `**Scope of Work:** ${reference.scopeOfWork}\n\n`
          content += '---\n\n'
        })
      } else {
        content = 'No references selected.'
      }
    }

    // Update the section
    const updatedSections = {
      ...proposal.sections,
      [sectionName]: {
        ...proposal.sections[sectionName],
        content: typeof content === 'string' ? content.trim() : content,
        type: 'content-library',
        lastModified: new Date().toISOString(),
        selectedIds: selectedIds, // Store the selected IDs for future reference
      },
    }

    const updatedProposal = await Proposal.findByIdAndUpdate(
      id,
      { sections: updatedSections },
      { new: true },
    )

    res.json(updatedProposal)
  } catch (error) {
    console.error('Error updating content library selection:', error)
    res
      .status(500)
      .json({ error: 'Failed to update content library selection' })
  }
})

// Switch proposal company (re-apply Title/Cover Letter/Experience)
router.put('/:id/company', async (req, res) => {
  try {
    const { id } = req.params
    const { companyId } = req.body || {}
    if (!companyId || typeof companyId !== 'string') {
      return res.status(400).json({ error: 'companyId is required' })
    }

    const proposal = await Proposal.findById(id)
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' })

    const company = await Company.findOne({ companyId }).lean()
    if (!company) return res.status(404).json({ error: 'Company not found' })

    const rfp = await RFP.findById(proposal.rfpId)
    const SharedSectionFormatters = require('../services/sharedSectionFormatters')

    const updatedSections = { ...(proposal.sections || {}) }

    // Update/insert Title
    updatedSections.Title = {
      ...(updatedSections.Title || {}),
      content: SharedSectionFormatters.formatTitleSection(company, rfp || {}),
      type: 'content-library',
      lastModified: new Date().toISOString(),
      selectedIds: [companyId],
    }

    // Update/insert Cover Letter
    updatedSections['Cover Letter'] = {
      ...(updatedSections['Cover Letter'] || {}),
      content: SharedSectionFormatters.formatCoverLetterSection(
        company,
        rfp || {},
      ),
      type: 'content-library',
      lastModified: new Date().toISOString(),
      selectedIds: [companyId],
    }

    // If there is an experience-like section already marked as content-library, refresh it.
    // Otherwise, if a common experience section exists, refresh it; else skip.
    const sectionNames = Object.keys(updatedSections)
    const experienceCandidates = sectionNames.filter((name) => {
      const n = String(name || '').toLowerCase()
      return (
        n.includes('experience') ||
        n.includes('qualifications') ||
        n.includes('firm') ||
        n.includes('capabilities') ||
        n.includes('company profile')
      )
    })
    for (const name of experienceCandidates.slice(0, 2)) {
      // Update only if the section is content-library or looks like a firm quals section
      updatedSections[name] = {
        ...(updatedSections[name] || {}),
        content: await SharedSectionFormatters.formatExperienceSection(
          company,
          rfp || {},
        ),
        type: 'content-library',
        lastModified: new Date().toISOString(),
        selectedIds: [companyId],
      }
    }

    proposal.companyId = companyId
    proposal.customContent = { ...(proposal.customContent || {}), companyId }
    proposal.sections = updatedSections
    proposal.lastModifiedBy = 'system'
    await proposal.save()

    const populated = await Proposal.findById(id).populate(
      'rfpId',
      'title clientName projectType',
    )
    return res.json(populated)
  } catch (error) {
    console.error('Error switching proposal company:', error)
    return res.status(500).json({ error: 'Failed to switch proposal company' })
  }
})

// Update proposal review (score/notes/rubric)
router.put('/:id/review', async (req, res) => {
  try {
    const { id } = req.params
    const { score, notes, rubric, decision } = req.body || {}

    const proposal = await Proposal.findById(id).populate(
      'rfpId',
      'title clientName projectType',
    )
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' })

    let nextScore = null
    if (score !== undefined && score !== null && score !== '') {
      const n = Number(score)
      if (Number.isFinite(n)) nextScore = Math.max(0, Math.min(100, n))
    }

    let nextDecision = proposal.review?.decision || ''
    if (decision === null) nextDecision = ''
    if (typeof decision === 'string') {
      const d = decision.trim().toLowerCase()
      if (d === '' || d === 'shortlist' || d === 'reject') nextDecision = d
    }

    proposal.review = {
      ...(proposal.review || {}),
      score: nextScore,
      decision: nextDecision,
      notes: typeof notes === 'string' ? notes : proposal.review?.notes || '',
      rubric:
        rubric && typeof rubric === 'object'
          ? rubric
          : proposal.review?.rubric || {},
      updatedAt: new Date(),
    }

    proposal.lastModifiedBy = 'review'
    await proposal.save()

    return res.json(proposal)
  } catch (error) {
    console.error('Error updating proposal review:', error)
    return res.status(500).json({ error: 'Failed to update proposal review' })
  }
})

module.exports = router
