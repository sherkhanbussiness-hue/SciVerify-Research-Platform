export type Domain = 'Physics' | 'Earth Science' | 'Astronomy' | 'Climate' | 'Data Analysis';
export type RunStatus = 'Success' | 'Failed' | 'Partial';

export interface ScientificTask {
  id: string;
  title: string;
  domain: Domain;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  question: string;
  runtime: string;
  inputs: string[];
  outputs: string[];
  method: string;
  answer: string;
  criteria: string[];
  dataset: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  color: string;
  accent: string;
}

export interface Evaluation {
  id: string;
  taskId: string;
  modelId: string;
  status: RunStatus;
  accuracy: number;
  runtime: number;
  codeLines: number;
  date: string;
  failure?: string;
}

export interface Dataset {
  id: string;
  name: string;
  domain: Domain;
  records: string;
  source: string;
  license: string;
  version: string;
  updated: string;
  description: string;
}

export interface Failure {
  id: string;
  task: string;
  model: string;
  type: string;
  error: string;
  severity: 'High' | 'Medium' | 'Low';
  resolution: string;
}

export const tasks: ScientificTask[] = [
  {
    id: 'orbital-trajectory',
    title: 'Orbital Trajectory Simulation',
    domain: 'Physics',
    difficulty: 'Intermediate',
    description: 'Integrate a two-body orbit and recover the satellite period from position samples.',
    question: 'Simulate the trajectory of a satellite around Earth using Newtonian gravitational dynamics and calculate its orbital period.',
    runtime: '10–15 sec',
    inputs: ['Earth mass: 5.972 × 10²⁴ kg', 'Initial altitude: 400 km', 'Tangential velocity: 7.67 km/s'],
    outputs: ['Position arrays over time', 'Orbital period in seconds', 'Trajectory visualization'],
    method: 'Velocity-Verlet integration with a fixed 1-second step and Earth radius normalization.',
    answer: '5,554 s ± 2.5 s (92.6 minute low Earth orbit)',
    criteria: ['Bound orbit is maintained', 'Period within 1% of reference', 'No energy drift above 0.5%', 'Plot includes Earth and trajectory'],
    dataset: 'Synthetic Physics Fixtures v2.1',
  },
  {
    id: 'gravity-force',
    title: 'Gravitational Force Calculation',
    domain: 'Physics',
    difficulty: 'Beginner',
    description: 'Calculate the force between two bodies and report the result with SI units.',
    question: 'Calculate the gravitational force between Earth and a 1,000 kg satellite at 400 km altitude.',
    runtime: '3–5 sec',
    inputs: ['Earth mass', 'Satellite mass', 'Earth radius', 'Gravitational constant'],
    outputs: ['Force in Newtons', 'Acceleration in m/s²', 'Unit check'],
    method: 'Newtonian inverse-square law with explicit SI conversion.',
    answer: '8,691 N ± 0.5 N',
    criteria: ['Correct constants', 'SI units preserved', 'Inverse-square relationship', 'Result within tolerance'],
    dataset: 'Synthetic Physics Fixtures v2.1',
  },
  {
    id: 'noaa-climate',
    title: 'NOAA Climate Data Analysis',
    domain: 'Earth Science',
    difficulty: 'Intermediate',
    description: 'Estimate a long-term temperature trend from a monthly station time series.',
    question: 'Analyze the annual temperature anomaly trend for the Seattle station from 1980–2023.',
    runtime: '12–20 sec',
    inputs: ['Monthly anomaly CSV', 'Station metadata', 'Baseline period'],
    outputs: ['OLS slope', 'Confidence interval', 'Trend visualization'],
    method: 'Pandas resampling followed by scipy.stats.linregress against decimal year.',
    answer: '+0.23 °C / decade ± 0.04',
    criteria: ['Missing months handled', 'Baseline documented', 'Trend uncertainty reported', 'Reproducible plot'],
    dataset: 'NOAA GHCN Climate v1.4',
  },
  {
    id: 'exoplanet-transit',
    title: 'Exoplanet Transit Detection',
    domain: 'Astronomy',
    difficulty: 'Advanced',
    description: 'Detect a shallow periodic transit signal in noisy stellar brightness data.',
    question: 'Identify the period and transit depth of the injected exoplanet signal in a Kepler light curve.',
    runtime: '25–40 sec',
    inputs: ['Normalized flux series', 'Cadence timestamps', 'Noise estimate'],
    outputs: ['Best period', 'Transit depth', 'Phase-folded light curve'],
    method: 'Box Least Squares periodogram with robust sigma clipping.',
    answer: 'Period 9.72 days; depth 1.14% ± 0.08%',
    criteria: ['Period within 0.1 day', 'False alarm rate below 1%', 'Outliers removed', 'Phase fold shown'],
    dataset: 'Kepler Open Transit Fixtures',
  },
  {
    id: 'glacier-melt',
    title: 'Glacier Melt Analysis',
    domain: 'Climate',
    difficulty: 'Intermediate',
    description: 'Fit a melt-rate trend to annual glacier mass-balance observations.',
    question: 'Estimate the average annual mass loss of the Helheim glacier between 1995 and 2022.',
    runtime: '8–12 sec',
    inputs: ['Annual mass balance', 'Year index', 'Measurement uncertainty'],
    outputs: ['Mass-loss rate', '95% confidence interval', 'Residual diagnostics'],
    method: 'Weighted least squares with uncertainty propagation and residual checks.',
    answer: '−1.84 ± 0.21 Gt / year',
    criteria: ['Uncertainty weighted', 'Sign convention explained', 'Residuals inspected', 'Units preserved'],
    dataset: 'GRACE Glacier Mass Balance v3',
  },
];

