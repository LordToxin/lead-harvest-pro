const assert = require("assert");

function escapeCsv(val) {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function buildCsv(leads) {
  const headers = ["Name", "Headline", "Company", "Location", "Email", "Phone", "Profile URL", "Source", "Captured At"];
  const rows = leads.map((l) => [
    escapeCsv(l.name),
    escapeCsv(l.headline),
    escapeCsv(l.company),
    escapeCsv(l.location),
    escapeCsv(l.email),
    escapeCsv(l.phone),
    escapeCsv(l.profileUrl),
    escapeCsv(l.source),
    escapeCsv(l.capturedAt)
  ]);
  return "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

function testCsvEscaping() {
  assert.strictEqual(escapeCsv('Developer "Guru"'), '"Developer ""Guru"""');
  assert.strictEqual(escapeCsv('New York, NY'), '"New York, NY"');
  assert.strictEqual(escapeCsv(null), '""');
  console.log("  ✔ testCsvEscaping passed");
}

function testCsvGeneration() {
  const mockLeads = [
    {
      name: "Dmitry S.",
      headline: "VP of Engineering",
      company: "Acme, Inc.",
      location: "Berlin, Germany",
      email: "dmitry@acme.com",
      phone: "+49 123 45678",
      profileUrl: "https://linkedin.com/in/dmitry",
      source: "LinkedIn",
      capturedAt: "2026-10-22T10:00:00Z"
    }
  ];

  const csv = buildCsv(mockLeads);
  assert.ok(csv.startsWith("\uFEFFName,Headline,Company"));
  assert.ok(csv.includes('"Dmitry S."'));
  assert.ok(csv.includes('"Acme, Inc."'));
  assert.ok(csv.includes('"dmitry@acme.com"'));
  console.log("  ✔ testCsvGeneration passed");
}

module.exports = {
  run() {
    console.log("Running CSV Export Tests...");
    testCsvEscaping();
    testCsvGeneration();
  }
};
