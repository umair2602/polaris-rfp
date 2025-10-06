const express = require('express')
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
      return res.status(404).json({ error: 'Company profile not found' })
    }

    res.json(profile)
  } catch (error) {
    console.error('Error fetching company profile:', error)
    res.status(500).json({ error: 'Failed to fetch company profile' })
  }
})

// Get all team members
router.get('/team', async (req, res) => {
  try {
    let teamMembers = await TeamMember.find({ isActive: true }).lean()

    res.json(teamMembers)
  } catch (error) {
    console.error('Error fetching team members:', error)
    res.status(500).json({ error: 'Failed to fetch team members' })
  }
})

// Get specific team member
router.get('/team/:memberId', async (req, res) => {
  try {
    const member = await TeamMember.findOne({ memberId: req.params.memberId, isActive: true }).lean()
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

    res.json(references)
  } catch (error) {
    console.error('Error fetching references:', error)
    res.status(500).json({ error: 'Failed to fetch references' })
  }
})


module.exports = router