export const models: Model[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', color: '#57d4d9', accent: '#163d45' },
  { id: 'claude-3-5', name: 'Claude 3.5', provider: 'Anthropic', color: '#b59afb', accent: '#32254f' },
  { id: 'gemini-1-5', name: 'Gemini 1.5', provider: 'Google', color: '#65dca1', accent: '#173d30' },
];

export const evaluations: Evaluation[] = [
  { id: 'eval-1042', taskId: 'orbital-trajectory', modelId: 'gpt-4o', status: 'Success', accuracy: 92.3, runtime: 12.4, codeLines: 48, date: 'Nov 15, 2025' },
  { id: 'eval-1041', taskId: 'noaa-climate', modelId: 'claude-3-5', status: 'Failed', accuracy: 0, runtime: 12.1, codeLines: 67, date: 'Nov 15, 2025', failure: 'Data handling error' },
  { id: 'eval-1040', taskId: 'gravity-force', modelId: 'gemini-1-5', status: 'Success', accuracy: 85.6, runtime: 3.8, codeLines: 23, date: 'Nov 14, 2025' },
  { id: 'eval-1039', taskId: 'exoplanet-transit', modelId: 'gpt-4o', status: 'Partial', accuracy: 64.2, runtime: 31.5, codeLines: 91, date: 'Nov 14, 2025', failure: 'Numerical error' },
  { id: 'eval-1038', taskId: 'glacier-melt', modelId: 'claude-3-5', status: 'Success', accuracy: 88.7, runtime: 9.2, codeLines: 52, date: 'Nov 13, 2025' },
  { id: 'eval-1037', taskId: 'orbital-trajectory', modelId: 'gemini-1-5', status: 'Failed', accuracy: 18.4, runtime: 14.9, codeLines: 44, date: 'Nov 13, 2025', failure: 'Wrong scientific method' },
  { id: 'eval-1036', taskId: 'noaa-climate', modelId: 'gpt-4o', status: 'Success', accuracy: 81.5, runtime: 16.7, codeLines: 73, date: 'Nov 12, 2025' },
  { id: 'eval-1035', taskId: 'gravity-force', modelId: 'claude-3-5', status: 'Partial', accuracy: 52.8, runtime: 4.1, codeLines: 26, date: 'Nov 12, 2025', failure: 'Incorrect output' },
  { id: 'eval-1034', taskId: 'exoplanet-transit', modelId: 'gemini-1-5', status: 'Failed', accuracy: 0, runtime: 7.8, codeLines: 34, date: 'Nov 11, 2025', failure: 'Timeout' },
  { id: 'eval-1033', taskId: 'glacier-melt', modelId: 'gpt-4o', status: 'Success', accuracy: 90.2, runtime: 10.1, codeLines: 57, date: 'Nov 11, 2025' },
  { id: 'eval-1032', taskId: 'glacier-melt', modelId: 'gemini-1-5', status: 'Success', accuracy: 78.1, runtime: 11.4, codeLines: 51, date: 'Nov 10, 2025' },
  { id: 'eval-1031', taskId: 'orbital-trajectory', modelId: 'claude-3-5', status: 'Failed', accuracy: 22.6, runtime: 8.4, codeLines: 39, date: 'Nov 10, 2025', failure: 'Dependency error' },
];

