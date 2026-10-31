/**
 * The subset of the OpenAI-compatible Responses API that BharatCode documents
 * (https://bharatcode.ai/build). Only what Turant sends and reads is typed.
 */

export type InputContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: "auto" | "low" | "high" };

export interface InputMessage {
  type?: "message";
  role: "user" | "assistant" | "system" | "developer";
  content: string | InputContent[];
}

export interface OutputText {
  type: "output_text";
  text: string;
  annotations?: unknown[];
}

export interface OutputMessage {
  type: "message";
  id?: string;
  role: "assistant";
  status?: "completed" | "in_progress" | "incomplete";
  content: Array<OutputText | { type: string; [k: string]: unknown }>;
}

export interface FunctionCallItem {
  type: "function_call";
  id?: string;
  call_id: string;
  name: string;
  arguments: string;
  status?: "completed" | "in_progress" | "incomplete";
}

export interface FunctionCallOutputItem {
  type: "function_call_output";
  call_id: string;
  /** Must be a string, per BharatCode's docs. */
  output: string;
}

export interface OtherOutputItem {
  type: "reasoning" | string;
  [k: string]: unknown;
}

export type OutputItem = OutputMessage | FunctionCallItem | OtherOutputItem;
export type InputItem = InputMessage | OutputItem | FunctionCallOutputItem;

export interface FunctionTool {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  strict: true;
}

export interface TextFormatJsonSchema {
  type: "json_schema";
  name: string;
  schema: Record<string, unknown>;
  strict: true;
}

export interface CreateResponseRequest {
  model: string;
  input: string | InputItem[];
  instructions?: string;
  tools?: FunctionTool[];
  tool_choice?: "auto" | "none" | "required" | { type: "function"; name: string };
  text?: { format: TextFormatJsonSchema };
  max_output_tokens?: number;
  reasoning?: { effort: "none" | "low" | "medium" | "high" };
  /** BharatCode requires store:false. The type makes any other value impossible. */
  store: false;
  stream?: boolean;
}

export interface ResponseObject {
  id?: string;
  object?: "response";
  status: "completed" | "incomplete" | "failed" | "in_progress" | "queued";
  output: OutputItem[];
  incomplete_details?: { reason?: string } | null;
  error?: { message?: string; code?: string } | null;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
}

export function isFunctionCall(item: OutputItem | InputItem): item is FunctionCallItem {
  return item.type === "function_call";
}

/** Concatenates the assistant's output text, ignoring reasoning and tool items. */
export function outputText(response: ResponseObject): string {
  return response.output
    .filter((i): i is OutputMessage => i.type === "message")
    .flatMap((m) => m.content)
    .filter((c): c is OutputText => c.type === "output_text" && typeof (c as OutputText).text === "string")
    .map((c) => c.text)
    .join("");
}
