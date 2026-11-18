export const DEFAULT_CLASS_PAY = 350;

export function classPay(rate: number) {
  return rate > 0 ? rate : DEFAULT_CLASS_PAY;
}
