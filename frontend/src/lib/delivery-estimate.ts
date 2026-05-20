const DISPATCH_DAYS_MIN = 3;
const DISPATCH_DAYS_MAX = 7;

function addCalendarDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  day: "numeric",
});

/** e.g. "May 28 – Jun 01" from today + dispatch window */
export function getEstimatedDeliveryLabel(from: Date = new Date()): string {
  const start = addCalendarDays(from, DISPATCH_DAYS_MIN);
  const end = addCalendarDays(from, DISPATCH_DAYS_MAX);
  return `${dateFmt.format(start)} – ${dateFmt.format(end)}`;
}
