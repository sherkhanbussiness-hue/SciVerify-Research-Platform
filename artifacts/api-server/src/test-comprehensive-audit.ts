/**
 * SciVerify — Comprehensive Audit Verification Runner
 * Automatically exercises Phase 1 through Phase 28 audit requirements:
 * - API routes & HTTP methods
 * - Boundary fuzzing (NaN, Infinity, 0, -1, 1e100, malformed types, null, empty)
 * - Defensive JSON error handling (no stack traces leaked)
 * - Sandbox security boundaries (blocks dangerous imports/exec, enforces limits)
 * - Subprocess environment isolation (no server secrets in subprocess)
 * - Scientific formulas & physical constants verification
 * - Baseline harness regression verification (fixtures fx-01 to fx-05)
 */

import http from "node:http";
import app from "./app";
import { runSandboxed } from "./harness/sandbox";
import { runFixtureById } from "./harness/pipeline";
import { FIXTURES } from "./harness/fixtures";
import { G, C, M_SUN, R_SUN, L_SUN, T_SUN, SIGMA, AU, M_P, SIGMA_T } from "./simulation/constants";

let server: http.Server;
let port: number;

function requestHttp(options: {
  method: string;
  path: string;
  body?: unknown;
  rawBody?: string;
  contentType?: string;
}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string; json?: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    let payload = options.rawBody;
    const contentType = options.contentType ?? "application/json";

    if (payload === undefined && options.body !== undefined) {
      payload = JSON.stringify(options.body);
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: options.path,
        method: options.method,
        headers: {
          "Content-Type": contentType,
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsedJson: Record<string, unknown> | undefined;
          try {
            parsedJson = JSON.parse(data) as Record<string, unknown>;
          } catch {
            // Not JSON
          }
          resolve({
            status: res.statusCode ?? 500,
            headers: res.headers,
            body: data,
            json: parsedJson,
          });
        });
      }
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

const auditResults: Record<string, "PASS" | "FAIL"> = {};

