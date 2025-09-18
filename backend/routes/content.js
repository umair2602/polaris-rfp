const express = require('express')
const contentLibrary = require('../services/contentLibrary')
const Company = require('../models/Company')
const TeamMember = require('../models/TeamMember')
const ProjectReference = require('../models/ProjectReference')
const PastProject = require('../models/PastProject')

const router = express.Router()

// Get company profile
router.get('/company', async (req, res) => {
  try {
    let profile = await Company.findOne().lean()

    if (!profile) {
      await seedDefaultCompany()
      profile = await Company.findOne().lean()
    }

    res.json(profile || contentLibrary.getCompanyProfile())
  } catch (error) {
    console.error('Error fetching company profile:', error)
    res.status(500).json({ error: 'Failed to fetch company profile' })
  }
})

// Get all team members
router.get('/team', async (req, res) => {
  try {
    let teamMembers = await TeamMember.find({ isActive: true }).lean()

    if (teamMembers.length === 0) {
      await seedDefaultTeamMembers()
      teamMembers = await TeamMember.find({ isActive: true }).lean()
    }

    res.json(
      teamMembers.length > 0 ? teamMembers : contentLibrary.getAllTeamMembers(),
    )
  } catch (error) {
    console.error('Error fetching team members:', error)
    res.status(500).json({ error: 'Failed to fetch team members' })
  }
})

// Get specific team member
router.get('/team/:memberId', (req, res) => {
  try {
    const member = contentLibrary.getTeamMember(req.params.memberId)
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' })
    }
    res.json(member)
  } catch (error) {
    console.error('Error fetching team member:', error)
    res.status(500).json({ error: 'Failed to fetch team member' })
  }
})

