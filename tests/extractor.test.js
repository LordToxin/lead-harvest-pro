const assert = require("assert");
const LeadExtractor = require("../scripts/extractor");

function testEmailExtraction() {
  const text = "Feel free to contact me at john.doe@company.com or sales@startup.io for inquiries.";
  const emails = LeadExtractor.findEmails(text);
  assert.strictEqual(emails.length, 2);
  assert.ok(emails.includes("john.doe@company.com"));
  assert.ok(emails.includes("sales@startup.io"));
  console.log("  ✔ testEmailExtraction passed");
}

function testPhoneExtraction() {
  const text = "Call our hotline at +1 (555) 234-5678 or reach direct: 415-555-0199.";
  const phones = LeadExtractor.findPhones(text);
  assert.strictEqual(phones.length, 2);
  console.log("  ✔ testPhoneExtraction passed");
}

function testCleanText() {
  const dirty = "  Senior \n Software \t  Engineer   ";
  assert.strictEqual(LeadExtractor.cleanText(dirty), "Senior Software Engineer");
  console.log("  ✔ testCleanText passed");
}

function testMockLinkedInExtraction() {
  // Simulated DOM tree
  const mockDoc = {
    body: { innerText: "Contact: ceo@techcorp.com" },
    querySelector(selector) {
      if (selector.includes("text-heading-xlarge")) {
        return { textContent: "Alex Morgan" };
      }
      if (selector.includes("text-body-medium")) {
        return { textContent: "Founder & CTO at TechCorp" };
      }
      if (selector.includes("text-body-small")) {
        return { textContent: "San Francisco Bay Area" };
      }
      return null;
    }
  };

  const lead = LeadExtractor.extractFromDocument(mockDoc, "https://www.linkedin.com/in/alexmorgan");
  assert.strictEqual(lead.name, "Alex Morgan");
  assert.strictEqual(lead.headline, "Founder & CTO at TechCorp");
  assert.strictEqual(lead.company, "TechCorp");
  assert.strictEqual(lead.location, "San Francisco Bay Area");
  assert.strictEqual(lead.email, "ceo@techcorp.com");
  assert.strictEqual(lead.source, "LinkedIn");
  console.log("  ✔ testMockLinkedInExtraction passed");
}

function testMockGitHubExtraction() {
  const mockDoc = {
    body: { innerText: "Reach out at dev@github.com" },
    querySelector(selector) {
      if (selector.includes("p-name")) return { textContent: "Sarah Connor" };
      if (selector.includes("p-note")) return { textContent: "Open source contributor & Rust enthusiast" };
      if (selector.includes("p-label")) return { textContent: "Austin, TX" };
      return null;
    }
  };

  const lead = LeadExtractor.extractFromDocument(mockDoc, "https://github.com/sarahconnor");
  assert.strictEqual(lead.name, "Sarah Connor");
  assert.strictEqual(lead.headline, "Open source contributor & Rust enthusiast");
  assert.strictEqual(lead.location, "Austin, TX");
  assert.strictEqual(lead.email, "dev@github.com");
  assert.strictEqual(lead.source, "GitHub");
  console.log("  ✔ testMockGitHubExtraction passed");
}

module.exports = {
  run() {
    console.log("Running Extractor Tests...");
    testEmailExtraction();
    testPhoneExtraction();
    testCleanText();
    testMockLinkedInExtraction();
    testMockGitHubExtraction();
  }
};
