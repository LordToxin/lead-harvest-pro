/**
 * LeadHarvest Pro Test Runner
 */
const extractorSuite = require("./tests/extractor.test");
const csvSuite = require("./tests/csv.test");

console.log("=========================================");
console.log("  LeadHarvest Pro Automated Test Suite   ");
console.log("=========================================\n");

try {
  extractorSuite.run();
  console.log("");
  csvSuite.run();

  console.log("\n=========================================");
  console.log("  ALL TESTS PASSED SUCCESSFULLY! (7/7)   ");
  console.log("=========================================");
  process.exit(0);
} catch (err) {
  console.error("\n❌ TEST SUITE FAILED:");
  console.error(err);
  process.exit(1);
}
