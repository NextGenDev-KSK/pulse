/** Fixed-capacity numeric history — pushes drop the oldest sample. */
export function pushCapped(arr: number[], value: number, cap: number): number[] {
  const next = arr.length >= cap ? arr.slice(arr.length - cap + 1) : arr.slice();
  next.push(value);
  return next;
}

export function pushCappedItem<T>(arr: T[], value: T, cap: number): T[] {
  const next = arr.length >= cap ? arr.slice(arr.length - cap + 1) : arr.slice();
  next.push(value);
  return next;
}
