import YAML from "yaml";

export interface ToolGuidance {
  /** When this tool should be used */
  when?: string;
  /** Usage examples */
  examples?: string[];
  /** Additional notes */
  notes?: string;
  /** Prefer this over another tool */
  prefer_over?: string;
}

export interface SystemPromptConfig {
  /** Rich tool guidance keyed by tool name */
  tools?: Record<string, ToolGuidance>;
  /** Extra instructions injected into the system prompt */
  instructions?: string[];
}

export function parseSystemPromptConfig(raw: string): SystemPromptConfig | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = YAML.parse(trimmed);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as SystemPromptConfig;
  } catch {
    return null;
  }
}

/**
 * Render tool guidance blocks into lines for the system prompt.
 * Appended after the tool list in the ## Tooling section.
 */
export function renderToolGuidanceLines(
  config: SystemPromptConfig,
  availableTools: Set<string>,
): string[] {
  const lines: string[] = [];
  const tools = config.tools;
  if (!tools || Object.keys(tools).length === 0) return lines;

  lines.push("");
  lines.push("### Tool Guidance");

  for (const [toolName, guidance] of Object.entries(tools)) {
    // Only render guidance for tools that are actually available
    const normalized = toolName.toLowerCase();
    if (!availableTools.has(normalized)) continue;

    const parts: string[] = [];
    if (guidance.when) parts.push(`When: ${guidance.when}`);
    if (guidance.prefer_over) parts.push(`Prefer over: ${guidance.prefer_over}`);
    if (guidance.notes) parts.push(guidance.notes);
    if (guidance.examples && guidance.examples.length > 0) {
      parts.push(`Examples: ${guidance.examples.join(" | ")}`);
    }

    if (parts.length > 0) {
      lines.push(`- **${toolName}**: ${parts.join(". ")}`);
    }
  }

  return lines;
}

/**
 * Render custom instructions from the config.
 */
export function renderCustomInstructionLines(config: SystemPromptConfig): string[] {
  const instructions = config.instructions;
  if (!instructions || instructions.length === 0) return [];

  return [
    "",
    "## Custom Instructions (from system-prompt.yml)",
    ...instructions.map((i) => `- ${i}`),
    "",
  ];
}
