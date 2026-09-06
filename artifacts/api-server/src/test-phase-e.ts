import { runSandboxed } from "./harness/sandbox";
import { FIXTURES } from "./harness/fixtures";
import { gradeFixture } from "./harness/grader";
import { validateScriptSecurity } from "./harness/security";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";

async function runPhaseETests() {
  console.log("==================================================");
  console.log("PHASE E: COMPREHENSIVE QA & RELIABILITY TEST SUITE");
  console.log("==================================================\n");

  const results: Record<string, boolean> = {};

  // 1. Crash test: Python syntax error
  console.log("Test 1: Sandbox Crash (Syntax Error)");
  const syntaxErrorCode = "def broken(\n  print('missing paren'";
  const crashCapture1 = await runSandboxed(syntaxErrorCode, 5000);
  const crashGrade1 = gradeFixture(FIXTURES[0], crashCapture1);
  const passCrash1 = !crashGrade1.ran && crashGrade1.correct === null && crashCapture1.crashed;
  console.log(`- ran: ${crashGrade1.ran}, correct: ${crashGrade1.correct}, crashed: ${crashCapture1.crashed} => ${passCrash1 ? "PASS" : "FAIL"}`);
  results["crash_syntax_error"] = passCrash1;

  // 2. Crash test: Runtime Exception
  console.log("\nTest 2: Sandbox Crash (Runtime Exception)");
  const exceptionCode = "raise RuntimeError('Scientific simulation exploded')";
  const crashCapture2 = await runSandboxed(exceptionCode, 5000);
  const crashGrade2 = gradeFixture(FIXTURES[0], crashCapture2);
  const passCrash2 = !crashGrade2.ran && crashGrade2.correct === null && crashCapture2.crashed;
  console.log(`- ran: ${crashGrade2.ran}, correct: ${crashGrade2.correct}, error: ${crashGrade2.error} => ${passCrash2 ? "PASS" : "FAIL"}`);
  results["crash_runtime_exception"] = passCrash2;

  // 3. No output test: Process exits 0 but prints nothing
  console.log("\nTest 3: No Output (Exit 0, empty stdout)");
  const emptyCode = "x = 42\n# prints nothing";
  const emptyCapture = await runSandboxed(emptyCode, 5000);
  const emptyGrade = gradeFixture(FIXTURES[0], emptyCapture);
  const passEmpty = emptyGrade.ran === true && emptyGrade.correct === false && emptyGrade.error !== null;
  console.log(`- ran: ${emptyGrade.ran}, correct: ${emptyGrade.correct}, error: ${emptyGrade.error} => ${passEmpty ? "PASS" : "FAIL"}`);
  results["no_output"] = passEmpty;

  // 4. Malformed output test: Process prints non-JSON text
  console.log("\nTest 4: Malformed Output (Exit 0, non-JSON text)");
  const malformedCode = "print('Hello, this is just plain text, not JSON!')";
  const malformedCapture = await runSandboxed(malformedCode, 5000);
  const malformedGrade = gradeFixture(FIXTURES[0], malformedCapture);
  const passMalformed = malformedGrade.ran === true && malformedGrade.correct === false && malformedGrade.error !== null;
  console.log(`- ran: ${malformedGrade.ran}, correct: ${malformedGrade.correct}, error: ${malformedGrade.error} => ${passMalformed ? "PASS" : "FAIL"}`);
  results["malformed_output"] = passMalformed;

  // 5. Security & Isolation test: Network attempt (assert import-level rejection)
  console.log("\nTest 5: Network Access Attempt in Script (Security Check Rejection)");
  const netCode = `
try:
    import urllib.request
    urllib.request.urlopen('http://192.0.2.1:1', timeout=0.5)
except Exception as e:
    import json
    print(json.dumps({"value": 0, "net_error": str(type(e).__name__)}))
`;
  const netSecurityCheck = validateScriptSecurity(netCode);
  const passNet = !netSecurityCheck.valid;
  console.log(`- network import rejected by security check: valid=${netSecurityCheck.valid}, reason="${netSecurityCheck.reason}" => ${passNet ? "PASS" : "FAIL"}`);
  results["network_access_rejected"] = passNet;

  // 5b. Security & Isolation test: Filesystem write attempt
  console.log("\nTest 5b: Filesystem Write Attempt in Script (Security Check Rejection)");
  const fsCode = `
try:
    with open("unauthorized_write.txt", "w") as f:
        f.write("malicious payload")
    import json
    print(json.dumps({"value": 0, "fs_write": "success"}))
except Exception as e:
    import json
    print(json.dumps({"value": 0, "fs_error": str(type(e).__name__)}))
`;
  const fsSecurityCheck = validateScriptSecurity(fsCode);
  const passFs = !fsSecurityCheck.valid;
  console.log(`- filesystem write rejected by security check: valid=${fsSecurityCheck.valid}, reason="${fsSecurityCheck.reason}" => ${passFs ? "PASS" : "FAIL"}`);
  results["filesystem_access_blocked"] = passFs;

  // 6. Numeric edge cases: NaN, Infinity, -0, Extreme Floats
  console.log("\nTest 6: Numeric Edge Cases");
  
  // 6a: NaN
  const nanCode = `
import json, math
print(json.dumps({"value": "NaN"}))
`;
  const nanCapture = await runSandboxed(nanCode, 5000);
  const nanGrade = gradeFixture(FIXTURES[0], nanCapture);
  const passNaN = nanGrade.ran === true && nanGrade.correct === false;
  console.log(`- NaN: ran=${nanGrade.ran}, correct=${nanGrade.correct} => ${passNaN ? "PASS" : "FAIL"}`);
  results["numeric_nan"] = passNaN;

  // 6b: Infinity
  const infCode = `
import json
print(json.dumps({"value": "Infinity"}))
`;
  const infCapture = await runSandboxed(infCode, 5000);
  const infGrade = gradeFixture(FIXTURES[0], infCapture);
  const passInf = infGrade.ran === true && infGrade.correct === false;
  console.log(`- Infinity: ran=${infGrade.ran}, correct=${infGrade.correct} => ${passInf ? "PASS" : "FAIL"}`);
  results["numeric_infinity"] = passInf;

  // 6c: Negative Zero
  const negZeroCode = `
import json
print(json.dumps({"value": -0.0}))
`;
  const negZeroCapture = await runSandboxed(negZeroCode, 5000);
  const negZeroGrade = gradeFixture(FIXTURES[0], negZeroCapture);
  const passNegZero = negZeroGrade.ran === true && negZeroGrade.correct === false; // -0 is not 5544.93
  console.log(`- Negative Zero: ran=${negZeroGrade.ran}, correct=${negZeroGrade.correct} => ${passNegZero ? "PASS" : "FAIL"}`);
  results["numeric_negative_zero"] = passNegZero;

  // 6d: Extreme Floats (Scientific notation)
  const extremeCode = `
import json
print(json.dumps({"value": 1.23456789e-20}))
`;
  const extremeCapture = await runSandboxed(extremeCode, 5000);
  const extremeGrade = gradeFixture(FIXTURES[0], extremeCapture);
  const passExtreme = extremeGrade.ran === true && extremeGrade.correct === false;
  console.log(`- Extreme float: ran=${extremeGrade.ran}, correct=${extremeGrade.correct} => ${passExtreme ? "PASS" : "FAIL"}`);
  results["numeric_extreme_float"] = passExtreme;

  // 7. Resource leak test: Repeated runs (10 runs in tight loop)
  console.log("\nTest 7: Resource Leak Check (10 repeated runs in tight loop)");
  const initialTempFiles = (await readdir(tmpdir())).filter((f) => f.startsWith("sciverify-"));
  console.log(`Initial sciverify temp directories: ${initialTempFiles.length}`);

  for (let i = 0; i < 10; i++) {
    const code = `
import json
print(json.dumps({"value": ${i}}))
`;
    await runSandboxed(code, 5000);
  }

  const finalTempFiles = (await readdir(tmpdir())).filter((f) => f.startsWith("sciverify-"));
  console.log(`Final sciverify temp directories: ${finalTempFiles.length}`);
  const passLeaks = finalTempFiles.length === initialTempFiles.length;
  console.log(`- Temp directories cleaned up: ${passLeaks ? "PASS" : "FAIL"}`);
  results["resource_leaks_temp_dirs"] = passLeaks;

  console.log("\n==================================================");
  console.log("SUMMARY OF PHASE E QA RESULTS:");
  console.log("==================================================");
  let allPass = true;
  for (const [key, ok] of Object.entries(results)) {
    console.log(`  ${key.padEnd(30)}: ${ok ? "PASS" : "FAIL"}`);
    if (!ok) allPass = false;
  }
  console.log("==================================================");
  if (!allPass) {
    throw new Error("One or more QA tests failed!");
  }
  console.log("ALL PHASE E QA TESTS PASSED!\n");
}

runPhaseETests().catch((err) => {
  console.error("Test suite error:", err);
  process.exit(1);
});
