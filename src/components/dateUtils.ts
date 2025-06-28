export function parseDateTime(datePart?: string, timePart?: string): Date | null {
  if (!datePart || typeof datePart !== 'string') return null;
  const trimmed = datePart.trim();

  // If this field already includes both date and time, try native parse
  if (/\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(\.\d+)?/.test(trimmed)) {
    // Fix: Replace space with T for ISO format
    const iso = trimmed.replace(' ', 'T');
    let d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
    // Remove milliseconds if present and try again
    let noMs = iso.replace(/\.\d+/, '');
    d = new Date(noMs);
    if (!isNaN(d.getTime())) return d;
  }

  // Legacy handling: separate date + time
  if (timePart && typeof timePart === 'string') {
    let iso = trimmed + 'T' + timePart.trim();
    let d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
    // Remove milliseconds if present and try again
    let noMs = iso.replace(/\.\d+/, '');
    d = new Date(noMs);
    if (!isNaN(d.getTime())) return d;
  }

  // ISO or native JS parseable date
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(trimmed)) {
    const iso = timePart ? `${trimmed}T${timePart}` : trimmed;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY/MM/DD or YYYY.MM.DD
  let ymd = trimmed.match(/^(\d{4})[\/.](\d{2})[\/.](\d{2})$/);
  if (ymd) {
    let [, year, month, day] = ymd;
    return buildDate(year, month, day, timePart);
  }

  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  let dmy = trimmed.match(/^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})$/);
  if (dmy) {
    let [, day, month, year] = dmy;
    return buildDate(year, month, day, timePart);
  }

  // MM/DD/YYYY or MM-DD-YYYY or MM.DD.YYYY (US format, ambiguous, but common)
  let mdy = trimmed.match(/^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})$/);
  if (mdy) {
    let [, month, day, year] = mdy;
    return buildDate(year, month, day, timePart);
  }

  // Fallback: try native JS
  const fallback = timePart ? `${trimmed}T${timePart}` : trimmed;
  const d = new Date(fallback);
  return isNaN(d.getTime()) ? null : d;
}

function buildDate(year: string, month: string, day: string, timePart?: string) {
  let hour = 0, minute = 0, second = 0, ms = 0;
  if (timePart && typeof timePart === 'string' && timePart.trim() !== '') {
    const t = timePart.trim();
    const parts = t.split(':');
    hour = Number(parts[0]) || 0;
    minute = Number(parts[1]) || 0;
    if (parts[2]) {
      // Handle seconds.milliseconds
      const [sec, msStr] = parts[2].split('.');
      second = Number(sec) || 0;
      ms = msStr ? Number(msStr) : 0;
    }
  }
  const jsDate = new Date(Number(year), Number(month) - 1, Number(day), hour, minute, second, ms);
  return isNaN(jsDate.getTime()) ? null : jsDate;
}