// Get past projects
router.get('/projects', async (req, res) => {
  try {
    const { project_type, industry, count = 20 } = req.query

    let query = { isActive: true, isPublic: true }
    if (project_type) {
      query.projectType = project_type
    }
    if (industry) {
      query.industry = industry
    }

    let projects = await PastProject.find(query)
      .limit(parseInt(count))
      .sort({ createdAt: -1 })
      .lean()

    if (projects.length === 0) {
      await seedDefaultProjects()
      projects = await PastProject.find(query)
        .limit(parseInt(count))
        .sort({ createdAt: -1 })
        .lean()
    }

    res.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Get project references
router.get('/references', async (req, res) => {
  try {
    const { project_type, count = 10 } = req.query

    let query = { isActive: true, isPublic: true }
    if (project_type) {
      query.projectType = project_type
    }

    let references = await ProjectReference.find(query)
      .limit(parseInt(count))
      .lean()

    if (references.length === 0) {
      await seedDefaultReferences()
      references = await ProjectReference.find(query)
        .limit(parseInt(count))
        .lean()
    }

    res.json(
      references.length > 0
        ? references
        : contentLibrary.getProjectReferences(project_type, parseInt(count)),
    )
  } catch (error) {
    console.error('Error fetching references:', error)
    res.status(500).json({ error: 'Failed to fetch references' })
  }
})

// Get relevant achievements for project type
router.get('/achievements/:projectType', (req, res) => {
  try {
    const achievements = contentLibrary.getRelevantAchievements(
      req.params.projectType,
    )
    res.json(achievements)
  } catch (error) {
    console.error('Error fetching achievements:', error)
    res.status(500).json({ error: 'Failed to fetch achievements' })
  }
})

// Get relevant certifications for project type
router.get('/certifications/:projectType', (req, res) => {
  try {
    const certifications = contentLibrary.getRelevantCertifications(
      req.params.projectType,
    )
    res.json(certifications)
  } catch (error) {
    console.error('Error fetching certifications:', error)
    res.status(500).json({ error: 'Failed to fetch certifications' })
  }
})

// Get company introduction for project type
router.get('/introduction/:projectType', (req, res) => {
  try {
    const introduction = contentLibrary.generateCompanyIntroduction(
      req.params.projectType,
    )
    res.json({ introduction })
  } catch (error) {
    console.error('Error generating introduction:', error)
    res.status(500).json({ error: 'Failed to generate introduction' })
  }
})

// Seed functions
async function seedDefaultCompany() {
  try {
    const companyProfile = contentLibrary.getCompanyProfile()
    const company = new Company(companyProfile)
    await company.save()
    console.log('✅ Default company seeded successfully')
  } catch (error) {
    console.error('Error seeding default company:', error)
  }
}

async function seedDefaultTeamMembers() {
  try {
    const teamMembers = contentLibrary.getAllTeamMembers()
    const formattedMembers = teamMembers.map((member) => ({
      memberId: member.id,
      name: member.name,
      title: member.title,
      roleDescription: member.roleDescription,
      experienceYears: member.experienceYears,
      education: member.education,
      certifications: member.certifications,
      specializations: member.specializations,
      responsibilities: member.responsibilities,
      bio: member.bio,
      keyProjects: member.keyProjects || [],
      skills: member.skills || [],
      isActive: true,
      projectTypes: [
        'software_development',
        'strategic_communications',
        'financial_modeling',
        'general',
      ],
    }))

    await TeamMember.insertMany(formattedMembers)
    console.log('✅ Default team members seeded successfully')
  } catch (error) {
    console.error('Error seeding default team members:', error)
  }
}

async function seedDefaultReferences() {
  try {
    const references = contentLibrary.getProjectReferences(
      'software_development',
      3,
    )
    const formattedReferences = references.map((ref) => ({
      clientName: ref.clientName,
      projectName: ref.projectScope.split(' - ')[0] || 'Project',
      projectScope: ref.projectScope,
      projectType: 'software_development',
      projectValue: ref.projectValue,
      duration: ref.duration,
      contactPerson: ref.contactPerson,
      contactEmail: ref.contactEmail,
      outcomes: ref.outcomes,
      testimonial: ref.testimonial,
      isActive: true,
      isPublic: true,
    }))

    await ProjectReference.insertMany(formattedReferences)
    console.log('✅ Default references seeded successfully')
  } catch (error) {
    console.error('Error seeding default references:', error)
  }
}

async function seedDefaultProjects() {
  try {
    const defaultProjects = [
      {
        title: 'Municipal ERP System Implementation',
        clientName: 'City of Richfield',
        description:
          'Comprehensive enterprise resource planning system for municipal operations including finance, HR, and citizen services.',
        industry: 'Government',
        projectType: 'Software Development',
        duration: '18 months',
        budget: '$2.5M',
        keyOutcomes: [
          'Reduced processing time by 60%',
          'Improved citizen satisfaction scores by 40%',
          'Achieved 99.9% system uptime',
          'Streamlined interdepartmental workflows',
        ],
        technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
        challenges: [
          'Legacy system integration',
          'Data migration from multiple sources',
          'User training and adoption',
        ],
        solutions: [
          'Phased migration approach',
          'Comprehensive training program',
          'Real-time data synchronization',
        ],
        isActive: true,
        isPublic: true,
      },
      {
        title: 'Healthcare Data Analytics Platform',
        clientName: 'Regional Medical Center',
        description:
          'Advanced analytics platform for patient outcomes tracking and operational efficiency optimization.',
        industry: 'Healthcare',
        projectType: 'Data Analytics',
        duration: '12 months',
        budget: '$1.8M',
        keyOutcomes: [
          'Improved patient outcomes by 25%',
          'Reduced operational costs by $500K annually',
          'Enhanced regulatory compliance',
          'Real-time dashboard implementation',
        ],
        technologies: ['Python', 'Tableau', 'SQL Server', 'Azure', 'Power BI'],
        challenges: [
          'HIPAA compliance requirements',
          'Complex data relationships',
          'Real-time processing needs',
        ],
        solutions: [
          'End-to-end encryption',
          'Advanced data modeling',
          'Stream processing architecture',
        ],
        isActive: true,
        isPublic: true,
      },
      {
        title: 'Financial Risk Management System',
        clientName: 'Community Bank Network',
        description:
          'Comprehensive risk assessment and management platform for community banking operations.',
        industry: 'Financial Services',
        projectType: 'Financial Modeling',
        duration: '15 months',
        budget: '$3.2M',
        keyOutcomes: [
          'Enhanced risk detection by 45%',
          'Regulatory compliance automation',
          'Reduced manual processing by 70%',
          'Improved audit trail capabilities',
        ],
        technologies: [
          'Java',
          'Spring Boot',
          'Oracle',
          'Kubernetes',
          'Jenkins',
        ],
        challenges: [
          'Regulatory compliance complexity',
          'High-availability requirements',
          'Integration with core banking systems',
        ],
        solutions: [
          'Microservices architecture',
          'Automated compliance reporting',
          'API-first integration approach',
        ],
        isActive: true,
        isPublic: true,
      },
    ]

    await PastProject.insertMany(defaultProjects)
    console.log('✅ Default projects seeded successfully')
  } catch (error) {
    console.error('Error seeding default projects:', error)
  }
}

module.exports = router
