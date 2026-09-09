import { Router, type Request, type Response, type IRouter } from "express";
import { FIXTURES } from "../harness/fixtures";
import { logger } from "../lib/logger";
import { sanitizeString } from "../lib/sanitize";

export interface DatasetItem {
  id: string;
  name: string;
  domain: "Physics" | "Earth Science" | "Astronomy" | "Climate" | "Data Analysis";
  records: string;
  source: string;
  license: string;
  version: string;
  updated: string;
  description: string;
  taskId?: string;
}

// In-memory dataset repository initialized with comprehensive scientific seeds
const DATASETS: DatasetItem[] = [
  {
    id: "ds-newton-01",
    name: "Pinned Newtonian Constants & Gravitational Ephemeris",
    domain: "Physics",
    records: "500",
    source: "CODATA 2018 / CGPM Standards",
    license: "Internal",
    version: "v2.1",
    updated: new Date().toLocaleDateString(),
    description: "Deterministic orbital, gravity, and ballistic reference standards with verified tolerance bounds.",
  },
  {
    id: "ds-kepler-01",
    name: "NASA Kepler Light Curve Transit Library",
    domain: "Astronomy",
    records: "18.4k",
    source: "NASA Exoplanet Archive",
    license: "CC BY 4.0",
    version: "v2.3",
    updated: new Date().toLocaleDateString(),
    description: "Curated orbital parameters and high-precision stellar photometric flux series.",
  },
  {
    id: "ds-noaa-01",
    name: "NOAA GHCN Station Climate Anomalies",
    domain: "Earth Science",
    records: "1.2M",
    source: "NOAA National Centers for Environmental Information",
    license: "Public domain",
    version: "v1.4",
    updated: new Date().toLocaleDateString(),
    description: "Station-level monthly mean temperature anomalies and baseline climatologies.",
  },
  {
    id: "ds-grace-01",
    name: "GRACE Satellite Gravimetry Glacier Mass Balance",
    domain: "Climate",
    records: "8.7k",
    source: "NASA JPL / GFZ Potsdam",
    license: "CC BY 4.0",
    version: "v3.0",
    updated: new Date().toLocaleDateString(),
    description: "Annual glacier mass-loss rates derived from satellite gravity anomalies.",
  },
  {
    id: "ds-jwst-01",
    name: "JWST Deep Field Spectroscopic Galaxy Catalog",
    domain: "Astronomy",
    records: "42.1k",
    source: "Space Telescope Science Institute (STScI)",
    license: "Open Access",
    version: "v1.1",
    updated: new Date().toLocaleDateString(),
    description: "High-redshift galaxy spectra, photometric redshifts, and emission line fluxes.",
  },
  {
    id: "ds-cern-01",
    name: "CERN Open Data Particle Scattering Kinematics",
    domain: "Physics",
    records: "250k",
    source: "CERN Open Data Portal",
    license: "CC0 1.0",
    version: "v2.0",
    updated: new Date().toLocaleDateString(),
    description: "Collision invariant mass reconstructions and momentum vectors for particle physics benchmarks.",
  },
];

const router: IRouter = Router();

// GET /api/datasets
router.get("/datasets", (_req: Request, res: Response) => {
  try {
    res.json(DATASETS);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list datasets";
    res.status(500).json({ error: "Internal server error", message: sanitizeString(message) });
  }
});

// POST /api/datasets
router.post("/datasets", (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<DatasetItem>;
    const name = sanitizeString(String(body.name || "").trim());
    if (!name) {
      res.status(400).json({ error: "Dataset name is required and cannot be blank." });
      return;
    }

    const domain = (body.domain || "Physics") as DatasetItem["domain"];
    const validDomains = ["Physics", "Earth Science", "Astronomy", "Climate", "Data Analysis"];
    if (!validDomains.includes(domain)) {
      res.status(400).json({ error: `Invalid domain. Must be one of: ${validDomains.join(", ")}` });
      return;
    }

    const newDataset: DatasetItem = {
      id: `ds-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      domain,
      records: sanitizeString(String(body.records || "1").trim()),
      source: sanitizeString(String(body.source || "User upload").trim()),
      license: sanitizeString(String(body.license || "CC BY 4.0").trim()),
      version: sanitizeString(String(body.version || "v1.0").trim()),
      updated: new Date().toLocaleDateString(),
      description: sanitizeString(String(body.description || `Dataset added for ${domain} research`).trim()),
      taskId: body.taskId ? sanitizeString(String(body.taskId)) : undefined,
    };

    DATASETS.unshift(newDataset);

    // If a taskId was supplied, associate it with that fixture in memory
    if (newDataset.taskId) {
      const fixture = FIXTURES.find((f) => f.id === newDataset.taskId);
      if (fixture) {
        fixture.dataset = newDataset.name;
      }
    }

    logger.info({ datasetId: newDataset.id, name: newDataset.name }, "Created new dataset");
    res.status(201).json(newDataset);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create dataset";
    res.status(500).json({ error: "Internal server error", message: sanitizeString(message) });
  }
});

// POST /api/fixtures/:id/dataset or /api/tasks/:id/dataset
const attachDatasetHandler = (req: Request, res: Response) => {
  try {
    const taskId = req.params["id"];
    const { datasetName, datasetId } = req.body as { datasetName?: string; datasetId?: string };

    let resolvedName = datasetName;
    if (!resolvedName && datasetId) {
      const found = DATASETS.find((d) => d.id === datasetId);
      if (found) resolvedName = found.name;
    }

    if (!resolvedName || !resolvedName.trim()) {
      res.status(400).json({ error: "datasetName or valid datasetId is required." });
      return;
    }

    const cleanName = sanitizeString(resolvedName.trim());
    const fixture = FIXTURES.find((f) => f.id === taskId);
    if (fixture) {
      fixture.dataset = cleanName;
    }

    logger.info({ taskId, dataset: cleanName }, "Attached dataset to task/fixture");
    res.json({ success: true, taskId, dataset: cleanName });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to attach dataset";
    res.status(500).json({ error: "Internal server error", message: sanitizeString(message) });
  }
};

router.post("/fixtures/:id/dataset", attachDatasetHandler);
router.post("/tasks/:id/dataset", attachDatasetHandler);

export default router;
