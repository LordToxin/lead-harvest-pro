/**
 * LeadHarvest Pro - Profile Extraction Engine
 * Supports LinkedIn, GitHub, Twitter/X, and generic web profiles.
 */

const LeadExtractor = {
  // Regex patterns
  EMAIL_REGEX: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE_REGEX: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,

  cleanText(text) {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim();
  },

  findEmails(text) {
    if (!text) return [];
    const matches = text.match(this.EMAIL_REGEX) || [];
    return [...new Set(matches.map(e => e.toLowerCase()))];
  },

  findPhones(text) {
    if (!text) return [];
    const matches = text.match(this.PHONE_REGEX) || [];
    return [...new Set(matches.map(p => this.cleanText(p)))];
  },

  extractFromDocument(doc, currentUrl = "") {
    const url = currentUrl || (typeof window !== "undefined" ? window.location.href : "");
    const bodyText = doc.body ? doc.body.innerText || doc.body.textContent || "" : "";
    const emails = this.findEmails(bodyText);
    const phones = this.findPhones(bodyText);

    let lead = {
      id: "lead_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      name: "",
      headline: "",
      company: "",
      location: "",
      email: emails[0] || "",
      phone: phones[0] || "",
      profileUrl: url,
      source: "web",
      capturedAt: new Date().toISOString(),
      tags: ["New"]
    };

    if (url.includes("linkedin.com")) {
      lead = this.extractLinkedIn(doc, lead, bodyText);
    } else if (url.includes("github.com")) {
      lead = this.extractGitHub(doc, lead, bodyText);
    } else if (url.includes("twitter.com") || url.includes("x.com")) {
      lead = this.extractTwitter(doc, lead, bodyText);
    } else {
      lead = this.extractGeneric(doc, lead);
    }

    // Fallbacks
    if (!lead.name) {
      const title = doc.querySelector("title")?.textContent || "";
      lead.name = this.cleanText(title.split(/[-|–•]/)[0]) || "Unknown Contact";
    }

    return lead;
  },

  extractLinkedIn(doc, baseLead, bodyText) {
    baseLead.source = "LinkedIn";

    // Standard LinkedIn profile top card selectors
    const nameEl = doc.querySelector("h1.text-heading-xlarge, h1.inline.t-24.v-align-middle.break-words, h1");
    if (nameEl) baseLead.name = this.cleanText(nameEl.textContent);

    const headlineEl = doc.querySelector(".text-body-medium.break-words, div.text-body-medium");
    if (headlineEl) baseLead.headline = this.cleanText(headlineEl.textContent);

    // Company from experience or headline
    const companyEl = doc.querySelector("button[aria-label*='Текущая компания'], div.inline-show-more-text--is-collapsed");
    if (companyEl) {
      baseLead.company = this.cleanText(companyEl.textContent);
    } else if (baseLead.headline && baseLead.headline.includes(" at ")) {
      baseLead.company = this.cleanText(baseLead.headline.split(" at ")[1]);
    } else if (baseLead.headline && baseLead.headline.includes(" @ ")) {
      baseLead.company = this.cleanText(baseLead.headline.split(" @ ")[1]);
    } else if (baseLead.headline && baseLead.headline.includes(" в ")) {
      baseLead.company = this.cleanText(baseLead.headline.split(" в ")[1]);
    }

    const locationEl = doc.querySelector(".text-body-small.inline.t-black--light.break-words, span.text-body-small");
    if (locationEl) baseLead.location = this.cleanText(locationEl.textContent);

    return baseLead;
  },

  extractGitHub(doc, baseLead, bodyText) {
    baseLead.source = "GitHub";

    const nameEl = doc.querySelector(".p-name, .vcard-fullname");
    const nicknameEl = doc.querySelector(".p-nickname, .vcard-username");
    baseLead.name = this.cleanText(nameEl?.textContent || nicknameEl?.textContent || "");

    const bioEl = doc.querySelector(".p-note.user-profile-bio, .user-profile-bio");
    if (bioEl) baseLead.headline = this.cleanText(bioEl.textContent);

    const orgEl = doc.querySelector("[data-test-selector='profile-website-url'], .p-org");
    if (orgEl) baseLead.company = this.cleanText(orgEl.textContent);

    const locEl = doc.querySelector("[itemprop='homeLocation'], .p-label");
    if (locEl) baseLead.location = this.cleanText(locEl.textContent);

    return baseLead;
  },

  extractTwitter(doc, baseLead, bodyText) {
    baseLead.source = "Twitter / X";

    const nameEl = doc.querySelector("[data-testid='UserName'] span");
    if (nameEl) baseLead.name = this.cleanText(nameEl.textContent);

    const bioEl = doc.querySelector("[data-testid='UserDescription']");
    if (bioEl) baseLead.headline = this.cleanText(bioEl.textContent);

    const locEl = doc.querySelector("[data-testid='UserLocation']");
    if (locEl) baseLead.location = this.cleanText(locEl.textContent);

    return baseLead;
  },

  extractGeneric(doc, baseLead) {
    baseLead.source = "Web Profile";
    const h1 = doc.querySelector("h1");
    if (h1) baseLead.name = this.cleanText(h1.textContent);

    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute("content");
    if (metaDesc) baseLead.headline = this.cleanText(metaDesc);

    return baseLead;
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = LeadExtractor;
}
