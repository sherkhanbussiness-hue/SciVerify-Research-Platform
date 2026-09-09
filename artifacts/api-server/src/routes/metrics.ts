import { Router, type IRouter } from "express";
import { listResults } from "../harness/store";
import { sanitizeString } from "../lib/sanitize";

const router: IRouter = Router();

/**
 * GET /api/metrics/calibration
 *
 * Returns a calibration report that shows how well the agent's self-reported
 * confidence scores predict actual correctness. Calibration is computed per
 * 20-point bucket: for each bucket we count how many runs fell in it and what
 * fraction of those were actually correct.
 *
 * A perfectly calibrated agent would have actual_accuracy ≈ bucket_midpoint / 100
 * for every bucket.
 *
 * Only runs that include a `self_reported_confidence` value are included.
 *
 * Response shape:
 * {
 *   total_with_confidence: number,     // runs that had a confidence score
 *   total_without_confidence: number,  // runs that lacked a confidence score
 *   buckets: Array<{
 *     label: string,                   // e.g. "0-20"
 *     min: number,                     // inclusive lower bound
 *     max: number,                     // exclusive upper bound (100 is inclusive for last bucket)
 *     midpoint: number,                // centre of bucket (ideal calibration target)
 *     count: number,                   // number of runs in this bucket
 *     correct_count: number,           // how many were correct (correct === true)
 *     actual_accuracy: number | null,  // correct_count / count, or null if count === 0
 *     ideal_accuracy: number           // midpoint / 100 — what a perfect agent would score
 *   }>
 * }
 */
router.get("/metrics/calibration", (_req, res) => {
  try {
    const allResults = listResults();

    const withConfidence = allResults.filter(
      (r) => typeof r.self_reported_confidence === "number" && Number.isFinite(r.self_reported_confidence),
    );
    const withoutConfidence = allResults.length - withConfidence.length;

    // Define 5 equal-width buckets across [0, 100]
    const BUCKET_SIZE = 20;
    const buckets = Array.from({ length: 5 }, (_, i) => {
      const min = i * BUCKET_SIZE;
      const max = min + BUCKET_SIZE; // exclusive except for the last bucket
      const label = `${min}-${max}`;
      const midpoint = min + BUCKET_SIZE / 2;

      const inBucket = withConfidence.filter((r) => {
        const c = r.self_reported_confidence as number;
        // Last bucket (80-100) is fully inclusive
        return i === 4 ? c >= min && c <= 100 : c >= min && c < max;
      });

      const count = inBucket.length;
      const correct_count = inBucket.filter((r) => r.correct === true).length;
      const actual_accuracy = count > 0 ? correct_count / count : null;

      return {
        label,
        min,
        max: i === 4 ? 100 : max,
        midpoint,
        count,
        correct_count,
        actual_accuracy,
        ideal_accuracy: midpoint / 100,
      };
    });

    res.json({
      total_with_confidence: withConfidence.length,
      total_without_confidence: withoutConfidence,
      buckets,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to compute calibration metrics";
    res.status(500).json({ error: "Internal server error", message: sanitizeString(message) });
  }
});

export default router;
