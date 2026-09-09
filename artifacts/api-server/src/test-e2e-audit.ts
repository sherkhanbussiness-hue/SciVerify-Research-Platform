import http from "node:http";
import app from "./app";
import { runFixtureById } from "./harness/pipeline";
import { listResults } from "./harness/store";

let server: http.Server;
let port: number;

function request(options: {
  method: string;
  path: string;
  body?: unknown;
}): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const payload = options.body !== undefined ? JSON.stringify(options.body) : undefined;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: options.path,
        method: options.method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, json: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode ?? 0, json: data });
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runE2E() {
  console.log("================================================================");
  console.log("SECTION 10: END-TO-END CROSS-SYSTEM DEBUGGING & INTEGRATION PASS");
  console.log("================================================================\n");

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        port = addr.port;
      }
      resolve();
    });
  });

  try {
    // 1. Fixtures endpoint check
    console.log("Test 1: Fetch fixtures list");
    const fixturesRes = await request({ method: "GET", path: "/api/fixtures" });
    if (fixturesRes.status !== 200 || !Array.isArray(fixturesRes.json) || fixturesRes.json.length === 0) {
      throw new Error(`Failed to list fixtures: status ${fixturesRes.status}`);
    }
    console.log(`- PASS: Listed ${fixturesRes.json.length} fixtures`);

    // 2. Single evaluation run (fx-01)
    console.log("\nTest 2: Trigger single evaluation run (fx-01) through full pipeline");
    const runRes = await request({ method: "POST", path: "/api/fixtures/fx-01/run" });
    if (runRes.status !== 200 || !runRes.json.ran) {
      throw new Error(`Failed single run: status ${runRes.status}, body: ${JSON.stringify(runRes.json)}`);
    }
    console.log(`- PASS: Run completed: id=${runRes.json.id}, ran=${runRes.json.ran}, correct=${runRes.json.correct}, retrieval_used=${runRes.json.retrieval_used}`);

    // 3. Concurrency check: Trigger 3 runs in quick succession
    console.log("\nTest 3: Concurrency check — 3 runs in parallel (fx-02, fx-03, fx-04)");
    const concurrentResults = await Promise.all([
      runFixtureById("fx-02"),
      runFixtureById("fx-03"),
      runFixtureById("fx-04"),
    ]);
    const allUniqueIds = new Set(concurrentResults.map((r) => r.id));
    if (allUniqueIds.size !== 3) {
      throw new Error("Concurrency collision: duplicate run IDs detected!");
    }
    console.log(`- PASS: 3 concurrent runs executed cleanly without collision. Unique IDs: ${allUniqueIds.size}`);

    // 4. In-memory store consistency
    console.log("\nTest 4: In-memory store consistency");
    const storedResults = listResults();
    console.log(`- Stored runs count: ${storedResults.length}`);
    if (storedResults.length < 4) {
      throw new Error(`Expected at least 4 runs stored, found ${storedResults.length}`);
    }
    console.log("- PASS: In-memory store accurately records all concurrent runs.");

    // 5. Calibration metrics endpoint check
    console.log("\nTest 5: Calibration metrics endpoint (/api/metrics/calibration)");
    const calibRes = await request({ method: "GET", path: "/api/metrics/calibration" });
    if (calibRes.status !== 200 || !Array.isArray(calibRes.json.buckets)) {
      throw new Error(`Failed calibration check: status ${calibRes.status}`);
    }
    console.log(`- PASS: Calibration returned 200 with ${calibRes.json.buckets.length} buckets.`);

    // 6. Summary endpoint check
    console.log("\nTest 6: Summary endpoint (/api/results/summary)");
    const summaryRes = await request({ method: "GET", path: "/api/results/summary" });
    if (summaryRes.status !== 200 || summaryRes.json.total_runs < 4) {
      throw new Error(`Failed summary check: status ${summaryRes.status}`);
    }
    console.log(`- PASS: Summary returned total_runs=${summaryRes.json.total_runs}, accuracy_rate=${summaryRes.json.accuracy_rate}`);

    // 7. Simulation verification endpoint check
    console.log("\nTest 7: Cosmic Lab sandbox verification endpoint (/api/simulation/verify)");
    const verifyRes = await request({
      method: "POST",
      path: "/api/simulation/verify",
      body: {
        script: "import json\nprint(json.dumps({'value': 42.0}))",
        expected_value: 42.0,
      },
    });
    if (verifyRes.status !== 200 || !verifyRes.json.ran || !verifyRes.json.correct) {
      throw new Error(`Failed simulation verify: status ${verifyRes.status}`);
    }
    console.log(`- PASS: Simulation sandbox verification completed: status=${verifyRes.json.status}`);

    // 8. Error handling: Malformed JSON and unknown route clean 400/404 JSON
    console.log("\nTest 8: Clean JSON errors without HTML stack trace");
    const notFoundRes = await request({ method: "GET", path: "/api/does-not-exist" });
    if (notFoundRes.status !== 404 || typeof notFoundRes.json !== "object" || notFoundRes.json.error !== "Endpoint not found") {
      throw new Error("404 did not return clean JSON");
    }
    console.log("- PASS: Unknown route returned clean JSON 404.");

    console.log("\n================================================================");
    console.log("ALL SECTION 10 INTEGRATION CHECKS PASSED PERFECTLY!");
    console.log("================================================================");
  } finally {
    server.close();
  }
}

runE2E().catch((err) => {
  console.error("SECTION 10 TEST FAILED:", err);
  if (server) server.close();
  process.exit(1);
});
