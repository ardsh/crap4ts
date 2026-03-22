import { describe, it, expect } from "vitest";
import { ConsoleReporter } from "../../../src/adapters/reporters/console.js";
import { PRESETS } from "../../../src/domain/threshold.js";
import { makeIdentity, makeScore, makeVerdict, makeSummary, makeResult } from "./helpers.js";

// ── Tests ─────────────────────────────────────────────────────────────

describe("ConsoleReporter", () => {
  describe("format", () => {
    it("produces table with file paths, function names, CC, Cov%, CRAP values", () => {
      const v1 = makeVerdict("src/domain/services/pricing.ts", "calculateLineTotal", 12, 45.0, 97.3, PRESETS.default);
      const v2 = makeVerdict("src/domain/services/pricing.ts", "applyDiscountRules", 8, 62.5, 30.4, PRESETS.default);
      const v3 = makeVerdict("src/domain/lib/money.ts", "roundCurrency", 2, 100.0, 2.0, PRESETS.default);

      const result = makeResult(
        [v1, v2, v3],
        makeSummary({
          totalFunctions: 47,
          totalFiles: 2,
          exceedingThreshold: 3,
          maxCrap: makeScore(97.3),
          worstFunction: makeIdentity("src/domain/services/pricing.ts", "calculateLineTotal"),
        }),
        false,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      // Header
      expect(output).toContain("crap4ts");
      expect(output).toContain("CRAP Score Analysis");

      // Column headers
      expect(output).toContain("File");
      expect(output).toContain("Function");
      expect(output).toContain("CC");
      expect(output).toContain("Cov%");
      expect(output).toContain("CRAP");

      // Data rows — file paths, function names, values
      expect(output).toContain("src/domain/services/pricing.ts");
      expect(output).toContain("calculateLineTotal");
      expect(output).toContain("12");
      expect(output).toContain("45.0");
      expect(output).toContain("97.3");

      expect(output).toContain("applyDiscountRules");
      expect(output).toContain("62.5");
      expect(output).toContain("30.4");

      expect(output).toContain("src/domain/lib/money.ts");
      expect(output).toContain("roundCurrency");
      expect(output).toContain("100.0");
      expect(output).toContain("2.0");

      // Summary line
      expect(output).toContain("47 functions");
      expect(output).toContain("3 above threshold");
      expect(output).toContain("worst: 97.3");
      expect(output).toContain("FAIL");
    });

    it("shows PASS in summary when all functions are below threshold", () => {
      const v1 = makeVerdict("src/utils.ts", "add", 1, 100.0, 1.0, PRESETS.default);
      const v2 = makeVerdict("src/utils.ts", "subtract", 1, 100.0, 1.0, PRESETS.default);

      const result = makeResult(
        [v1, v2],
        makeSummary({
          totalFunctions: 2,
          totalFiles: 1,
          exceedingThreshold: 0,
          maxCrap: makeScore(1.0),
        }),
        true,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      expect(output).toContain("PASS");
      expect(output).not.toContain("FAIL");
    });

    it("shows FAIL in summary when functions exceed threshold", () => {
      const v1 = makeVerdict("src/complex.ts", "doEverything", 20, 10.0, 380.0, PRESETS.default);

      const result = makeResult(
        [v1],
        makeSummary({
          totalFunctions: 1,
          totalFiles: 1,
          exceedingThreshold: 1,
          maxCrap: makeScore(380.0),
        }),
        false,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      expect(output).toContain("FAIL");
      expect(output).not.toContain("PASS");
    });

    it("handles empty results gracefully", () => {
      const result = makeResult(
        [],
        makeSummary({ totalFunctions: 0, totalFiles: 0 }),
        true,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      // Should still produce header and summary
      expect(output).toContain("crap4ts");
      expect(output).toContain("0 functions");
      expect(output).toContain("PASS");
    });

    it("shows the threshold value in summary", () => {
      const result = makeResult(
        [],
        makeSummary({ totalFunctions: 5, exceedingThreshold: 2, maxCrap: makeScore(25) }),
        false,
        15,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      expect(output).toContain("15");
    });

    it("shows Threshold column when overrides are active", () => {
      const v1 = makeVerdict("src/cli/run.ts", "runCli", 5, 60.0, 10.0, 20);
      const v2 = makeVerdict("src/domain/calc.ts", "calculate", 3, 90.0, 3.0, PRESETS.default);

      const overrides = [{ glob: "src/cli/**", threshold: 20 }];
      const result = makeResult(
        [v1, v2],
        makeSummary({
          totalFunctions: 2,
          totalFiles: 2,
          exceedingThreshold: 0,
          maxCrap: makeScore(10.0),
        }),
        true,
        PRESETS.default,
        overrides,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      // Should have a Threshold column header
      expect(output).toContain("Threshold");

      // Each row should show its effective threshold
      // v1 has threshold 20, v2 has default threshold
      const lines = output.split("\n");
      const cliRow = lines.find((l) => l.includes("runCli"));
      const domainRow = lines.find((l) => l.includes("calculate"));
      expect(cliRow).toContain("20");
      expect(domainRow).toContain(String(PRESETS.default));
    });

    it("shows overrides-active indicator in summary when overrides exist", () => {
      const overrides = [{ glob: "src/cli/**", threshold: 20 }];
      const result = makeResult(
        [],
        makeSummary({ totalFunctions: 5, exceedingThreshold: 1, maxCrap: makeScore(15) }),
        false,
        PRESETS.default,
        overrides,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      expect(output).toContain(`default: ${PRESETS.default}`);
      expect(output).toContain("overrides active");
    });

    it("does not show Threshold column when no overrides exist", () => {
      const v1 = makeVerdict("src/utils.ts", "add", 1, 100.0, 1.0, PRESETS.default);

      const result = makeResult(
        [v1],
        makeSummary({
          totalFunctions: 1,
          totalFiles: 1,
          exceedingThreshold: 0,
          maxCrap: makeScore(1.0),
        }),
        true,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      // The word "Threshold" should NOT appear as a column header
      // (it may appear in the summary line as part of "above threshold")
      const lines = output.split("\n");
      const headerLine = lines.find((l) => l.includes("File") && l.includes("Function"));
      expect(headerLine).not.toContain("Threshold");

      // Summary should show plain threshold number, not "overrides active"
      expect(output).not.toContain("overrides active");
      expect(output).toContain(`above threshold (${PRESETS.default})`);
    });
  });

  describe("non-TTY mode (no ANSI codes)", () => {
    it("does not contain ANSI escape sequences when color is false", () => {
      const v1 = makeVerdict("src/foo.ts", "bar", 10, 30.0, 80.0, PRESETS.default);

      const result = makeResult(
        [v1],
        makeSummary({ totalFunctions: 1, totalFiles: 1, exceedingThreshold: 1, maxCrap: makeScore(80.0) }),
        false,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      expect(output).not.toMatch(/\x1b\[/);
    });

    it("contains ANSI codes when color is true", () => {
      const v1 = makeVerdict("src/foo.ts", "bar", 10, 30.0, 80.0, PRESETS.default);

      const result = makeResult(
        [v1],
        makeSummary({ totalFunctions: 1, totalFiles: 1, exceedingThreshold: 1, maxCrap: makeScore(80.0) }),
        false,
      );

      const reporter = new ConsoleReporter({ color: true });
      const output = reporter.format(result);

      expect(output).toMatch(/\x1b\[/);
    });
  });

  describe("color rules", () => {
    it("colorizes coverage red when below 50%", () => {
      const v = makeVerdict("src/a.ts", "fn", 5, 30.0, 20.0, PRESETS.default);
      const result = makeResult(
        [v],
        makeSummary({ totalFunctions: 1, totalFiles: 1, exceedingThreshold: 1, maxCrap: makeScore(20.0) }),
        false,
      );

      const reporter = new ConsoleReporter({ color: true });
      const output = reporter.format(result);

      expect(output).toMatch(/\x1b\[3?1m.*30\.0/s);
    });

    it("colorizes coverage yellow when 50-79%", () => {
      const v = makeVerdict("src/a.ts", "fn", 5, 65.0, 10.0, PRESETS.default);
      const result = makeResult(
        [v],
        makeSummary({ totalFunctions: 1, totalFiles: 1, maxCrap: makeScore(10.0) }),
        true,
      );

      const reporter = new ConsoleReporter({ color: true });
      const output = reporter.format(result);

      expect(output).toMatch(/\x1b\[33m.*65\.0/s);
    });

    it("colorizes coverage green when 80%+", () => {
      const v = makeVerdict("src/a.ts", "fn", 2, 95.0, 2.0, PRESETS.default);
      const result = makeResult(
        [v],
        makeSummary({ totalFunctions: 1, totalFiles: 1, maxCrap: makeScore(2.0) }),
        true,
      );

      const reporter = new ConsoleReporter({ color: true });
      const output = reporter.format(result);

      expect(output).toMatch(/\x1b\[32m.*95\.0/s);
    });

    it("colorizes above-threshold CRAP scores red+bold", () => {
      const v = makeVerdict("src/a.ts", "fn", 10, 30.0, 80.0, PRESETS.default);
      const result = makeResult(
        [v],
        makeSummary({ totalFunctions: 1, totalFiles: 1, exceedingThreshold: 1, maxCrap: makeScore(80.0) }),
        false,
      );

      const reporter = new ConsoleReporter({ color: true });
      const output = reporter.format(result);

      // Bold ANSI: \x1b[1m, Red: \x1b[31m — chalk combines them
       
      expect(output).toMatch(/\x1b\[1m/);
       
      expect(output).toMatch(/\x1b\[3?1m/);
    });
  });

  describe("implements ReporterPort", () => {
    it("has a format method returning string", () => {
      const reporter = new ConsoleReporter({ color: false });
      const result = makeResult([], makeSummary(), true);
      const output = reporter.format(result);
      expect(typeof output).toBe("string");
    });
  });

  describe("row ordering", () => {
    it("outputs functions preserving input order", () => {
      const v1 = makeVerdict("src/b.ts", "bFn", 1, 100.0, 1.0, PRESETS.default);
      const v2 = makeVerdict("src/a.ts", "aFn", 1, 100.0, 1.0, PRESETS.default);

      const result = makeResult(
        [v1, v2],
        makeSummary({ totalFunctions: 2, totalFiles: 2, maxCrap: makeScore(1.0) }),
        true,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      const bIdx = output.indexOf("src/b.ts");
      const aIdx = output.indexOf("src/a.ts");
      expect(bIdx).toBeLessThan(aIdx);
    });
  });

  describe("coverage formatting", () => {
    it("formats coverage with one decimal place", () => {
      const v = makeVerdict("src/x.ts", "fn", 1, 50.0, 1.0, PRESETS.default);
      const result = makeResult(
        [v],
        makeSummary({ totalFunctions: 1, totalFiles: 1, maxCrap: makeScore(1.0) }),
        true,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      expect(output).toContain("50.0");
    });

    it("formats CRAP with one decimal place", () => {
      const v = makeVerdict("src/x.ts", "fn", 5, 34.5, 12.03, PRESETS.default);
      const result = makeResult(
        [v],
        makeSummary({ totalFunctions: 1, totalFiles: 1, exceedingThreshold: 1, maxCrap: makeScore(12.03) }),
        false,
      );

      const reporter = new ConsoleReporter({ color: false });
      const output = reporter.format(result);

      expect(output).toMatch(/12\.0/);
    });
  });
});
