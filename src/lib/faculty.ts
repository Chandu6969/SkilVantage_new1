export const DEFAULT_CLASS_PAY = 350;

export const CLASS_SESSIONS = [
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "6:00 PM - 7:00 PM",
  "7:00 PM - 8:00 PM",
  "8:00 PM - 9:00 PM",
  "9:00 PM - 10:00 PM",
  "10:00 PM - 11:00 PM",
] as const;

export function classPay(rate: number) {
  return rate > 0 ? rate : DEFAULT_CLASS_PAY;
}
