import { describe, it, expect, beforeEach, vi } from "vitest";
import { JsonReporter } from "../../../src/adapters/reporters/json.js";
import { PRESETS } from "../../../src/domain/threshold.js";
import { makeIdentity, makeScore, makeVerdict, makeDistribution, makeSummary, makeResult } from "./helpers.js";

// ── Tests ─────────────────────────────────────────────────────────────

describe("JsonReporter", () => {
  let reporter: JsonReporter;

  beforeEach(() => {
    reporter = new JsonReporter();
  });

  describe("format", () => {
    it("returns valid JSON (JSON.parse does not throw)", () => {
      const result = makeResult([], makeSummary(), true);
      const output = reporter.format(result);
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it("uses 2-space indentation", () => {
      const result = makeResult([], makeSummary(), true);
      const output = reporter.format(result);
      // 2-space indent means lines start with "  " (two spaces), not tabs or 4 spaces
      const lines = output.split("\n");
      const indentedLines = lines.filter((l) => l.startsWith(" "));
      expect(indentedLines.length).toBeGreaterThan(0);
      // All indented lines should use multiples of 2 spaces
      for (const line of indentedLines) {
        const leadingSpaces = line.match(/^( +)/)?.[1].length ?? 0;
        expect(leadingSpaces % 2).toBe(0);
      }
    });

    it("includes $schema field", () => {
      const result = makeResult([], makeSummary(), true);
      const output = reporter.format(result);
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty("$schema");
      expect(typeof parsed.$schema).toBe("string");
    });

    it("includes version field as a semver string", () => {
      const result = makeResult([], makeSummary(), true);
      const output = reporter.format(result);
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty("version");
      expect(typeof parsed.version).toBe("string");
      expect(parsed.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it("includes timestamp as ISO 8601 string", () => {
      const result = makeResult([], makeSummary(), true);
      const output = reporter.format(result);
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty("timestamp");
      expect(typeof parsed.timestamp).toBe("string");
      // ISO 8601 format check: should parse back to a valid Date
      const date = new Date(parsed.timestamp);
      expect(date.toISOString()).toBe(parsed.timestamp);
    });

    it("includes config field with threshold info", () => {
      const result = makeResult([], makeSummary(), true, 15);
      const output = reporter.format(result);
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty("config");
      expect(parsed.config).toEqual({
        defaultThreshold: 15,
        overrides: [],
      });
    });

    it("includes config with overrides when present", () => {
      const analysisResult: AnalysisResult = {
        functions: [],
        unmatched: [],
        warnings: [],
        summary: makeSummary(),
        thresholdConfig: {
          defaultThreshold: PRESETS.default,
          overrides: [{ glob: "src/legacy/**", threshold: 30 }],
        },
        passed: true,
      };
      const output = reporter.format(analysisResult);
      const parsed = JSON.parse(output);
      expect(parsed.config).toEqual({
        defaultThreshold: PRESETS.default,
        overrides: [{ glob: "src/legacy/**", threshold: 30 }],
      });
    });

    it("includes summary from AnalysisResult.summary", () => {
      const summary = makeSummary({
        totalFunctions: 42,
        totalFiles: 8,
        exceedingThreshold: 3,
        exceedingPercent: 7.14,
        averageCrap: 6.5,
        medianCrap: 4.0,
        maxCrap: makeScore(97.3),
        worstFunction: makeIdentity("src/pricing.ts", "calculateTotal"),
        distribution: makeDistribution(30, 5, 4, 3),
        crapLoad: 150.2,
      });
      const result = makeResult([], summary, false);
      const output = reporter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.summary).toEqual(summary);
    });

    it("includes functions array from AnalysisResult.functions", () => {
      const v1 = makeVerdict("src/pricing.ts", "calculateTotal", 12, 45.0, 97.3, PRESETS.default);
      const v2 = makeVerdict("src/utils.ts", "add", 1, 100.0, 1.0, PRESETS.default);

      const result = makeResult(
        [v1, v2],
        makeSummary({ totalFunctions: 2, totalFiles: 2, maxCrap: makeScore(97.3) }),
        false,
      );
      const output = reporter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.functions).toHaveLength(2);
      expect(parsed.functions[0].scored.identity.qualifiedName).toBe("calculateTotal");
      expect(parsed.functions[1].scored.identity.qualifiedName).toBe("add");
    });

    it("includes passed boolean from AnalysisResult.passed", () => {
      const passingResult = makeResult([], makeSummary(), true);
      const failingResult = makeResult([], makeSummary(), false);

      const passOutput = JSON.parse(reporter.format(passingResult));
      const failOutput = JSON.parse(reporter.format(failingResult));

      expect(passOutput.passed).toBe(true);
      expect(failOutput.passed).toBe(false);
    });

    it("preserves all AnalysisResult data through serialization", () => {
      const v1 = makeVerdict("src/a.ts", "fnA", 5, 80.0, 6.25, PRESETS.default);

      const summary = makeSummary({
        totalFunctions: 1,
        totalFiles: 1,
        exceedingThreshold: 0,
        averageCrap: 6.25,
        medianCrap: 6.25,
        maxCrap: makeScore(6.25),
        worstFunction: makeIdentity("src/a.ts", "fnA"),
        distribution: makeDistribution(0, 1, 0, 0),
        crapLoad: 0,
      });

      const result = makeResult([v1], summary, true);
      const output = reporter.format(result);
      const parsed = JSON.parse(output);

      // Reporter is a pure serializer — passes through all data including contributors
      expect(parsed.functions).toEqual(result.functions);
      expect(parsed.warnings).toEqual(result.warnings);
      expect(parsed.summary).toEqual(result.summary);
      expect(parsed.passed).toEqual(result.passed);
      expect(parsed.config).toEqual(result.thresholdConfig);
    });

    it("handles empty results", () => {
      const result = makeResult([], makeSummary(), true);
      const output = reporter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.functions).toEqual([]);
      expect(parsed.warnings).toEqual([]);
      expect(parsed.summary.totalFunctions).toBe(0);
      expect(parsed.passed).toBe(true);
    });

    it("has all expected top-level envelope keys", () => {
      const result = makeResult([], makeSummary(), true);
      const output = reporter.format(result);
      const parsed = JSON.parse(output);

      const keys = Object.keys(parsed);
      expect(keys).toContain("$schema");
      expect(keys).toContain("version");
      expect(keys).toContain("timestamp");
      expect(keys).toContain("config");
      expect(keys).toContain("summary");
      expect(keys).toContain("functions");
      expect(keys).toContain("unmatched");
      expect(keys).toContain("warnings");
      expect(keys).toContain("passed");
    });

    it("uses a stable timestamp within a single call", () => {
      // Freeze time to ensure timestamp is consistent
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00.000Z"));

      const result = makeResult([], makeSummary(), true);
      const output = reporter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.timestamp).toBe("2025-06-15T12:00:00.000Z");

      vi.useRealTimers();
    });
  });

  describe("implements ReporterPort", () => {
    it("has a format method returning string", () => {
      const result = makeResult([], makeSummary(), true);
      const output = reporter.format(result);
      expect(typeof output).toBe("string");
    });
  });
});
