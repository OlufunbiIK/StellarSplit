// Scheduled report generation for compliance
import { readEvents } from './eventStore';
import fs from 'fs';
import path from 'path';

const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');
const REPORT_PATH = path.join(REPORTS_DIR, 'audit-report.json');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

export function generateReport() {
  const events = readEvents();
  const report = {
    generatedAt: new Date().toISOString(),
    totalEvents: events.length,
    actions: events.map(e => e.action),
    users: [...new Set(events.map(e => e.userId))],
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  return report;
}
