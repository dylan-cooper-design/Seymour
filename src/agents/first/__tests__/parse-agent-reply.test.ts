import { describe, it, expect } from "vitest";
import {
  normalizeSuggestions,
  extractJsonBlock,
  createJsonBlockFilter,
  buildApiMessages,
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
    expect(normalizeSuggestions([{ options: ["Modal", "Full page"] }])).toEqual([
      { options: ["Modal", "Full page"] },
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

  it("extracts structure from a json block", () => {
    const structure = { rename: [{ id: "problem", label: "Problem statement" }] };
    const text = `Here is my reply.\n\`\`\`json\n${JSON.stringify({ structure })}\n\`\`\``;
    const result = extractJsonBlock(text);
    expect(result.structure).toEqual(structure);
    expect(result.cleanReply).toBe("Here is my reply.");
  });

  it("extracts proposals from a json block", () => {
    const proposals = [
      { id: "resolve-x", kind: "resolveDecision", nodeId: "framing", resolution: "Modal" },
    ];
    const text = `Make your choice.\n\`\`\`json\n${JSON.stringify({ proposals })}\n\`\`\``;
    const result = extractJsonBlock(text);
    expect(result.proposals).toEqual(proposals);
  });

  it("drops an empty proposals array", () => {
    const text = `No proposals here.\n\`\`\`json\n${JSON.stringify({ proposals: [] })}\n\`\`\``;
    const result = extractJsonBlock(text);
    expect(result.proposals).toBeUndefined();
  });

  it("extracts suggestions from a json block", () => {
    const suggestions = [{ question: "Which fits?", options: ["Modal", "Full page"] }];
    const text = `Make your choice.\n\`\`\`json\n${JSON.stringify({ suggestions })}\n\`\`\``;
    const result = extractJsonBlock(text);
    expect(result.suggestions).toEqual(suggestions);
  });

  it("extracts structure, proposals, and suggestions together", () => {
    const structure = { setProjectName: "Password recovery" };
    const proposals = [{ id: "note-1", kind: "note", nodeId: "problem", note: "..." }];
    const suggestions = [{ options: ["Yes", "No"] }];
    const text = `Reply.\n\`\`\`json\n${JSON.stringify({ structure, proposals, suggestions })}\n\`\`\``;
    const result = extractJsonBlock(text);
    expect(result.structure).toEqual(structure);
    expect(result.proposals).toEqual(proposals);
    expect(result.suggestions).toEqual(suggestions);
  });

  it("returns text unchanged when json block is malformed", () => {
    const text = "Here is my reply.\n```json\n{ bad json }\n```";
    const result = extractJsonBlock(text);
    expect(result.cleanReply).toBe(text);
    expect(result.structure).toBeUndefined();
    expect(result.proposals).toBeUndefined();
    expect(result.suggestions).toBeUndefined();
  });

  it("strips the json block from the visible reply", () => {
    const text = `Before.\n\`\`\`json\n{"structure": {}}\n\`\`\`\nAfter.`;
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
  const projectContext = '{"activeNodeId":"problem"}';
  const currentMessage = "I want to build a SaaS app.";

  it("embeds only the current turn when there is no thread history", () => {
    const result = buildApiMessages([], projectContext, currentMessage);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("user");
    expect(result[0].content).toContain(currentMessage);
    expect(result[0].content).toContain(projectContext);
  });

  it("drops a leading assistant greeting with no prior user turn", () => {
    const thread = [{ role: "assistant", text: "**Problem statement**\n\nSettle the problem." }];
    const result = buildApiMessages(thread, projectContext, currentMessage);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("user");
  });

  it("does not inject a synthetic greeting when thread history exists", () => {
    const thread = [
      { role: "user", text: "I want to build something." },
      { role: "assistant", text: "Great, tell me more." },
    ];
    const result = buildApiMessages(thread, projectContext, currentMessage);
    expect(result).toHaveLength(3);
    expect(result[0].content).toBe("I want to build something.");
    expect(result[1].content).toBe("Great, tell me more.");
    expect(result[2].content).toContain(currentMessage);
  });

  it("embeds projectContext and currentMessage in the final user turn", () => {
    const result = buildApiMessages([], projectContext, currentMessage);
    const lastMessage = result[result.length - 1];
    expect(lastMessage.content).toContain(`PROJECT_CONTEXT:\n${projectContext}`);
    expect(lastMessage.content).toContain(`USER_MESSAGE:\n${currentMessage}`);
  });

  it("skips assistant messages that appear before the first user message", () => {
    const thread = [
      { role: "assistant", text: "I am the greeting." },
      { role: "user", text: "First user message." },
      { role: "assistant", text: "Response." },
    ];
    const result = buildApiMessages(thread, projectContext, currentMessage);
    expect(result[0].content).toBe("First user message.");
  });
});
