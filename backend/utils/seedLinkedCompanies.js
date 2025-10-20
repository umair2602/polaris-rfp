const mongoose = require("mongoose");
const Company = require("../models/Company");
const SharedCompanyInfo = require("../models/SharedCompany");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

/**
 * Seed script to create two linked companies:
 * - Eighth Generation Consulting
 * - Polaris EcoSystems
 * 
 * These companies share all data except name and email.
 * Any update to shared fields in one company automatically updates the other.
 */

async function seedLinkedCompanies() {
  try {
    console.log("Starting linked companies seeding...");

    // Check if companies already exist
    const existingEighthGen = await Company.findOne({
      name: "Eighth Generation Consulting",
    });
    const existingPolaris = await Company.findOne({
      name: "Polaris EcoSystems",
    });

    if (existingEighthGen && existingPolaris) {
      console.log("Linked companies already exist. Skipping seed.");
      return {
        eighthGen: existingEighthGen,
        polaris: existingPolaris,
        message: "Companies already exist",
      };
    }

    // Shared data template (same for both companies)
    const sharedData = {
      description:
        "Eighth Generation Consulting is a 100% Native-owned, certified MBE professional services firm specializing in strategic communications, technology solutions, and financial modeling. We combine deep cultural understanding with cutting-edge expertise to deliver transformative results for tribal, municipal, and state clients.",
      founded: new Date("2010-01-01"),
      location: "Victoria, BC, Canada",
      website: "https://eighthgen.com",
      phone: "+1 (250) 555-0123",
      tagline: "Excellence in Indigenous Business Solutions",
      coreCapabilities: [
        "100% NNASC Certified MBE",
        "NASCLA General Contracting License",
        "AWS Security Specialty Certification",
        "NABCEP PV System Inspector/PV Technical Sales Professional",
      ],
      certifications: [
        "100% NNASC Certified MBE",
        "NASCLA General Contracting License",
        "AWS Security Specialty Certification",
        "NABCEP PV System Inspector/PV Technical Sales Professional",
      ],
      industryFocus: [
        "Strategic Communications",
        "Technology Solutions",
        "Financial Modeling",
        "Land Use Planning",
        "Zoning & Regulatory Compliance",
      ],
      missionStatement:
        "To deliver transformative results for tribal, municipal, and state clients through deep cultural understanding and cutting-edge expertise.",
      visionStatement:
        "To be the leading Native-owned consultancy driving sustainable development and community empowerment.",
      values: [
        "Cultural Integrity",
        "Innovation",
        "Community Partnership",
        "Excellence",
        "Sustainability",
      ],
      statistics: {
        yearsInBusiness: 15,
        projectsCompleted: 200,
        clientsSatisfied: 150,
        teamMembers: 5,
      },
      socialMedia: {
        linkedin: "https://linkedin.com/company/eighth-generation-consulting",
        twitter: "https://twitter.com/eighthgen",
        facebook: "https://facebook.com/eighthgenconsulting",
      },
      coverLetter: `Dear Town Board and Planning Commission,

On behalf of Eighth Generation Consulting, we are pleased to submit our proposal to partner with Town of Amherst on the development of a Comprehensive Land Use Plan and a complete Zoning Code Update. We recognize that this is a once-in-a-generation opportunity to modernize the Township's planning framework, protect its rural and agricultural character, and create a legally defensible, community-driven vision for the next 10–20 years.

Our team brings extensive experience in rural township planning, zoning modernization, and community engagement, having successfully completed similar projects for small communities across the US. We understand the unique needs of Richfield Township: balancing growth pressures with preservation of farmland and residential quality of life.

We are committed to delivering a clear, implementable plan, a user-friendly zoning code, and strong engagement with your residents, Trustees, and Planning Commission.

We appreciate your consideration and look forward to working together.`,
      firmQualificationsAndExperience: `Eighth Generation Consulting is a consultancy established in 2022, with a staff of 5 professionals specializing in land use planning, zoning, and public engagement. Our leadership team has over 75 years of combined experience supporting municipalities, tribal governments, and both non-profit and for-profit organizations to integrate economic and environmental development with community engagement and regulatory compliance requirements. We've earned numerous awards and recognitions for these efforts:

• 2022: Honored by the United Nations at the Biodiversity COP15 for pioneering zoning, land use, and stakeholder collaboration through the City of Carbondale's Sustainability Plan.
• 2024: Grand Prize winners through an NREL sponsored prize on community integration of infrastructure and workforce development in land use issues.
• 2024: MIT Solver - Indigenous Communities Fellowship Class of 2024 for work on developing systems of collaboration between local, state, tribal, and federal entities around energy and responsible land use issues.
• 2025: American Made Challenge Current Semifinalist, U.S. Department of Energy.
• 2025: Verizon Disaster Resilience Prize Current Semifinalist for oneNode, a solar microgrid technology to restore connectivity, monitor hazards, and coordinate response in disaster zones.
• 2025: Shortlisted as an MIT Solver semifinalist for a second time focusing on responsible land use, zoning, and privacy concerns for data center development.
• 2025: Awarded Preferred Provider by the Alliance for Tribal Clean Energy.
• Our core services include: Comprehensive Planning, Zoning Ordinance Updates, Rural & Agricultural Preservation, Public Facilitation, and Legal/Statutory Compliance Reviews.`,
    };

    // Create shared company info document
    const sharedInfo = new SharedCompanyInfo(sharedData);
    await sharedInfo.save();
    console.log("✓ Created shared company info");

    // Create Eighth Generation Consulting
    const eighthGenData = {
      ...sharedData,
      name: "Eighth Generation Consulting",
      email: "info@eighthgen.com",
      companyId: `company_eighthgen_${Date.now()}`,
      sharedInfo: sharedInfo._id,
    };

    const eighthGen = new Company(eighthGenData);
    await eighthGen.save();
    console.log("✓ Created Eighth Generation Consulting");

    // Create Polaris EcoSystems with name replacement
    const polarisData = {
      ...sharedData,
      name: "Polaris EcoSystems",
      email: "info@polarisecosystems.com",
      companyId: `company_polaris_${Date.now()}`,
      sharedInfo: sharedInfo._id,
    };

    const polaris = new Company(polarisData);
    
    // Apply dynamic naming to replace "Eighth Generation Consulting" with "Polaris EcoSystems"
    polaris.applyDynamicNaming();
    await polaris.save();
    console.log("✓ Created Polaris EcoSystems");

    // Update shared info with linked company references
    sharedInfo.linkedCompanies = [eighthGen._id, polaris._id];
    await sharedInfo.save();
    console.log("✓ Linked companies to shared info");

    console.log("\n=== Linked Companies Created Successfully ===");
    console.log(`Eighth Generation Consulting ID: ${eighthGen.companyId}`);
    console.log(`Polaris EcoSystems ID: ${polaris.companyId}`);
    console.log(`Shared Info ID: ${sharedInfo._id}`);
    console.log("\nShared fields will now sync between both companies.");
    console.log("Independent fields (name, email) remain unique.\n");

    return {
      eighthGen,
      polaris,
      sharedInfo,
      message: "Successfully created linked companies",
    };
  } catch (error) {
    console.error("Error seeding linked companies:", error);
    throw error;
  }
}