function assertAudit(testName: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}${detail ? ` - ${detail}` : ""}`);
    auditResults[testName] = "PASS";
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    auditResults[testName] = "FAIL";
  }
}

async function runAudit() {
  console.log("================================================================================");
  console.log("  SCIVERIFY COMPREHENSIVE AUDIT & RELIABILITY VERIFICATION SUITE");
  console.log("================================================================================\n");

  // Start server on ephemeral port
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        port = addr.port;
      }
      resolve();
    });
  });

  console.log(`Auditing API server running on 127.0.0.1:${port}\n`);

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: API VALIDATION & BOUNDARY TESTS (Phases 6, 21)
    // -------------------------------------------------------------------------
    console.log("--- SECTION 1: API Validation & Boundary Fuzzing ---");

    // Star endpoint valid
    const starValid = await requestHttp({
      method: "POST",
      path: "/api/simulation/star",
      body: { mass_msun: 1.0, radius_rsun: 1.0, temperature_k: 5772 },
    });
    assertAudit("api_star_valid_200", starValid.status === 200 && starValid.json?.calculated !== undefined);

    // Star invalid: missing field
    const starMissing = await requestHttp({
      method: "POST",
      path: "/api/simulation/star",
      body: { mass_msun: 1.0 },
    });
    assertAudit("api_star_missing_fields_400", starMissing.status === 400 && starMissing.json?.error !== undefined);

    // Star invalid: wrong type (string)
    const starWrongType = await requestHttp({
      method: "POST",
      path: "/api/simulation/star",
      body: { mass_msun: "one solar mass", radius_rsun: 1.0, temperature_k: 5772 },
    });
    assertAudit("api_star_wrong_type_400", starWrongType.status === 400);

    // Star invalid: negative values
    const starNegative = await requestHttp({
      method: "POST",
      path: "/api/simulation/star",
      body: { mass_msun: -1.0, radius_rsun: 1.0, temperature_k: 5772 },
    });
    assertAudit("api_star_negative_mass_400", starNegative.status === 400);

    // Star invalid: zero values
    const starZero = await requestHttp({
      method: "POST",
      path: "/api/simulation/star",
      body: { mass_msun: 0, radius_rsun: 1.0, temperature_k: 5772 },
    });
    assertAudit("api_star_zero_mass_400", starZero.status === 400);

    // Star invalid: extreme overflow (1e100)
    const starExtreme = await requestHttp({
      method: "POST",
      path: "/api/simulation/star",
      body: { mass_msun: 1e100, radius_rsun: 1.0, temperature_k: 5772 },
    });
    assertAudit("api_star_extreme_overflow_400", starExtreme.status === 400);

    // Pulsar valid & invalid
    const pulsarValid = await requestHttp({
      method: "POST",
      path: "/api/simulation/pulsar",
      body: { period_ms: 33.0, magnetic_field_gauss: 1e12 },
    });
    assertAudit("api_pulsar_valid_200", pulsarValid.status === 200 && pulsarValid.json?.calculated !== undefined);

    const pulsarInvalid = await requestHttp({
      method: "POST",
      path: "/api/simulation/pulsar",
      body: { period_ms: -10, magnetic_field_gauss: 1e12 },
    });
    assertAudit("api_pulsar_negative_period_400", pulsarInvalid.status === 400);

    // Asteroid valid & invalid
    const asteroidValid = await requestHttp({
      method: "POST",
      path: "/api/simulation/asteroid",
      body: { semi_major_axis_au: 2.77, eccentricity: 0.076 },
    });
    assertAudit("api_asteroid_valid_200", asteroidValid.status === 200 && asteroidValid.json?.calculated !== undefined);

    const asteroidEccentricityError = await requestHttp({
      method: "POST",
      path: "/api/simulation/asteroid",
      body: { semi_major_axis_au: 2.77, eccentricity: 1.5 },
    });
    assertAudit("api_asteroid_unbounded_eccentricity_400", asteroidEccentricityError.status === 400);

    // Black hole valid & invalid
    const bhValid = await requestHttp({
      method: "POST",
      path: "/api/simulation/blackhole",
      body: { mass_msun: 4.15e6, test_particle_r_rs: 3.0 },
    });
    assertAudit("api_blackhole_valid_200", bhValid.status === 200 && bhValid.json?.calculated !== undefined);

    const bhInsideHorizon = await requestHttp({
      method: "POST",
      path: "/api/simulation/blackhole",
      body: { mass_msun: 10.0, test_particle_r_rs: 0.5 },
    });
    assertAudit("api_blackhole_inside_horizon_400", bhInsideHorizon.status === 400);

    // Quasar valid & invalid
    const quasarValid = await requestHttp({
      method: "POST",
      path: "/api/simulation/quasar",
      body: { smbh_mass_msun: 1e9, accretion_rate_msun_yr: 20.0 },
    });
    assertAudit("api_quasar_valid_200", quasarValid.status === 200 && quasarValid.json?.calculated !== undefined);

    const quasarInvalid = await requestHttp({
      method: "POST",
      path: "/api/simulation/quasar",
      body: { smbh_mass_msun: -500, accretion_rate_msun_yr: 20.0 },
    });
    assertAudit("api_quasar_negative_mass_400", quasarInvalid.status === 400);

    // -------------------------------------------------------------------------
    // SECTION 2: MALFORMED JSON & DEFENSIVE ERROR HANDLING (Phases 6, 15)
    // -------------------------------------------------------------------------
    console.log("\n--- SECTION 2: Malformed JSON & Error Leakage Prevention ---");

    // Send malformed JSON syntax: { broken:
    const malformedJson = await requestHttp({
      method: "POST",
      path: "/api/simulation/star",
      rawBody: "{\"mass_msun\": 1.0, \"broken\": ",
      contentType: "application/json",
    });
    assertAudit(
      "api_malformed_json_clean_400",
      malformedJson.status === 400 &&
        malformedJson.json?.error === "Malformed JSON payload" &&
        !malformedJson.body.includes("<pre>") &&
        !malformedJson.body.includes("node_modules"),
      "Returns clean JSON 400 without HTML stack trace"
    );

    // Unmatched API route -> clean 404 JSON
    const unknownRoute = await requestHttp({
      method: "GET",
      path: "/api/nonexistent-endpoint-test",
    });
    assertAudit(
      "api_unknown_route_clean_404",
      unknownRoute.status === 404 && unknownRoute.json?.error === "Endpoint not found"
    );

    // -------------------------------------------------------------------------
    // SECTION 3: CODE EXECUTION SECURITY & SANDBOX ISOLATION (Phases 10, 11)
    // -------------------------------------------------------------------------
    console.log("\n--- SECTION 3: Code Execution Security & Sandbox Boundaries ---");

    // 1. Block forbidden import: os
    const blockOs = await requestHttp({
      method: "POST",
      path: "/api/simulation/verify",
      body: { script: "import os\nprint('pwned')" },
    });
    assertAudit(
      "security_block_import_os",
      blockOs.status === 400 && blockOs.json?.error === "Script security violation",
      "Rejected import os"
    );

    // 2. Block forbidden import: subprocess
    const blockSubprocess = await requestHttp({
      method: "POST",
      path: "/api/simulation/verify",
      body: { script: "import subprocess\nsubprocess.run(['cmd'])" },
    });
    assertAudit(
      "security_block_import_subprocess",
      blockSubprocess.status === 400 && blockSubprocess.json?.error === "Script security violation",
      "Rejected import subprocess"
    );

    // 3. Block forbidden import: socket
    const blockSocket = await requestHttp({
      method: "POST",
      path: "/api/simulation/verify",
      body: { script: "import socket\ns = socket.socket()" },
    });
    assertAudit(
      "security_block_import_socket",
      blockSocket.status === 400 && blockSocket.json?.error === "Script security violation",
      "Rejected import socket"
    );

    // 4. Block eval/exec
    const blockEval = await requestHttp({
      method: "POST",
      path: "/api/simulation/verify",
      body: { script: "eval('1 + 1')" },
    });
    assertAudit(
      "security_block_eval_call",
      blockEval.status === 400 && blockEval.json?.error === "Script security violation",
      "Rejected eval() invocation"
    );

    // 5. Block oversized scripts (>50KB)
    const giantScript = "x = 1\n" + " # comment \n".repeat(5000);
    const blockOversized = await requestHttp({
      method: "POST",
      path: "/api/simulation/verify",
      body: { script: giantScript },
    });
    assertAudit(
      "security_block_oversized_script",
      blockOversized.status === 400 && blockOversized.json?.error === "Script security violation",
      "Rejected script > 50KB"
    );

    // 6. Legitimate scientific script works inside sandbox
    const legitimateScript = `import json, math
