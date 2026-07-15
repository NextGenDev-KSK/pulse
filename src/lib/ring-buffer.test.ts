import { describe, expect, it } from "vitest";
import { pushCapped, pushCappedItem } from "@/lib/ring-buffer";

describe("pushCapped", () => {
  it("appends until the cap is reached", () => {
    let arr: number[] = [];
    arr = pushCapped(arr, 1, 3);
    arr = pushCapped(arr, 2, 3);
    arr = pushCapped(arr, 3, 3);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("drops the oldest sample once at capacity", () => {
    let arr = [1, 2, 3];
    arr = pushCapped(arr, 4, 3);
    expect(arr).toEqual([2, 3, 4]);
    arr = pushCapped(arr, 5, 3);
    expect(arr).toEqual([3, 4, 5]);
  });

  it("does not mutate the input array", () => {
    const arr = [1, 2, 3];
    const next = pushCapped(arr, 4, 3);
    expect(arr).toEqual([1, 2, 3]);
    expect(next).not.toBe(arr);
  });

  it("collapses an over-cap array back down to exactly the cap", () => {
    const arr = [1, 2, 3, 4, 5];
    const next = pushCapped(arr, 6, 3);
    expect(next).toEqual([4, 5, 6]);
    expect(next.length).toBe(3);
  });
});

describe("pushCappedItem", () => {
  it("works generically for object items", () => {
    type Ev = { id: string };
    let arr: Ev[] = [];
    arr = pushCappedItem(arr, { id: "a" }, 2);
    arr = pushCappedItem(arr, { id: "b" }, 2);
    arr = pushCappedItem(arr, { id: "c" }, 2);
    expect(arr.map((e) => e.id)).toEqual(["b", "c"]);
  });
});
