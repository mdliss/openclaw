import { describe, expect, it } from "vitest";

import {
  parseSystemPromptConfig,
  renderToolGuidanceLines,
  renderCustomInstructionLines,
} from "./system-prompt-config.js";

describe("parseSystemPromptConfig", () => {
  it("parses valid YAML", () => {
    const yaml = `
tools:
  host_write:
    when: writing files to the host filesystem
    examples:
      - 'host_write(path: "test.md", content: "hi", root: "workspace")'
instructions:
  - always use host_write for filesystem ops
`;
    const config = parseSystemPromptConfig(yaml);
    expect(config).not.toBeNull();
    expect(config!.tools!.host_write.when).toBe("writing files to the host filesystem");
    expect(config!.instructions).toHaveLength(1);
  });

  it("returns null for empty input", () => {
    expect(parseSystemPromptConfig("")).toBeNull();
    expect(parseSystemPromptConfig("   ")).toBeNull();
  });

  it("returns null for invalid YAML", () => {
    expect(parseSystemPromptConfig(":::invalid")).toBeNull();
  });
});

describe("renderToolGuidanceLines", () => {
  it("renders guidance for available tools", () => {
    const config = parseSystemPromptConfig(`
tools:
  host_write:
    when: writing files
    notes: boundary-checked
  missing_tool:
    when: should not appear
`);
    const available = new Set(["host_write"]);
    const lines = renderToolGuidanceLines(config!, available);
    expect(lines.some((l) => l.includes("host_write"))).toBe(true);
    expect(lines.some((l) => l.includes("missing_tool"))).toBe(false);
  });

  it("returns empty for no tools", () => {
    const config = parseSystemPromptConfig("instructions:\n  - test");
    const lines = renderToolGuidanceLines(config!, new Set(["exec"]));
    expect(lines).toHaveLength(0);
  });
});

describe("renderCustomInstructionLines", () => {
  it("renders instructions as bullet list", () => {
    const config = parseSystemPromptConfig(`
instructions:
  - use host_write
  - check memory first
`);
    const lines = renderCustomInstructionLines(config!);
    expect(lines.some((l) => l.includes("use host_write"))).toBe(true);
    expect(lines.some((l) => l.includes("check memory first"))).toBe(true);
    expect(lines.some((l) => l.includes("Custom Instructions"))).toBe(true);
  });

  it("returns empty when no instructions", () => {
    const config = parseSystemPromptConfig("tools:\n  exec:\n    when: test");
    const lines = renderCustomInstructionLines(config!);
    expect(lines).toHaveLength(0);
  });
});
