import { runFixtureById } from "./harness/pipeline";
import { listFixtures } from "./harness/fixtures";
import { summarizeResults } from "./harness/store";

const target = process.argv[2] ?? "fx-01";

async function main() {
  if (target === "all") {
    const results = [];
    for (const fixture of listFixtures()) {
      const result = await runFixtureById(fixture.id);
      results.push(result);
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ fixture_id: fixture.id, ran: result.ran, correct: result.correct, error: result.error, output: result.output, latency_ms: result.latency_ms }, null, 2));
    }
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(summarizeResults(), null, 2));
    return;
  }

  const result = await runFixtureById(target);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
