import { describe, it, expect } from "vitest";
import {
  normalizeSuggestions,
  extractJsonBlock,
  createJsonBlockFilter,
  buildApiMessages,
  SESSION_GREETING,
} from "../parse-agent-reply";

// ---------------------------------------------------------------------------
// normalizeSuggestions
// ---------------------------------------------------------------------------

describe("normalizeSuggestions", () => {
  it("returns undefined for undefined input", () => {
    expect(normalizeSuggestions(undefined)).toBeUndefined();
  });

  it("returns undefined for empty array", () => {
    expect(normalizeSuggestions([])).toBeUndefined();
  });

  it("keeps the current { question, options } format", () => {
    const input = [
      { question: "Do you have an audience?", options: ["Yes", "Starting from zero"] },
      { question: "What does success look like?", options: ["Signups", "Validated interest"] },
    ];
    expect(normalizeSuggestions(input)).toEqual(input);
  });

  it("keeps a group with options but no question", () => {
    expect(normalizeSuggestions([{ options: ["Ready to start", "Not yet"] }])).toEqual([
      { options: ["Ready to start", "Not yet"] },
    ]);
  });

  it("filters non-string options out of a group", () => {
    expect(normalizeSuggestions([{ question: "Pick", options: ["Yes", 42, null, "No"] }])).toEqual([
      { question: "Pick", options: ["Yes", "No"] },
    ]);
  });

  it("drops groups whose options are all filtered away", () => {
    expect(
      normalizeSuggestions([
        { question: "Empty", options: [] },
        { question: "Real", options: ["Yes", "No"] },
      ])
    ).toEqual([{ question: "Real", options: ["Yes", "No"] }]);
  });

  it("returns undefined when every group ends up empty", () => {
    expect(normalizeSuggestions([{ options: [] }, { options: [42] }])).toBeUndefined();
  });

  it("converts a legacy flat string array to a single group", () => {
    expect(normalizeSuggestions(["Yes", "No", "Maybe"])).toEqual([
      { options: ["Yes", "No", "Maybe"] },
    ]);
  });

  it("converts a legacy string[][] to one group per inner array", () => {
    expect(
      normalizeSuggestions([
        ["Yes", "No"],
        ["Option A", "Option B"],
      ])
    ).toEqual([{ options: ["Yes", "No"] }, { options: ["Option A", "Option B"] }]);
  });

  it("returns undefined if a legacy nested array has only empty groups", () => {
    expect(normalizeSuggestions([[], []])).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractJsonBlock
// ---------------------------------------------------------------------------

describe("extractJsonBlock", () => {
  it("returns text unchanged when there is no json block", () => {
    const text = "Here is my reply with no JSON.";
    expect(extractJsonBlock(text)).toEqual({ cleanReply: text });
  });

  it("extracts navPatch from a json block", () => {
    const navPatch = { setActiveNavItemId: "phase-1-plan" };
    const text = `Here is my reply.\n\`\`\`json\n${JSON.stringify({ navPatch })}\n\`\`\``;
    const result = extractJsonBlock(text);
    expect(result.navPatch).toEqual(navPatch);
    expect(result.cleanReply).toBe("Here is my reply.");
  });

  it("extracts suggestions from a json block", () => {
    const suggestions = [{ question: "Approve?", options: ["Approved", "I want to adjust this"] }];
    const text = `Make your choice.\n\`\`\`json\n${JSON.stringify({ suggestions })}\n\`\`\``;
    const result = extractJsonBlock(text);
    expect(result.suggestions).toEqual(suggestions);
  });

  it("extracts both navPatch and suggestions together", () => {
    const navPatch = { setActiveNavItemId: "phase-1" };
    const suggestions = [{ options: ["Yes", "No"] }];
    const text = `Reply.\n\`\`\`json\n${JSON.stringify({ navPatch, suggestions })}\n\`\`\``;
    const result = extractJsonBlock(text);
    expect(result.navPatch).toEqual(navPatch);
    expect(result.suggestions).toEqual(suggestions);
  });

  it("returns text unchanged when json block is malformed", () => {
    const text = "Here is my reply.\n```json\n{ bad json }\n```";
    const result = extractJsonBlock(text);
    expect(result.cleanReply).toBe(text);
    expect(result.navPatch).toBeUndefined();
    expect(result.suggestions).toBeUndefined();
  });

  it("strips the json block from the visible reply", () => {
    const text = `Before.\n\`\`\`json\n{"navPatch": {}}\n\`\`\`\nAfter.`;
    const result = extractJsonBlock(text);
    expect(result.cleanReply).toBe("Before.\n\nAfter.");
  });
});

// ---------------------------------------------------------------------------
// createJsonBlockFilter (streaming filter)
// ---------------------------------------------------------------------------

describe("createJsonBlockFilter", () => {
  it("passes plain text through unchanged", () => {
    const filter = createJsonBlockFilter();
    const out = filter.feed("Hello world") + filter.flush();
    expect(out).toBe("Hello world");
  });

  it("strips a complete json block in a single chunk", () => {
    const filter = createJsonBlockFilter();
    const input = 'Before ```json\n{"key":"value"}\n``` After';
    const out = filter.feed(input) + filter.flush();
    expect(out).toBe("Before  After");
  });

  it("strips a json block split across multiple chunks", () => {
    const filter = createJsonBlockFilter();
    const chunks = ["Reply text. ```js", 'on\n{"key":"v', 'alue"}\n``` Done.'];
    const out = chunks.map((c) => filter.feed(c)).join("") + filter.flush();
    expect(out).toBe("Reply text.  Done.");
  });

  it("passes text with no json block through flush correctly", () => {
    const filter = createJsonBlockFilter();
    filter.feed("Short");
    expect(filter.flush()).toBe("Short");
  });

  it("returns empty string from flush when inside an unclosed json block", () => {
    const filter = createJsonBlockFilter();
    filter.feed("Text ```json\n{incomplete");
    expect(filter.flush()).toBe("");
  });

  it("handles text before and after the json block", () => {
    const filter = createJsonBlockFilter();
    const out =
      filter.feed("Start. ") +
      filter.feed("```json\n{}\n```") +
      filter.feed(" End.") +
      filter.flush();
    expect(out).toBe("Start.  End.");
  });
});

// ---------------------------------------------------------------------------
// buildApiMessages
// ---------------------------------------------------------------------------

describe("buildApiMessages", () => {
  const navContext = '{"activeNavItemId":"phase-1"}';
  const currentMessage = "I want to build a SaaS app.";

  it("injects synthetic greeting for a new session (no thread messages)", () => {
    const result = buildApiMessages([], navContext, currentMessage);
    expect(result).toHaveLength(3);
    expect(result[0].role).toBe("user");
    expect(result[1].role).toBe("assistant");
    expect(result[1].content).toBe(SESSION_GREETING);
    expect(result[2].role).toBe("user");
    expect(result[2].content).toContain(currentMessage);
    expect(result[2].content).toContain(navContext);
  });

  it("does not inject synthetic greeting when thread history exists", () => {
    const thread = [
      { role: "user", text: "I want to build something." },
      { role: "assistant", text: "Great, tell me more." },
    ];
    const result = buildApiMessages(thread, navContext, currentMessage);
    expect(result).toHaveLength(3);
    expect(result[0].content).toBe("I want to build something.");
    expect(result[1].content).toBe("Great, tell me more.");
    expect(result[2].content).toContain(currentMessage);
  });

  it("embeds navContext and currentMessage in the final user turn", () => {
    const result = buildApiMessages([], navContext, currentMessage);
    const lastMessage = result[result.length - 1];
    expect(lastMessage.content).toContain(`NAV_CONTEXT:\n${navContext}`);
    expect(lastMessage.content).toContain(`USER_MESSAGE:\n${currentMessage}`);
  });

  it("skips assistant messages that appear before the first user message", () => {
    const thread = [
      { role: "assistant", text: "I am the greeting." },
      { role: "user", text: "First user message." },
      { role: "assistant", text: "Response." },
    ];
    const result = buildApiMessages(thread, navContext, currentMessage);
    // First item should be the first user message, not the assistant greeting
    expect(result[0].content).toBe("First user message.");
  });
});