export const datasets: Dataset[] = [
  { id: 'ds-nasa', name: 'NASA Orbital Data', domain: 'Astronomy', records: '18.4k', source: 'NASA Exoplanet Archive', license: 'CC BY 4.0', version: 'v2.3', updated: 'Nov 08, 2025', description: 'Curated orbital parameters and light curves for simulation fixtures.' },
  { id: 'ds-noaa', name: 'NOAA Climate Data', domain: 'Earth Science', records: '1.2m', source: 'NOAA GHCN', license: 'Public domain', version: 'v1.4', updated: 'Nov 03, 2025', description: 'Station-level monthly temperature anomalies with provenance metadata.' },
  { id: 'ds-physics', name: 'Synthetic Physics Fixtures', domain: 'Physics', records: '420', source: 'SciVerify Research', license: 'Internal', version: 'v2.1', updated: 'Oct 29, 2025', description: 'Deterministic two-body and force-calculation problems with reference answers.' },
  { id: 'ds-grace', name: 'GRACE Glacier Mass Balance', domain: 'Climate', records: '8.7k', source: 'NASA JPL', license: 'CC BY 4.0', version: 'v3.0', updated: 'Oct 21, 2025', description: 'Annual glacier mass changes derived from satellite gravimetry.' },
];

export const failures: Failure[] = [
  { id: 'f-01', task: 'NOAA Climate Data Analysis', model: 'Claude 3.5', type: 'Data Handling Error', error: 'Timezone-naive index shifted annual resampling by one month.', severity: 'High', resolution: 'Pin UTC index before resampling.' },
  { id: 'f-02', task: 'Orbital Trajectory Simulation', model: 'Gemini 1.5', type: 'Wrong Scientific Method', error: 'Used constant-velocity approximation instead of gravitational integration.', severity: 'High', resolution: 'Add method rubric check.' },
  { id: 'f-03', task: 'Exoplanet Transit Detection', model: 'Gemini 1.5', type: 'Timeout', error: 'Periodogram exceeded 30 second sandbox budget.', severity: 'Medium', resolution: 'Vectorize BLS search.' },
  { id: 'f-04', task: 'Gravitational Force Calculation', model: 'Claude 3.5', type: 'Incorrect Output', error: 'Returned force in kilogram-force without labeling conversion.', severity: 'Medium', resolution: 'Require SI unit assertion.' },
  { id: 'f-05', task: 'Exoplanet Transit Detection', model: 'GPT-4o', type: 'Numerical Error', error: 'Sigma clipping removed the shallow transit signal.', severity: 'Low', resolution: 'Use robust local baseline.' },
];

export const codeSample = `import numpy as np
import matplotlib.pyplot as plt

G = 6.67430e-11
M_EARTH = 5.972e24
R_EARTH = 6.371e6
altitude = 400e3
radius = R_EARTH + altitude
velocity = np.sqrt(G * M_EARTH / radius)

dt, duration = 1.0, 5554.0
times = np.arange(0, duration, dt)
theta = velocity * times / radius
x = radius * np.cos(theta)
y = radius * np.sin(theta)

period = 2 * np.pi * radius / velocity
print(f"Orbital period: {period:.1f} s")

fig, ax = plt.subplots(figsize=(8, 6))
ax.plot(x / 1e6, y / 1e6, color="#57d4d9", label="Satellite orbit")
ax.scatter([0], [0], s=500, color="#b59afb", label="Earth")
ax.set(xlabel="X Position (km)", ylabel="Y Position (km)")
ax.set_aspect("equal")
ax.legend()
plt.tight_layout()`;

export const referenceCode = codeSample.replace('np.arange(0, duration, dt)', 'np.linspace(0, duration, int(duration / dt))').replace('velocity * times / radius', '2 * np.pi * times / period');

export const taskById = (id: string) => tasks.find((task) => task.id === id) ?? tasks[0];
export const modelById = (id: string) => models.find((model) => model.id === id) ?? models[0];
export const evaluationById = (id: string) => evaluations.find((run) => run.id === id) ?? evaluations[0];