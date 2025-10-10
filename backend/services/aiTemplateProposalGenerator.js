// Thin wrapper that delegates template-based proposal generation
const TemplateGenerator = require('./templateGenerator');

async function generateAIProposalFromTemplate(rfp, template, customContent) {
  return TemplateGenerator.generateAIProposalFromTemplate(rfp, template, customContent);
}

module.exports = {
  generateAIProposalFromTemplate,
};
