import { describe, expect, it } from "vitest";
import { exportCsv, exportJson, timestampedName } from "@/lib/export";

/**
 * The export helpers touch the DOM (anchor + Blob). jsdom's Blob has no
 * synchronous text accessor, so we stub the Blob constructor to capture its
 * content directly, plus the URL + anchor.click side effects.
 */
function captureDownload(fn: () => void): string {
  const origBlob = globalThis.Blob;
  const origCreate = URL.createObjectURL;
  const origRevoke = URL.revokeObjectURL;
  const origClick = HTMLAnchorElement.prototype.click;
  let captured = "";

  class CapturingBlob {
    constructor(parts: string[]) {
      captured = parts.join("");
    }
  }
  globalThis.Blob = CapturingBlob as unknown as typeof Blob;
  URL.createObjectURL = (() => "blob:mock") as typeof URL.createObjectURL;
  URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
  HTMLAnchorElement.prototype.click = function () {};

  try {
    fn();
    return captured;
  } finally {
    globalThis.Blob = origBlob;
    URL.createObjectURL = origCreate;
    URL.revokeObjectURL = origRevoke;
    HTMLAnchorElement.prototype.click = origClick;
  }
}

describe("exportCsv", () => {
  it("writes a header row that is the union of all keys", () => {
    const text = captureDownload(() =>
      exportCsv("out.csv", [
        { a: 1, b: 2 },
        { a: 3, c: 4 },
      ]),
    );
    const [header] = text.split("\n");
    expect(header.split(",").sort()).toEqual(["a", "b", "c"]);
  });

  it("quotes and escapes values containing commas or quotes", () => {
    const text = captureDownload(() =>
      exportCsv("out.csv", [{ note: 'has, comma and "quote"' }]),
    );
    expect(text).toContain('"has, comma and ""quote"""');
  });

  it("neutralises spreadsheet formula injection", () => {
    const text = captureDownload(() =>
      exportCsv("out.csv", [{ payload: "=SUM(A1:A9)" }]),
    );
    // Leading '=' must be prefixed with an apostrophe so Excel treats it as text.
    expect(text).toContain("'=SUM(A1:A9)");
  });

  it("handles an empty row set without throwing", () => {
    const text = captureDownload(() => exportCsv("empty.csv", []));
    expect(text).toBe("");
  });
});

describe("exportJson", () => {
  it("pretty-prints the payload", () => {
    const text = captureDownload(() => exportJson("d.json", { x: 1 }));
    expect(text).toBe(JSON.stringify({ x: 1 }, null, 2));
  });
});

describe("timestampedName", () => {
  it("produces a base-YYYYMMDD-HHMM.ext filename", () => {
    const name = timestampedName("ledger", "csv");
    expect(name).toMatch(/^ledger-\d{8}-\d{4}\.csv$/);
  });
});
