import type { ProductId, ProductInfo } from "./types.ts";

type Rule = {
  test: RegExp;
  id: ProductId;
  name: string;
  tier: string;
  tierLabel: string;
  ready: boolean;
};

const RULES: Rule[] = [
  { test: /^xiaojiu-claude-max20x-/i, id: "claude", name: "Claude", tier: "claude-max20x", tierLabel: "Claude Max 20x", ready: false },
  { test: /^xiaojiu-claude-max5x-/i, id: "claude", name: "Claude", tier: "claude-max5x", tierLabel: "Claude Max 5x", ready: false },
  { test: /^xiaojiu-claude-pro-/i, id: "claude", name: "Claude", tier: "claude-pro", tierLabel: "Claude Pro", ready: false },
  { test: /^xiaojiu-claude-/i, id: "claude", name: "Claude", tier: "claude", tierLabel: "Claude", ready: false },
  { test: /^xiaojiu-teammix-/i, id: "team", name: "Team", tier: "team-mixed", tierLabel: "ChatGPT Team 混合席位", ready: false },
  { test: /^xiaojiu-team-/i, id: "team", name: "Team", tier: "team", tierLabel: "ChatGPT Team", ready: false },
  { test: /^xiaojiu-codex2500-/i, id: "codex", name: "Codex", tier: "codex2500", tierLabel: "Codex Credits 2500", ready: true },
  { test: /^xiaojiu-codex2000-/i, id: "codex", name: "Codex", tier: "codex2000", tierLabel: "Codex Credits 2000", ready: true },
  { test: /^xiaojiu-codex1000-/i, id: "codex", name: "Codex", tier: "codex1000", tierLabel: "Codex Credits 1000", ready: true },
  { test: /^xiaojiu-codex500-/i, id: "codex", name: "Codex", tier: "codex500", tierLabel: "Codex Credits 500", ready: true },
  { test: /^xiaojiu-codex250-/i, id: "codex", name: "Codex", tier: "codex250", tierLabel: "Codex Credits 250", ready: true },
  { test: /^xiaojiu-codex-/i, id: "codex", name: "Codex", tier: "codex", tierLabel: "Codex Credits", ready: true },
  { test: /^xiaojiu-groky-/i, id: "grok", name: "Grok", tier: "grok-yearly", tierLabel: "Grok 年付", ready: true },
  { test: /^xiaojiu-grokm-/i, id: "grok", name: "Grok", tier: "grok-monthly", tierLabel: "Grok 月付", ready: true },
  { test: /^xiaojiu-grok-/i, id: "grok", name: "Grok", tier: "grok", tierLabel: "Grok", ready: true },
  { test: /^xiaojiu-renew20x-/i, id: "chatgpt", name: "ChatGPT", tier: "pro20x-renewal", tierLabel: "ChatGPT Pro 200 续费", ready: true },
  { test: /^xiaojiu-pro20x-/i, id: "chatgpt", name: "ChatGPT", tier: "pro20x", tierLabel: "ChatGPT Pro 200", ready: true },
  { test: /^xiaojiu-promax-/i, id: "chatgpt", name: "ChatGPT", tier: "promax", tierLabel: "ChatGPT Pro 500", ready: true },
  { test: /^xiaojiu-pro5xcl-/i, id: "chatgpt", name: "ChatGPT", tier: "pro5xcl", tierLabel: "ChatGPT Pro 100", ready: true },
  { test: /^xiaojiu-pro5x-/i, id: "chatgpt", name: "ChatGPT", tier: "pro5x", tierLabel: "ChatGPT Pro 100", ready: true },
  { test: /^xiaojiu-gptgo-/i, id: "chatgpt", name: "ChatGPT", tier: "go", tierLabel: "ChatGPT Go", ready: true },
  { test: /^xiaojiu-go-/i, id: "chatgpt", name: "ChatGPT", tier: "go", tierLabel: "ChatGPT Go", ready: true },
  { test: /^xiaojiu-/i, id: "chatgpt", name: "ChatGPT", tier: "plus", tierLabel: "ChatGPT Plus", ready: true },
];

const UNKNOWN: ProductInfo = {
  id: "unknown",
  name: "未识别",
  tier: "unknown",
  tierLabel: "未识别卡种",
  ready: false,
};

export function classifyCdk(cdk: string): ProductInfo {
  const value = cdk.trim();
  const rule = RULES.find((item) => item.test.test(value));
  if (!rule) return UNKNOWN;
  return {
    id: rule.id,
    name: rule.name,
    tier: rule.tier,
    tierLabel: rule.tierLabel,
    ready: rule.ready,
  };
}

export function productNoun(id: ProductId): string {
  switch (id) {
    case "chatgpt":
      return "ChatGPT";
    case "grok":
      return "Grok";
    case "codex":
      return "Codex";
    case "claude":
      return "Claude";
    case "team":
      return "Team";
    default:
      return "礼品卡";
  }
}
