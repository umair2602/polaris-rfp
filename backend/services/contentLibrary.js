class ContentLibrary {
  constructor() {
    this.companyData = this.initializeCompanyData();
    this.teamMembers = this.initializeTeamMembers();
    this.projectReferences = this.initializeProjectReferences();
  }

  initializeCompanyData() {
    return {
      companyName: "Eighth Generation Consulting",
      description: "Eighth Generation Consulting is a 100% Native-owned, certified MBE professional services firm specializing in strategic communications, technology solutions, and financial modeling. We combine deep cultural understanding with cutting-edge expertise to deliver transformative results for tribal, municipal, and state clients.",
      certifications: [
        "100% NNASC Certified MBE",
        "NASCLA General Contracting License",
        "AWS Security Specialty Certification",
        "NABCEP PV System Inspector/PV Technical Sales Professional"
      ],
      headquarters: "Pacific Northwest",
      foundedYear: 2020,
      keyAchievements: [
        "Grand Prize Winners of the Community Energy Innovation - Manufacturing Track",
        "Winners of the 'Ready' Phase of Solar Prize Round 8",
        "MIT Solve Indigenous Communities Fellowship Class of 2024",
        "DOE PV RESOLVE Advisory Committee Members"
      ],
      coreValues: [
        "Cultural integrity and Indigenous perspectives",
        "Innovation through traditional knowledge",
        "Sustainable community development",
        "Excellence in technical delivery"
      ]
    };
  }

  initializeTeamMembers() {
    return {
      saxon_metzger: {
        id: "saxon_metzger",
        name: "Saxon Metzger",
        title: "MBA, President / Principal Investigator",
        roleDescription: "Strategic leader with expertise in renewable energy, community development, and project management",
        experienceYears: 12,
        education: [
          "MBA - Business Administration",
          "Bachelor's Degree - Environmental Science"
        ],
        certifications: [
          "NASCLA Certified General Contractor",
          "NABCEP PV System Inspector",
          "NABCEP PV Technical Sales Professional"
        ],
        keyProjects: [
          "DOE PV RESOLVE Advisory Committee Leadership",
          "Solar Prize Round 8 Grand Prize Winner",
          "MIT Solve Indigenous Communities Fellowship",
          "Multi-million dollar renewable energy installations"
        ],
        responsibilities: [
          "Strategic planning and project oversight",
          "Client relationship management",
          "Technical feasibility analysis",
          "Community stakeholder engagement"
        ],
        specialties: ["renewable energy", "project management", "strategic communications"]
      },
      wesley_ladd: {
        id: "wesley_ladd",
        name: "Wesley Ladd",
        title: "MBA, Senior Cloud Architect",
        roleDescription: "Cybersecurity and cloud infrastructure expert with extensive enterprise experience",
        experienceYears: 10,
        education: [
          "MBA - Information Systems",
          "Bachelor's Degree - Computer Science"
        ],
        certifications: [
          "AWS Security Specialty",
          "CISSP - Certified Information Systems Security Professional",
          "CISA - Certified Information Systems Auditor"
        ],
        keyProjects: [
          "Enterprise cloud migration for Fortune 500 companies",
          "Federal government security architecture",
          "Multi-cloud infrastructure design",
          "Cybersecurity framework implementation"
        ],
        responsibilities: [
          "Cloud architecture design",
          "Security implementation",
          "Technical team leadership",
          "Infrastructure optimization"
        ],
        specialties: ["cloud architecture", "cybersecurity", "enterprise systems"]
      },
      technical_lead: {
        id: "technical_lead",
        name: "Senior Technical Lead",
        title: "Senior Software Engineer",
        roleDescription: "Full-stack development expert with focus on scalable web applications",
        experienceYears: 8,
        education: [
          "Master's Degree - Computer Science",
          "Bachelor's Degree - Software Engineering"
        ],
        certifications: [
          "AWS Solutions Architect",
          "Google Cloud Professional",
          "Certified Scrum Master"
        ],
        keyProjects: [
          "Large-scale web portal development",
          "API integration and microservices",
          "Database optimization projects",
          "Mobile application development"
        ],
        responsibilities: [
          "Technical architecture decisions",
          "Code review and quality assurance",
          "Team mentoring",
          "Performance optimization"
        ],
        specialties: ["full-stack development", "system architecture", "API design"]
      },
      communications_lead: {
        id: "communications_lead",
        name: "Strategic Communications Director",
        title: "Senior Communications Strategist",
        roleDescription: "Expert in stakeholder engagement and culturally informed messaging",
        experienceYears: 15,
        education: [
          "Master's Degree - Communications",
          "Bachelor's Degree - Indigenous Studies"
        ],
        certifications: [
          "APR - Accredited in Public Relations",
          "Certified Digital Marketing Professional"
        ],
        keyProjects: [
          "Multi-million dollar public awareness campaigns",
          "Tribal government communications strategy",
          "Federal agency stakeholder engagement",
          "Community outreach program development"
        ],
        responsibilities: [
          "Communications strategy development",
          "Stakeholder relationship management",
          "Content creation and oversight",
          "Cultural sensitivity guidance"
        ],
        specialties: ["strategic communications", "stakeholder engagement", "cultural competency"]
      }
    };
  }

  initializeProjectReferences() {
    return [
      {
        id: "ref_001",
        clientName: "Department of Energy",
        contactPerson: "Dr. Sarah Johnson",
        contactEmail: "sarah.johnson@doe.gov",
        contactPhone: "(202) 586-5000",
        projectScope: "Solar energy technical advisory and community engagement",
        projectType: "strategic_communications",
        outcomes: [
          "Successfully advised on $50M community solar program",
          "Developed culturally appropriate outreach strategies",
          "Achieved 95% stakeholder satisfaction rating"
        ],
        testimonial: "Eighth Generation Consulting provided invaluable expertise in bridging technical requirements with community needs. Their cultural competency and technical excellence made the difference in our program's success.",
        projectValue: "$500,000",
        duration: "18 months"
      },
      {
        id: "ref_002",
        clientName: "Tribal Energy Coalition",
        contactPerson: "Robert Martinez",
        contactEmail: "rmartinez@tribalenergy.org",
        contactPhone: "(505) 555-0123",
        projectScope: "Web portal development for renewable energy resource sharing",
        projectType: "software_development",
        outcomes: [
          "Delivered scalable web platform serving 50+ tribal communities",
          "Integrated complex data visualization tools",
          "Maintained 99.9% uptime throughout deployment"
        ],
        testimonial: "The team at Eighth Generation delivered a world-class platform that exceeded our expectations. Their understanding of tribal needs combined with technical excellence was exactly what our coalition needed.",
        projectValue: "$750,000",
        duration: "12 months"
      },
      {
        id: "ref_003",
        clientName: "State Renewable Energy Office",
        contactPerson: "Amanda Chen",
        contactEmail: "achen@state.gov",
        contactPhone: "(360) 555-0456",
        projectScope: "Financial modeling and economic impact analysis",
        projectType: "financial_modeling",
        outcomes: [
          "Completed comprehensive economic impact study",
          "Identified $2.3B in potential economic benefits",
          "Delivered actionable policy recommendations"
        ],
        testimonial: "Their financial modeling expertise helped us make data-driven decisions on renewable energy investments. The analysis was thorough, accurate, and presented in a clear, actionable format.",
        projectValue: "$150,000",
        duration: "6 months"
      }
    ];
  }

  getCompanyProfile() {
    return this.companyData;
  }

  getTeamMember(identifier) {
    // Try direct lookup first
    if (this.teamMembers[identifier]) {
      return this.teamMembers[identifier];
    }

    // Try lookup by role/specialty
    for (const [memberId, member] of Object.entries(this.teamMembers)) {
      if (member.specialties?.includes(identifier) || 
          member.title.toLowerCase().includes(identifier.replace('_', ' ').toLowerCase())) {
        return member;
      }
    }

    return null;
  }

  getTeamMembersByRoles(roles) {
    const members = [];
    for (const role of roles) {
      const member = this.getTeamMember(role);
      if (member && !members.find(m => m.id === member.id)) {
        members.push(member);
      }
    }
    return members;
  }

  getAllTeamMembers() {
    return this.teamMembers;
  }

  getProjectReferences(projectType = null, count = 3) {
    let references = this.projectReferences;

    if (projectType) {
      references = references.filter(ref => ref.projectType === projectType);
    }

    return references.slice(0, count);
  }

  getRelevantAchievements(projectType) {
    const achievements = this.companyData.keyAchievements;

    if (projectType === 'software_development') {
      return achievements.filter(ach =>
        ach.toLowerCase().includes('prize') || 
        ach.toLowerCase().includes('innovation') ||
        ach.toLowerCase().includes('technology')
      );
    } else if (projectType === 'strategic_communications') {
      return achievements.filter(ach =>
        ach.toLowerCase().includes('fellowship') ||
        ach.toLowerCase().includes('community') ||
        ach.toLowerCase().includes('advisory')
      );
    }

    return achievements;
  }

  getRelevantCertifications(projectType) {
    const allCerts = this.companyData.certifications;

    if (projectType === 'software_development') {
      return allCerts.filter(cert =>
        cert.toLowerCase().includes('aws') ||
        cert.toLowerCase().includes('technical') ||
        cert.toLowerCase().includes('security')
      );
    } else if (projectType === 'strategic_communications') {
      return allCerts.filter(cert =>
        cert.toLowerCase().includes('mbe') ||
        cert.toLowerCase().includes('certified')
      );
    }

    return allCerts;
  }

  generateCompanyIntroduction(projectType) {
    const baseIntro = this.companyData.description;
    const relevantAchievements = this.getRelevantAchievements(projectType);
    const relevantCerts = this.getRelevantCertifications(projectType);

    const introParts = [
      baseIntro,
      `Our key achievements include: ${relevantAchievements.slice(0, 2).join(', ')}.`,
      `We maintain industry certifications including: ${relevantCerts.slice(0, 3).join(', ')}.`
    ];

    return introParts.join(' ');
  }
}

module.exports = new ContentLibrary();