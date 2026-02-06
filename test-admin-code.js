// Quick test to verify admin code validation
const testCode = "NULO2026ADMIN";
console.log("Code:", testCode);
console.log("Length:", testCode.length);
console.log("Expected: 12 characters");

// Test the regex
const regex = /^NULO2026ADMIN$/;
console.log("Regex test:", regex.test(testCode));
