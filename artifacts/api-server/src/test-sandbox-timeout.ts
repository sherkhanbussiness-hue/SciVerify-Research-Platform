import { runSandboxed } from "./harness/sandbox";
import { FIXTURES } from "./harness/fixtures";
import { gradeFixture } from "./harness/grader";

async function run() {
  console.log("=== Testing Sandbox Timeout & Process Termination ===");
  const infiniteLoopCode = `
import time
print("Starting infinite loop...")
while True:
    time.sleep(0.1)
`;

  const startTime = Date.now();
  const capture = await runSandboxed(infiniteLoopCode, 1500); // 1.5s timeout
  const elapsed = Date.now() - startTime;

  console.log("Elapsed ms:", elapsed);
  console.log("Timed out:", capture.timed_out);
  console.log("Crashed:", capture.crashed);
  console.log("Exit code:", capture.exit_code);
  console.log("Execution time ms:", capture.execution_time_ms);
  console.log("Stdout:", JSON.stringify(capture.stdout));
  console.log("Stderr:", JSON.stringify(capture.stderr));

  const grade = gradeFixture(FIXTURES[0], capture);
  console.log("Grade result:", JSON.stringify(grade, null, 2));

  if (!capture.timed_out) {
    throw new Error("FAIL: capture.timed_out should be true");
  }
  if (grade.ran !== false) {
    throw new Error("FAIL: grade.ran should be false for timeout");
  }
  if (grade.correct !== null) {
    throw new Error("FAIL: grade.correct should be null for timeout");
  }

  console.log("=== Timeout Test PASSED! ===");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