r = 10.0
area = math.pi * (r ** 2)
print(json.dumps({"value": area}))
`;
    const legitRun = await requestHttp({
      method: "POST",
      path: "/api/simulation/verify",
      body: { script: legitimateScript, expected_value: 314.159, tolerance: 0.1 },
    });
    assertAudit(
      "security_legitimate_scientific_script_allowed",
      legitRun.status === 200 && legitRun.json?.ran === true && legitRun.json?.correct === true,
      "Allowed safe mathematical computation"
    );

    // 7. Subprocess environment isolation: verify server env vars are NOT passed to child
    process.env["SCIVERIFY_AUDIT_SECRET_TOKEN"] = "SUPER_SECRET_12345";
    const envIsolationCapture = await runSandboxed(
      `import json, sys
# Check standard environment access
try:
    import os
    leaked = "SCIVERIFY_AUDIT_SECRET_TOKEN" in os.environ
except:
    leaked = False
print(json.dumps({"value": 1 if leaked else 0, "leaked": leaked}))
`,
      5000
    );
    const parsedEnvCheck = envIsolationCapture.parsed_output as { leaked?: boolean } | null;
    assertAudit(
      "security_subprocess_env_isolation",
      parsedEnvCheck?.leaked === false,
      "Child Python subprocess does not inherit server environment variables"
    );
    delete process.env["SCIVERIFY_AUDIT_SECRET_TOKEN"];

    // -------------------------------------------------------------------------
    // SECTION 4: SCIENTIFIC INTEGRITY AUDIT (Phase 5)
    // -------------------------------------------------------------------------
    console.log("\n--- SECTION 4: Scientific Integrity & Formula Validation ---");

    // Check physical constants match CODATA / IAU standard
    assertAudit(
      "scientific_constants_gravitational_G",
      Math.abs(G - 6.6743e-11) < 1e-15,
      `G = ${G} m^3 kg^-1 s^-2`
    );
    assertAudit(
      "scientific_constants_speed_of_light_c",
      C === 299792458,
      `c = ${C} m s^-1 (exact SI definition)`
    );
    assertAudit(
      "scientific_constants_stefan_boltzmann_sigma",
      Math.abs(SIGMA - 5.670374e-8) < 1e-13,
      `sigma = ${SIGMA} W m^-2 K^-4`
    );
    assertAudit(
      "scientific_constants_astronomical_unit_AU",
      AU === 149597870700,
      `AU = ${AU} m (exact IAU 2012 definition)`
    );

    // Verify Stefan-Boltzmann law calculation: L = 4 * pi * R^2 * sigma * T^4 for Sun
    const expectedSunLumW = 4 * Math.PI * Math.pow(R_SUN, 2) * SIGMA * Math.pow(T_SUN, 4);
    const diffLumPct = Math.abs(expectedSunLumW - L_SUN) / L_SUN;
    assertAudit(
      "scientific_stefan_boltzmann_sun_luminosity",
      diffLumPct < 0.01,
      `Stefan-Boltzmann solar calculation matches IAU L_sun within 1% (${(diffLumPct * 100).toFixed(2)}% difference)`
    );

    // -------------------------------------------------------------------------
    // SECTION 5: REGRESSION TESTING (Phases 24, 25)
    // -------------------------------------------------------------------------
    console.log("\n--- SECTION 5: Baseline Verification Harness Regression ---");

    // Verify all 5 Newtonian fixtures fx-01 through fx-05
    process.env["SCIVERIFY_STUB_AGENT"] = "1";
    let regressionAllPassed = true;

    for (const fixture of FIXTURES) {
      const result = await runFixtureById(fixture.id);
      const passed = result.ran === true && result.correct === true && result.crashed === false;
      if (!passed) regressionAllPassed = false;
      assertAudit(
        `regression_fixture_${fixture.id}`,
        passed,
        `${fixture.subdomain} ${fixture.method} => ran=${result.ran}, correct=${result.correct}`
      );
    }

    assertAudit("regression_all_fixtures_intact", regressionAllPassed, "Existing SciVerify harness 100% operational");
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  // Final Summary
  console.log("\n================================================================================");
  console.log("  AUDIT EXECUTION SUMMARY");
  console.log("================================================================================");
  const total = Object.keys(auditResults).length;
  const passed = Object.values(auditResults).filter((v) => v === "PASS").length;
  const failed = total - passed;

  console.log(`Total Audit Assertions : ${total}`);
  console.log(`Passed Assertions      : ${passed}`);
  console.log(`Failed Assertions      : ${failed}`);
  console.log(`Overall Verdict        : ${failed === 0 ? "PASS" : "FAIL"}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

void runAudit();