/**
 * Helper function to demonstrate updating shared data
 */
async function demonstrateLinkedUpdate() {
  try {
    console.log("\n=== Demonstrating Linked Update ===");

    const eighthGen = await Company.findOne({
      name: "Eighth Generation Consulting",
    });
    const polarisBefore = await Company.findOne({ name: "Polaris EcoSystems" });

    console.log("Before update:");
    console.log(`Eighth Gen location: ${eighthGen.location}`);
    console.log(`Polaris location: ${polarisBefore.location}`);

    // Update Eighth Gen's location (a shared field)
    eighthGen.location = "Seattle, WA, USA";
    await eighthGen.save();

    // Fetch Polaris again to see the update
    const polarisAfter = await Company.findOne({ name: "Polaris EcoSystems" });

    console.log("\nAfter updating Eighth Gen:");
    console.log(`Eighth Gen location: ${eighthGen.location}`);
    console.log(`Polaris location: ${polarisAfter.location}`);
    console.log("✓ Update propagated successfully!\n");
  } catch (error) {
    console.error("Error demonstrating linked update:", error);
  }
}

// Run if executed directly
if (require.main === module) {
  const connectDB = async () => {
    try {
      // Use same connection logic as server.js
      const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
      
      if (!MONGODB_URI) {
        console.error("\n❌ ERROR: No MongoDB connection string found!");
        
        process.exit(1);
      }

      console.log("Connecting to MongoDB...");
      console.log(`URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`); // Hide credentials in log
      
      await mongoose.connect(MONGODB_URI);
      console.log("✓ MongoDB connected successfully\n");

      await seedLinkedCompanies();
      await demonstrateLinkedUpdate();

      await mongoose.connection.close();
      console.log("\n✓ MongoDB connection closed");
      console.log("✓ Seeding completed successfully!");
      process.exit(0);
    } catch (error) {
      console.error("\n❌ Fatal error:", error.message);
      
      if (error.name === "MongooseServerSelectionError") {
        console.error("\n💡 Troubleshooting tips:");
        console.error("  1. Make sure MongoDB is running");
        console.error("  2. Check your MONGODB_URI in .env file");
        console.error("  3. Verify network connectivity");
        console.error("  4. Check if MongoDB is listening on the correct port\n");
      }
      
      process.exit(1);
    }
  };

  connectDB();
}

module.exports = { seedLinkedCompanies, demonstrateLinkedUpdate };
