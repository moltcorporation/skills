---
name: workflow-dev-kit-docs
description: 'Answer questions about the workflow DevKit. Use anytime you are working with workflow-dev-kit or need to view the workflow-dev-kit documentation'
---

# API Reference

All the functions and primitives that come with Workflow DevKit by package.

<Cards>
  <Card title="workflow" href="/docs/api-reference/workflow">
    Core workflow primitives including steps, context management, streaming, webhooks, and error handling.
  </Card>

  <Card title="workflow/api" href="/docs/api-reference/workflow-api">
    API reference for runtime functions from the `workflow/api` package.
  </Card>

  <Card title="workflow/next" href="/docs/api-reference/workflow-next">
    Next.js integration for Workflow DevKit that automatically configures bundling and runtime support.
  </Card>

  <Card title="@workflow/ai" href="/docs/api-reference/workflow-ai">
    Helpers for integrating AI SDK for building AI-powered workflows.
  </Card>
</Cards>


---
title: Chat Session Modeling
description: Model chat sessions at different architectural layers to control state ownership and handle interruptions.
type: guide
summary: Choose between single-turn and multi-turn workflow patterns for managing chat session state.
prerequisites:
  - /docs/ai
  - /docs/foundations/workflows-and-steps
related:
  - /docs/ai/message-queueing
  - /docs/ai/resumable-streams
  - /docs/foundations/hooks
  - /docs/api-reference/workflow-ai/durable-agent
  - /docs/api-reference/workflow/define-hook
---

# Chat Session Modeling



Chat sessions in AI agents can be modeled at different layers of your architecture. The choice affects state ownership and how you handle interruptions and reconnections.

While there are many ways to model chat sessions, the two most common categories are single-turn and multi-turn.

## Single-Turn Workflows

Each user message triggers a new workflow run. The client or API route owns the conversation history and sends the full message array with each request.

<Tabs items={['Workflow', 'API Route', 'Client']}>
  <Tab value="Workflow">
    ```typescript title="workflows/chat/index.ts" lineNumbers
    import { DurableAgent } from "@workflow/ai/agent";
    import { getWritable } from "workflow";
    import { flightBookingTools, FLIGHT_ASSISTANT_PROMPT } from "./steps/tools";
    import { convertToModelMessages, type UIMessage, type UIMessageChunk } from "ai";

    export async function chat(messages: UIMessage[]) {
      "use workflow";

      const writable = getWritable<UIMessageChunk>();

      const agent = new DurableAgent({
        model: "bedrock/claude-haiku-4-5-20251001-v1",
        system: FLIGHT_ASSISTANT_PROMPT,
        tools: flightBookingTools,
      });

      await agent.stream({
        messages: convertToModelMessages(messages), // [!code highlight] Full history from client
        writable,
      });
    }
    ```
  </Tab>

  <Tab value="API Route">
    ```typescript title="app/api/chat/route.ts" lineNumbers
    import { createUIMessageStreamResponse, type UIMessage } from "ai";
    import { start } from "workflow/api";
    import { chat } from "@/workflows/chat";

    export async function POST(req: Request) {
      const { messages }: { messages: UIMessage[] } = await req.json();

      const run = await start(chat, [messages]); // [!code highlight]

      return createUIMessageStreamResponse({
        stream: run.readable,
        headers: {
          "x-workflow-run-id": run.runId, // [!code highlight] For stream reconnection
        },
      });
    }
    ```
  </Tab>

  <Tab value="Client">
    Chat messages need to be stored somewhere—typically a database. In this example, we assume a route like `/chats/:id` passes the session ID, allowing us to fetch existing messages and persist new ones.

    ```typescript title="app/chats/[id]/page.tsx" lineNumbers
    "use client";

    import { useChat } from "@ai-sdk/react";
    import { WorkflowChatTransport } from "@workflow/ai"; // [!code highlight]
    import { useParams } from "next/navigation";
    import { useMemo } from "react";

    // Fetch existing messages from your backend
    async function getMessages(sessionId: string) { // [!code highlight]
      const res = await fetch(`/api/chats/${sessionId}/messages`); // [!code highlight]
      return res.json(); // [!code highlight]
    } // [!code highlight]

    export function Chat({ initialMessages }) {
      const { id: sessionId } = useParams<{ id: string }>();

      const transport = useMemo( // [!code highlight]
        () => // [!code highlight]
          new WorkflowChatTransport({ // [!code highlight]
            api: "/api/chat", // [!code highlight]
            onChatEnd: async () => { // [!code highlight]
              // Persist the updated messages to the chat session // [!code highlight]
              await fetch(`/api/chats/${sessionId}/messages`, { // [!code highlight]
                method: "PUT", // [!code highlight]
                headers: { "Content-Type": "application/json" }, // [!code highlight]
                body: JSON.stringify({ messages }), // [!code highlight]
              }); // [!code highlight]
            }, // [!code highlight]
          }), // [!code highlight]
        [sessionId] // [!code highlight]
      ); // [!code highlight]

      const { messages, input, handleInputChange, handleSubmit } = useChat({
        initialMessages, // [!code highlight] Loaded via getMessages(sessionId)
        transport, // [!code highlight]
      });

      return (
        <form onSubmit={handleSubmit}>
          {/* ... render messages ... */}
          <input value={input} onChange={handleInputChange} />
        </form>
      );
    }
    ```
  </Tab>
</Tabs>

This is the pattern used in the [Building Durable AI Agents](/docs/ai) guide.

In this pattern, the client owns conversation state, with the latest turn managed by the AI SDK's `useChat`, and past turns persisted to a user-managed database.

Persisting the turn is usually done through either:

* A step on the workflow that runs after `agent.stream()` and takes the message history from the agent return value (either `messages: ModelMessage[]` or `uiMessages: UIMessage[]`)
* A hook on `useChat`in the client that calls an API to persist state (or localStorage, etc.), either on every new message, or `onFinish`
* The resumable stream attached to the workflow (see [Resumable Streams](/docs/ai/resumable-streams))
  * Note that user messages are not persisted to the stream by default, and need to be explicitly persisted separately

## Multi-Turn Workflows

A single workflow handles the entire conversation session across multiple turns, and owns the current conversation state. The clients/API routes inject new messages via hooks. The workflow run ID serves as the session identifier.

For a full example of an agent using multi-turn workflows, check out the Flight Booking App example in the [Workflow Examples](https://github.com/vercel/workflow-examples/tree/main/flight-booking-app) repository.

A key challenge in multi-turn workflows is ensuring user messages appear in the correct order when replaying the stream (e.g., after a page refresh). Since the stream primarily contains AI responses, user messages must be explicitly marked in the stream so the client can reconstruct the full conversation.

<Tabs items={['Workflow', 'API Routes', 'Hook Definition', 'Client Hook']}>
  <Tab value="Workflow">
    ```typescript title="workflows/chat/index.ts" lineNumbers
    import {
      convertToModelMessages,
      type UIMessageChunk,
      type UIMessage,
      type ModelMessage,
    } from "ai";
    import { DurableAgent } from "@workflow/ai/agent";
    import { getWritable, getWorkflowMetadata } from "workflow";
    import { chatMessageHook } from "./hooks/chat-message";
    import { flightBookingTools, FLIGHT_ASSISTANT_PROMPT } from "./steps/tools";
    import { writeUserMessageMarker, writeStreamClose } from "./steps/writer"; // [!code highlight]

    export async function chat(initialMessages: UIMessage[]) {
      "use workflow";

      const { workflowRunId: runId } = getWorkflowMetadata();
      const writable = getWritable<UIMessageChunk>();
      const messages: ModelMessage[] = convertToModelMessages(initialMessages);

      // Write markers for initial user messages (for replay) // [!code highlight]
      for (const msg of initialMessages) { // [!code highlight]
        if (msg.role === "user") { // [!code highlight]
          const text = msg.parts.filter((p) => p.type === "text").map((p) => p.text).join(""); // [!code highlight]
          if (text) await writeUserMessageMarker(writable, text, msg.id); // [!code highlight]
        } // [!code highlight]
      } // [!code highlight]

      const agent = new DurableAgent({
        model: "bedrock/claude-haiku-4-5-20251001-v1",
        system: FLIGHT_ASSISTANT_PROMPT,
        tools: flightBookingTools,
      });

      // Use run ID as the hook token for easy resumption
      const hook = chatMessageHook.create({ token: runId });
      let turnNumber = 0;

      while (true) {
        turnNumber++;
        const result = await agent.stream({
          messages,
          writable,
          preventClose: true, // [!code highlight] Keep stream open for follow-ups
          sendStart: turnNumber === 1,
          sendFinish: false,
        });
        messages.push(...result.messages.slice(messages.length));

        // Wait for next user message via hook
        const { message: followUp } = await hook;
        if (followUp === "/done") break;

        // Write marker and add to messages // [!code highlight]
        const followUpId = `user-${runId}-${turnNumber}`; // [!code highlight]
        await writeUserMessageMarker(writable, followUp, followUpId); // [!code highlight]
        messages.push({ role: "user", content: followUp });
      }

      await writeStreamClose(writable); // [!code highlight]
      return { messages };
    }
    ```

    The `writeUserMessageMarker` helper writes a `data-workflow` chunk to mark user turns:

    ```typescript title="workflows/chat/steps/writer.ts" lineNumbers
    import type { UIMessageChunk } from "ai";

    export async function writeUserMessageMarker( // [!code highlight]
      writable: WritableStream<UIMessageChunk>,
      content: string,
      messageId: string
    ) {
      "use step"; // [!code highlight]
      const writer = writable.getWriter();
      try {
        await writer.write({
          type: "data-workflow", // [!code highlight]
          data: { type: "user-message", id: messageId, content, timestamp: Date.now() }, // [!code highlight]
        } as UIMessageChunk);
      } finally {
        writer.releaseLock();
      }
    }

    export async function writeStreamClose(writable: WritableStream<UIMessageChunk>) {
      const writer = writable.getWriter();
      await writer.write({ type: "finish" });
      await writer.close();
    }
    ```
  </Tab>

  <Tab value="API Routes">
    Three endpoints: start a session, send follow-up messages, and reconnect to the stream.

    ```typescript title="app/api/chat/route.ts" lineNumbers
    import { createUIMessageStreamResponse, type UIMessage } from "ai";
    import { start } from "workflow/api";
    import { chat } from "@/workflows/chat";

    export async function POST(req: Request) {
      const { initialMessage }: { initialMessage: UIMessage } = await req.json();

      const run = await start(chat, [[initialMessage]]); // [!code highlight]

      return createUIMessageStreamResponse({
        stream: run.readable,
        headers: {
          "x-workflow-run-id": run.runId, // [!code highlight] For follow-ups and reconnection
        },
      });
    }
    ```

    ```typescript title="app/api/chat/[id]/route.ts" lineNumbers
    import { chatMessageHook } from "@/workflows/chat/hooks/chat-message";

    export async function POST(
      req: Request,
      { params }: { params: Promise<{ id: string }> }
    ) {
      const { id: runId } = await params;
      const { message } = await req.json();

      // Resume the hook using the workflow run ID // [!code highlight]
      await chatMessageHook.resume(runId, { message }); // [!code highlight]

      return Response.json({ success: true });
    }
    ```

    ```typescript title="app/api/chat/[id]/stream/route.ts" lineNumbers
    import { createUIMessageStreamResponse } from "ai";
    import { getRun } from "workflow/api";

    export async function GET(
      request: Request,
      { params }: { params: Promise<{ id: string }> }
    ) {
      const { id } = await params;
      const { searchParams } = new URL(request.url);
      const startIndex = searchParams.get("startIndex");

      const run = getRun(id); // [!code highlight]
      const stream = run.getReadable({ // [!code highlight]
        startIndex: startIndex ? parseInt(startIndex, 10) : undefined, // [!code highlight]
      }); // [!code highlight]

      return createUIMessageStreamResponse({ stream });
    }
    ```
  </Tab>

  <Tab value="Hook Definition">
    ```typescript title="workflows/chat/hooks/chat-message.ts" lineNumbers
    import { defineHook } from "workflow";
    import { z } from "zod";

    export const chatMessageHook = defineHook({
      schema: z.object({
        message: z.string(),
      }),
    });
    ```
  </Tab>

  <Tab value="Client Hook">
    A custom hook wraps `useChat` to manage the multi-turn session. It handles:

    * Routing between the initial message endpoint and follow-up endpoint
    * Reconstructing user messages from stream markers for correct ordering on replay

    ```typescript title="hooks/use-multi-turn-chat.ts" lineNumbers
    "use client";

    import type { UIMessage, UIDataTypes, ChatStatus } from "ai";
    import { useChat } from "@ai-sdk/react";
    import { WorkflowChatTransport } from "@workflow/ai";
    import { useState, useCallback, useMemo, useEffect, useRef } from "react";

    const STORAGE_KEY = "workflow-run-id";

    interface UserMessageData {
      type: "user-message";
      id: string;
      content: string;
      timestamp: number;
    }

    export function useMultiTurnChat() {
      const [runId, setRunId] = useState<string | null>(null);
      const [shouldResume, setShouldResume] = useState(false);
      const userMessagesRef = useRef<Map<string, UIMessage>>(new Map());

      // Check for existing session on mount // [!code highlight]
      useEffect(() => {
        const storedRunId = localStorage.getItem(STORAGE_KEY);
        if (storedRunId) {
          setRunId(storedRunId);
          setShouldResume(true);
        }
      }, []);

      const transport = useMemo(
        () =>
          new WorkflowChatTransport({
            api: "/api/chat",
            onChatSendMessage: (response) => {
              const workflowRunId = response.headers.get("x-workflow-run-id");
              if (workflowRunId) {
                setRunId(workflowRunId);
                localStorage.setItem(STORAGE_KEY, workflowRunId);
              }
            },
            onChatEnd: () => {
              setRunId(null);
              localStorage.removeItem(STORAGE_KEY);
              userMessagesRef.current.clear();
            },
            prepareReconnectToStreamRequest: ({ api, ...rest }) => {
              const storedRunId = localStorage.getItem(STORAGE_KEY);
              if (!storedRunId) throw new Error("No active session");
              return { ...rest, api: `/api/chat/${storedRunId}/stream` };
            },
          }),
        []
      );

      const { messages: rawMessages, sendMessage: baseSendMessage, status, stop, setMessages } =
        useChat({ resume: shouldResume, transport });

      // Reconstruct conversation order from stream markers // [!code highlight]
      const messages = useMemo(() => { // [!code highlight]
        const result: UIMessage[] = []; // [!code highlight]
        const seenContent = new Set<string>(); // [!code highlight]
        // [!code highlight]
        // Collect content from optimistic user messages // [!code highlight]
        for (const msg of rawMessages) { // [!code highlight]
          if (msg.role === "user") { // [!code highlight]
            const text = msg.parts.filter((p) => p.type === "text").map((p) => p.text).join(""); // [!code highlight]
            if (text) seenContent.add(text); // [!code highlight]
          } // [!code highlight]
        } // [!code highlight]
        // [!code highlight]
        for (const msg of rawMessages) { // [!code highlight]
          if (msg.role === "user") { // [!code highlight]
            result.push(msg); // [!code highlight]
            continue; // [!code highlight]
          } // [!code highlight]
          // [!code highlight]
          if (msg.role === "assistant") { // [!code highlight]
            // Process parts in order, splitting on user-message markers // [!code highlight]
            let currentParts: typeof msg.parts = []; // [!code highlight]
            let partIndex = 0; // [!code highlight]
            // [!code highlight]
            for (const part of msg.parts) { // [!code highlight]
              if (part.type === "data-workflow" && "data" in part) { // [!code highlight]
                const data = part.data as UserMessageData; // [!code highlight]
                if (data?.type === "user-message") { // [!code highlight]
                  // Flush accumulated assistant parts // [!code highlight]
                  if (currentParts.length > 0) { // [!code highlight]
                    result.push({ ...msg, id: `${msg.id}-${partIndex++}`, parts: currentParts }); // [!code highlight]
                    currentParts = []; // [!code highlight]
                  } // [!code highlight]
                  // Add user message if not duplicate // [!code highlight]
                  if (!seenContent.has(data.content)) { // [!code highlight]
                    seenContent.add(data.content); // [!code highlight]
                    result.push({ id: data.id, role: "user", parts: [{ type: "text", text: data.content }] }); // [!code highlight]
                  } // [!code highlight]
                  continue; // [!code highlight]
                } // [!code highlight]
              } // [!code highlight]
              currentParts.push(part); // [!code highlight]
            } // [!code highlight]
            // [!code highlight]
            if (currentParts.length > 0) { // [!code highlight]
              result.push({ ...msg, id: partIndex > 0 ? `${msg.id}-${partIndex}` : msg.id, parts: currentParts }); // [!code highlight]
            } // [!code highlight]
          } // [!code highlight]
        } // [!code highlight]
        return result; // [!code highlight]
      }, [rawMessages]); // [!code highlight]

      // Route messages to appropriate endpoint
      const sendMessage = useCallback(
        async (text: string) => {
          if (runId) {
            // Follow-up: send via hook resumption // [!code highlight]
            await fetch(`/api/chat/${runId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: text }),
            });
          } else {
            // First message: start new workflow
            await baseSendMessage({ text, metadata: { createdAt: Date.now() } });
          }
        },
        [runId, baseSendMessage]
      );

      const endSession = useCallback(async () => {
        if (runId) {
          await fetch(`/api/chat/${runId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "/done" }),
          });
        }
        setRunId(null);
        setShouldResume(false);
        localStorage.removeItem(STORAGE_KEY);
        userMessagesRef.current.clear();
        setMessages([]);
      }, [runId, setMessages]);

      return { messages, status, runId, sendMessage, endSession, stop };
    }
    ```
  </Tab>
</Tabs>

In this pattern, the workflow owns the entire conversation session. All messages are persisted in the workflow, and follow-up messages are injected via hooks. The workflow writes **user message markers** to the stream using `data-workflow` chunks, which allows the client to reconstruct the full conversation in the correct order when replaying the stream (e.g., after a page refresh).

The client hook processes these markers by:

1. Iterating through message parts in order
2. When a `user-message` marker is found, flushing any accumulated assistant content and inserting the user message
3. Deduplicating against optimistic sends from the initial message

This ensures the conversation displays as User → AI → User → AI regardless of whether viewing live or replaying from the stream.

## Choosing a Pattern

| Consideration                  | Single-Turn                      | Multi-Turn            |
| ------------------------------ | -------------------------------- | --------------------- |
| State ownership                | Client or API route              | Workflow              |
| Message injection from backend | Requires stitching together runs | Native via hooks      |
| Workflow complexity            | Lower                            | Higher                |
| Workflow time horizon          | Minutes                          | Hours to indefinitely |
| Observability scope            | Per-turn traces                  | Full session traces   |

**Multi-turn is recommended for most production use-cases.** If you're starting fresh, go with multi-turn. It's more flexible and grows with your requirements. You don't need to maintain the chat history yourself and can offload all that to the workflow's built in persistence. It also enables native message injection and full session observability, which becomes increasingly valuable as your agent matures.

**Single-turn works well when adapting existing architectures.** If you already have a system for managing message state, and want to adopt durable agents incrementally, single-turn workflows slot in with minimal changes. Each turn maps cleanly to an independent workflow run.

## Multiplayer Chat Sessions

The multi-turn pattern also easily enables multi-player chat sessions. New messages can come from system events, external services, and other users. Since a `hook` injects messages into workflow at any point, and the entire history is a single stream that clients can reconnect to, it doesn't matter where the injected messages come from. Here are different use-cases for multi-player chat sessions:

<Tabs items={['System Event', 'External Service', 'Multiple Users']}>
  <Tab value="System Event">
    Internal system events like scheduled tasks, background jobs, or database triggers can inject updates into an active conversation.

    ```typescript title="app/api/internal/flight-update/route.ts" lineNumbers
    import { chatMessageHook } from "@/workflows/chat/hooks/chat-message";

    // Called by your flight status monitoring system
    export async function POST(req: Request) {
      const { runId, flightNumber, newStatus } = await req.json();

      await chatMessageHook.resume(runId, { // [!code highlight]
        message: `[System] Flight ${flightNumber} status updated: ${newStatus}`, // [!code highlight]
      }); // [!code highlight]

      return Response.json({ success: true });
    }
    ```
  </Tab>

  <Tab value="External Service">
    External webhooks from third-party services (Stripe, Twilio, etc.) can notify the conversation of events.

    ```typescript title="app/api/webhooks/payment/route.ts" lineNumbers
    import { chatMessageHook } from "@/workflows/chat/hooks/chat-message";

    export async function POST(req: Request) {
      const { runId, paymentStatus, amount } = await req.json();

      if (paymentStatus === "succeeded") {
        await chatMessageHook.resume(runId, { // [!code highlight]
          message: `[Payment] Payment of $${amount.toFixed(2)} received. Your booking is confirmed!`, // [!code highlight]
        }); // [!code highlight]
      }

      return Response.json({ received: true });
    }
    ```
  </Tab>

  <Tab value="Multiple Users">
    Multiple human users can participate in the same conversation. Each user's client connects to the same workflow stream.

    ```typescript title="app/api/chat/[id]/route.ts" lineNumbers
    import { chatMessageHook } from "@/workflows/chat/hooks/chat-message";
    import { getUser } from "@/lib/auth";

    export async function POST(
      req: Request,
      { params }: { params: Promise<{ id: string }> }
    ) {
      const { id: runId } = await params;
      const { message } = await req.json();
      const user = await getUser(req); // [!code highlight]

      // Inject message with user attribution // [!code highlight]
      await chatMessageHook.resume(runId, { // [!code highlight]
        message: `[${user.name}] ${message}`, // [!code highlight]
      }); // [!code highlight]

      return Response.json({ success: true });
    }
    ```
  </Tab>
</Tabs>

## Related Documentation

* [Building Durable AI Agents](/docs/ai) - Foundation guide for durable agents
* [Message Queueing](/docs/ai/message-queueing) - Queueing messages during tool execution
* [`defineHook()` API Reference](/docs/api-reference/workflow/define-hook) - Hook configuration options
* [`DurableAgent` API Reference](/docs/api-reference/workflow-ai/durable-agent) - Full API documentation


---
title: Patterns for Defining Tools
description: Common patterns for defining tools in durable AI agents using Workflow DevKit.
type: guide
summary: Define step-level and workflow-level tools for durable AI agents with stream writing and context access.
prerequisites:
  - /docs/ai
related:
  - /docs/ai/streaming-updates-from-tools
  - /docs/ai/sleep-and-delays
  - /docs/foundations/workflows-and-steps
  - /docs/api-reference/workflow/get-writable
---

# Patterns for Defining Tools



This page covers the details for some common patterns when defining tools for AI agents using Workflow DevKit.

Using DurableAgent, we model most tools as steps. These can be anything from a simple function call to a entire multi-day long workflow.

## Accessing message context in tools

Just like in regular AI SDK tool definitions, tool in DurableAgent are called with a first argument of the tool's input parameters, and a second argument of the tool call context.

When you tool needs access to the full message history, you can access it via the `messages` property of the tool call context:

```typescript title="tools.ts" lineNumbers
async function getWeather(
  { city }: { city: string },
  { messages, toolCallId }: { messages: LanguageModelV2Prompt, toolCallId: string }) { // [!code highlight]
  "use step";
  return `Weather in ${city} is sunny`;
}
```

## Writing to Streams

As discussed in [Streaming Updates from Tools](/docs/ai/streaming-updates-from-tools), it's common to use a step just to call `getWritable()` for writing custom data parts to the stream.

This can be made generic, by creating a helper step function to write arbitrary data to the stream:

```typescript title="tools.ts" lineNumbers
import { getWritable } from "workflow";

async function writeToStream(data: any) {
  "use step";

  const writable = getWritable();
  const writer = writable.getWriter();
  await writer.write(data);
  writer.releaseLock();
}
```

## Step-Level vs Workflow-Level Tools

Tools can be implemented either at the step level or the workflow level, with different capabilities and constraints.

| Capability                            | Step-Level (`"use step"`) | Workflow-Level (`"use workflow"`) |
| ------------------------------------- | ------------------------- | --------------------------------- |
| `getWritable()`                       | ✅                         | ❌                                 |
| Automatic retries                     | ✅                         | ❌                                 |
| Side-effects (e.g. API calls) allowed | ✅                         | ❌                                 |
| `sleep()`                             | ❌                         | ✅                                 |
| `createWebhook()`                     | ❌                         | ✅                                 |

Tools can also combine both by starting out on the workflow level, and calling into steps for I/O operations, like so:

```typescript title="tools.ts" lineNumbers
// Step: handles I/O with retries
async function performFetch(url: string) {
  "use step";
  const response = await fetch(url);
  return response.json();
}

// Workflow-level: orchestrates steps and can use sleep()
async function executeFetchWithDelay({ url }: { url: string }) {
  const result = await performFetch(url);
  await sleep("5s"); // Only available at workflow level
  return result;
}
```


---
title: Human-in-the-Loop
description: Wait for human input or external events before proceeding in your AI agent workflows.
type: guide
summary: Pause agent workflows for human approval using hooks and webhooks, then resume on input.
prerequisites:
  - /docs/ai
  - /docs/foundations/hooks
related:
  - /docs/ai/chat-session-modeling
  - /docs/api-reference/workflow/create-webhook
  - /docs/api-reference/workflow/define-hook
  - /docs/foundations/workflows-and-steps
---

# Human-in-the-Loop



A common pre-requisite for running AI agents in production is the ability to wait for human input or external events before proceeding.

Workflow DevKit's [webhook](/docs/api-reference/workflow/create-webhook) and [hook](/docs/api-reference/workflow/define-hook) primitives enable "human-in-the-loop" patterns where workflows pause until a human takes action, allowing smooth resumption of workflows even after days of inactivity, and provides stability across code deployments.

If you need to react to external events programmatically, see the [hooks](/docs/foundations/hooks) documentation for more information. This part of the guide will focus on the human-in-the-loop pattern, which is a subset of the more general hook pattern.

## How It Works

<Steps>
  <Step>
    `defineHook()` creates a typed hook that can be awaited in a workflow. When the tool is called, it creates a hook instance using the tool call ID as the token.
  </Step>

  <Step>
    The workflow pauses at `await hook` - no compute resources are consumed while waiting for the human to take action.
  </Step>

  <Step>
    The UI displays the pending tool call with its input data (flight details, price, etc.) and renders approval controls.
  </Step>

  <Step>
    The user submits their decision through an API endpoint, which resumes the hook with the approval data.
  </Step>

  <Step>
    The workflow receives the approval data and resumes execution.
  </Step>
</Steps>

While this demo will use a client side button for human approval, you could just as easily create a webhook and send the approval link over email or slack to resume the agent.

## Creating a Booking Approval Tool

Add a tool that allows the agent to deliberately pause execution until a human approves or rejects a flight booking:

<Steps>
  <Step>
    ### Define the Hook

    Create a typed hook with a Zod schema for validation:

    ```typescript title="workflow/hooks/booking-approval.ts" lineNumbers
    import { defineHook } from "workflow";
    import { z } from "zod";
    // ... existing imports ...

    export const bookingApprovalHook = defineHook({
      schema: z.object({
        approved: z.boolean(),
        comment: z.string().optional(),
      }),
    });

    // ... tool definitions ...
    ```
  </Step>

  <Step>
    ### Implement the Tool

    Create a tool that creates a hook instance using the tool call ID as the token. The UI will use this ID to submit the approval.

    {/*@skip-typecheck: incomplete code sample*/}

    ```typescript title="workflows/chat/steps/tools.ts" lineNumbers
    import { bookingApprovalHook } from "@/workflows/hooks/booking-approval"; // [!code highlight]

    // ...

    async function executeBookingApproval( // [!code highlight]
      { flightNumber, passengerName, price }: { flightNumber: string; passengerName: string; price: number }, // [!code highlight]
      { toolCallId }: { toolCallId: string } // [!code highlight]
    ) { // [!code highlight]
      // Note: No "use step" here - hooks are workflow-level primitives // [!code highlight]

      // Use the toolCallId as the hook token so the UI can reference it // [!code highlight]
      const hook = bookingApprovalHook.create({ token: toolCallId }); // [!code highlight]

      // Workflow pauses here until the hook is resolved // [!code highlight]
      const { approved, comment } = await hook; // [!code highlight]

      if (!approved) {
        return `Booking rejected: ${comment || "No reason provided"}`;
      }

      return `Booking approved for ${passengerName} on flight ${flightNumber}${comment ? ` - Note: ${comment}` : ""}`;
    }

    // ...

    // Adding the tool to the existing tool definitions
    export const flightBookingTools = {
      // ... existing tool definitions ...
      bookingApproval: {
        description: "Request human approval before booking a flight",
        inputSchema: z.object({
          flightNumber: z.string().describe("Flight number to book"),
          passengerName: z.string().describe("Name of the passenger"),
          price: z.number().describe("Total price of the booking"),
        }),
        execute: executeBookingApproval,
      },
    };
    ```

    <Callout type="info">
      Note that the `defineHook().create()` function must be called from within a workflow context, not from within a step. This is why `executeBookingApproval` does not have `"use step"` - it runs in the workflow context where hooks are available.
    </Callout>
  </Step>

  <Step>
    ### Create the API Route

    Create a new API endpoint that the UI will call to submit the approval decision:

    ```typescript title="app/api/hooks/approval/route.ts" lineNumbers
    import { bookingApprovalHook } from "@/workflows/hooks/booking-approval"; // [!code highlight]

    export async function POST(request: Request) {
      const { toolCallId, approved, comment } = await request.json();

      // Schema validation happens automatically // [!code highlight]
      // Can throw a zod schema validation error, or a
      await bookingApprovalHook.resume(toolCallId, { // [!code highlight]
        approved,
        comment,
      });

      return Response.json({ success: true });
    }
    ```
  </Step>

  <Step>
    ### Create the Approval Component

    Build a new component that reacts to the tool call data, and allows the user to approve or reject the booking:

    ```typescript title="components/booking-approval.tsx" lineNumbers
    "use client";

    import { useState } from "react";

    interface BookingApprovalProps {
      toolCallId: string;
      input?: {
        flightNumber: string;
        passengerName: string;
        price: number;
      };
      output?: string;
    }

    export function BookingApproval({ toolCallId, input, output }: BookingApprovalProps) {
      const [comment, setComment] = useState("");
      const [isSubmitting, setIsSubmitting] = useState(false);

      // If we have output, the approval has been processed
      if (output) {
        return (
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{output}</p>
          </div>
        );
      }

      const handleSubmit = async (approved: boolean) => {
        setIsSubmitting(true);
        try {
          await fetch("/api/hooks/approval", { // [!code highlight]
            method: "POST", // [!code highlight]
            headers: { "Content-Type": "application/json" }, // [!code highlight]
            body: JSON.stringify({ toolCallId, approved, comment }), // [!code highlight]
          }); // [!code highlight]
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <p className="font-medium">Approve this booking?</p>
            <div className="text-sm text-muted-foreground">
              {input && (
                <div className="space-y-2">
                  <div>Flight: {input.flightNumber}</div>
                  <div>Passenger: {input.passengerName}</div>
                  <div>Price: ${input.price}</div>
                </div>
              )}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)..."
            className="w-full border rounded p-2 text-sm"
            rows={2}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Reject"}
            </button>
          </div>
        </div>
      );
    }
    ```
  </Step>

  <Step>
    ### Show the Tool Status in the UI

    Use the component we just created to render the tool call and approval controls in your chat interface:

    {/*@skip-typecheck: incomplete code sample*/}

    ```typescript title="app/page.tsx" lineNumbers
    // ... existing imports ...
    import { BookingApproval } from "@/components/booking-approval";

    export default function ChatPage() {

      // ...

      const { stop, messages, sendMessage, status, setMessages } =
        useChat<MyUIMessage>({
          // ... options
        });

      // ...

      return (
        <div className="flex flex-col w-full max-w-2xl pt-12 pb-24 mx-auto stretch">
          // ...

          <Conversation className="mb-10">
            <ConversationContent>
              {messages.map((message, index) => {
                const hasText = message.parts.some((part) => part.type === "text");

                return (
                  <div key={message.id}>
                    // ...
                    <Message from={message.role}>
                      <MessageContent>
                        {message.parts.map((part, partIndex) => {

                          // ...

                          if (
                            part.type === "tool-searchFlights" ||
                            part.type === "tool-checkFlightStatus" ||
                            part.type === "tool-getAirportInfo" ||
                            part.type === "tool-bookFlight" ||
                            part.type === "tool-checkBaggageAllowance"
                          ) {
                            // ... render other tools
                          }
                          if (part.type === "tool-bookingApproval") { // [!code highlight]
                            return ( // [!code highlight]
                              <BookingApproval // [!code highlight]
                                key={partIndex} // [!code highlight]
                                toolCallId={part.toolCallId} // [!code highlight]
                                input={part.input as any} // [!code highlight]
                                output={part.output as any} // [!code highlight]
                              /> // [!code highlight]
                            ); // [!code highlight]
                          } // [!code highlight]
                          return null;
                        })}
                      </MessageContent>
                    </Message>
                  </div>
                );
              })}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          // ...
        </div>
      );
    }
    ```
  </Step>
</Steps>

## Using Webhooks Directly

For simpler cases where you don't need type-safe validation or programmatic resumption, you can use [`createWebhook()`](/docs/api-reference/workflow/create-webhook) directly. This generates a unique URL that can be called to resume the workflow:

```typescript title="workflows/chat/steps/tools.ts" lineNumbers
import { createWebhook } from "workflow";
import { z } from "zod";

async function executeBookingApproval(
  { flightNumber, passengerName, price }: { flightNumber: string; passengerName: string; price: number },
  { toolCallId }: { toolCallId: string }
) {
  const webhook = createWebhook(); // [!code highlight]

  // The webhook URL could be logged, sent via email, or stored for later use
  console.log("Approval URL:", webhook.url);

  // Workflow pauses here until the webhook is called // [!code highlight]
  const request = await webhook; // [!code highlight]
  const { approved, comment } = await request.json(); // [!code highlight]

  if (!approved) {
    return `Booking rejected: ${comment || "No reason provided"}`;
  }

  return `Booking approved for ${passengerName} on flight ${flightNumber}`;
}
```

The webhook URL can be called directly with a POST request containing the approval data. This is useful for:

* External systems that need to call back into your workflow
* Payment provider callbacks
* Email-based approval links

## Related Documentation

* [Hooks & Webhooks](/docs/foundations/hooks) - Complete guide to hooks and webhooks
* [`createWebhook()` API Reference](/docs/api-reference/workflow/create-webhook) - Webhook configuration options
* [`defineHook()` API Reference](/docs/api-reference/workflow/define-hook) - Type-safe hook definitions


---
title: Building Durable AI Agents
description: Build AI agents that survive crashes, scale across requests, and maintain state with durable LLM tool-call loops.
type: overview
summary: Convert a basic AI chat app into a durable, resumable agent using Workflow DevKit.
related:
  - /docs/foundations/workflows-and-steps
  - /docs/foundations/streaming
  - /docs/foundations/errors-and-retries
  - /docs/ai/defining-tools
  - /docs/ai/resumable-streams
  - /docs/ai/human-in-the-loop
  - /docs/getting-started/next
---

# Building Durable AI Agents



AI agents are built on the primitive of LLM and tool-call loops, often with additional processes for data fetching, resource provisioning, or reacting to external events.

Workflow DevKit makes your agents production-ready, by turning them into durable, resumable workflows. It transforms your LLM calls, tool executions, and other async operations into retryable, scalable, and observable steps.

<AgentTraces />

This guide walks you through converting a basic AI chat app into a durable AI agent using Workflow DevKit.

## Why Durable Agents?

Aside from the usual challenges of getting your long-running tasks to be production-ready, building mature AI agents typically requires solving several **additional challenges**:

* **Statefulness**: Persisting chat sessions and turning LLM and tool calls into async jobs with workers and queues.
* **Observability**: Using services to collect traces and metrics, and managing them separately from your messages and user history.
* **Resumability**: Resuming streams requires not just storing your messages, but also storing streams, and piping them across services.
* **Human-in-the-loop**: Your client, API, and async job orchestration need to work together to create, track, route to, and display human approval requests, or similar webhook operations.

Workflow DevKit provides all of these capabilities out of the box. Your agent becomes a workflow, your tools become steps, and the framework handles interplay with your existing infrastructure.

## Getting Started

To make an Agent durable, we first need an Agent, which we'll be setting up here. If you already have an app you'd like to follow along with, you can skip this section.

For our example, we'll need an app with a simple chat interface and an API route calling an LLM, so that we can add Workflow DevKit to it. We'll use the [Flight Booking Agent](https://github.com/vercel/workflow-examples/tree/main/flight-booking-app) example as a starting point, which comes with a chat interface built using Next.js, AI SDK, and Shadcn UI.

<Steps>
  <Step>
    ### Clone example app

    We'll need an app with a simple chat interface and an API route calling an LLM, so that we can add Workflow DevKit to it. For the follow-along steps, we'll use the [Flight Booking Agent](https://github.com/vercel/workflow-examples/tree/main/flight-booking-app) example as a starting point, which comes with a chat interface built using Next.js, AI SDK, and Shadcn UI.

    If you have your own project, you can skip this step, and simply apply the changes of the following steps to your own project.

    ```bash
    git clone https://github.com/vercel/workflow-examples -b plain-ai-sdk
    cd workflow-examples/flight-booking-app
    ```
  </Step>

  <Step>
    ### Set up API keys

    In order to connect to an LLM, we'll need to set up an API key. The easiest way to do this is to use Vercel Gateway (works with all providers at zero markup), or you can configure a custom provider.

    <Tabs items={['Gateway', 'Custom Provider']}>
      <Tab value="Gateway">
        Get a Gateway API key from the [Vercel Gateway](https://vercel.com/docs/gateway/api-reference/overview) page.

        Then add it to your `.env.local` file:

        ```bash title=".env.local" lineNumbers
        GATEWAY_API_KEY=...
        ```
      </Tab>

      <Tab value="Custom Provider">
        This is an example of how to use the OpenAI provider for AI SDK. For details on other providers and more details, see the [AI SDK provider guide](https://ai-sdk.dev/providers/ai-sdk-providers).

        <CodeBlockTabs defaultValue="npm">
          <CodeBlockTabsList>
            <CodeBlockTabsTrigger value="npm">
              npm
            </CodeBlockTabsTrigger>

            <CodeBlockTabsTrigger value="pnpm">
              pnpm
            </CodeBlockTabsTrigger>

            <CodeBlockTabsTrigger value="yarn">
              yarn
            </CodeBlockTabsTrigger>

            <CodeBlockTabsTrigger value="bun">
              bun
            </CodeBlockTabsTrigger>
          </CodeBlockTabsList>

          <CodeBlockTab value="npm">
            ```bash
            npm i @ai-sdk/openai
            ```
          </CodeBlockTab>

          <CodeBlockTab value="pnpm">
            ```bash
            pnpm add @ai-sdk/openai
            ```
          </CodeBlockTab>

          <CodeBlockTab value="yarn">
            ```bash
            yarn add @ai-sdk/openai
            ```
          </CodeBlockTab>

          <CodeBlockTab value="bun">
            ```bash
            bun add @ai-sdk/openai
            ```
          </CodeBlockTab>
        </CodeBlockTabs>

        Set your OpenAI API key in your environment variables:

        ```bash title=".env.local" lineNumbers
        OPENAI_API_KEY=...
        ```

        Then modify your API endpoint to use the OpenAI provider:

        {/* @skip-typecheck: incomplete code sample */}

        ```typescript title="app/api/chat/route.ts" lineNumbers
        // ...
        import { openai } from "@workflow/ai/openai"; // [!code highlight]

        export async function POST(req: Request) {
          // ...
          const agent = new Agent({
            // This uses the OPENAI_API_KEY environment variable by default, but you
            // can also pass { apiKey: string } as an option.
            model: openai("gpt-5.1"), // [!code highlight]
            // ...
          });
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step>
    ### Get familiar with the code

    Let's take a moment to see what we're working with. Run the app with `npm run dev` and open [http://localhost:3000](http://localhost:3000) in your browser. You should see a simple chat interface to play with. Go ahead and give it a try.

    The core code that makes all of this happen is quite simple. Here's a breakdown of the main parts. Note that there's no changes needed here, we're simply taking a look at the code to understand what's happening.

    <Tabs items={['API Route', 'Tools', 'Client']}>
      <Tab value="API Route">
        Our API route makes a simple call to [AI SDK's `Agent` class](https://ai-sdk.dev/docs/agents/overview), which is a simple wrapper around [AI SDK's `streamText` function](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#streamtext). This is also where we pass tools to the agent.

        ```typescript title="app/api/chat/route.ts" lineNumbers
        export async function POST(req: Request) {
          const { messages }: { messages: UIMessage[] } = await req.json();
          const agent = new Agent({ // [!code highlight]
            model: gateway("bedrock/claude-4-5-haiku-20251001-v1"),
            system: FLIGHT_ASSISTANT_PROMPT,
            tools: flightBookingTools,
          });
          const modelMessages = convertToModelMessages(messages);
          const stream = agent.stream({ messages: modelMessages }); // [!code highlight]
          return createUIMessageStreamResponse({
            stream: stream.toUIMessageStream(),
          });
        }
        ```
      </Tab>

      <Tab value="Tools">
        Our tools are mostly mocked out for the sake of the example. We use AI SDK's `tool` function to define the tool, and pass it to the agent. In your own app, this might be any kind of tool call, like database queries, calls to external services, etc.

        ```typescript title="workflows/chat/steps/tools.ts" lineNumbers
        import { tool } from "ai";
        import { z } from "zod";

        export const tools = {
          searchFlights: tool({
            description: "Search for flights",
            inputSchema: z.object({ query: z.string() }),
            execute: searchFlights,
          }),
        };

        async function searchFlights({ from, to, date }: { from: string; to: string; date: string }) {
          // ... generate some fake flights
        }
        ```
      </Tab>

      <Tab value="Client">
        Our `ChatPage` component has a lot of logic for nicely displaying the chat messages, but at it's core, it's simply managing input/output for the [`useChat` hook](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat#usechat) from AI SDK.

        ```typescript title="app/chat.tsx" lineNumbers
        "use client";

        import { useChat } from "@ai-sdk/react";

        export default function ChatPage() {
          const { messages, input, handleInputChange, handleSubmit } = useChat({ // [!code highlight]
            // ... other options ...
          });

          // ... more UI logic

          return (
            <div>
              // This is a simplified example of the rendering logic
              {messages.map((m) => (
                <div key={m.id}>
                  <strong>{m.role}:</strong>
                  {m.parts.map((part, i) => {
                    if (part.type === "text") { // [!code highlight]
                      return <span key={i}>{part.text}</span>;
                    }
                    if (part.type === "tool-searchFlights") { // [!code highlight]
                      // ... some special rendering for our tool results
                    }
                    return null;
                  })}
                </div>
              ))}
              <form onSubmit={handleSubmit}>
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                />
              </form>
            </div>
          );
        }
        ```
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Integrating Workflow DevKit

Now that we have a basic agent using AI SDK, we can modify it to make it durable.

<Steps>
  <Step>
    ### Install Dependencies

    Add the Workflow DevKit packages to your project:

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow @workflow/ai
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow @workflow/ai
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow @workflow/ai
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow @workflow/ai
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    and extend the Next.js config to transform your workflow code (see [Getting Started](/docs/getting-started/next) for more details).

    ```typescript title="next.config.ts" lineNumbers
    import { withWorkflow } from "workflow/next";
    import type { NextConfig } from "next";

    const nextConfig: NextConfig = {
      // ... rest of your Next.js config
    };

    export default withWorkflow(nextConfig);
    ```
  </Step>

  <Step>
    ### Create a Workflow Function

    Move the agent logic into a separate function, which will serve as our workflow definition.

    {/* @skip-typecheck: Shows two mutually exclusive model options */}

    ```typescript title="workflows/chat/workflow.ts" lineNumbers
    import { DurableAgent } from "@workflow/ai/agent"; // [!code highlight]
    import { getWritable } from "workflow"; // [!code highlight]
    import { tools } from "@/ai/tools";
    import { openai } from "@workflow/ai/openai";
    import type { ModelMessage, UIMessageChunk } from "ai";

    export async function chatWorkflow(messages: ModelMessage[]) {
      "use workflow"; // [!code highlight]

      const writable = getWritable<UIMessageChunk>(); // [!code highlight]

      const agent = new DurableAgent({ // [!code highlight]

        // If using AI Gateway, just specify the model name as a string:
        model: "bedrock/claude-4-5-haiku-20251001-v1", // [!code highlight]

        // ELSE if using a custom provider, pass the provider call as an argument:
        model: openai("gpt-5.1"), // [!code highlight]

        system: FLIGHT_ASSISTANT_PROMPT,
        tools: flightBookingTools,
      });

      await agent.stream({ // [!code highlight]
        messages,
        writable,
      });
    }
    ```

    Key changes:

    * Add the `"use workflow"` directive to mark our Agent as a workflow function
    * Replaced `Agent` with [`DurableAgent`](/docs/api-reference/workflow-ai/durable-agent) from `@workflow/ai/agent`. This ensures that all calls to the LLM are executed as "steps", and results are aggregated within the workflow context (see [Workflows and Steps](/docs/foundations/workflows-and-steps) for more details on how workflows/steps are defined).
    * Use [`getWritable()`](/docs/api-reference/workflow/get-writable) to get a stream for agent output. This stream is persistent, and API endpoints can read from a run's stream at any time.
  </Step>

  <Step>
    ### Update the API Route

    Remove the agent call that we just extracted, and replace it with a call to `start()` to run the workflow:

    ```typescript title="app/api/chat/route.ts" lineNumbers
    import type { UIMessage } from "ai";
    import { convertToModelMessages, createUIMessageStreamResponse } from "ai";
    import { start } from "workflow/api";
    import { chatWorkflow } from "@/workflows/chat/workflow";

    export async function POST(req: Request) {
      const { messages }: { messages: UIMessage[] } = await req.json();
      const modelMessages = convertToModelMessages(messages);

      const run = await start(chatWorkflow, [modelMessages]); // [!code highlight]

      return createUIMessageStreamResponse({
        stream: run.readable, // [!code highlight]
      });
    }
    ```

    Key changes:

    * Call `start()` to run the workflow function. This returns a `Run` object, which contains the run ID and the readable stream (see [Starting Workflows](/docs/foundations/starting-workflows) for more details on the `Run` object).
    * Pass the `writable` to `agent.stream()` instead of returning a stream directly, ensuring all the Agent output is written to to the run's stream.
  </Step>

  <Step>
    ### Convert Tools to Steps

    Mark all tool definitions with `"use step"` to make them durable. This enables automatic retries and observability for each tool call:

    {/* @skip-typecheck: incomplete code sample */}

    ```typescript title="workflows/chat/steps/tools.ts​" lineNumbers
    // ...

    export async function searchFlights(
      // ... arguments
    ) {
      "use step"; // [!code highlight]

      // ... rest of the tool code
    }

    export async function checkFlightStatus(
      // ... arguments
    ) {
      "use step"; // [!code highlight]

      // ... rest of the tool code
    }

    export async function getAirportInfo(
      // ... arguments
    ) {
      "use step"; // [!code highlight]

      // ... rest of the tool code
    }

    export async function bookFlight({
      // ... arguments
    }) {
      "use step"; // [!code highlight]

      // ... rest of the tool code
    }

    export async function checkBaggageAllowance(
      // ... arguments
    ) {
        "use step"; // [!code highlight]

        // ... rest of the tool code
      }
    }
    ```

    With `"use step"`:

    * The tool execution runs in a separate step with full Node.js access. In production, each step is executed in a separate worker process, which scales automatically with your workload.
    * Failed tool calls are automatically retried (up to 3 times by default). See [Errors and Retries](/docs/foundations/errors-and-retries) for more details.
    * Each tool execution appears as a discrete step in observability tools. See [Observability](/docs/observability) for more details.
  </Step>
</Steps>

That's all you need to do to convert your basic AI SDK agent into a durable agent. If you run your development server, and send a chat message, you should see your agent respond just as before, but now with added durability and observability.

## Observability

In your app directory, you can open up the observability dashboard to see your workflow in action, using the CLI:

```bash
npx workflow web
```

This opens a local dashboard showing all workflow runs and their status, as well as a trace viewer to inspect the workflow in detail, including retry attempts, and the data being passed between steps.

## Next Steps

Now that you have a basic durable agent, it's a only a short step to add these additional features:

<Cards>
  <Card title="Streaming Updates from Tools" href="/docs/ai/streaming-updates-from-tools">
    Stream progress updates from tools to the UI while they're executing.
  </Card>

  <Card title="Resumable Streams" href="/docs/ai/resumable-streams">
    Enable clients to reconnect to interrupted streams without losing data.
  </Card>

  <Card title="Sleep, Suspense, and Scheduling" href="/docs/ai/sleep-and-delays">
    Add native sleep, suspense, and scheduling functionality to your Agent and workflow.
  </Card>

  <Card title="Human-in-the-Loop" href="/docs/ai/human-in-the-loop">
    Implement approval steps to wait for human input or external events.
  </Card>
</Cards>

## Complete Example

A complete example that includes all of the above, plus all of the "next steps" features is available on the main branch of the [Flight Booking Agent](https://github.com/vercel/workflow-examples/tree/main/flight-booking-app) example.

## Related Documentation

* [Tools](/docs/ai/defining-tools) - Patterns for defining tools for your agent
* [`DurableAgent` API Reference](/docs/api-reference/workflow-ai/durable-agent) - Full API documentation
* [Workflows and Steps](/docs/foundations/workflows-and-steps) - Core concepts
* [Streaming](/docs/foundations/streaming) - In-depth streaming guide
* [Errors and Retries](/docs/foundations/errors-and-retries) - Error handling patterns


---
title: Queueing User Messages
description: Inject messages during an agent's turn, before tool calls complete or while the model is reasoning.
type: guide
summary: Inject user messages mid-turn using the `prepareStep` callback to influence the agent's next step.
prerequisites:
  - /docs/ai
related:
  - /docs/ai/chat-session-modeling
  - /docs/api-reference/workflow-ai/durable-agent
  - /docs/api-reference/workflow/define-hook
---

# Queueing User Messages



When using [multi-turn workflows](/docs/ai/chat-session-modeling#multi-turn-workflows), messages typically arrive between agent turns. The workflow waits at a hook, receives a message, then starts a new turn. But sometimes you need to inject messages *during* an agent's turn, before tool calls complete or while the model is reasoning.

`DurableAgent`'s `prepareStep` callback enables this by running before each step in the agent loop, giving you a chance to inject queued messages into the conversation. `prepareStep` also allows you to modify the model choice and existing messages mid-turn, see AI SDK's [prepareStep callback](https://ai-sdk.dev/docs/agents/loop-control#prepare-step) for more details.

## When to Use This

Message queueing is useful when:

* Users send follow-up messages while the agent is still searching for flights or processing bookings
* External systems need to inject context mid-turn (e.g., a flight status webhook fires during processing)
* You want messages to influence the agent's next step rather than waiting for the current turn to complete

<Callout type="info">
  If you just need basic multi-turn conversations where messages arrive between turns, see [Chat Session Modeling](/docs/ai/chat-session-modeling). This guide covers the more advanced case of injecting messages *during* turns.
</Callout>

## The `prepareStep` Callback

The `prepareStep` callback runs before each step in the agent loop. It receives the current state and can modify the messages sent to the model:

```typescript lineNumbers
interface PrepareStepInfo {
  model: string | (() => Promise<LanguageModelV2>);  // Current model
  stepNumber: number;                                // 0-indexed step count
  steps: StepResult[];                               // Previous step results
  messages: LanguageModelV2Prompt;                   // Messages to be sent
}

interface PrepareStepResult {
  model?: string | (() => Promise<LanguageModelV2>); // Override model
  messages?: LanguageModelV2Prompt;                  // Override messages
}
```

## Injecting Queued Messages

Once you have a [multi-turn workflow](/docs/ai/chat-session-modeling#multi-turn-workflows), you can combine a message queue with `prepareStep` to inject messages that arrive during processing:

```typescript title="workflows/chat/index.ts" lineNumbers
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable, getWorkflowMetadata } from "workflow";
import { chatMessageHook } from "./hooks/chat-message";
import { flightBookingTools, FLIGHT_ASSISTANT_PROMPT } from "./steps/tools";
import type { UIMessageChunk, ModelMessage } from "ai";

export async function chat(initialMessages: ModelMessage[]) {
  "use workflow";

  const { workflowRunId: runId } = getWorkflowMetadata();
  const writable = getWritable<UIMessageChunk>();
  const messageQueue: Array<{ role: "user"; content: string }> = []; // [!code highlight]

  const agent = new DurableAgent({
    model: "bedrock/claude-haiku-4-5-20251001-v1",
    system: FLIGHT_ASSISTANT_PROMPT,
    tools: flightBookingTools,
  });

  // Listen for messages in background (non-blocking) // [!code highlight]
  const hook = chatMessageHook.create({ token: runId }); // [!code highlight]
  hook.then(({ message }) => { // [!code highlight]
    messageQueue.push({ role: "user", content: message }); // [!code highlight]
  }); // [!code highlight]

  await agent.stream({
    messages: initialMessages,
    writable,
    prepareStep: ({ messages: currentMessages }) => { // [!code highlight]
      // Inject any queued messages before the next LLM call // [!code highlight]
      if (messageQueue.length > 0) { // [!code highlight]
        const newMessages = messageQueue.splice(0); // Drain queue // [!code highlight]
        return { // [!code highlight]
          messages: [ // [!code highlight]
            ...currentMessages, // [!code highlight]
            ...newMessages.map((m) => ({ // [!code highlight]
              role: m.role, // [!code highlight]
              content: [{ type: "text" as const, text: m.content }], // [!code highlight]
            })), // [!code highlight]
          ], // [!code highlight]
        }; // [!code highlight]
      } // [!code highlight]
      return {}; // [!code highlight]
    }, // [!code highlight]
  });
}
```

Messages sent via `chatMessageHook.resume()` accumulate in the queue and get injected before the next step, whether that's a tool call or another LLM request.

<Callout type="info">
  The `prepareStep` callback receives messages in `LanguageModelV2Prompt` format (with content arrays), which is the internal format used by the AI SDK.
</Callout>

## Combining with Multi-Turn Sessions

You can also combine message queueing with the standard multi-turn pattern:

```typescript title="workflows/chat/index.ts" lineNumbers
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable, getWorkflowMetadata } from "workflow";
import { chatMessageHook } from "./hooks/chat-message";
import type { UIMessageChunk, ModelMessage } from "ai";

export async function chat(initialMessages: ModelMessage[]) {
  "use workflow";

  const { workflowRunId: runId } = getWorkflowMetadata();
  const writable = getWritable<UIMessageChunk>();
  const messages: ModelMessage[] = [...initialMessages];
  const messageQueue: Array<{ role: "user"; content: string }> = [];

  const agent = new DurableAgent({ /* ... */ });
  const hook = chatMessageHook.create({ token: runId });

  while (true) {
    // Set up non-blocking listener for mid-turn messages // [!code highlight]
    let pendingMessage: string | null = null; // [!code highlight]
    hook.then(({ message }) => { // [!code highlight]
      if (message === "/done") return; // [!code highlight]
      messageQueue.push({ role: "user", content: message }); // [!code highlight]
      pendingMessage = message; // [!code highlight]
    }); // [!code highlight]

    const result = await agent.stream({
      messages,
      writable,
      preventClose: true,
      prepareStep: ({ messages: currentMessages }) => {
        // Inject queued messages during turn // [!code highlight]
        if (messageQueue.length > 0) {
          const newMessages = messageQueue.splice(0);
          return {
            messages: [
              ...currentMessages,
              ...newMessages.map((m) => ({
                role: m.role,
                content: [{ type: "text" as const, text: m.content }],
              })),
            ],
          };
        }
        return {};
      },
    });

    messages.push(...result.messages.slice(messages.length));

    // Wait for next message (either queued during turn or new) // [!code highlight]
    const { message: followUp } = pendingMessage ? { message: pendingMessage } : await hook; // [!code highlight]
    if (followUp === "/done") break;

    messages.push({ role: "user", content: followUp });
  }
}
```

## Related Documentation

* [Chat Session Modeling](/docs/ai/chat-session-modeling) - Single-turn vs multi-turn patterns
* [Building Durable AI Agents](/docs/ai) - Complete guide to creating durable agents
* [`DurableAgent` API Reference](/docs/api-reference/workflow-ai/durable-agent) - Full API documentation
* [`defineHook()` API Reference](/docs/api-reference/workflow/define-hook) - Hook configuration options


---
title: Resumable Streams
description: Handle network interruptions, page refreshes, and timeouts without losing agent progress.
type: guide
summary: Reconnect to interrupted agent streams using `WorkflowChatTransport` without losing progress.
prerequisites:
  - /docs/ai
  - /docs/foundations/streaming
related:
  - /docs/ai/chat-session-modeling
  - /docs/api-reference/workflow-ai/workflow-chat-transport
  - /docs/api-reference/workflow-api/get-run
---

# Resumable Streams



When building chat interfaces, it's common to run into network interruptions, page refreshes, or serverless function timeouts, which can break the connection to an in-progress agent.

Where a standard chat implementation would require the user to resend their message and wait for the entire response again, workflow runs are durable, and so are the streams attached to them. This means a stream can be resumed at any point, optionally only syncing the data that was missed since the last connection.

Resumable streams come out of the box with Workflow DevKit, however, the client needs to recognize that a stream exists, and needs to know which stream to reconnect to, and needs to know where to start from. For this, Workflow DevKit provides the [`WorkflowChatTransport`](/docs/api-reference/workflow-ai/workflow-chat-transport) helper, a drop-in transport for the AI SDK that handles client-side resumption logic for you.

## Implementing stream resumption

Let's add stream resumption to our Flight Booking Agent that we build in the [Building Durable AI Agents](/docs/ai) guide.

<Steps>
  <Step>
    ### Return the Run ID from Your API

    Modify your chat endpoint to include the workflow run ID in a response header. The Run ID uniquely identifies the run's stream, so it allows the client to know which stream to reconnect to.

    {/* @skip-typecheck: incomplete code sample */}

    ```typescript title="app/api/chat/route.ts" lineNumbers
    // ... imports ...

    export async function POST(req: Request) {

      // ... existing logic to create the workflow ...

      const run = await start(chatWorkflow, [modelMessages]);

      return createUIMessageStreamResponse({
        stream: run.readable,
        headers: { // [!code highlight
          "x-workflow-run-id": run.runId, // [!code highlight]
        }, // [!code highlight]
      });
    }
    ```
  </Step>

  <Step>
    ### Add a Stream Reconnection Endpoint

    Currently we only have one API endpoint that always creates a new run, so we need to create a new API route that returns the stream for an existing run:

    ```typescript title="app/api/chat/[id]/stream/route.ts" lineNumbers
    import { createUIMessageStreamResponse } from "ai";
    import { getRun } from "workflow/api"; // [!code highlight]

    export async function GET(
      request: Request,
      { params }: { params: Promise<{ id: string }> }
    ) {
      const { id } = await params;
      const { searchParams } = new URL(request.url);

      // Client provides the last chunk index they received
      const startIndexParam = searchParams.get("startIndex"); // [!code highlight]
      const startIndex = startIndexParam
        ? parseInt(startIndexParam, 10)
        : undefined;

      // Instead of starting a new run, we fetch an existing run.
      const run = getRun(id); // [!code highlight]
      const stream = run.getReadable({ startIndex }); // [!code highlight]

      return createUIMessageStreamResponse({ stream }); // [!code highlight]
    }
    ```

    The `startIndex` parameter ensures the client can choose where to resume the stream from. For instance, if the function times out during streaming, the chat transport will use `startIndex` to resume the stream exactly from the last token it received.
  </Step>

  <Step>
    ### Use `WorkflowChatTransport` in the Client

    Replace the default transport in AI-SDK's `useChat` with [`WorkflowChatTransport`](/docs/api-reference/workflow-ai/workflow-chat-transport), and update the callbacks to store and use the latest run ID. For now, we'll store the run ID in localStorage. For your own app, this would be stored wherever you store session information.

    ```typescript title="app/page.tsx" lineNumbers
    "use client";

    import { useChat } from "@ai-sdk/react";
    import { WorkflowChatTransport } from "@workflow/ai"; // [!code highlight]
    import { useMemo, useState } from "react";

    export default function ChatPage() {

      // Check for an active workflow run on mount
      const activeRunId = useMemo(() => { // [!code highlight]
        if (typeof window === "undefined") return; // [!code highlight]
        return localStorage.getItem("active-workflow-run-id") ?? undefined; // [!code highlight]
      }, []); // [!code highlight]

      const { messages, sendMessage, status } = useChat({
        resume: Boolean(activeRunId), // [!code highlight]
        transport: new WorkflowChatTransport({ // [!code highlight]
          api: "/api/chat",

          // Store the run ID when a new chat starts
          onChatSendMessage: (response) => { // [!code highlight]
            const workflowRunId = response.headers.get("x-workflow-run-id"); // [!code highlight]
            if (workflowRunId) { // [!code highlight]
              localStorage.setItem("active-workflow-run-id", workflowRunId); // [!code highlight]
            } // [!code highlight]
          }, // [!code highlight]

          // Clear the run ID when the chat completes
          onChatEnd: () => { // [!code highlight]
            localStorage.removeItem("active-workflow-run-id"); // [!code highlight]
          }, // [!code highlight]

          // Use the stored run ID for reconnection
          prepareReconnectToStreamRequest: ({ api, ...rest }) => { // [!code highlight]
            const runId = localStorage.getItem("active-workflow-run-id"); // [!code highlight]
            if (!runId) throw new Error("No active workflow run ID found"); // [!code highlight]
            return { // [!code highlight]
              ...rest, // [!code highlight]
              api: `/api/chat/${encodeURIComponent(runId)}/stream`, // [!code highlight]
            }; // [!code highlight]
          }, // [!code highlight]
        }), // [!code highlight]
      });

      // ... render your chat UI
    }
    ```
  </Step>
</Steps>

Now try the flight booking example again. Open it up in a separate tab, or spam the refresh button, and see how the client connects to the same chat stream every time.

## How It Works

1. When the user sends a message, `WorkflowChatTransport` makes a POST to `/api/chat`
2. The API starts a workflow and returns the run ID in the `x-workflow-run-id` header
3. `onChatSendMessage` stores this run ID in localStorage
4. If the stream is interrupted before receiving a "finish" chunk, the transport automatically reconnects
5. `prepareReconnectToStreamRequest` builds the reconnection URL using the stored run ID, pointing to the new endpoint `/api/chat/{runId}/stream`
6. The reconnection endpoint returns the stream from where the client left off
7. When the stream completes, `onChatEnd` clears the stored run ID

This approach also handles page refreshes, as the client will automatically reconnect to the stream from the last known position when the UI loads with a stored run ID, following the behavior of [AI SDK's stream resumption](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams#chatbot-resume-streams).

## Related Documentation

* [`WorkflowChatTransport` API Reference](/docs/api-reference/workflow-ai/workflow-chat-transport) - Full configuration options
* [Streaming](/docs/foundations/streaming) - Understanding workflow streams
* [`getRun()` API Reference](/docs/api-reference/workflow-api/get-run) - Retrieving existing runs


---
title: Sleep, Suspense, and Scheduling
description: Schedule recurring actions, handle rate limiting, and wait for external state in AI agents.
type: guide
summary: Pause agent execution with `sleep()` for scheduling, rate limiting, and waiting on external state.
prerequisites:
  - /docs/ai
related:
  - /docs/ai/defining-tools
  - /docs/ai/streaming-updates-from-tools
  - /docs/foundations/errors-and-retries
  - /docs/api-reference/workflow/sleep
---

# Sleep, Suspense, and Scheduling



AI agents sometimes need to pause execution in order to schedule recurring or future actions, wait before retrying an operation (e.g. for rate limiting), or wait for external state to be available.

Workflow DevKit's `sleep` function enables Agents to pause execution without consuming resources, and resume at a specified time, after a specified duration, or in response to an external event. Workflow operation that suspend will survive restarts, new deploys, and infrastructure changes, independent of whether the suspense takes seconds or months.

<Callout type="info">
  See the [`sleep()` API Reference](/docs/api-reference/workflow/sleep) for the full list of supported duration formats and detailed API documentation, and see the [hooks](/docs/foundations/hooks) documentation for more information on how to resume in response to external events.
</Callout>

## Adding a Sleep Tool

Sleep is a built-in function in Workflow DevKit, so exposing it as a tool is as simple as wrapping it in a tool definition. Learn more about how to define tools in [Patterns for Defining Tools](/docs/ai/defining-tools).

<Steps>
  <Step>
    ### Define the Tool

    Add a new "sleep" tool to the `tools` defined in `workflows/chat/steps/tools.ts`:

    ```typescript title="workflows/chat/steps/tools.ts" lineNumbers
    import { getWritable, sleep } from "workflow"; // [!code highlight]

    // ... existing imports ...

    async function executeSleep( // [!code highlight]
      { durationMs }: { durationMs: number }, // [!code highlight]
    ) { // [!code highlight]
      // Note: No "use step" here - sleep is a workflow-level function // [!code highlight]
      await sleep(durationMs); // [!code highlight]
      return { message: `Slept for ${durationMs}ms` }; // [!code highlight]
    }

    // ... existing tool functions ...

    export const flightBookingTools = {
     // ... existing tool definitions ...
     sleep: { // [!code highlight]
      description: "Pause execution for a specified duration", // [!code highlight]
      inputSchema: z.object({ // [!code highlight]
        durationMs: z.number().describe("Duration to sleep in milliseconds"), // [!code highlight]
      }), // [!code highlight]
      execute: executeSleep, // [!code highlight]
     } // [!code highlight]
    }
    ```

    <Callout type="info">
      Note that the `sleep()` function must be called from within a workflow context, not from within a step. This is why `executeSleep` does not have `"use step"` - it runs in the workflow context where `sleep()` is available.
    </Callout>

    This already makes the full sleep functionality available to the Agent!
  </Step>

  <Step>
    ### Show the tool status in the UI

    To round it off, extend the UI to display the tool call status. This can be done either by displaying the tool call information directly, or by emitting custom data parts to the stream (see [Streaming Updates from Tools](/docs/ai/streaming-updates-from-tools) for more details). In this case, since there aren't any fine-grained progress updates to show, we'll just display the tool call information directly:

    {/*@skip-typecheck: incomplete code sample*/}

    ```typescript title="app/page.tsx" lineNumbers
    export default function ChatPage() {

      // ...

      const { stop, messages, sendMessage, status, setMessages } =
        useChat<MyUIMessage>({
          // ... options
        });

      // ...

      return (
        <div className="flex flex-col w-full max-w-2xl pt-12 pb-24 mx-auto stretch">
          // ...

          <Conversation className="mb-10">
            <ConversationContent>
              {messages.map((message, index) => {
                const hasText = message.parts.some((part) => part.type === "text");

                return (
                  <div key={message.id}>
                    // ...
                    <Message from={message.role}>
                      <MessageContent>
                        {message.parts.map((part, partIndex) => {

                          // ...

                          if (
                            part.type === "tool-searchFlights" ||
                            part.type === "tool-checkFlightStatus" ||
                            part.type === "tool-getAirportInfo" ||
                            part.type === "tool-bookFlight" ||
                            part.type === "tool-checkBaggageAllowance"
                            part.type === "tool-sleep" // [!code highlight]
                          ) {
                            // ...
                          }
                          return null;
                        })}
                      </MessageContent>
                    </Message>
                  </div>
                );
              })}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          // ...
        </div>
      );
    }

    function renderToolOutput(part: any) {
      // ...
      switch (part.type) {
        // ...
        case "tool-sleep": { // [!code highlight]
          return ( // [!code highlight]
            <div className="space-y-2"> // [!code highlight]
              <p className="text-sm font-medium">Sleeping for {part.input.durationMs}ms...</p> // [!code highlight]
            </div> // [!code highlight]
          ); // [!code highlight]
        }
        // ...
    }

    ```
  </Step>
</Steps>

Now, try out the Flight Booking Agent again, and ask it to sleep for 10 seconds before checking any flight. You'll see the agent pause, and the UI reflect the tool call status.

## Use Cases

Aside from providing `sleep()` as a tool, there are other use cases for Agents that commonly call for suspension and resumption.

### Rate Limiting

When hitting API rate limits, use `RetryableError` with a delay:

```typescript lineNumbers
async function callRateLimitedAPI(endpoint: string) {
  "use step";

  const response = await fetch(endpoint);

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    throw new RetryableError("Rate limited", {
      retryAfter: retryAfter ? parseInt(retryAfter) * 1000 : "1m",
    });
  }

  return response.json();
}
```

## Related Documentation

* [`sleep()` API Reference](/docs/api-reference/workflow/sleep) - Full API documentation with all duration formats
* [Workflows and Steps](/docs/foundations/workflows-and-steps) - Understanding workflow context
* [Errors and Retries](/docs/foundations/errors-and-retries) - Using `RetryableError` with delays


---
title: Streaming Updates from Tools
description: Show progress updates and stream step output to users during long-running tool executions.
type: guide
summary: Write custom data parts from step functions to show progress updates during long-running tool calls.
prerequisites:
  - /docs/ai
  - /docs/foundations/streaming
related:
  - /docs/ai/defining-tools
  - /docs/ai/resumable-streams
  - /docs/api-reference/workflow/get-writable
---

# Streaming Updates from Tools



After [building a durable AI agent](/docs/ai), we already get UI message chunks for displaying tool invocations and return values. However, for long-running steps, we may want to show progress updates, or stream step output to the user while it's being generated.

Workflow DevKit enables this by letting step functions write custom chunks to the same stream the agent uses. These chunks appear as data parts in your messages, which you can render however you like.

As an example, we'll extend out Flight Booking Agent to use emit more granular progress updates while searching for flights.

<Steps>
  <Step>
    ### Define Your Data Part Type

    First, define a TypeScript type for your custom data part. This ensures type safety across your tool and client code:

    ```typescript title="schemas/chat.ts" lineNumbers
    export interface FoundFlightDataPart {
      type: "data-found-flight"; // [!code highlight]
      id: string;
      data: {
        flightNumber: string;
        from: string;
        to: string;
      };
    }
    ```

    The `type` field must be a string starting with `data-` followed by your custom identifier. The `id` field should match the `toolCallId` so the client can associate the data with the correct tool invocation. Learn more about [data parts](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data#data-parts-persistent) in the AI SDK documentation.
  </Step>

  <Step>
    ### Emit Updates from Your Tool

    Use [`getWritable()`](/docs/api-reference/workflow/get-writable) inside a step function to get a handle to the stream. This is the same stream that the LLM and other tools calls are writing to, so we can inject out own data packets directly.

    {/* @skip-typecheck: incomplete code sample */}

    ```typescript title="workflows/chat/steps/tools.ts" lineNumbers
    import { getWritable } from "workflow"; // [!code highlight]
    import type { UIMessageChunk } from "ai";

    export async function searchFlights(
      { from, to, date }: { from: string; to: string; date: string },
      { toolCallId }: { toolCallId: string } // [!code highlight]
    ) {
      "use step";

      const writable = getWritable<UIMessageChunk>(); // [!code highlight]
      const writer = writable.getWriter(); // [!code highlight]

      // ... existing logic to generate flights ...

      for (const flight of generatedFlights) { // [!code highlight]

        // Simulate the time it takes to find each flight
        await new Promise((resolve) => setTimeout(resolve, 1000)); // [!code highlight]

        await writer.write({ // [!code highlight]
          id: `${toolCallId}-${flight.flightNumber}`, // [!code highlight]
          type: "data-found-flight", // [!code highlight]
          data: flight, // [!code highlight]
        }); // [!code highlight]
      } // [!code highlight]

      writer.releaseLock(); // [!code highlight]

      return {
        message: `Found ${generatedFlights.length} flights from ${from} to ${to} on ${date}`,
        flights: generatedFlights.sort((a, b) => a.price - b.price), // Sort by price
      };
    }
    ```

    Key points:

    * Call `getWritable<UIMessageChunk>()` to get the stream
    * Use `getWriter()` to acquire a writer
    * Write objects with `type`, `id`, and `data` fields
    * Always call `releaseLock()` when done writing (learn more about [streaming](/docs/foundations/streaming))
  </Step>

  <Step>
    ### Handle Data Parts in the Client

    Update your chat component to detect and render the custom data parts. Data parts are stored in the message's `parts` array alongside text and tool invocation parts:

    {/* @skip-typecheck: incomplete code sample */}

    ```typescript title="app/page.tsx" lineNumbers
    {message.parts.map((part, partIndex) => {
      // Render text parts
      if (part.type === "text") {
        return (
          <Response key={`${message.id}-text-${partIndex}`}>
            {part.text}
          </Response>
        );
      }

      // Render streaming flight data parts // [!code highlight]
      if (part.type === "data-found-flight") { // [!code highlight]
        const flight = part.data as { // [!code highlight]
          flightNumber: string; // [!code highlight]
          airline: string; // [!code highlight]
          from: string; // [!code highlight]
          to: string; // [!code highlight]
        }; // [!code highlight]
        return ( // [!code highlight]
          <div key={`${part.id}-${flight.flightNumber}`} className="p-3 bg-muted rounded-md"> // [!code highlight]
            <div className="font-medium">{flight.airline} - {flight.flightNumber}</div> // [!code highlight]
            <div className="text-muted-foreground">{flight.from} → {flight.to}</div> // [!code highlight]
          </div> // [!code highlight]
        ); // [!code highlight]
      } // [!code highlight]

      // ... other rendering logic ...
    })}
    ```

    The pattern is:

    1. Data parts have a `type` field starting with `data-`
    2. Match the type to your custom identifier (e.g., `data-found-flight`)
    3. Use the data part's payload to display progress or intermediate results
  </Step>
</Steps>

Now, when you run the agent to search for flights, you'll see the flight results pop up one after another. This will be most useful if you have tool calls that take minutes to complete, and you need to show granular progress updates to the user.

## Related Documentation

* [Building Durable AI Agents](/docs/ai) - Complete guide to durable agents
* [`getWritable()` API Reference](/docs/api-reference/workflow/get-writable) - Stream API details
* [Streaming](/docs/foundations/streaming) - Understanding workflow streams


---
title: Building a World
description: Implement the World interface to run workflows on any custom infrastructure.
type: guide
summary: Build a custom World adapter to run workflows on your own infrastructure.
prerequisites:
  - /docs/deploying
  - /docs/foundations/workflows-and-steps
related:
  - /docs/deploying/world/local-world
  - /docs/deploying/world/postgres-world
  - /docs/deploying/world/vercel-world
---

# Building a World



A **World** is the abstraction that allows workflows to run on any infrastructure. It handles workflow storage, step execution queuing, and data streaming. This guide explains the World interface and how to implement your own.

<Callout>
  Before building a custom World, check the [Worlds Ecosystem](/worlds) page — there may already be a community implementation for your infrastructure.
</Callout>

<Callout type="info">
  **Reference Implementation:** The [Postgres World source code](https://github.com/vercel/workflow/tree/main/packages/world-postgres) is a production-ready example of how to implement the World interface with a database backend and pg-boss for queuing.
</Callout>

## What is a World?

A World connects workflows to the infrastructure that powers them. The World interface abstracts three core responsibilities:

1. **Storage** — Persisting workflow runs, steps, hooks, and the event log
2. **Queue** — Enqueuing and processing workflow and step invocations
3. **Streamer** — Managing real-time data streams between workflows and clients

{/* @skip-typecheck - interface definition, not runnable code */}

```typescript
interface World extends Storage, Queue, Streamer {
  start?(): Promise<void>;
}
```

The optional `start()` method initializes any background tasks needed by your World (e.g., queue polling).

## The Event Log Model

Workflow storage is built on an **append-only event log**. All state changes happen through events — you never modify runs, steps, or hooks directly. Instead, you create events that update the materialized state.

Events fall into three categories: run lifecycle events, step lifecycle events, and hook lifecycle events. See the [Event Sourcing](/docs/how-it-works/event-sourcing) documentation for a complete list of event types and their semantics.

## Storage Interface

The Storage interface provides read access to materialized entities and write access through events:

{/* @skip-typecheck - interface definition, not runnable code */}

```typescript
interface Storage {
  runs: {
    get(id: string, params?: GetWorkflowRunParams): Promise<WorkflowRun>;
    list(params?: ListWorkflowRunsParams): Promise<PaginatedResponse<WorkflowRun>>;
  };

  steps: {
    get(runId: string | undefined, stepId: string, params?: GetStepParams): Promise<Step>;
    list(params: ListWorkflowRunStepsParams): Promise<PaginatedResponse<Step>>;
  };

  events: {
    // Create a new workflow run (runId must be null - server generates it)
    create(runId: null, data: RunCreatedEventRequest, params?: CreateEventParams): Promise<EventResult>;
    
    // Create an event for an existing run
    create(runId: string, data: CreateEventRequest, params?: CreateEventParams): Promise<EventResult>;
    
    list(params: ListEventsParams): Promise<PaginatedResponse<Event>>;
    listByCorrelationId(params: ListEventsByCorrelationIdParams): Promise<PaginatedResponse<Event>>;
  };

  hooks: {
    get(hookId: string, params?: GetHookParams): Promise<Hook>;
    getByToken(token: string, params?: GetHookParams): Promise<Hook>;
    list(params: ListHooksParams): Promise<PaginatedResponse<Hook>>;
  };
}
```

### Key Implementation Details

**Event Creation:** When `events.create()` is called, your implementation must:

1. Persist the event to the event log
2. Atomically update the affected entity (run, step, or hook)
3. Return both the created event and the updated entity

**Run Creation:** For `run_created` events, the `runId` parameter is `null`. Your World generates and returns a new `runId`.

**Hook Tokens:** Hook tokens must be unique. If a `hook_created` event conflicts with an existing token, return a `hook_conflict` event instead.

**Automatic Hook Disposal:** When a workflow reaches a terminal state (`completed`, `failed`, or `cancelled`), automatically dispose of all associated hooks to release tokens for reuse.

## Queue Interface

The Queue interface handles asynchronous execution of workflows and steps:

{/* @skip-typecheck - interface definition, not runnable code */}

```typescript
interface Queue {
  getDeploymentId(): Promise<string>;

  queue(
    queueName: ValidQueueName,
    message: QueuePayload,
    opts?: QueueOptions
  ): Promise<{ messageId: MessageId }>;

  createQueueHandler(
    queueNamePrefix: QueuePrefix,
    handler: (message: unknown, meta: { attempt: number; queueName: ValidQueueName; messageId: MessageId }) => Promise<void | { timeoutSeconds: number }>
  ): (req: Request) => Promise<Response>;
}
```

### Queue Names

Queue names follow a specific pattern:

* `__wkf_workflow_<name>` — For workflow invocations
* `__wkf_step_<name>` — For step invocations

### Message Payloads

Two types of messages flow through queues:

**Workflow Invocations:**

{/* @skip-typecheck - interface definition, not runnable code */}

```typescript
interface WorkflowInvokePayload {
  runId: string;
  traceCarrier?: Record<string, string>;  // OpenTelemetry context
  requestedAt?: Date;
}
```

**Step Invocations:**

{/* @skip-typecheck - interface definition, not runnable code */}

```typescript
interface StepInvokePayload {
  workflowName: string;
  workflowRunId: string;
  workflowStartedAt: number;
  stepId: string;
  traceCarrier?: Record<string, string>;
  requestedAt?: Date;
}
```

### Implementation Considerations

* Messages must be delivered at-least-once
* Support configurable retry policies
* Track attempt counts for observability
* Implement idempotency using the `idempotencyKey` option when provided

## Streamer Interface

The Streamer interface enables real-time data streaming:

{/* @skip-typecheck - interface definition, not runnable code */}

```typescript
interface Streamer {
  writeToStream(
    name: string,
    runId: string | Promise<string>,
    chunk: string | Uint8Array
  ): Promise<void>;

  closeStream(
    name: string,
    runId: string | Promise<string>
  ): Promise<void>;

  readFromStream(
    name: string,
    startIndex?: number
  ): Promise<ReadableStream<Uint8Array>>;

  listStreamsByRunId(runId: string): Promise<string[]>;
}
```

Streams are identified by a combination of `runId` and `name`. Each workflow run can have multiple named streams.

## Reference Implementations

Study these implementations for guidance:

* **[Local World](https://github.com/vercel/workflow/tree/main/packages/world-local)** — Filesystem-based, great for understanding the basics
* **[Postgres World](https://github.com/vercel/workflow/tree/main/packages/world-postgres)** — Database-backed with pg-boss for queuing

## Testing Your World

Workflow DevKit includes an E2E test suite that validates World implementations. Once your World is published to npm:

1. Add your world to [`worlds-manifest.json`](https://github.com/vercel/workflow/blob/main/worlds-manifest.json)
2. Open a PR to the Workflow repository
3. CI will automatically run the E2E test suite against your implementation

Your world will then appear on the [Worlds Ecosystem](/worlds) page with its compatibility status and performance benchmarks.

## Publishing Your World

1. **Package your World** — Export a default World instance from your package
2. **Publish to npm** — Publish your package to npm
3. **Add to the manifest** — Submit a PR adding your world to [`worlds-manifest.json`](https://github.com/vercel/workflow/blob/main/worlds-manifest.json)
4. **Document configuration** — Clearly document any required environment variables

```json
// worlds-manifest.json entry
{
  "package": "your-world-package",
  "repository": "https://github.com/you/your-world",
  "docs": "https://github.com/you/your-world#readme"
}
```


---
title: Deploying
description: Deploy workflows locally, on Vercel, or anywhere using pluggable World adapters.
type: overview
summary: Learn how to deploy workflows to different environments using World adapters.
related:
  - /docs/deploying/world/local-world
  - /docs/deploying/world/postgres-world
  - /docs/deploying/world/vercel-world
  - /docs/deploying/building-a-world
---

# Deploying



Workflows are designed to be highly portable. The same workflow code can run locally during development, on Vercel with zero configuration, or on any infrastructure using **Worlds** — pluggable adapters that handle storage, queuing, and communication.

## Local Development

During local development, workflows automatically use the **Local World** — no configuration required. The Local World stores workflow data in a `.workflow-data/` directory and processes steps synchronously, making it perfect for development and testing.

```bash
# Just run your dev server - workflows work out of the box
npm run dev
```

You can inspect local workflow data using the CLI:

```bash
npx workflow inspect runs
```

<Callout>
  Learn more about the [Local World](/worlds/local) configuration and internals.
</Callout>

## Deploying to Vercel

The easiest way to deploy workflows to production is on Vercel. When you deploy to Vercel, workflows automatically use the **Vercel World** — again, with zero configuration.

The Vercel World provides:

* **Durable storage** - Workflow state persists across function invocations
* **Managed queuing** - Steps are processed reliably with automatic retries
* **Automatic scaling** - Workflows scale with your application
* **Built-in observability** - View workflow runs in the Vercel dashboard

Simply deploy your application:

```bash
vercel deploy
```

<Callout>
  Learn more about the [Vercel World](/worlds/vercel) and its capabilities.
</Callout>

## Self-Hosting & Other Providers

For self-hosting or deploying to other cloud providers, you can use community-maintained Worlds or build your own.

<Cards>
  <Card title="Explore Worlds" href="/worlds">
    Browse official and community World implementations with compatibility status and performance benchmarks.
  </Card>

  <Card title="Build Your Own" href="/docs/deploying/building-a-world">
    Learn how to implement a custom World for your infrastructure.
  </Card>
</Cards>

### Using a Third-Party World

To use a different World implementation, set the `WORKFLOW_TARGET_WORLD` environment variable:

```bash
export WORKFLOW_TARGET_WORLD=@workflow-worlds/postgres
# Plus any world-specific configuration
export DATABASE_URL=postgres://...
```

Each World may have its own configuration requirements — refer to the specific World's documentation for details.

## Observability

The [Observability tools](/docs/observability) work with any World backend. By default they connect to your local environment, but can be configured to inspect remote deployments:

```bash
# Inspect local workflows
npx workflow inspect runs

# Inspect remote workflows
npx workflow inspect runs --backend @workflow-worlds/postgres
```

Learn more about [Observability](/docs/observability) tools.


---
title: corrupted-event-log
description: The workflow's event log contains an event that no consumer can process, indicating corruption or invalid state.
type: troubleshooting
summary: Resolve corrupted event log errors caused by duplicate or orphaned events.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/foundations/errors-and-retries
---

# corrupted-event-log



This error occurs when the Workflow runtime encounters an event in the event log that no registered consumer can process. This means the event log is in an invalid state — typically due to duplicate or orphaned events.

This is a **workflow-level fatal error**. It cannot be caught or handled inside your workflow code. A corrupted event log immediately fails the entire run without executing any more user code. The run must be retried from outside the workflow.

## Error Message

```
Unconsumed event in event log: eventType=<type>, correlationId=<id>, eventId=<id>. This indicates a corrupted or invalid event log.
```

## Why This Happens

Workflows persist their progress as an ordered event log. During replay, the runtime processes each event in sequence — every event must be consumed by a matching callback (e.g., a step or sleep waiting for its result). When an event has no matching consumer, the runtime cannot advance past it, which would block all subsequent events and hang the workflow indefinitely.

Instead of silently hanging, the runtime raises a `WorkflowRuntimeError` to fail the workflow fast and surface the problem.

Common scenarios that produce this error:

1. **Duplicate completion events** — Two `wait_completed` events for a single `wait_created`, or two `step_completed` events for the same step. The first is consumed normally, but the second has no consumer.
2. **Orphaned events** — A `step_completed` or `wait_completed` event whose `correlationId` doesn't match any step or sleep in the workflow code.
3. **Events after terminal state** — An event that arrives after its corresponding step or wait has already reached a terminal state (e.g., `step_retrying` after `step_completed`).

## What To Do

This error indicates a bug in the Workflow SDK or Workflow server — not in your workflow code. Your workflow code does not need to change. Follow these steps to resolve the issue:

### 1. Upgrade to the latest `workflow` package

The bug that caused the corrupted event log may have already been identified and fixed in a newer version. Update to the latest version:

```bash
npm install workflow@latest
```

### 2. Retry the failed run

Since this is a fatal error, the run is automatically marked as `failed`. You can re-run it using the **Re-run** button in the Workflow Dashboard.

### 3. Report the issue

If the error persists after upgrading, please [open an issue on GitHub](https://github.com/vercel/workflow/issues/new) so we can investigate and fix the underlying bug. Include the following details to help us diagnose the problem:

* The version of the `workflow` package you are using
* The run ID(s) of the affected workflow run(s)
* The error message (including `eventType`, `correlationId`, and `eventId`)
* Any details about the event log or the workflow that triggered the error

## This Error Cannot Be Caught

Unlike other workflow errors, a corrupted event log error is **not catchable** inside your workflow function. Because the event log itself is invalid, the runtime cannot safely continue executing any user code. The entire run fails immediately and is marked as `failed`.

To handle this programmatically from outside the workflow, you can check the run status:

```typescript lineNumbers
import { getRun } from "workflow/api";

const run = getRun("wrun_abc123");
const status = await run.status;
if (status === "failed") {
  console.error("Run failed");
}
```


---
title: fetch-in-workflow
description: Use the workflow fetch step function instead of global fetch in workflows.
type: troubleshooting
summary: Resolve the fetch-in-workflow error by using the workflow fetch function.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/api-reference/workflow/fetch
---

# fetch-in-workflow



This error occurs when you try to use `fetch()` directly in a workflow function, or when a library (like the AI SDK) tries to call `fetch()` under the hood.

## Error Message

```
Global "fetch" is unavailable in workflow functions. Use the "fetch" step function from "workflow" to make HTTP requests.
```

## Why This Happens

Workflow functions run in a sandboxed environment without direct access to `fetch()`.

Many libraries make HTTP requests under the hood. For example, the AI SDK's `generateText()` function calls `fetch()` to make HTTP requests to AI providers. When these libraries run inside a workflow function, they fail because the global `fetch` is not available.

## Quick Fix

Import the `fetch` step function from the `workflow` package and assign it to `globalThis.fetch` inside your workflow function. This version of `fetch` is a step function that wraps the standard `fetch` API, automatically handling serialization and providing retry capabilities. This will also make `fetch()` available to all functions and libraries in the current workflow function.

**Before:**

```typescript lineNumbers title="workflows/ai.ts"
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function chatWorkflow(prompt: string) {
  "use workflow";

  // Error - generateText() calls fetch() under the hood
  const result = await generateText({ // [!code highlight]
    model: openai("gpt-4"), // [!code highlight]
    prompt, // [!code highlight]
  }); // [!code highlight]

  return result.text;
}
```

**After:**

```typescript lineNumbers title="workflows/ai.ts"
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { fetch } from "workflow"; // [!code highlight]

export async function chatWorkflow(prompt: string) {
  "use workflow";

  globalThis.fetch = fetch; // [!code highlight]

  // Now generateText() can make HTTP requests via the fetch step
  const result = await generateText({
    model: openai("gpt-4"),
    prompt,
  });

  return result.text;
}
```

## Common Scenarios

### AI SDK Integration

This is the most common scenario - using AI SDK functions that make HTTP requests:

```typescript lineNumbers
import { generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { fetch } from "workflow"; // [!code highlight]

export async function aiWorkflow(userMessage: string) {
  "use workflow";

  globalThis.fetch = fetch; // [!code highlight]

  // generateText makes HTTP requests to OpenAI
  const response = await generateText({
    model: openai("gpt-4"),
    prompt: userMessage,
  });

  return response.text;
}
```

### Direct API Calls

You can also use the fetch step function directly for your own HTTP requests:

```typescript lineNumbers
import { fetch } from "workflow";

export async function dataWorkflow() {
  "use workflow";

  // Use fetch directly for HTTP requests
  const response = await fetch("https://api.example.com/data"); // [!code highlight]
  const data = await response.json();

  return data;
}
```

For more details on the `fetch` step function, see the [fetch API reference](/docs/api-reference/workflow/fetch).


---
title: hook-conflict
description: Hook tokens must be unique across all running workflows in your project.
type: troubleshooting
summary: Resolve hook token conflicts by using unique or auto-generated tokens.
prerequisites:
  - /docs/foundations/hooks
related:
  - /docs/api-reference/workflow/create-hook
  - /docs/api-reference/workflow/define-hook
---

# hook-conflict



This error occurs when you try to create a hook with a token that is already in use by another active workflow run. Hook tokens must be unique across all running workflows in your project.

## Error Message

```
Hook token conflict: Hook with token <token> already exists for this project
```

## Why This Happens

Hooks use tokens to identify incoming webhook payloads. When you create a hook with `createHook({ token: "my-token" })`, the Workflow runtime reserves that token for your workflow run. If another workflow run is already using that token, a conflict occurs.

This typically happens when:

1. **Two workflows start simultaneously** with the same hardcoded token
2. **A previous workflow run is still waiting** for a hook when a new run tries to use the same token

## Common Causes

### Hardcoded Token Values

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
// Error - multiple concurrent runs will conflict
export async function processPayment() {
  "use workflow";

  const hook = createHook({ token: "payment-hook" }); // [!code highlight]
  // If another run is already waiting on "payment-hook", this will fail
  const payment = await hook;
}
```

**Solution:** Use unique tokens that include the run ID or other unique identifiers.

```typescript lineNumbers
export async function processPayment(orderId: string) {
  "use workflow";

  // Include unique identifier in token
  const hook = createHook({ token: `payment-${orderId}` }); // [!code highlight]
  const payment = await hook;
}
```

### Omitting the Token (Auto-generated)

The safest approach is to let the Workflow runtime generate a unique token automatically:

```typescript lineNumbers
export async function processPayment() {
  "use workflow";

  const hook = createHook(); // Auto-generated unique token // [!code highlight]
  console.log(`Send webhook to token: ${hook.token}`);
  const payment = await hook;
}
```

## Handling Hook Conflicts in Your Workflow

When a hook conflict occurs, awaiting the hook will throw a `WorkflowRuntimeError`. You can catch this error to handle the conflict gracefully:

```typescript lineNumbers
import { WorkflowRuntimeError } from "@workflow/errors";

export async function processPayment(orderId: string) {
  "use workflow";

  const hook = createHook({ token: `payment-${orderId}` });

  try {
    const payment = await hook; // [!code highlight]
    return { success: true, payment };
  } catch (error) {
    if (error instanceof WorkflowRuntimeError && error.slug === "hook-conflict") { // [!code highlight]
      // Another workflow is already processing this order
      return { success: false, reason: "duplicate-processing" };
    }
    throw error; // Re-throw other errors
  }
}
```

This pattern is useful when you want to detect and handle duplicate processing attempts instead of letting the workflow fail.

## When Hook Tokens Are Released

Hook tokens are automatically released when:

* The workflow run **completes** (successfully or with an error)
* The workflow run is **cancelled**
* The hook is explicitly **disposed**

After a workflow completes, its hook tokens become available for reuse by other workflows.

## Best Practices

1. **Use auto-generated tokens** when possible - they are guaranteed to be unique
2. **Include unique identifiers** if you need custom tokens (order ID, user ID, etc.)
3. **Avoid reusing the same token** across multiple concurrent workflow runs
4. **Consider using webhooks** (`createWebhook`) if you need a fixed, predictable URL that can receive multiple payloads

## Related

* [Hooks](/docs/foundations/hooks) - Learn more about using hooks in workflows
* [createWebhook](/docs/api-reference/workflow/create-webhook) - Alternative for fixed webhook URLs


---
title: Errors
description: Fix common mistakes when creating and executing workflows.
type: overview
summary: Browse and resolve common workflow errors.
related:
  - /docs/foundations/errors-and-retries
---

# Errors



Fix common mistakes when creating and executing workflows in the **Workflow DevKit**.

<Cards>
  <Card href="/docs/errors/fetch-in-workflow" title="fetch-in-workflow">
    Learn how to use fetch in workflow functions.
  </Card>

  <Card href="/docs/errors/hook-conflict" title="hook-conflict">
    Learn how to handle hook token conflicts between workflows.
  </Card>

  <Card href="/docs/errors/node-js-module-in-workflow" title="node-js-module-in-workflow">
    Learn how to use Node.js modules in workflows.
  </Card>

  <Card href="/docs/errors/serialization-failed" title="serialization-failed">
    Learn how to handle serialization failures in workflows.
  </Card>

  <Card href="/docs/errors/start-invalid-workflow-function" title="start-invalid-workflow-function">
    Learn how to start an invalid workflow function.
  </Card>

  <Card href="/docs/errors/timeout-in-workflow" title="timeout-in-workflow">
    Learn how to handle timing delays in workflow functions.
  </Card>

  <Card href="/docs/errors/webhook-invalid-respond-with-value" title="webhook-invalid-respond-with-value">
    Learn how to use the correct `respondWith` values for webhooks.
  </Card>

  <Card href="/docs/errors/webhook-response-not-sent" title="webhook-response-not-sent">
    Learn how to send responses when using manual webhook response mode.
  </Card>

  <Card href="/docs/errors/corrupted-event-log" title="corrupted-event-log">
    Learn how to handle corrupted or invalid event logs.
  </Card>
</Cards>

## Learn More

* [API Reference](/docs/api-reference) - Complete API documentation
* [Foundations](/docs/foundations) - Architecture and core concepts
* [Examples](https://github.com/vercel/workflow) - Sample implementations
* [GitHub Issues](https://github.com/vercel/workflow/issues) - Report bugs and request features


---
title: node-js-module-in-workflow
description: Move Node.js core module usage to step functions instead of workflows.
type: troubleshooting
summary: Resolve the node-js-module-in-workflow error by moving Node.js modules to step functions.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/how-it-works/understanding-directives
---

# node-js-module-in-workflow



This error occurs when you try to import or use Node.js core modules (like `fs`, `http`, `crypto`, `path`, etc.) directly inside a workflow function.

## Error Message

```
Cannot use Node.js module "fs" in workflow functions. Move this module to a step function.
```

## Why This Happens

Workflow functions run in a sandboxed environment without full Node.js runtime access. This restriction is important for maintaining **determinism** - the ability to replay workflows exactly and resume from where they left off after suspensions or failures.

Node.js modules have side effects and non-deterministic behavior that could break workflow replay guarantees.

## Quick Fix

Move any code using Node.js modules to a step function. Step functions have full Node.js runtime access.

For example, when trying to read a file in a workflow function, you should move the code to a step function.

**Before:**

```typescript lineNumbers
import * as fs from "fs";

export async function processFileWorkflow(filePath: string) {
  "use workflow";

  // This will cause an error - Node.js module in workflow context
  const content = fs.readFileSync(filePath, "utf-8"); // [!code highlight]
  return content;
}
```

**After:**

```typescript lineNumbers
import * as fs from "fs";

export async function processFileWorkflow(filePath: string) {
  "use workflow";

  // Call step function that has Node.js access
  const content = await read(filePath); // [!code highlight]
  return content;
}

async function read(filePath: string) {
  "use step";

  // Node.js modules are allowed in step functions
  return fs.readFileSync(filePath, "utf-8"); // [!code highlight]
}
```

## Common Node.js Modules

These common Node.js core modules cannot be used in workflow functions:

* File system: `fs`, `path`
* Network: `http`, `https`, `net`, `dns`, `fetch`
* Process: `child_process`, `cluster`
* Crypto: `crypto` (use Web Crypto API instead)
* Operating system: `os`
* Streams: `stream` (use Web Streams API instead)

<Callout type="info">
  You can use Web Platform APIs in workflow functions (like `Headers`, `crypto.randomUUID()`, `Response`, etc.), since these are available in the sandboxed environment.
</Callout>


---
title: serialization-failed
description: Ensure all data passed between workflow and step functions is serializable.
type: troubleshooting
summary: Resolve serialization errors by passing only serializable types across execution boundaries.
prerequisites:
  - /docs/foundations/serialization
related:
  - /docs/foundations/workflows-and-steps
---

# serialization-failed



This error occurs when you try to pass non-serializable data between execution boundaries in your workflow. All data passed between workflow functions, step functions, and the workflow runtime must be serializable to persist in the event log.

## Error Message

```
Failed to serialize workflow arguments. Ensure you're passing serializable types
(plain objects, arrays, primitives, Date, RegExp, Map, Set).
```

This error can appear when:

* Serializing workflow arguments when calling `start()`
* Serializing workflow return values
* Serializing step arguments
* Serializing step return values

## Why This Happens

Workflows persist their state using an event log. Every value that crosses execution boundaries must be:

1. **Serialized** to be stored in the event log
2. **Deserialized** when the workflow resumes

Functions, class instances, symbols, and other non-serializable types cannot be properly reconstructed after serialization, which would break workflow replay.

## Common Causes

### Passing Functions

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
// Error - functions cannot be serialized
export async function processWorkflow() {
  "use workflow";

  const callback = () => console.log("done"); // [!code highlight]
  await processStep(callback); // Error! // [!code highlight]
}
```

**Solution:** Pass data instead, then define the function logic in the step.

```typescript lineNumbers
// Fixed - pass configuration data instead
export async function processWorkflow() {
  "use workflow";

  await processStep({ shouldLog: true }); // [!code highlight]
}

async function processStep(config: { shouldLog: boolean }) {
  "use step";

  if (config.shouldLog) { // [!code highlight]
    console.log("done"); // [!code highlight]
  } // [!code highlight]
}
```

### Class Instances

```typescript lineNumbers
class User {
  constructor(public name: string) {}
  greet() { return `Hello ${this.name}`; }
}

// Error - class instances lose methods after serialization
export async function greetWorkflow() {
  "use workflow";

  await greetStep(new User("Alice")); // Error! // [!code highlight]
}
```

**Solution:** Pass plain objects and reconstruct the class in the step.

```typescript lineNumbers
class User {
  constructor(public name: string) {}
  greet() { return `Hello ${this.name}`; }
}

// Fixed - pass plain object, reconstruct in step
export async function greetWorkflow() {
  "use workflow";

  await greetStep({ name: "Alice" }); // [!code highlight]
}

async function greetStep(userData: { name: string }) {
  "use step";

  const user = new User(userData.name); // [!code highlight]
  console.log(user.greet());
}
```

## Supported Serializable Types

Workflow DevKit supports these types across execution boundaries:

### Standard JSON Types

* `string`, `number`, `boolean`, `null`
* Arrays of serializable values
* Plain objects with serializable values

To learn more about supported types, see the [Serialization](/docs/foundations/serialization) section.

## Debugging Serialization Issues

To identify what's causing serialization to fail:

1. **Check the error stack trace** - it often shows which property failed
2. **Simplify your data** - temporarily pass smaller objects to isolate the issue
3. **Ensure you are using supported data types** - see the [Serialization](/docs/foundations/serialization) section for more details


---
title: start-invalid-workflow-function
description: Ensure you pass a valid workflow function to start() with proper configuration.
type: troubleshooting
summary: Resolve the start-invalid-workflow-function error by passing a properly configured workflow function.
prerequisites:
  - /docs/foundations/starting-workflows
related:
  - /docs/api-reference/workflow-api/start
---

# start-invalid-workflow-function



This error occurs when you try to call `start()` with a function that is not a valid workflow function or when the Workflow DevKit is not configured correctly.

## Error Message

```
'start' received an invalid workflow function. Ensure the Workflow DevKit
is configured correctly and the function includes a 'use workflow' directive.
```

## Why This Happens

The `start()` function expects a workflow function that has been properly processed by Workflow DevKit's build system. During the build process, workflow functions are transformed and marked with special metadata that `start()` uses to identify and execute them.

This error typically happens when:

* The function is missing the `"use workflow"` directive
* The workflow isn't being built/transformed correctly
* The function isn't exported from the workflow file
* The wrong function is being imported

## Common Causes

### Missing `"use workflow"` Directive

```typescript lineNumbers title="workflows/order.ts"
// Error - missing directive
export async function processOrder(orderId: string) { // [!code highlight]
  // workflow logic
  return { status: "completed" };
}
```

**Solution:** Add the `"use workflow"` directive.

```typescript lineNumbers title="workflows/order.ts"
// Fixed - includes directive
export async function processOrder(orderId: string) {
  "use workflow"; // [!code highlight]

  // workflow logic
  return { status: "completed" };
}
```

### Incorrect Import

```typescript lineNumbers title="app/api/route.ts"
import { start } from "workflow/api";
// Error - importing step function instead of workflow
import { processStep } from "@/workflows/order"; // [!code highlight]

export async function POST(request: Request) {
  await start(processStep, ["order-123"]); // Error! // [!code highlight]
  return Response.json({ started: true });
}
```

**Solution:** Import the correct workflow function.

```typescript lineNumbers title="app/api/route.ts"
import { start } from "workflow/api";
// Fixed - import workflow function
import { processOrder } from "@/workflows/order"; // [!code highlight]

export async function POST(request: Request) {
  await start(processOrder, ["order-123"]); // [!code highlight]
  return Response.json({ started: true });
}
```

### Next.js Configuration Missing

```typescript lineNumbers title="next.config.ts"
// Error - missing withWorkflow wrapper
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // your config
};

export default nextConfig;
```

**Solution:** Wrap with `withWorkflow()`.

```typescript lineNumbers title="next.config.ts"
// Fixed - includes withWorkflow
import { withWorkflow } from "workflow/next"; // [!code highlight}
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // your config
};

export default withWorkflow(nextConfig); // [!code highlight]
```


---
title: timeout-in-workflow
description: Use the sleep function instead of setTimeout or setInterval in workflows.
type: troubleshooting
summary: Resolve the timeout-in-workflow error by replacing setTimeout with the sleep function.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/api-reference/workflow/sleep
---

# timeout-in-workflow



This error occurs when you try to use `setTimeout()`, `setInterval()`, or related timing functions directly inside a workflow function.

## Error Message

```
Timeout functions like "setTimeout" and "setInterval" are not supported in workflow functions. Use the "sleep" function from "workflow" for time-based delays.
```

## Why This Happens

Workflow functions run in a sandboxed environment where timing functions like `setTimeout()` and `setInterval()` are not available. These functions rely on asynchronous scheduling that would break the **deterministic replay** guarantees that workflows depend on.

When a workflow suspends and later resumes, it replays from the event log. If timing functions were allowed, the replay would produce different results than the original execution.

## Quick Fix

Use the `sleep` function from the `workflow` package for time-based delays. Unlike `setTimeout()`, `sleep` is tracked in the event log and replays correctly.

**Before:**

```typescript lineNumbers title="workflows/delayed.ts"
export async function delayedWorkflow() {
  "use workflow";

  // Error - setTimeout is not available in workflow functions
  await new Promise(resolve => setTimeout(resolve, 5000)); // [!code highlight]

  return 'done';
}
```

**After:**

```typescript lineNumbers title="workflows/delayed.ts"
import { sleep } from 'workflow'; // [!code highlight]

export async function delayedWorkflow() {
  "use workflow";

  // sleep is tracked in the event log and replays correctly
  await sleep('5s'); // [!code highlight]

  return 'done';
}
```

## Unavailable Functions

These timing functions cannot be used in workflow functions:

* `setTimeout()`
* `setInterval()`
* `setImmediate()`
* `clearTimeout()`
* `clearInterval()`
* `clearImmediate()`

## Common Scenarios

### Polling with Delays

If you need to poll an external service with delays between requests:

```typescript lineNumbers title="workflows/polling.ts"
import { sleep } from 'workflow';

export async function pollingWorkflow() {
  "use workflow";

  let status = 'pending';

  while (status === 'pending') {
    status = await checkStatus(); // step function
    if (status === 'pending') {
      await sleep('10s'); // [!code highlight]
    }
  }

  return status;
}

async function checkStatus() {
  "use step";
  const response = await fetch('https://api.example.com/status');
  const data = await response.json();
  return data.status;
}
```

### Scheduled Delays

For workflows that need to wait for a specific duration:

```typescript lineNumbers title="workflows/reminder.ts"
import { sleep } from 'workflow';

export async function reminderWorkflow(message: string) {
  "use workflow";

  // Wait 24 hours before sending reminder
  await sleep('24h'); // [!code highlight]

  await sendReminder(message);

  return 'reminder sent';
}

async function sendReminder(message: string) {
  "use step";
  // Send reminder logic
}
```

<Callout type="info">
  The `sleep` function accepts duration strings like `'5s'`, `'10m'`, `'1h'`, `'24h'`, or milliseconds as a number. See the [sleep API reference](/docs/api-reference/workflow/sleep) for more details.
</Callout>


---
title: webhook-invalid-respond-with-value
description: The respondWith option must be "manual" or a Response object.
type: troubleshooting
summary: Resolve the webhook-invalid-respond-with-value error by using a valid respondWith option.
prerequisites:
  - /docs/foundations/hooks
related:
  - /docs/api-reference/workflow/create-webhook
---

# webhook-invalid-respond-with-value



This error occurs when you provide an invalid value for the `respondWith` option when creating a webhook. The `respondWith` option must be either `"manual"` or a `Response` object.

## Error Message

```
Invalid `respondWith` value: [value]
```

## Why This Happens

When creating a webhook with `createWebhook()`, you can specify how the webhook should respond to incoming HTTP requests using the `respondWith` option. This option only accepts specific values:

1. `"manual"` - Allows you to manually send a response from within the workflow
2. A `Response` object - A pre-defined response to send immediately
3. `undefined` (default) - Returns a `202 Accepted` response

## Common Causes

### Using an Invalid String Value

```typescript lineNumbers
// Error - invalid string value
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook({
    respondWith: "automatic", // Error! // [!code highlight]
  });
}
```

**Solution:** Use `"manual"` or provide a `Response` object.

```typescript lineNumbers
// Fixed - use "manual"
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook({
    respondWith: "manual", // [!code highlight]
  });

  const request = await webhook;

  // Send custom response
  await request.respondWith(new Response("OK", { status: 200 })); // [!code highlight]
}
```

### Using a Non-Response Object

```typescript lineNumbers
// Error - plain object instead of Response
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook({
    respondWith: { status: 200, body: "OK" }, // Error! // [!code highlight]
  });
}
```

**Solution:** Create a proper `Response` object.

```typescript lineNumbers
// Fixed - use Response constructor
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook({
    respondWith: new Response("OK", { status: 200 }), // [!code highlight]
  });
}
```

## Valid Usage Examples

### Default Behavior (202 Response)

```typescript lineNumbers
// Returns 202 Accepted automatically
const webhook = await createWebhook();
const request = await webhook;
// No need to send a response
```

### Manual Response

```typescript lineNumbers
// Manual response control
const webhook = await createWebhook({
  respondWith: "manual",
});

const request = await webhook;

// Process the request...
const data = await request.json();

// Send custom response
await request.respondWith(
  new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
);
```

### Pre-defined Response

```typescript lineNumbers
// Immediate response
const webhook = await createWebhook({
  respondWith: new Response("Request received", { status: 200 }),
});

const request = await webhook;
// Response already sent
```

## Learn More

* [createWebhook() API Reference](/docs/api-reference/workflow/create-webhook)
* [resumeWebhook() API Reference](/docs/api-reference/workflow-api/resume-webhook)
* [Webhooks Guide](/docs/foundations/hooks)


---
title: webhook-response-not-sent
description: Manual webhooks must send a response before execution completes.
type: troubleshooting
summary: Resolve the webhook-response-not-sent error by ensuring all code paths call respondWith.
prerequisites:
  - /docs/foundations/hooks
related:
  - /docs/api-reference/workflow/create-webhook
---

# webhook-response-not-sent



This error occurs when a webhook is configured with `respondWith: "manual"` but the workflow does not send a response using `request.respondWith()` before the webhook execution completes.

## Error Message

```
Workflow run did not send a response
```

## Why This Happens

When you create a webhook with `respondWith: "manual"`, you are responsible for calling `request.respondWith()` to send the HTTP response back to the caller. If the workflow execution completes without sending a response, this error will be thrown.

The webhook infrastructure waits for a response to be sent, and if none is provided, it cannot complete the HTTP request properly.

## Common Causes

### Forgetting to Call `request.respondWith()`

```typescript lineNumbers
// Error - no response sent
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook({
    respondWith: "manual",
  });

  const request = await webhook;
  const data = await request.json();

  // Process data...
  console.log(data);

  // Error: workflow ends without calling request.respondWith() // [!code highlight]
}
```

**Solution:** Always call `request.respondWith()` when using manual response mode.

```typescript lineNumbers
// Fixed - response sent
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook({
    respondWith: "manual",
  });

  const request = await webhook;
  const data = await request.json();

  // Process data...
  console.log(data);

  // Send response before workflow ends // [!code highlight]
  await request.respondWith(new Response("Processed", { status: 200 })); // [!code highlight]
}
```

### Conditional Response Logic

```typescript lineNumbers
// Error - response only sent in some branches
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook({
    respondWith: "manual",
  });

  const request = await webhook;
  const data = await request.json();

  if (data.isValid) {
    await request.respondWith(new Response("OK", { status: 200 }));
  }
  // Error: no response when data.isValid is false // [!code highlight]
}
```

**Solution:** Ensure all code paths send a response.

```typescript lineNumbers
// Fixed - response sent in all branches
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook({
    respondWith: "manual",
  });

  const request = await webhook;
  const data = await request.json();

  if (data.isValid) { // [!code highlight]
    await request.respondWith(new Response("OK", { status: 200 })); // [!code highlight]
  } else { // [!code highlight]
    await request.respondWith(new Response("Invalid data", { status: 400 })); // [!code highlight]
  } // [!code highlight]
}
```

### Exception Before Response

```typescript lineNumbers
// Error - exception thrown before response
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook({
    respondWith: "manual",
  });

  const request = await webhook;

  // Error occurs here // [!code highlight]
  throw new Error("Something went wrong"); // [!code highlight]

  // Never reached
  await request.respondWith(new Response("OK", { status: 200 }));
}
```

**Solution:** Use try-catch to handle errors and send appropriate responses.

```typescript lineNumbers
// Fixed - error handling with response
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook({
    respondWith: "manual",
  });

  const request = await webhook;

  try { // [!code highlight]
    // Process request...
    const result = await processData(request); // [!code highlight]
    await request.respondWith(new Response("OK", { status: 200 })); // [!code highlight]
  } catch (error) { // [!code highlight]
    // Send error response // [!code highlight]
    await request.respondWith( // [!code highlight]
      new Response("Internal error", { status: 500 }) // [!code highlight]
    ); // [!code highlight]
  } // [!code highlight]
}
```

## Alternative: Use Default Response Mode

If you don't need custom response control, consider using the default response mode which automatically returns a `202 Accepted` response:

```typescript lineNumbers
// Automatic 202 response - no manual response needed
export async function webhookWorkflow() {
  "use workflow";

  const webhook = await createWebhook(); // [!code highlight]
  const request = await webhook;

  // Process request asynchronously
  await processData(request);

  // No need to call request.respondWith()
}
```

## Learn More

* [createWebhook() API Reference](/docs/api-reference/workflow/create-webhook)
* [resumeWebhook() API Reference](/docs/api-reference/workflow-api/resume-webhook)
* [Webhooks Guide](/docs/foundations/hooks)


---
title: Common Patterns
description: Implement distributed patterns using familiar async/await syntax with no new APIs to learn.
type: guide
summary: Apply sequential, parallel, timeout, and composition patterns in workflows.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/foundations/errors-and-retries
  - /docs/foundations/hooks
---

# Common Patterns



Common distributed patterns are simple to implement in workflows and require learning no new syntax. You can just use familiar async/await patterns.

## Sequential Execution

The simplest way to orchestrate steps is to execute them one after another, where each step can be dependent on the previous step.

```typescript lineNumbers
declare function validateData(data: unknown): Promise<string>; // @setup
declare function processData(data: string): Promise<string>; // @setup
declare function storeData(data: string): Promise<string>; // @setup

export async function dataPipelineWorkflow(data: unknown) {
  "use workflow";

  const validated = await validateData(data);
  const processed = await processData(validated);
  const stored = await storeData(processed);

  return stored;
}
```

## Parallel Execution

When you need to execute multiple steps in parallel, you can use `Promise.all` to run them all at the same time.

```typescript lineNumbers
declare function fetchUser(userId: string): Promise<{ name: string }>; // @setup
declare function fetchOrders(userId: string): Promise<{ items: string[] }>; // @setup
declare function fetchPreferences(userId: string): Promise<{ theme: string }>; // @setup

export async function fetchUserData(userId: string) {
  "use workflow";

  const [user, orders, preferences] = await Promise.all([ // [!code highlight]
    fetchUser(userId), // [!code highlight]
    fetchOrders(userId), // [!code highlight]
    fetchPreferences(userId) // [!code highlight]
  ]); // [!code highlight]

  return { user, orders, preferences };
}
```

This not only applies to steps - since [`sleep()`](/docs/api-reference/workflow/sleep) and [`webhook`](/docs/api-reference/workflow/create-webhook) are also just promises, we can await those in parallel too.
We can also use `Promise.race` instead of `Promise.all` to stop executing promises after the first one completes.

```typescript lineNumbers
import { sleep, createWebhook } from "workflow";
declare function executeExternalTask(webhookUrl: string): Promise<void>; // @setup

export async function runExternalTask(userId: string) {
  "use workflow";

  const webhook = createWebhook();
  await executeExternalTask(webhook.url); // Send the webhook somewhere

  // Wait for the external webhook to be hit, with a timeout of 1 day,
  // whichever comes first
  await Promise.race([ // [!code highlight]
    webhook, // [!code highlight]
    sleep("1 day"), // [!code highlight]
  ]); // [!code highlight]

  console.log("Done")
}
```

## A Full Example

Here's a simplified example taken from the [birthday card generator demo](https://github.com/vercel/workflow-examples/tree/main/birthday-card-generator), to illustrate how sequential and parallel execution can be combined.

```typescript lineNumbers
import { createWebhook, sleep, type Webhook } from "workflow"
declare function makeCardText(prompt: string): Promise<string>; // @setup
declare function makeCardImage(text: string): Promise<string>; // @setup
declare function sendRSVPEmail(friend: string, webhook: Webhook): Promise<void>; // @setup
declare function sendBirthdayCard(text: string, image: string, rsvps: unknown[], email: string): Promise<void>; // @setup

async function birthdayWorkflow(
    prompt: string,
    email: string,
    friends: string[],
    birthday: Date
) {
    "use workflow";

    // Generate a birthday card with sequential steps
    const text = await makeCardText(prompt)
    const image = await makeCardImage(text)

    // Create webhooks for each friend who's invited to the birthday party
    const webhooks = friends.map(_ => createWebhook())

    // Send out all the RSVP invites in parallel steps
    await Promise.all(
        friends.map(
            (friend, i) => sendRSVPEmail(friend, webhooks[i])
        )
    )

    // Collect RSVPs as they are made without blocking the workflow
    let rsvps = []
    webhooks.map(
        webhook => webhook
            .then(req => req.json())
            .then(( { rsvp } ) => rsvps.push(rsvp))
    )

    // Wait until the birthday
    await sleep(birthday)

    // Send birthday card with as many rsvps were collected
    await sendBirthdayCard(text, image, rsvps, email)

    return { text, image, status: "Sent" }
}
```

## Timeout Pattern

A common requirement is adding timeouts to operations that might take too long. Use `Promise.race` with `sleep()` to implement this pattern.

```typescript lineNumbers
import { sleep } from "workflow";
declare function processData(data: string): Promise<string>; // @setup

export async function processWithTimeout(data: string) {
  "use workflow";

  const result = await Promise.race([ // [!code highlight]
    processData(data), // [!code highlight]
    sleep("30s").then(() => "timeout" as const), // [!code highlight]
  ]); // [!code highlight]

  if (result === "timeout") {
    // In workflows, any thrown error exits the workflow (FatalError is for steps)
    throw new Error("Processing timed out after 30 seconds");
  }

  return result;
}
```

This pattern works with any promise-returning operation including steps, hooks, and webhooks. For example, you can add a timeout to a webhook that waits for external input:

```typescript lineNumbers
import { sleep, createWebhook } from "workflow";
declare function sendApprovalRequest(requestId: string, webhookUrl: string): Promise<void>; // @setup

export async function waitForApproval(requestId: string) {
  "use workflow";

  const webhook = createWebhook<{ approved: boolean }>();
  await sendApprovalRequest(requestId, webhook.url);

  const result = await Promise.race([ // [!code highlight]
    webhook.then((req) => req.json()), // [!code highlight]
    sleep("7 days").then(() => ({ timedOut: true }) as const), // [!code highlight]
  ]); // [!code highlight]

  if ("timedOut" in result) {
    throw new Error("Approval request expired after 7 days");
  }

  return result.approved;
}
```

## Workflow Composition

Workflows can call other workflows, enabling you to break complex processes into reusable building blocks. There are two approaches depending on your needs.

### Direct Await (Flattening)

Call a child workflow directly using `await`. This "flattens" the child workflow into the parent - the child's steps execute inline within the parent workflow's context.

```typescript lineNumbers
declare function sendEmail(userId: string): Promise<void>; // @setup
declare function sendPushNotification(userId: string): Promise<void>; // @setup
declare function createAccount(userId: string): Promise<void>; // @setup
declare function setupPreferences(userId: string): Promise<void>; // @setup

// Child workflow
export async function sendNotifications(userId: string) {
  "use workflow";

  await sendEmail(userId);
  await sendPushNotification(userId);
  return { notified: true };
}

// Parent workflow calls child directly
export async function onboardUser(userId: string) {
  "use workflow";

  await createAccount(userId);
  await sendNotifications(userId); // [!code highlight]
  await setupPreferences(userId);

  return { userId, status: "onboarded" };
}
```

With direct await, the parent workflow waits for the child to complete before continuing. The child's steps appear in the parent's event log as if they were called directly from the parent.

### Background Execution via Step

To run a child workflow independently without blocking the parent, use a step that calls [`start()`](/docs/api-reference/workflow-api/start). This launches the child workflow in the background.

```typescript lineNumbers
import { start } from "workflow/api";
declare function generateReport(reportId: string): Promise<void>; // @setup
declare function fulfillOrder(orderId: string): Promise<{ id: string }>; // @setup
declare function sendConfirmation(orderId: string): Promise<void>; // @setup

// Step that starts a workflow in the background
async function triggerReportGeneration(reportId: string) {
  "use step";

  const run = await start(generateReport, [reportId]); // [!code highlight]
  return run.runId;
}

// Parent workflow
export async function processOrder(orderId: string) {
  "use workflow";

  const order = await fulfillOrder(orderId);

  // Fire off report generation without waiting
  const reportRunId = await triggerReportGeneration(orderId); // [!code highlight]

  // Continue immediately - report generates in background
  await sendConfirmation(orderId);

  return { orderId, reportRunId };
}
```

With background execution, the parent workflow continues immediately after starting the child. The child workflow runs independently with its own event log and can be monitored separately using the returned `runId`.

**Choose direct await when:**

* The parent needs the child's result before continuing
* You want a single, unified event log

**Choose background execution when:**

* The parent doesn't need to wait for the result
* You want separate workflow runs for observability


---
title: Errors & Retrying
description: Customize retry behavior with FatalError and RetryableError for robust error handling.
type: conceptual
summary: Control how steps handle failures and customize retry behavior.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/api-reference/workflow/fatal-error
  - /docs/api-reference/workflow/retryable-error
---

# Errors & Retrying



By default, errors thrown inside steps are retried. Additionally, Workflow DevKit provides two new types of errors you can use to customize retries.

## Default Retrying

By default, steps retry up to 3 times on arbitrary errors. You can customize the number of retries by adding a `maxRetries` property to the step function.

```typescript lineNumbers
async function callApi(endpoint: string) {
  "use step";

  const response = await fetch(endpoint);

  if (response.status >= 500) {
    // Any uncaught error gets retried
    throw new Error("Uncaught exceptions get retried!"); // [!code highlight]
  }

  return response.json();
}

callApi.maxRetries = 5; // Retry up to 5 times on failure (6 total attempts)
```

Steps get enqueued immediately after a failure. Read on to see how this can be customized.

<Callout type="info">
  When a retried step performs external side effects (payments, emails, API
  writes), ensure those calls are <strong>idempotent</strong> to avoid duplicate
  side effects. See <a href="/docs/foundations/idempotency">Idempotency</a> for
  more information.
</Callout>

## Intentional Errors

When your step needs to intentionally throw an error and skip retrying, simply throw a [`FatalError`](/docs/api-reference/workflow/fatal-error).

```typescript lineNumbers
import { FatalError } from "workflow";

async function callApi(endpoint: string) {
  "use step";

  const response = await fetch(endpoint);

  if (response.status >= 500) {
    // Any uncaught error gets retried
    throw new Error("Uncaught exceptions get retried!");
  }

  if (response.status === 404) {
    throw new FatalError("Resource not found. Skipping retries."); // [!code highlight]
  }

  return response.json();
}
```

## Customize Retry Behavior

When you need to customize the delay on a retry, use [`RetryableError`](/docs/api-reference/workflow/retryable-error) and set the `retryAfter` property.

```typescript lineNumbers
import { FatalError, RetryableError } from "workflow";

async function callApi(endpoint: string) {
  "use step";

  const response = await fetch(endpoint);

  if (response.status >= 500) {
    throw new Error("Uncaught exceptions get retried!");
  }

  if (response.status === 404) {
    throw new FatalError("Resource not found. Skipping retries.");
  }

  if (response.status === 429) {
    throw new RetryableError("Rate limited. Retrying...", { // [!code highlight]
      retryAfter: "1m", // Duration string // [!code highlight]
    }); // [!code highlight]
  }

  return response.json();
}
```

## Advanced Example

This final example combines everything we've learned, along with [`getStepMetadata`](/docs/api-reference/workflow/get-step-metadata).

```typescript lineNumbers
import { FatalError, RetryableError, getStepMetadata } from "workflow";

async function callApi(endpoint: string) {
  "use step";

  const metadata = getStepMetadata();

  const response = await fetch(endpoint);

  if (response.status >= 500) {
    // Exponential backoffs
    throw new RetryableError("Backing off...", {
      retryAfter: (metadata.attempt ** 2) * 1000,  // [!code highlight]
    });
  }

  if (response.status === 404) {
    throw new FatalError("Resource not found. Skipping retries.");
  }

  if (response.status === 429) {
    throw new RetryableError("Rate limited. Retrying...", {
      retryAfter: new Date(Date.now() + 60000),  // Date instance // [!code highlight]
    });
  }

  return response.json();
}
callApi.maxRetries = 5; // Retry up to 5 times on failure (6 total attempts)
```

<Callout type="info">
  Setting <code>maxRetries = 0</code> means the step will run once but will not
  be retried on failure. The default is <code>maxRetries = 3</code>, meaning the
  step can run up to 4 times total (1 initial attempt + 3 retries).
</Callout>

## Rolling Back Failed Steps

When a workflow fails partway through, it can leave the system in an inconsistent state.
A common pattern to address this is "rollbacks": for each successful step, record a corresponding rollback action that can undo it.
If a later step fails, run the rollbacks in reverse order to roll back.

Key guidelines:

* Make rollbacks steps as well, so they are durable and benefit from retries.
* Ensure rollbacks are [idempotent](/docs/foundations/idempotency); they may run more than once.
* Only enqueue a compensation after its forward step succeeds.

```typescript lineNumbers
// Forward steps
async function reserveInventory(orderId: string) {
  "use step";
  // ... call inventory service to reserve ...
}

async function chargePayment(orderId: string) {
  "use step";
  // ... charge the customer ...
}

// Rollback steps
async function releaseInventory(orderId: string) {
  "use step";
  // ... undo inventory reservation ...
}

async function refundPayment(orderId: string) {
  "use step";
  // ... refund the charge ...
}

export async function placeOrderSaga(orderId: string) {
  "use workflow";

  const rollbacks: Array<() => Promise<void>> = [];

  try {
    await reserveInventory(orderId);
    rollbacks.push(() => releaseInventory(orderId));

    await chargePayment(orderId);
    rollbacks.push(() => refundPayment(orderId));

    // ... more steps & rollbacks ...
  } catch (e) {
    for (const rollback of rollbacks.reverse()) {
      await rollback();
    }
    // Rethrow so the workflow records the failure after rollbacks
    throw e;
  }
}
```


---
title: Hooks & Webhooks
description: Pause workflows and resume them later with external data, user interactions, or HTTP requests.
type: conceptual
summary: Pause workflows and resume them with external data or HTTP requests.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/api-reference/workflow/create-hook
  - /docs/api-reference/workflow/create-webhook
  - /docs/ai/human-in-the-loop
---

# Hooks & Webhooks



Hooks provide a powerful mechanism for pausing workflow execution and resuming it later with external data. They enable workflows to wait for external events, user interactions (also known as "human in the loop"), or HTTP requests. This guide will teach you the core concepts, starting with the low-level Hook primitive and building up to the higher-level Webhook abstraction.

## Understanding Hooks

At their core, **Hooks** are a low-level primitive that allows you to pause a workflow and resume it later with arbitrary [serializable data](/docs/foundations/serialization). Think of them as suspension points in your workflow where you're waiting for external input.

When you create a hook, it generates a unique token that external systems can use to send data back to your workflow. This makes hooks perfect for scenarios like:

* Waiting for approval from a user or admin
* Receiving data from an external system or service
* Implementing event-driven workflows that react to multiple events over time

### Creating Your First Hook

Let's start with a simple example. Here's a workflow that creates a hook and waits for external data:

```typescript lineNumbers
import { createHook } from "workflow";

export async function approvalWorkflow() {
  "use workflow";

  // Create a hook that expects an approval payload
  const hook = createHook<{ approved: boolean; comment: string }>();

  console.log("Waiting for approval...");
  console.log("Send approval to token:", hook.token);

  // Workflow pauses here until data is sent
  const result = await hook;

  if (result.approved) {
    console.log("Approved with comment:", result.comment);
    // Continue with approved workflow...
  } else {
    console.log("Rejected:", result.comment);
    // Handle rejection...
  }
}
```

The workflow will pause at `await hook` until external code sends data to resume it.

<Callout type="info">
  See the full API reference for [`createHook()`](/docs/api-reference/workflow/create-hook) for all available options.
</Callout>

### Resuming a Hook

To send data to a waiting workflow, use [`resumeHook()`](/docs/api-reference/workflow-api/resume-hook) from an API route, server action, or any other external context:

```typescript lineNumbers
import { resumeHook } from "workflow/api";

// In an API route or external handler
export async function POST(request: Request) {
  const { token, approved, comment } = await request.json();

  try {
    // Resume the workflow with the approval data
    const result = await resumeHook(token, { approved, comment });
    return Response.json({ success: true, runId: result.runId });
  } catch (error) {
    return Response.json({ error: "Invalid token" }, { status: 404 });
  }
}
```

The key points:

* Hooks allow you to pass **any [serializable data](/docs/foundations/serialization)** as the payload
* You need the hook's `token` to resume it
* The workflow will resume execution right where it left off

### Custom Tokens for Deterministic Hooks

By default, hooks generate a random token. However, you often want to use a **custom token** that external systems can reconstruct. This is especially useful for long-running workflows where the same workflow instance should handle multiple events.

For example, imagine a Slack bot where each channel should have its own workflow instance:

```typescript lineNumbers
import { createHook } from "workflow";

export async function slackChannelBot(channelId: string) {
  "use workflow";

  // Use channel ID in the token so Slack webhooks can find this workflow
  const hook = createHook<SlackMessage>({
    token: `slack_messages:${channelId}`
  });

  for await (const message of hook) {
    console.log(`${message.user}: ${message.text}`);

    if (message.text === "/stop") {
      break;
    }

    await processMessage(message);
  }
}

async function processMessage(message: SlackMessage) {
  "use step";
  // Process the Slack message
}
```

Now your Slack webhook handler can deterministically resume the correct workflow:

```typescript lineNumbers
import { resumeHook } from "workflow/api";

export async function POST(request: Request) {
  const slackEvent = await request.json();
  const channelId = slackEvent.channel;

  try {
    // Reconstruct the token using the channel ID
    await resumeHook(`slack_messages:${channelId}`, slackEvent);

    return new Response("OK");
  } catch (error) {
    return new Response("Hook not found", { status: 404 });
  }
}
```

### Receiving Multiple Events

Hooks are *reusable* - they implement `AsyncIterable`, which means you can use `for await...of` to receive multiple events over time:

```typescript lineNumbers
import { createHook } from "workflow";

export async function dataCollectionWorkflow() {
  "use workflow";

  const hook = createHook<{ value: number; done?: boolean }>();

  const values: number[] = [];

  // Keep receiving data until we get a "done" signal
  for await (const payload of hook) {
    values.push(payload.value);

    if (payload.done) {
      break;
    }
  }

  console.log("Collected values:", values);
  return values;
}
```

Each time you call `resumeHook()` with the same token, the loop receives another value.

## Understanding Webhooks

While hooks are powerful, they require you to manually handle HTTP requests and route them to workflows. **Webhooks** solve this by providing a higher-level abstraction built on top of hooks that:

1. Automatically serializes the entire HTTP [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object
2. Provides an automatically addressable `url` property pointing to the generated webhook endpoint
3. Handles sending HTTP [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) objects back to the caller

When using Workflow DevKit, webhooks are automatically wired up at `/.well-known/workflow/v1/webhook/:token` without any additional setup.

<Callout type="info">
  See the full API reference for [`createWebhook()`](/docs/api-reference/workflow/create-webhook) for all available options.
</Callout>

### Creating Your First Webhook

Here's a simple webhook that receives HTTP requests:

```typescript lineNumbers
import { createWebhook } from "workflow";

export async function webhookWorkflow() {
  "use workflow";

  const webhook = createWebhook();

  // The webhook is automatically available at this URL
  console.log("Send HTTP requests to:", webhook.url);
  // Example: https://your-app.com/.well-known/workflow/v1/webhook/lJHkuMdQ2FxSFTbUMU84k

  // Workflow pauses until an HTTP request is received
  const request = await webhook;

  console.log("Received request:", request.method, request.url);

  // Access the request body
  const data = await request.json();
  console.log("Data:", data);
}
```

The webhook will automatically respond with a `202 Accepted` status by default. External systems can simply make an HTTP request to the `webhook.url` to resume your workflow.

### Sending Custom Responses

Webhooks provide two ways to send custom HTTP responses: **static responses** and **dynamic responses**.

#### Static Responses

Use the `respondWith` option to provide a static response that will be sent automatically for every request:

```typescript lineNumbers
import { createWebhook } from "workflow";

export async function webhookWithStaticResponse() {
  "use workflow";

  const webhook = createWebhook({
    respondWith: Response.json({
      success: true, message: "Webhook received"
    }),
  });

  const request = await webhook;

  // The response was already sent automatically
  // Continue processing the request asynchronously
  const data = await request.json();
  await processData(data);
}

async function processData(data: any) {
  "use step";
  // Long-running processing here
}
```

#### Dynamic Responses (Manual Mode)

For dynamic responses based on the request content, set `respondWith: "manual"` and call the `respondWith()` method on the request:

```typescript lineNumbers
import { createWebhook, type RequestWithResponse } from "workflow";

async function sendCustomResponse(request: RequestWithResponse, message: string) {
  "use step";

  // Call respondWith() to send the response
  await request.respondWith(
    new Response(
      JSON.stringify({ message }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  );
}

export async function webhookWithDynamicResponse() {
  "use workflow";

  // Set respondWith to "manual" to handle responses yourself
  const webhook = createWebhook({ respondWith: "manual" });

  const request = await webhook;
  const data = await request.json();

  // Decide what response to send based on the data
  if (data.type === "urgent") {
    await sendCustomResponse(request, "Processing urgently");
  } else {
    await sendCustomResponse(request, "Processing normally");
  }

  // Continue workflow...
}
```

<Callout type="warning">
  When using `respondWith: "manual"`, the `respondWith()` method **must** be called from within a step function due to serialization requirements. This requirement may be removed in the future.
</Callout>

### Handling Multiple Webhook Requests

Like hooks, webhooks support iteration:

```typescript lineNumbers
import { createWebhook, type RequestWithResponse } from "workflow";

async function respondToSlack(request: RequestWithResponse, text: string) {
  "use step";

  await request.respondWith(
    new Response(
      JSON.stringify({ response_type: "in_channel", text }),
      { headers: { "Content-Type": "application/json" } }
    )
  );
}

export async function slackCommandWorkflow(channelId: string) {
  "use workflow";

  const webhook = createWebhook({
    token: `slack_command:${channelId}`,
    respondWith: "manual"
  });

  console.log("Configure Slack command webhook:", webhook.url);

  for await (const request of webhook) {
    const formData = await request.formData();
    const command = formData.get("command");
    const text = formData.get("text");

    if (command === "/status") {
      await respondToSlack(request, "Checking status...");
      const status = await checkSystemStatus();
      await postToSlack(channelId, `Status: ${status}`);
    }

    if (text === "stop") {
      await respondToSlack(request, "Stopping workflow...");
      break;
    }
  }
}

async function checkSystemStatus() {
  "use step";
  return "All systems operational";
}

async function postToSlack(channelId: string, message: string) {
  "use step";
  // Post message to Slack
}
```

## Hooks vs. Webhooks: When to Use Each

| Feature               | Hooks                                                          | Webhooks                                                                                    |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Data Format**       | Arbitrary serializable data                                    | HTTP `Request` objects                                                                      |
| **URL**               | No automatic URL                                               | Automatic `webhook.url` property                                                            |
| **Response Handling** | N/A                                                            | Can send HTTP `Response` (static or dynamic)                                                |
| **Use Case**          | Custom integrations, type-safe payloads                        | HTTP webhooks, standard REST APIs                                                           |
| **Resuming**          | [`resumeHook()`](/docs/api-reference/workflow-api/resume-hook) | Automatic via HTTP, or [`resumeWebhook()`](/docs/api-reference/workflow-api/resume-webhook) |

**Use Hooks when:**

* You need full control over the payload structure
* You're integrating with custom event sources
* You want strong TypeScript typing with [`defineHook()`](/docs/api-reference/workflow/define-hook)

**Use Webhooks when:**

* You're receiving HTTP requests from external services
* You need to send HTTP responses back to the caller
* You want automatic URL routing without writing API handlers

## Advanced Patterns

### Type-Safe Hooks with `defineHook()`

The [`defineHook()`](/docs/api-reference/workflow/define-hook) helper provides type safety and runtime validation between creating and resuming hooks using [Standard Schema v1](https://standardschema.dev). Use any compliant validator like Zod or Valibot:

```typescript lineNumbers
import { defineHook } from "workflow";
import { z } from "zod";

// Define the hook with schema for type safety and runtime validation
const approvalHook = defineHook({ // [!code highlight]
  schema: z.object({ // [!code highlight]
    requestId: z.string(), // [!code highlight]
    approved: z.boolean(), // [!code highlight]
    approvedBy: z.string(), // [!code highlight]
    comment: z.string().transform((value) => value.trim()), // [!code highlight]
  }), // [!code highlight]
}); // [!code highlight]

// In your workflow
export async function documentApprovalWorkflow(documentId: string) {
  "use workflow";

  const hook = approvalHook.create({
    token: `approval:${documentId}`
  });

  // Payload is type-safe and validated
  const approval = await hook;

  console.log(`Document ${approval.requestId} ${approval.approved ? "approved" : "rejected"}`);
  console.log(`By: ${approval.approvedBy}, Comment: ${approval.comment}`);
}

// In your API route - both type-safe and runtime-validated!
export async function POST(request: Request) {
  const { documentId, ...approvalData } = await request.json();

  try {
    // The schema validates the payload before resuming the workflow
    await approvalHook.resume(`approval:${documentId}`, approvalData);
    return new Response("OK");
  } catch (error) {
    return Response.json({ error: "Invalid token or validation failed" }, { status: 400 });
  }
}
```

This pattern is especially valuable in larger applications where the workflow and API code are in separate files, providing both compile-time type safety and runtime validation.

## Best Practices

### Token Design

When using custom tokens:

* **Make them deterministic**: Base them on data the external system can reconstruct (like channel IDs, user IDs, etc.)
* **Use namespacing**: Prefix tokens to avoid conflicts (e.g., `slack:${channelId}`, `github:${repoId}`)
* **Include routing information**: Ensure the token contains enough information to identify the correct workflow instance

### Response Handling in Webhooks

* Use **static responses** (`respondWith: Response`) for simple acknowledgments
* Use **manual mode** (`respondWith: "manual"`) when responses depend on request processing
* Remember that `respondWith()` must be called from within a step function

### Iterating Over Events

Both hooks and webhooks support iteration, making them perfect for long-running event loops:

{/* @skip-typecheck: incomplete code sample */}

```typescript
const hook = createHook<Event>();

for await (const event of hook) {
  await processEvent(event);

  if (shouldStop(event)) {
    break;
  }
}
```

This pattern allows a single workflow instance to handle multiple events over time, maintaining state between events.

## Related Documentation

* [Serialization](/docs/foundations/serialization) - Understanding what data can be passed through hooks
* [`createHook()` API Reference](/docs/api-reference/workflow/create-hook)
* [`createWebhook()` API Reference](/docs/api-reference/workflow/create-webhook)
* [`defineHook()` API Reference](/docs/api-reference/workflow/define-hook)
* [`resumeHook()` API Reference](/docs/api-reference/workflow-api/resume-hook)
* [`resumeWebhook()` API Reference](/docs/api-reference/workflow-api/resume-webhook)


---
title: Idempotency
description: Ensure operations can be safely retried without producing duplicate side effects.
type: conceptual
summary: Prevent duplicate side effects when retrying operations in steps.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/foundations/errors-and-retries
---

# Idempotency



Idempotency is a property of an operation that ensures it can be safely retried without producing duplicate side effects.

In distributed systems (calling external APIs), it is not always possible to ensure an operation has only been performed once just by seeing if it succeeds.
Consider a payment API that charges the user $10, but due to network failures, the confirmation response is lost. When the step retries (because the previous attempt was considered a failure), it will charge the user again.

To prevent this, many external APIs support idempotency keys. An idempotency key is a unique identifier for an operation that can be used to deduplicate requests.

## The core pattern: use the step ID as your idempotency key

Every step invocation has a stable `stepId` that stays the same across retries.
Use it as the idempotency key when calling third-party APIs.

```typescript lineNumbers
import { getStepMetadata } from "workflow";

async function chargeUser(userId: string, amount: number) {
  "use step";

  const { stepId } = getStepMetadata();

  // Example: Stripe-style idempotency key
  // This guarantees only one charge is created even if the step retries
  await stripe.charges.create(
    {
      amount,
      currency: "usd",
      customer: userId,
    },
    {
      idempotencyKey: stepId, // [!code highlight]
    }
  );
}
```

Why this works:

* **Stable across retries**: `stepId` does not change between attempts.
* **Globally unique per step**: Fulfills the uniqueness requirement for an idempotency key.

## Best practices

* **Always provide idempotency keys to external side effects that are not idempotent** inside steps (payments, emails, SMS, queues).
* **Prefer `stepId` as your key**; it is stable across retries and unique per step.
* **Keep keys deterministic**; avoid including timestamps or attempt counters.
* **Handle 409/conflict responses** gracefully; treat them as success if the prior attempt completed.

## Related docs

* Learn about retries in [Errors & Retrying](/docs/foundations/errors-and-retries)
* API reference: [`getStepMetadata`](/docs/api-reference/workflow/get-step-metadata)


---
title: Foundations
description: Learn the core concepts of workflow programming to build durable, long-running applications.
type: overview
summary: Explore the core concepts you need to use workflows effectively.
related:
  - /docs/foundations/workflows-and-steps
  - /docs/getting-started
---

# Foundations



Workflow programming can be a slight shift from how you traditionally write real-world applications. Learning the foundations now will go a long way toward helping you use workflows effectively.

<Cards>
  <Card href="/docs/foundations/workflows-and-steps" title="Workflows and Steps">
    Learn about the building blocks of durability
  </Card>

  <Card href="/docs/foundations/starting-workflows" title="Starting Workflows">
    Trigger workflows and track their execution using the `start()` function.
  </Card>

  <Card href="/docs/foundations/common-patterns" title="Common Patterns">
    Common patterns useful in workflows.
  </Card>

  <Card href="/docs/foundations/errors-and-retries" title="Errors & Retrying">
    Types of errors and how retrying work in workflows.
  </Card>

  <Card href="/docs/foundations/hooks" title="Webhooks (and hooks)">
    Respond to external events in your workflow using hooks and webhooks.
  </Card>

  <Card href="/docs/foundations/streaming" title="Streaming">
    Stream data in real-time to clients without waiting for the workflow to complete.
  </Card>

  <Card href="/docs/foundations/serialization" title="Serialization">
    Understand which types can be passed between workflow and step functions.
  </Card>

  <Card href="/docs/foundations/idempotency" title="Idempotency">
    Prevent duplicate side effects when retrying operations.
  </Card>
</Cards>


---
title: Serialization
description: Understand how workflow data is serialized and persisted across suspensions and resumptions.
type: conceptual
summary: Learn which types can be passed between workflow and step functions.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/errors/serialization-failed
---

# Serialization



All function arguments and return values passed between workflow and step functions must be serializable. Workflow DevKit uses a custom serialization system built on top of [devalue](https://github.com/sveltejs/devalue). This system supports standard JSON types, as well as a few additional popular Web API types.

<Callout type="info">
  The serialization system ensures that all data persists correctly across workflow suspensions and resumptions, enabling durable execution.
</Callout>

## Supported Serializable Types

The following types can be serialized and passed through workflow functions:

**Standard JSON Types:**

* `string`
* `number`
* `boolean`
* `null`
* Arrays of serializable values
* Objects with string keys and serializable values

**Extended Types:**

* `undefined`
* `bigint`
* `ArrayBuffer`
* `BigInt64Array`, `BigUint64Array`
* `Date`
* `Float32Array`, `Float64Array`
* `Int8Array`, `Int16Array`, `Int32Array`
* `Map<Serializable, Serializable>`
* `RegExp`
* `Set<Serializable>`
* `URL`
* `URLSearchParams`
* `Uint8Array`, `Uint8ClampedArray`, `Uint16Array`, `Uint32Array`

**Notable:**

<Callout type="info">
  These types have special handling and are explained in detail in the sections below.
</Callout>

* `Headers`
* `Request`
* `Response`
* `ReadableStream<Serializable>`
* `WritableStream<Serializable>`

## Streaming

`ReadableStream` and `WritableStream` are supported as serializable types with special handling. These streams can be passed between workflow and step functions while maintaining their streaming capabilities.

For complete information about using streams in workflows, including patterns for AI streaming, file processing, and progress updates, see the [Streaming Guide](/docs/foundations/streaming).

## Request & Response

The Web API [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) and [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) APIs are supported by the serialization system,
and can be passed around between workflow and step functions similarly to other data types.

As a convenience, these two APIs are treated slightly differently when used
within a workflow function: calling the `text()` / `json()` / `arrayBuffer()` instance
methods is automatically treated as a step function invocation. This allows you to consume
the body directly in the workflow context while maintaining proper serialization and caching.

For example, consider how receiving a webhook request provides the entire `Request`
instance into the workflow context. You may consume the body of that request directly
in the workflow, which will be cached as a step result for future resumptions of the workflow:

```typescript title="workflows/webhook.ts" lineNumbers
import { createWebhook } from "workflow";

export async function handleWebhookWorkflow() {
  "use workflow";

  const webhook = createWebhook();
  const request = await webhook;

  // The body of the request will only be consumed once // [!code highlight]
  const body = await request.json(); // [!code highlight]

  // …
}
```

### Using `fetch` in Workflows

Because `Request` and `Response` are serializable, Workflow DevKit provides a `fetch` function that can be used directly in workflow functions:

```typescript title="workflows/api-call.ts" lineNumbers
import { fetch } from "workflow"; // [!code highlight]

export async function apiWorkflow() {
  "use workflow";

  // fetch can be called directly in workflows // [!code highlight]
  const response = await fetch("https://api.example.com/data"); // [!code highlight]
  const data = await response.json();

  return data;
}
```

The implementation is straightforward - `fetch` from workflow is a step function that wraps the standard `fetch`:

```typescript title="Implementation" lineNumbers
export async function fetch(...args: Parameters<typeof globalThis.fetch>) {
  "use step";
  return globalThis.fetch(...args);
}
```

This allows you to make HTTP requests directly in workflow functions while maintaining deterministic replay behavior through automatic caching.

## Pass-by-Value Semantics

**Parameters are passed by value, not by reference.** Steps receive deserialized copies of data. Mutations inside a step won't affect the original in the workflow.

**Incorrect:**

```typescript title="workflows/incorrect-mutation.ts" lineNumbers
export async function updateUserWorkflow(userId: string) {
  "use workflow";

  let user = { id: userId, name: "John", email: "john@example.com" };
  await updateUserStep(user);

  // user.email is still "john@example.com" // [!code highlight]
  console.log(user.email); // [!code highlight]
}

async function updateUserStep(user: { id: string; name: string; email: string }) {
  "use step";
  user.email = "newemail@example.com"; // Changes are lost // [!code highlight]
}
```

**Correct - return the modified data:**

```typescript title="workflows/correct-mutation.ts" lineNumbers
export async function updateUserWorkflow(userId: string) {
  "use workflow";

  let user = { id: userId, name: "John", email: "john@example.com" };
  user = await updateUserStep(user); // Reassign the return value // [!code highlight]

  console.log(user.email); // "newemail@example.com"
}

async function updateUserStep(user: { id: string; name: string; email: string }) {
  "use step";
  user.email = "newemail@example.com";
  return user; // [!code highlight]
}
```


---
title: Starting Workflows
description: Trigger workflow execution with the start() function and track progress with Run objects.
type: guide
summary: Trigger workflows and track their execution using the start() function.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/api-reference/workflow-api/start
---

# Starting Workflows



Once you've defined your workflow functions, you need to trigger them to begin execution. This is done using the `start()` function from `workflow/api`, which enqueues a new workflow run and returns a `Run` object that you can use to track its progress.

## The `start()` Function

The [`start()`](/docs/api-reference/workflow-api/start) function is used to programmatically trigger workflow executions from runtime contexts like API routes, Server Actions, or any server-side code.

```typescript lineNumbers
import { start } from "workflow/api";
import { handleUserSignup } from "./workflows/user-signup";

export async function POST(request: Request) {
  const { email } = await request.json();

  // Start the workflow
  const run = await start(handleUserSignup, [email]); // [!code highlight]

  return Response.json({
    message: "Workflow started",
    runId: run.runId
  });
}
```

**Key Points:**

* `start()` returns immediately after enqueuing the workflow - it doesn't wait for completion
* The first argument is your workflow function
* The second argument is an array of arguments to pass to the workflow (optional if the workflow takes no arguments)
* All arguments must be [serializable](/docs/foundations/serialization)

**Learn more**: [`start()` API Reference](/docs/api-reference/workflow-api/start)

## The `Run` Object

When you call `start()`, it returns a [`Run`](/docs/api-reference/workflow-api/start#returns) object that provides access to the workflow's status and results.

```typescript lineNumbers
import { start } from "workflow/api";
import { processOrder } from "./workflows/process-order";

const run = await start(processOrder, [/* orderId */]);

// The run object has properties you can await
console.log("Run ID:", run.runId);

// Check the workflow status
const status = await run.status; // "running" | "completed" | "failed"

// Get the workflow's return value (blocks until completion)
const result = await run.returnValue;
```

**Key Properties:**

* `runId` - Unique identifier for this workflow run
* `status` - Current status of the workflow (async)
* `returnValue` - The value returned by the workflow function (async, blocks until completion)
* `readable` - ReadableStream for streaming updates from the workflow

<Callout type="info">
  Most `Run` properties are async getters that return promises. You need to `await` them to get their values. For a complete list of properties and methods, see the API reference below.
</Callout>

**Learn more**: [`Run` API Reference](/docs/api-reference/workflow-api/start#returns)

## Common Patterns

### Fire and Forget

The most common pattern is to start a workflow and immediately return, letting it execute in the background:

```typescript lineNumbers
import { start } from "workflow/api";
import { sendNotifications } from "./workflows/notifications";

export async function POST(request: Request) {
  // Start workflow and don't wait for it
  const run = await start(sendNotifications, [userId]);

  // Return immediately
  return Response.json({
    message: "Notifications queued",
    runId: run.runId
  });
}
```

### Wait for Completion

If you need to wait for the workflow to complete before responding:

```typescript lineNumbers
import { start } from "workflow/api";
import { generateReport } from "./workflows/reports";

export async function POST(request: Request) {
  const run = await start(generateReport, [reportId]);

  // Wait for the workflow to complete
  const report = await run.returnValue; // [!code highlight]

  return Response.json({ report });
}
```

<Callout type="warn">
  Be cautious when waiting for `returnValue` - if your workflow takes a long time, your API route may timeout.
</Callout>

### Stream Updates to Client

Stream real-time updates from your workflow as it executes, without waiting for completion:

```typescript lineNumbers
import { start } from "workflow/api";
import { generateAIContent } from "./workflows/ai-generation";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  // Start the workflow
  const run = await start(generateAIContent, [prompt]);

  // Get the readable stream (can also use run.readable as shorthand)
  const stream = run.getReadable(); // [!code highlight]

  // Return the stream immediately
  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });
}
```

Your workflow can write to the stream using [`getWritable()`](/docs/api-reference/workflow/get-writable):

```typescript lineNumbers
import { getWritable } from "workflow";

export async function generateAIContent(prompt: string) {
  "use workflow";

  const writable = getWritable(); // [!code highlight]

  await streamContentToClient(writable, prompt);

  return { status: "complete" };
}

async function streamContentToClient(
  writable: WritableStream,
  prompt: string
) {
  "use step";

  const writer = writable.getWriter();

  // Stream updates as they become available
  for (let i = 0; i < 10; i++) {
    const chunk = new TextEncoder().encode(`Update ${i}\n`);
    await writer.write(chunk);
  }

  writer.releaseLock();
}
```

<Callout type="info">
  Streams are particularly useful for AI workflows where you want to show progress to users in real-time, or for long-running processes that produce intermediate results.
</Callout>

**Learn more**: [Streaming in Workflows](/docs/foundations/serialization#streaming)

### Check Status Later

You can retrieve a workflow run later using its `runId` with [`getRun()`](/docs/api-reference/workflow-api/get-run):

```typescript lineNumbers
import { getRun } from "workflow/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  // Retrieve the existing run
  const run = getRun(runId); // [!code highlight]

  // Check its status
  const status = await run.status;

  if (status === "completed") {
    const result = await run.returnValue;
    return Response.json({ result });
  }

  return Response.json({ status });
}
```

## Next Steps

Now that you understand how to start workflows and track their execution:

* Learn about [Common Patterns](/docs/foundations/common-patterns) for organizing complex workflows
* Explore [Errors & Retrying](/docs/foundations/errors-and-retries) to handle failures gracefully
* Check the [`start()` API Reference](/docs/api-reference/workflow-api/start) for complete details


---
title: Streaming
description: Stream data in real-time to clients for progress updates and incremental content delivery.
type: conceptual
summary: Stream real-time data to clients without waiting for workflow completion.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/api-reference/workflow/get-writable
  - /docs/ai/resumable-streams
---

# Streaming



Workflows can stream data in real-time to clients without waiting for the entire workflow to complete. This enables progress updates, AI-generated content, log messages, and other incremental data to be delivered as workflows execute.

## Getting Started with `getWritable()`

Every workflow run has a default writable stream that steps can write to using [`getWritable()`](/docs/api-reference/workflow/get-writable). Data written to this stream becomes immediately available to clients consuming the workflow's output.

```typescript title="workflows/simple-streaming.ts" lineNumbers
import { getWritable } from "workflow";

async function writeProgress(message: string) {
  "use step";

  // Steps can write to the run's default stream
  const writable = getWritable<string>(); // [!code highlight]
  const writer = writable.getWriter();
  await writer.write(message);
  writer.releaseLock();
}

export async function simpleStreamingWorkflow() {
  "use workflow";

  await writeProgress("Starting task...");
  await writeProgress("Processing data...");
  await writeProgress("Task complete!");
}
```

### Consuming the Stream

Use the `Run` object's `readable` property to consume the stream from your API route:

```typescript title="app/api/stream/route.ts" lineNumbers
import { start } from "workflow/api";
import { simpleStreamingWorkflow } from "./workflows/simple";

export async function POST() {
  const run = await start(simpleStreamingWorkflow);

  // Return the readable stream to the client
  return new Response(run.readable, {
    headers: { "Content-Type": "text/plain" }
  });
}
```

When a client makes a request to this endpoint, they'll receive each message as it's written, without waiting for the workflow to complete.

### Resuming Streams from a Specific Point

Use `run.getReadable({ startIndex })` to resume a stream from a specific position. This is useful for reconnecting after timeouts or network interruptions:

```typescript title="app/api/resume-stream/[runId]/route.ts" lineNumbers
import { getRun } from "workflow/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const { searchParams } = new URL(request.url);

  // Client provides the last chunk index they received
  const startIndexParam = searchParams.get("startIndex"); // [!code highlight]
  const startIndex = startIndexParam ? parseInt(startIndexParam, 10) : undefined; // [!code highlight]

  const run = getRun(runId);
  const stream = run.getReadable({ startIndex }); // [!code highlight]

  return new Response(stream, {
    headers: { "Content-Type": "text/plain" }
  });
}
```

This allows clients to reconnect and continue receiving data from where they left off, rather than restarting from the beginning.

## Streams as Data Types

[`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) and [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream) are standard Web Streams API types that Workflow DevKit makes serializable. These are not custom types - they follow the web standard - but Workflow DevKit adds the ability to pass them between functions while maintaining their streaming capabilities.

Unlike regular values that are fully serialized to the [event log](/docs/how-it-works/event-sourcing), streams maintain their streaming capabilities when passed between functions.

**Key properties:**

* Stream references can be passed between workflow and step functions
* Stream data flows directly without being stored in the event log
* Streams preserve their state across workflow suspension points

<Callout type="info">
  **How Streams Persist Across Workflow Suspensions**

  Streams in Workflow DevKit are backed by persistent, resumable storage provided by the "world" implementation. This is what enables streams to maintain their state even when workflows suspend and resume:

  * **Vercel deployments**: Streams are backed by a performant Redis-based stream
  * **Local development**: Stream chunks are stored in the filesystem
</Callout>

### Passing Streams as Arguments

Since streams are serializable data types, you don't need to use the special [`getWritable()`](/docs/api-reference/workflow/get-writable). You can even wire your own streams through workflows, passing them as arguments from outside into steps.

Here's an example of passing a request body stream through a workflow to a step that processes it:

```typescript title="app/api/upload/route.ts" lineNumbers
import { start } from "workflow/api";
import { streamProcessingWorkflow } from "./workflows/streaming";

export async function POST(request: Request) {
  // Streams can be passed as workflow arguments
  const run = await start(streamProcessingWorkflow, [request.body]); // [!code highlight]
  await run.result();

  return Response.json({ status: "complete" });
}
```

```typescript title="workflows/streaming.ts" lineNumbers
export async function streamProcessingWorkflow(
  inputStream: ReadableStream<Uint8Array> // [!code highlight]
) {
  "use workflow";

  // Workflow passes stream to step for processing
  const result = await processInputStream(inputStream); // [!code highlight]
  return { length: result.length };
}

async function processInputStream(input: ReadableStream<Uint8Array>) {
  "use step";

  // Step reads from the stream
  const chunks: Uint8Array[] = [];

  for await (const chunk of input) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}
```

## Important Limitation

<Callout type="info">
  **Streams Cannot Be Used Directly in Workflow Context**

  You cannot read from or write to streams directly within a workflow function. All stream operations must happen in step functions.
</Callout>

Workflow functions must be deterministic to support replay. Since streams bypass the [event log](/docs/how-it-works/event-sourcing) for performance, reading stream data in a workflow would break determinism - each replay could see different data. By requiring all stream operations to happen in steps, the framework ensures consistent behavior.

For more on determinism and replay, see [Workflows and Steps](/docs/foundations/workflows-and-steps).

```typescript title="workflows/bad-example.ts" lineNumbers
export async function badWorkflow() {
  "use workflow";

  const writable = getWritable<string>();

  // Cannot read/write streams in workflow context
  const writer = writable.getWriter(); // [!code highlight]
  await writer.write("data"); // [!code highlight]
}
```

```typescript title="workflows/good-example.ts" lineNumbers
export async function goodWorkflow() {
  "use workflow";

  // Delegate stream operations to steps
  await writeToStream("data");
}

async function writeToStream(data: string) {
  "use step";

  // Stream operations must happen in steps
  const writable = getWritable<string>();
  const writer = writable.getWriter();
  await writer.write(data);
  writer.releaseLock();
}
```

## Namespaced Streams

Use `getWritable({ namespace: 'name' })` to create multiple independent streams for different types of data. This is useful when you want to separate logs, metrics, data outputs, or other distinct channels.

```typescript title="workflows/multi-stream.ts" lineNumbers
import { getWritable } from "workflow";

type LogEntry = { level: string; message: string };
type MetricEntry = { cpu: number; memory: number };

async function writeLogs() {
  "use step";

  const logs = getWritable<LogEntry>({ namespace: "logs" }); // [!code highlight]
  const writer = logs.getWriter();

  await writer.write({ level: "info", message: "Task started" });
  await writer.write({ level: "info", message: "Processing..." });

  writer.releaseLock();
}

async function writeMetrics() {
  "use step";

  const metrics = getWritable<MetricEntry>({ namespace: "metrics" }); // [!code highlight]
  const writer = metrics.getWriter();

  await writer.write({ cpu: 45, memory: 512 });
  await writer.write({ cpu: 52, memory: 520 });

  writer.releaseLock();
}

async function closeStreams() {
  "use step";

  await getWritable({ namespace: "logs" }).close();
  await getWritable({ namespace: "metrics" }).close();
}

export async function multiStreamWorkflow() {
  "use workflow";

  await writeLogs();
  await writeMetrics();
  await closeStreams();
}
```

### Consuming Namespaced Streams

Use `run.getReadable({ namespace: 'name' })` to access specific streams:

```typescript title="app/api/multi-stream/route.ts" lineNumbers
import { start } from "workflow/api";
import { multiStreamWorkflow } from "./workflows/multi";

type LogEntry = { level: string; message: string };
type MetricEntry = { cpu: number; memory: number };

export async function POST(request: Request) {
  const run = await start(multiStreamWorkflow);

  // Access specific named streams // [!code highlight]
  const logs = run.getReadable<LogEntry>({ namespace: "logs" }); // [!code highlight]
  const metrics = run.getReadable<MetricEntry>({ namespace: "metrics" }); // [!code highlight]

  // Return the logs stream to the client
  return new Response(logs, {
    headers: { "Content-Type": "application/json" }
  });
}
```

## Common Patterns

### Progress Updates for Long-Running Tasks

Send incremental progress updates to keep users informed during lengthy workflows:

```typescript title="workflows/batch-processing.ts" lineNumbers
import { getWritable, sleep } from "workflow";

type ProgressUpdate = {
  item: string;
  progress: number;
  status: string;
};

async function processItem(
  item: string,
  current: number,
  total: number
) {
  "use step";

  const writable = getWritable<ProgressUpdate>(); // [!code highlight]
  const writer = writable.getWriter();

  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send progress update // [!code highlight]
  await writer.write({ // [!code highlight]
    item, // [!code highlight]
    progress: Math.round((current / total) * 100), // [!code highlight]
    status: "processing" // [!code highlight]
  }); // [!code highlight]

  writer.releaseLock();
}

async function finalizeProgress() {
  "use step";

  await getWritable().close();
}

export async function batchProcessingWorkflow(items: string[]) {
  "use workflow";

  for (let i = 0; i < items.length; i++) {
    await processItem(items[i], i + 1, items.length);
    await sleep("1s");
  }

  await finalizeProgress();
}
```

### Streaming AI Responses with `DurableAgent`

Stream AI-generated content using [`DurableAgent`](/docs/api-reference/workflow-ai/durable-agent) from `@workflow/ai`. Tools can also emit progress updates to the same stream using [data chunks](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data#streaming-custom-data) with the [`UIMessageChunk`](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) type from the AI SDK:

```typescript title="workflows/ai-assistant.ts" lineNumbers
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { z } from "zod";
import type { UIMessageChunk } from "ai";

async function searchFlights({ query }: { query: string }) {
  "use step";

  // Tools can emit progress updates to the stream
  const writable = getWritable<UIMessageChunk>(); // [!code highlight]
  const writer = writable.getWriter(); // [!code highlight]
  await writer.write({ // [!code highlight]
    type: "data-progress", // [!code highlight]
    data: { message: `Searching flights for ${query}...` }, // [!code highlight]
    transient: true, // [!code highlight]
  }); // [!code highlight]
  writer.releaseLock(); // [!code highlight]

  // ... search logic ...
  return { flights: [/* results */] };
}

export async function aiAssistantWorkflow(userMessage: string) {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    system: "You are a helpful flight assistant.",
    tools: {
      searchFlights: {
        description: "Search for flights",
        inputSchema: z.object({ query: z.string() }),
        execute: searchFlights,
      },
    },
  });

  // LLM response will be streamed to the run's writable
  await agent.stream({
    messages: [{ role: "user", content: userMessage }],
    writable: getWritable<UIMessageChunk>(), // [!code highlight]
  });
}
```

```typescript title="app/api/ai-assistant/route.ts" lineNumbers
import { createUIMessageStreamResponse } from "ai";
import { start } from "workflow/api";
import { aiAssistantWorkflow } from "./workflows/ai";

export async function POST(request: Request) {
  const { message } = await request.json();

  const run = await start(aiAssistantWorkflow, [message]);

  return createUIMessageStreamResponse({
    stream: run.readable,
  });
}
```

<Callout type="info">
  For a complete implementation, see the [flight booking example](https://github.com/vercel/workflow-examples/tree/main/flight-booking-app) which demonstrates streaming AI responses with tool progress updates.
</Callout>

### Streaming Between Steps

One step produces a stream and another step consumes it:

```typescript title="workflows/stream-pipeline.ts" lineNumbers
export async function streamPipelineWorkflow() {
  "use workflow";

  // Streams can be passed between steps
  const stream = await generateData(); // [!code highlight]
  const results = await consumeData(stream); // [!code highlight]

  return { count: results.length };
}

async function generateData(): Promise<ReadableStream<number>> {
  "use step";

  // Producer step creates a stream
  return new ReadableStream<number>({
    start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(i);
      }
      controller.close();
    }
  });
}

async function consumeData(readable: ReadableStream<number>) {
  "use step";

  // Consumer step reads from the stream
  const values: number[] = [];
  for await (const value of readable) {
    values.push(value);
  }
  return values;
}
```

### Processing Large Files Without Memory Overhead

Process large files by streaming chunks through transformation steps:

```typescript title="workflows/file-processing.ts" lineNumbers
export async function fileProcessingWorkflow(fileUrl: string) {
  "use workflow";

  // Chain streams through multiple processing steps
  const rawStream = await downloadFile(fileUrl); // [!code highlight]
  const processedStream = await transformData(rawStream); // [!code highlight]
  await uploadResult(processedStream); // [!code highlight]
}

async function downloadFile(url: string): Promise<ReadableStream<Uint8Array>> {
  "use step";
  const response = await fetch(url);
  return response.body!;
}

async function transformData(input: ReadableStream<Uint8Array>): Promise<ReadableStream<Uint8Array>> {
  "use step";

  // Transform stream chunks without loading entire file into memory
  return input.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      // Process each chunk individually
      controller.enqueue(chunk);
    }
  }));
}

async function uploadResult(stream: ReadableStream<Uint8Array>) {
  "use step";
  await fetch("https://storage.example.com/upload", {
    method: "POST",
    body: stream,
  });
}
```

## Best Practices

**Release locks properly:**

```typescript lineNumbers
const writer = writable.getWriter();
try {
  await writer.write(data);
} finally {
  writer.releaseLock(); // Always release
}
```

<Callout type="info">
  Stream locks acquired in a step only apply within that step, not across other steps. This enables multiple writers to write to the same stream concurrently.
</Callout>

<Callout type="warn">
  If a lock is not released, the step function's HTTP request cannot terminate. Even though the step returns and the workflow continues, the underlying request will remain active until it times out—wasting compute resources unnecessarily.
</Callout>

**Close streams when done:**

```typescript lineNumbers
async function finalizeStream() {
  "use step";

  await getWritable().close(); // Signal completion
}
```

Streams are automatically closed when the workflow run completes, but explicitly closing them signals completion to consumers earlier.

**Use typed streams for type safety:**

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
const writable = getWritable<MyDataType>();
const writer = writable.getWriter();
await writer.write({ /* typed data */ });
```

## Stream Failures

When a step returns a stream, the step is considered successful once it returns, even if the stream later encounters an error. The workflow won't automatically retry the step. The consumer of the stream must handle errors gracefully. For more on retry behavior, see [Errors and Retries](/docs/foundations/errors-and-retries).

```typescript title="workflows/stream-error-handling.ts" lineNumbers
import { FatalError } from "workflow";

async function produceStream(): Promise<ReadableStream<number>> {
  "use step";

  // Step succeeds once it returns the stream
  return new ReadableStream<number>({
    start(controller) {
      controller.enqueue(1);
      controller.enqueue(2);
      // Error occurs after step has completed // [!code highlight]
      controller.error(new Error("Stream failed")); // [!code highlight]
    }
  });
}

async function consumeStream(stream: ReadableStream<number>) {
  "use step";

  try { // [!code highlight]
    for await (const value of stream) {
      console.log(value);
    }
  } catch (error) { // [!code highlight]
    // Retrying won't help since the stream is already errored // [!code highlight]
    throw new FatalError("Stream failed"); // [!code highlight]
  } // [!code highlight]
}

export async function streamErrorWorkflow() {
  "use workflow";

  const stream = await produceStream(); // Step succeeds // [!code highlight]
  await consumeStream(stream); // Consumer handles errors // [!code highlight]
}
```

<Callout type="info">
  Stream errors don't trigger automatic retries for the producer step. Design your stream consumers to handle errors appropriately. Since the stream is already in an errored state, retrying the consumer won't help - use `FatalError` to fail the workflow immediately.
</Callout>

## Related Documentation

* [`getWritable()` API Reference](/docs/api-reference/workflow/get-writable) - Get the workflow's writable stream
* [`sleep()` API Reference](/docs/api-reference/workflow/sleep) - Pause workflow execution for a duration
* [`start()` API Reference](/docs/api-reference/workflow-api/start) - Start workflows and access the `Run` object
* [`getRun()` API Reference](/docs/api-reference/workflow-api/get-run) - Retrieve runs and their streams later
* [DurableAgent](/docs/api-reference/workflow-ai/durable-agent) - AI agents with built-in streaming support
* [Errors and Retries](/docs/foundations/errors-and-retries) - Understanding error handling and retry behavior
* [Serialization](/docs/foundations/serialization) - Understanding what data types can be passed in workflows
* [Workflows and Steps](/docs/foundations/workflows-and-steps) - Core concepts of workflow execution


---
title: Workflows and Steps
description: Build long-running, stateful application logic that persists progress and resumes after failures.
type: conceptual
summary: Understand the two function types that make up a workflow.
prerequisites:
  - /docs/foundations
related:
  - /docs/how-it-works/understanding-directives
  - /docs/foundations/serialization
---

# Workflows and Steps



import { File, Folder, Files } from "fumadocs-ui/components/files";

Workflows (a.k.a. *durable functions*) are a programming model for building long-running, stateful application logic that can maintain its execution state across restarts, failures, or user events. Unlike traditional serverless functions that lose all state when they terminate, workflows persist their progress and can resume exactly where they left off.

Moreover, workflows let you easily model complex multi-step processes in simple, elegant code. To do this, we introduce two fundamental entities:

1. **Workflow Functions**: Functions that orchestrate/organize steps
2. **Step Functions**: Functions that carry out the actual work

## Workflow Functions

*Directive: `"use workflow"`*

Workflow functions define the entrypoint of a workflow and organize how step functions are called. This type of function does not have access to the Node.js runtime, and usable `npm` packages are limited.

Although this may seem limiting initially, this feature is important in order to suspend and accurately resume execution of workflows.

It helps to think of the workflow function less like a full JavaScript runtime and more like "stitching together" various steps using conditionals, loops, try/catch handlers, `Promise.all`, and other language primitives.

```typescript lineNumbers
export async function processOrderWorkflow(orderId: string) {
  "use workflow"; // [!code highlight]

  // Orchestrate multiple steps
  const order = await fetchOrder(orderId);
  const payment = await chargePayment(order);

  return { orderId, status: "completed" };
}
```

**Key Characteristics:**

* Runs in a sandboxed environment without full Node.js access
* All step results are persisted to the [event log](/docs/how-it-works/event-sourcing)
* Must be **deterministic** to allow resuming after failures

Determinism in the workflow is required to resume the workflow from a suspension. Essentially, the workflow code gets re-run multiple times during its lifecycle, each time using the [event log](/docs/how-it-works/event-sourcing) to resume the workflow to the correct spot.

The sandboxed environment that workflows run in already ensures determinism. For instance, `Math.random` and `Date` constructors are fixed in workflow runs, so you are safe to use them, and the framework ensures that the values don't change across replays.

## Step Functions

*Directive: `"use step"`*

Step functions perform the actual work in a workflow and have full runtime access.

```typescript lineNumbers
async function chargePayment(order: Order) {
  "use step"; // [!code highlight]

  // Full Node.js access - use any npm package
  const stripe = new Stripe(process.env.STRIPE_KEY);

  const charge = await stripe.charges.create({
    amount: order.total,
    currency: "usd",
    source: order.paymentToken
  });

  return { chargeId: charge.id };
}
```

**Key Characteristics:**

* Full Node.js runtime and npm package access
* Automatic retry on errors
* Results persisted for replay

By default, steps have a maximum of 3 retry attempts before they fail and propagate the error to the workflow. Learn more about errors and retrying in the [Errors & Retrying](/docs/foundations/errors-and-retries) page.

<Callout type="warning">
  **Important:** Due to serialization, parameters are passed by **value, not by reference**. If you pass an object or array to a step and mutate it, those changes will **not** be visible in the workflow context. Always return modified data from your step functions instead. See [Pass-by-Value Semantics](/docs/foundations/serialization#pass-by-value-semantics) for details and examples.
</Callout>

<Callout type="info">
  Step functions are primarily meant to be used inside a workflow.
</Callout>

Calling a step from outside a workflow or from another step will essentially run the step in the same process like a normal function (in other words, the `use step` directive is a no-op). This means you can reuse step functions in other parts of your codebase without needing to duplicate business logic.

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
async function updateUser(userId: string) {
  "use step";
  await db.insert(...);
}

// Used inside a workflow
export async function userOnboardingWorkflow(userId: string) {
  "use workflow";
  await updateUser(userId);
  // ... more steps
}

// Used directly outside a workflow
export async function POST() {
  await updateUser("123");
  // ... more logic
}
```

<Callout type="info">
  Keep in mind that calling a step function outside of a workflow function will not have retry semantics, nor will it be observable. Additionally, certain workflow-specific functions like [`getStepMetadata()`](/docs/api-reference/workflow/get-step-metadata) will throw an error when used inside a step that's called outside a workflow.
</Callout>

### Suspension and Resumption

Workflow functions have the ability to automatically suspend while they wait on asynchronous work. While suspended, the workflow's state is stored via the [event log](/docs/how-it-works/event-sourcing) and no compute resources are used until the workflow resumes execution.

There are multiple ways a workflow can suspend:

* Waiting on a step function: the workflow yields while the step runs in the step runtime.
* Using `sleep()` to pause for some fixed duration.
* Awaiting on a promise returned by [`createWebhook()`](/docs/api-reference/workflow/create-webhook), which resumes the workflow when an external system passes data into the workflow.

```typescript lineNumbers
import { sleep, createWebhook } from "workflow";

export async function documentReviewProcess(userId: string) {
  "use workflow";

  await sleep("1 month"); // Sleep will suspend without consuming any resources [!code highlight]

  // Create a webhook for external workflow resumption
  const webhook = createWebhook();

  // Send the webhook url to some external service or in an email, etc.
  await sendHumanApprovalEmail("Click this link to accept the review", webhook.url)

  const data = await webhook; // The workflow suspends till the URL is resumed [!code highlight]

  console.log("Document reviewed!")
}
```

## Writing Workflows

### Basic Structure

The simplest workflow consists of a workflow function and one or more step functions.

```typescript lineNumbers
// Workflow function (orchestrates the steps)
export async function greetingWorkflow(name: string) {
  "use workflow";

  const message = await greet(name);
  return { message };
}

// Step function (does the actual work)
async function greet(name: string) {
  "use step";

  // Access Node.js APIs
  const message = `Hello ${name} at ${new Date().toISOString()}`;
  console.log(message);
  return message;
}
```

### Project structure

While you can organize workflow and step functions however you like, we find that larger projects benefit from some structure:

<Files>
  <Folder name="workflows" defaultOpen disabled>
    <Folder name="userOnboarding" defaultOpen disabled>
      <File name="index.ts" />

      <File name="steps.ts" />
    </Folder>

    <Folder name="aiVideoGeneration" defaultOpen disabled>
      <File name="index.ts" />

      <Folder name="steps" defaultOpen disabled>
        <File name="transcribeUpload.ts" />

        <File name="generateVideo.ts" />

        <File name="notifyUser.ts" />
      </Folder>
    </Folder>

    <Folder name="shared" defaultOpen disabled>
      <File name="validateInput.ts" />

      <File name="logActivity.ts" />
    </Folder>
  </Folder>
</Files>

You can choose to organize your steps into a single `steps.ts` file or separate files within a `steps` folder. The `shared` folder is a good place to put common steps that are used by multiple workflows.

<Callout type="info">
  Splitting up steps and workflows will also help avoid most bundler related bugs with the Workflow DevKit.
</Callout>


---
title: Astro
description: Set up your first durable workflow in an Astro application.
type: guide
summary: Set up Workflow DevKit in an Astro app.
prerequisites:
  - /docs/getting-started
related:
  - /docs/foundations/workflows-and-steps
---

# Astro





This guide will walk through setting up your first workflow in an Astro app. Along the way, you'll learn more about the concepts that are fundamental to using the development kit in your own projects.

***

<Steps>
  <Step>
    ## Create Your Astro Project

    Start by creating a new Astro project. This command will create a new directory named `my-workflow-app` and setup a minimal Astro project inside it.

    ```bash
    npm create astro@latest my-workflow-app -- --template minimal --install --yes
    ```

    Enter the newly made directory:

    ```bash
    cd my-workflow-app
    ```

    ### Install `workflow`

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    ### Configure Astro

    Add `workflow()` to your Astro config. This enables usage of the `"use workflow"` and `"use step"` directives.

    ```typescript title="astro.config.mjs" lineNumbers
    // @ts-check
    import { defineConfig } from "astro/config";
    import { workflow } from "workflow/astro";

    // https://astro.build/config
    export default defineConfig({
      integrations: [workflow()],
    });
    ```

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="text-sm">
          ### Setup IntelliSense for TypeScript (Optional)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          To enable helpful hints in your IDE, setup the workflow plugin in `tsconfig.json`:

          ```json title="tsconfig.json" lineNumbers
          {
            "compilerOptions": {
              // ... rest of your TypeScript config
              "plugins": [
                {
                  "name": "workflow" // [!code highlight]
                }
              ]
            }
          }
          ```
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Step>

  <Step>
    ## Create Your First Workflow

    Create a new file for our first workflow:

    ```typescript title="src/workflows/user-signup.ts" lineNumbers
    import { sleep } from "workflow";

    export async function handleUserSignup(email: string) {
      "use workflow"; // [!code highlight]

      const user = await createUser(email);
      await sendWelcomeEmail(user);

      await sleep("5s"); // Pause for 5s - doesn't consume any resources
      await sendOnboardingEmail(user);

      return { userId: user.id, status: "onboarded" };
    }

    ```

    We'll fill in those functions next, but let's take a look at this code:

    * We define a **workflow** function with the directive `"use workflow"`. Think of the workflow function as the *orchestrator* of individual **steps**.
    * The Workflow DevKit's `sleep` function allows us to suspend execution of the workflow without using up any resources. A sleep can be a few seconds, hours, days, or even months long.

    ## Create Your Workflow Steps

    Let's now define those missing functions.

    ```typescript title="src/workflows/user-signup.ts" lineNumbers
    import { FatalError } from "workflow"

    // Our workflow function defined earlier

    async function createUser(email: string) {
      "use step"; // [!code highlight]

      console.log(`Creating user with email: ${email}`);

      // Full Node.js access - database calls, APIs, etc.
      return { id: crypto.randomUUID(), email };
    }

    async function sendWelcomeEmail(user: { id: string; email: string; }) {
      "use step"; // [!code highlight]

      console.log(`Sending welcome email to user: ${user.id}`);

      if (Math.random() < 0.3) {
      // By default, steps will be retried for unhandled errors
       throw new Error("Retryable!");
      }
    }

    async function sendOnboardingEmail(user: { id: string; email: string}) {
      "use step"; // [!code highlight]

      if (!user.email.includes("@")) {
        // To skip retrying, throw a FatalError instead
        throw new FatalError("Invalid Email");
      }

      console.log(`Sending onboarding email to user: ${user.id}`);
    }
    ```

    Taking a look at this code:

    * Business logic lives inside **steps**. When a step is invoked inside a **workflow**, it gets enqueued to run on a separate request while the workflow is suspended, just like `sleep`.
    * If a step throws an error, like in `sendWelcomeEmail`, the step will automatically be retried until it succeeds (or hits the step's max retry count).
    * Steps can throw a `FatalError` if an error is intentional and should not be retried.

    <Callout>
      We'll dive deeper into workflows, steps, and other ways to suspend or handle events in [Foundations](/docs/foundations).
    </Callout>
  </Step>

  <Step>
    ## Create Your Route Handler

    To invoke your new workflow, we'll have to add your workflow to a `POST` API route handler, `src/pages/api/signup.ts` with the following code:

    ```typescript title="src/pages/api/signup.ts"
    import type { APIRoute } from "astro";
    import { start } from "workflow/api";
    import { handleUserSignup } from "../../workflows/user-signup";

    export const POST: APIRoute = async ({ request }: { request: Request }) => {
      const { email } = await request.json();

      // Executes asynchronously and doesn't block your app
      await start(handleUserSignup, [email]);
      return Response.json({
        message: "User signup workflow started",
      });
    };

    export const prerender = false; // Don't prerender this page since it's an API route
    ```

    This route handler creates a `POST` request endpoint at `/api/signup` that will trigger your workflow.

    <Callout>
      Workflows can be triggered from API routes or any server-side code.
    </Callout>
  </Step>
</Steps>

## Run in Development

To start your development server, run the following command in your terminal in the Vite root directory:

```bash
npm run dev
```

Once your development server is running, you can trigger your workflow by running this command in the terminal:

```bash
curl -X POST --json '{"email":"hello@example.com"}' http://localhost:4321/api/signup
```

Check the Astro development server logs to see your workflow execute as well as the steps that are being processed.

Additionally, you can use the [Workflow DevKit CLI or Web UI](/docs/observability) to inspect your workflow runs and steps in detail.

```bash
npx workflow inspect runs
# or add '--web' for an interactive Web based UI
```

<img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />

***

## Deploying to Production

Workflow DevKit apps currently work best when deployed to [Vercel](https://vercel.com/home) and needs no special configuration.

To deploy your Astro project to Vercel, ensure that the [Astro Vercel adapter](https://docs.astro.build/en/guides/integrations-guide/vercel) is configured:

```bash
npx astro add vercel
```

Additionally, check the [Deploying](/docs/deploying) section to learn how your workflows can be deployed elsewhere.

## Next Steps

* Learn more about the [Foundations](/docs/foundations).
* Check [Errors](/docs/errors) if you encounter issues.
* Explore the [API Reference](/docs/api-reference).


---
title: Express
description: Set up your first durable workflow in an Express application.
type: guide
summary: Set up Workflow DevKit in an Express app.
prerequisites:
  - /docs/getting-started
related:
  - /docs/foundations/workflows-and-steps
---

# Express





This guide will walk through setting up your first workflow in a Express app. Along the way, you'll learn more about the concepts that are fundamental to using the development kit in your own projects.

***

<Steps>
  <Step>
    ## Create Your Express Project

    Start by creating a new Express project.

    ```bash
    mkdir my-workflow-app
    ```

    Enter the newly made directory:

    ```bash
    cd my-workflow-app
    ```

    Initialize the project:

    ```bash
    npm init --y
    ```

    ### Install `workflow`, `express`, `nitro`, and `rollup`

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow express nitro rollup
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow express nitro rollup
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow express nitro rollup
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow express nitro rollup
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    <Callout>
      By default, Express doesn't include a build system. Nitro adds one which enables compiling workflows, runs, and deploys for development and production. Learn more about Nitro [here](https://v3.nitro.build).
    </Callout>

    If using TypeScript, you need to install the `@types/express` package.

    ```bash
    npm i -D @types/express
    ```

    ### Configure Nitro

    Create a new file `nitro.config.ts` for your Nitro configuration with module `workflow/nitro`. This enables usage of the `"use workflow"` and `"use step"` directives.

    ```typescript title="nitro.config.ts" lineNumbers
    import { defineNitroConfig } from "nitro/config";

    export default defineNitroConfig({
      modules: ["workflow/nitro"],
      vercel: { entryFormat: "node" },
      routes: {
        "/**": { handler: "./src/index.ts", format: "node" },
      },
    });
    ```

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="[&_p]:my-0 text-lg [&_p]:text-foreground">
          Setup IntelliSense for TypeScript (Optional)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          To enable helpful hints in your IDE, setup the workflow plugin in `tsconfig.json`:

          ```json title="tsconfig.json" lineNumbers
          {
            "compilerOptions": {
              // ... rest of your TypeScript config
              "plugins": [
                {
                  "name": "workflow" // [!code highlight]
                }
              ]
            }
          }
          ```
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    ### Update `package.json`

    To use the Nitro builder, update your `package.json` to include the following scripts:

    ```json title="package.json" lineNumbers
    {
      // ...
      "scripts": {
        "dev": "nitro dev",
        "build": "nitro build"
      },
      // ...
    }
    ```
  </Step>

  <Step>
    ## Create Your First Workflow

    Create a new file for our first workflow:

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { sleep } from "workflow";

    export async function handleUserSignup(email: string) {
      "use workflow"; // [!code highlight]

      const user = await createUser(email);
      await sendWelcomeEmail(user);

      await sleep("5s"); // Pause for 5s - doesn't consume any resources
      await sendOnboardingEmail(user);

      return { userId: user.id, status: "onboarded" };
    }
    ```

    We'll fill in those functions next, but let's take a look at this code:

    * We define a **workflow** function with the directive `"use workflow"`. Think of the workflow function as the *orchestrator* of individual **steps**.
    * The Workflow DevKit's `sleep` function allows us to suspend execution of the workflow without using up any resources. A sleep can be a few seconds, hours, days, or even months long.

    ## Create Your Workflow Steps

    Let's now define those missing functions.

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { FatalError } from "workflow";

    // Our workflow function defined earlier

    async function createUser(email: string) {
      "use step"; // [!code highlight]

      console.log(`Creating user with email: ${email}`);

      // Full Node.js access - database calls, APIs, etc.
      return { id: crypto.randomUUID(), email };
    }

    async function sendWelcomeEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]

      console.log(`Sending welcome email to user: ${user.id}`);

      if (Math.random() < 0.3) {
        // By default, steps will be retried for unhandled errors
        throw new Error("Retryable!");
      }
    }

    async function sendOnboardingEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]

      if (!user.email.includes("@")) {
        // To skip retrying, throw a FatalError instead
        throw new FatalError("Invalid Email");
      }

      console.log(`Sending onboarding email to user: ${user.id}`);
    }
    ```

    Taking a look at this code:

    * Business logic lives inside **steps**. When a step is invoked inside a **workflow**, it gets enqueued to run on a separate request while the workflow is suspended, just like `sleep`.
    * If a step throws an error, like in `sendWelcomeEmail`, the step will automatically be retried until it succeeds (or hits the step's max retry count).
    * Steps can throw a `FatalError` if an error is intentional and should not be retried.

    <Callout>
      We'll dive deeper into workflows, steps, and other ways to suspend or handle
      events in [Foundations](/docs/foundations).
    </Callout>
  </Step>

  <Step>
    ## Create Your Route Handler

    To invoke your new workflow, we'll create both the Express app and a new API route handler at `src/index.ts` with the following code:

    ```typescript title="src/index.ts"
    import express from "express";
    import { start } from "workflow/api";
    import { handleUserSignup } from "../workflows/user-signup.js";

    const app = express();
    app.use(express.json());

    app.post("/api/signup", async (req, res) => {
      const { email } = req.body;
      await start(handleUserSignup, [email]);
      return res.json({ message: "User signup workflow started" });
    });

    export default app;
    ```

    This route handler creates a `POST` request endpoint at `/api/signup` that will trigger your workflow.
  </Step>

  <Step>
    ## Run in development

    To start your development server, run the following command in your terminal in the Express root directory:

    ```bash
    npm run dev
    ```

    Once your development server is running, you can trigger your workflow by running this command in the terminal:

    ```bash
    curl -X POST --json '{"email":"hello@example.com"}' http://localhost:3000/api/signup
    ```

    Check the Express development server logs to see your workflow execute as well as the steps that are being processed.

    Additionally, you can use the [Workflow DevKit CLI or Web UI](/docs/observability) to inspect your workflow runs and steps in detail.

    ```bash
    # Open the observability Web UI
    npx workflow web
    # or if you prefer a terminal interface, use the CLI inspect command
    npx workflow inspect runs
    ```

        <img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />
  </Step>
</Steps>

***

## Deploying to production

Workflow DevKit apps currently work best when deployed to [Vercel](https://vercel.com/home) and needs no special configuration.

Check the [Deploying](/docs/deploying) section to learn how your workflows can be deployed elsewhere.

## Next Steps

* Learn more about the [Foundations](/docs/foundations).
* Check [Errors](/docs/errors) if you encounter issues.
* Explore the [API Reference](/docs/api-reference).


---
title: Fastify
description: Set up your first durable workflow in a Fastify application.
type: guide
summary: Set up Workflow DevKit in a Fastify app.
prerequisites:
  - /docs/getting-started
related:
  - /docs/foundations/workflows-and-steps
---

# Fastify





This guide will walk through setting up your first workflow in a Fastify app. Along the way, you'll learn more about the concepts that are fundamental to using the development kit in your own projects.

***

<Steps>
  <Step>
    ## Create Your Fastify Project

    Start by creating a new Fastify project.

    ```bash
    mkdir my-workflow-app
    ```

    Enter the newly made directory:

    ```bash
    cd my-workflow-app
    ```

    Initialize the project:

    ```bash
    npm init --y
    ```

    ### Install `workflow`, `fastify` and `nitro`

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow fastify nitro rollup
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow fastify nitro rollup
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow fastify nitro rollup
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow fastify nitro rollup
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    <Callout>
      By default, Fastify doesn't include a build system. Nitro adds one which enables compiling workflows, runs, and deploys for development and production. Learn more about [Nitro](https://v3.nitro.build).
    </Callout>

    If using TypeScript, you need to install the `@types/node` and `typescript` packages

    ```bash
    npm i -D @types/node typescript
    ```

    ### Configure Nitro

    Create a new file `nitro.config.ts` for your Nitro configuration with module `workflow/nitro`. This enables usage of the `"use workflow"` and `"use step"` directives

    ```typescript title="nitro.config.ts" lineNumbers
    import { defineNitroConfig } from "nitro/config";

    export default defineNitroConfig({
    	modules: ["workflow/nitro"],
    	vercel: { entryFormat: "node" },
    	routes: {
    		"/**": { handler: "./src/index.ts", format: "node" },
    	},
    });
    ```

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="[&_p]:my-0 text-lg [&_p]:text-foreground">
          Setup IntelliSense for TypeScript (Optional)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          To enable helpful hints in your IDE, set up the workflow plugin in `tsconfig.json`:

          ```json title="tsconfig.json" lineNumbers
          {
            "compilerOptions": {
              // ... rest of your TypeScript config
              "plugins": [
                {
                  "name": "workflow" // [!code highlight]
                }
              ]
            }
          }
          ```
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    ### Update `package.json`

    To use the Nitro builder, update your `package.json` to include the following scripts:

    ```json title="package.json" lineNumbers
    {
      // ...
      "scripts": {
        "dev": "nitro dev",
        "build": "nitro build"
      },
      // ...
    }
    ```
  </Step>

  <Step>
    ## Create Your First Workflow

    Create a new file for our first workflow:

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { sleep } from "workflow";

    export async function handleUserSignup(email: string) {
      "use workflow"; // [!code highlight]

      const user = await createUser(email);
      await sendWelcomeEmail(user);

      await sleep("5s"); // Pause for 5s - doesn't consume any resources
      await sendOnboardingEmail(user);

      return { userId: user.id, status: "onboarded" };
    }
    ```

    We'll fill in those functions next, but let's take a look at this code:

    * We define a **workflow** function with the directive `"use workflow"`. Think of the workflow function as the *orchestrator* of individual **steps**.
    * The Workflow DevKit's `sleep` function allows us to suspend execution of the workflow without using up any resources. A sleep can be a few seconds, hours, days, or even months long.

    ## Create Your Workflow Steps

    Let's now define those missing functions:

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { FatalError } from "workflow";

    // Our workflow function defined earlier

    async function createUser(email: string) {
      "use step"; // [!code highlight]
      console.log(`Creating user with email: ${email}`);
      return { id: crypto.randomUUID(), email };
    }

    async function sendWelcomeEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]
      console.log(`Sending welcome email to user: ${user.id}`);
      if (Math.random() < 0.3) {
        // Steps retry on unhandled errors
        throw new Error("Retryable!");
      }
    }

    async function sendOnboardingEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]
      if (!user.email.includes("@")) {
        // FatalError skips retries
        throw new FatalError("Invalid Email");
      }
      console.log(`Sending onboarding email to user: ${user.id}`);
    }
    ```

    Taking a look at this code:

    * Business logic lives inside **steps**. When a step is invoked inside a **workflow**, it gets enqueued to run on a separate request while the workflow is suspended, just like `sleep`.
    * If a step throws an error, like in `sendWelcomeEmail`, the step will automatically be retried until it succeeds (or hits the step's max retry count).
    * Steps can throw a `FatalError` if an error is intentional and should not be retried.

    <Callout>
      We'll dive deeper into workflows, steps, and other ways to suspend or handle
      events in [Foundations](/docs/foundations).
    </Callout>
  </Step>

  <Step>
    ## Create Your Route Handler

    To invoke your new workflow, we'll create both the Fastify app and a new API route handler at `src/index.ts` with the following code:

    ```typescript title="src/index.ts"
    import Fastify from "fastify";
    import { start } from "workflow/api";
    import { handleUserSignup } from "../workflows/user-signup.js";

    const app = Fastify({ logger: true });
    app.post("/api/signup", async (req, reply) => {
      const { email } = req.body as { email: string };
      await start(handleUserSignup, [email]);
      return reply.send({ message: "User signup workflow started" });
    });

    // Wait for Fastify to be ready before handling requests
    await app.ready();


    export default (req: any, res: any) => {
      app.server.emit("request", req, res);
    };
    ```

    This route handler creates a `POST` request endpoint at `/api/signup` that will trigger your workflow.
  </Step>

  <Step>
    ## Run in development

    To start your development server, run the following command in your terminal in the Fastify root directory:

    ```bash
    npm run dev
    ```

    Once your development server is running, you can trigger your workflow by running this command in the terminal:

    ```bash
    curl -X POST --json '{"email":"hello@example.com"}' http://localhost:3000/api/signup
    ```

    Check the Fastify development server logs to see your workflow execute as well as the steps that are being processed.

    Additionally, you can use the [Workflow DevKit CLI or Web UI](/docs/observability) to inspect your workflow runs and steps in detail.

    ```bash
    npx workflow inspect runs # add '--web' for an interactive Web based UI
    ```

        <img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />
  </Step>
</Steps>

***

## Deploying to production

Workflow DevKit apps currently work best when deployed to [Vercel](https://vercel.com/home) and needs no special configuration.

Check the [Deploying](/docs/deploying) section to learn how your workflows can be deployed elsewhere.

## Next Steps

* Learn more about the [Foundations](/docs/foundations).
* Check [Errors](/docs/errors) if you encounter issues.
* Explore the [API Reference](/docs/api-reference).


---
title: Hono
description: This guide will walk through setting up your first workflow in a Hono app. Along the way, you'll learn more about the concepts that are fundamental to using the development kit in your own projects.
type: guide
summary: Set up Workflow DevKit in a Hono app.
prerequisites:
  - /docs/getting-started
related:
  - /docs/foundations/workflows-and-steps
---

# Hono





<Steps>
  <Step>
    ## Create Your Hono Project

    Start by creating a new Hono project. This command will create a new directory named `my-workflow-app` and set up a Hono project inside it.

    ```bash
    npm create hono@latest my-workflow-app -- --template=nodejs
    ```

    Enter the newly created directory:

    ```bash
    cd my-workflow-app
    ```

    ### Install `workflow`, `nitro`, and `rollup`

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow nitro rollup
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow nitro rollup
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow nitro rollup
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow nitro rollup
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    <Callout>
      By default, Hono doesn't include a build system. Nitro adds one which enables compiling workflows, runs, and deploys for development and production. Learn more about Nitro [here](https://v3.nitro.build).
    </Callout>

    ### Configure Nitro

    Create a new file `nitro.config.ts` for your Nitro configuration with module `workflow/nitro`. This enables usage of the `"use workflow"` and `"use step"` directives.

    ```typescript title="nitro.config.ts" lineNumbers
    import { defineConfig } from "nitro";

    export default defineConfig({
      modules: ["workflow/nitro"],
      routes: {
        "/**": "./src/index.ts"
      }
    });
    ```

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="[&_p]:my-0 text-lg [&_p]:text-foreground">
          Setup IntelliSense for TypeScript (Optional)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          To enable helpful hints in your IDE, setup the workflow plugin in `tsconfig.json`:

          ```json title="tsconfig.json" lineNumbers
          {
            "compilerOptions": {
              // ... rest of your TypeScript config
              "plugins": [
                {
                  "name": "workflow" // [!code highlight]
                }
              ]
            }
          }
          ```
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    ### Update `package.json`

    To use the Nitro builder, update your `package.json` to include the following scripts:

    ```json title="package.json" lineNumbers
    {
      // ...
      "scripts": {
        "dev": "nitro dev",
        "build": "nitro build"
      },
      // ...
    }
    ```
  </Step>

  <Step>
    ## Create Your First Workflow

    Create a new file for our first workflow:

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { sleep } from "workflow";

    export async function handleUserSignup(email: string) {
      "use workflow"; // [!code highlight]

      const user = await createUser(email);
      await sendWelcomeEmail(user);

      await sleep("5s"); // Pause for 5s - doesn't consume any resources
      await sendOnboardingEmail(user);

      console.log("Workflow is complete! Run 'npx workflow web' to inspect your run")

      return { userId: user.id, status: "onboarded" };
    }
    ```

    We'll fill in those functions next, but let's take a look at this code:

    * We define a **workflow** function with the directive `"use workflow"`. Think of the workflow function as the *orchestrator* of individual **steps**.
    * The Workflow DevKit's `sleep` function allows us to suspend execution of the workflow without using up any resources. A sleep can be a few seconds, hours, days, or even months long.

    ## Create Your Workflow Steps

    Let's now define those missing functions.

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { FatalError } from "workflow";

    // Our workflow function defined earlier

    async function createUser(email: string) {
      "use step"; // [!code highlight]

      console.log(`Creating user with email: ${email}`);

      // Full Node.js access - database calls, APIs, etc.
      return { id: crypto.randomUUID(), email };
    }

    async function sendWelcomeEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]

      console.log(`Sending welcome email to user: ${user.id}`);

      if (Math.random() < 0.3) {
        // By default, steps will be retried for unhandled errors
        throw new Error("Retryable!");
      }
    }

    async function sendOnboardingEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]

      if (!user.email.includes("@")) {
        // To skip retrying, throw a FatalError instead
        throw new FatalError("Invalid Email");
      }

      console.log(`Sending onboarding email to user: ${user.id}`);
    }
    ```

    Taking a look at this code:

    * Business logic lives inside **steps**. When a step is invoked inside a **workflow**, it gets enqueued to run on a separate request while the workflow is suspended, just like `sleep`.
    * If a step throws an error, like in `sendWelcomeEmail`, the step will automatically be retried until it succeeds (or hits the step's max retry count).
    * Steps can throw a `FatalError` if an error is intentional and should not be retried.

    <Callout>
      We'll dive deeper into workflows, steps, and other ways to suspend or handle
      events in [Foundations](/docs/foundations).
    </Callout>
  </Step>

  <Step>
    ## Create Your Route Handler

    To invoke your new workflow, we'll create a new API route handler at `src/index.ts` with the following code:

    ```typescript title="src/index.ts"
    import { Hono } from "hono";
    import { start } from "workflow/api";
    import { handleUserSignup } from "../workflows/user-signup.js";

    const app = new Hono();

    app.post("/api/signup", async (c) => {
      const { email } = await c.req.json();
      await start(handleUserSignup, [email]);
      return c.json({ message: "User signup workflow started" });
    });

    export default app;
    ```

    This route handler creates a `POST` request endpoint at `/api/signup` that will trigger your workflow.
  </Step>

  <Step>
    ## Run in development

    To start your development server, run the following command in your terminal in the Hono root directory:

    ```bash
    npm run dev
    ```

    Once your development server is running, you can trigger your workflow by running this command in the terminal:

    ```bash
    curl -X POST --json '{"email":"hello@example.com"}' http://localhost:3000/api/signup
    ```

    Check the Hono development server logs to see your workflow execute as well as the steps that are being processed.

    Additionally, you can use the [Workflow DevKit CLI or Web UI](/docs/observability) to inspect your workflow runs and steps in detail.

    ```bash
    # Open the observability Web UI
    npx workflow web
    # or if you prefer a terminal interface, use the CLI inspect command
    npx workflow inspect runs
    ```

        <img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />
  </Step>
</Steps>

## Deploying to production

Workflow DevKit apps currently work best when deployed to [Vercel](https://vercel.com/home) and needs no special configuration.

Check the [Deploying](/docs/deploying) section to learn how your workflows can be deployed elsewhere.

## Next Steps

* Learn more about the [Foundations](/docs/foundations).
* Check [Errors](/docs/errors) if you encounter issues.
* Explore the [API Reference](/docs/api-reference).


---
title: Getting Started
description: Start by choosing your framework. Each guide will walk you through the steps to install the dependencies and start running your first workflow.
type: overview
summary: Choose a framework and start building your first workflow.
related:
  - /docs/foundations
  - /docs/foundations/workflows-and-steps
---

# Getting Started



import { Next, Nitro, SvelteKit, Nuxt, Hono, Bun, AstroDark, AstroLight, TanStack, Vite, Express, Nest, Fastify } from "@/app/[lang]/(home)/components/frameworks";

<Cards>
  <Card href="/docs/getting-started/next">
    <div className="flex flex-col items-center justify-center gap-2">
       

      <Next className="size-16" />

       

      <span className="font-medium">Next.js</span>

       
    </div>
  </Card>

  <Card href="/docs/getting-started/vite">
    <div className="flex flex-col items-center justify-center gap-2">
      <Vite className="size-16" />

      <span className="font-medium">
        Vite
      </span>
    </div>
  </Card>

  <Card href="/docs/getting-started/astro">
    <div className="flex flex-col items-center justify-center gap-2">
      <AstroLight className="size-16 dark:hidden" />

      <AstroDark className="size-16 hidden dark:block" />

      <span className="font-medium">
        Astro
      </span>
    </div>
  </Card>

  <Card href="/docs/getting-started/express">
    <div className="flex flex-col items-center justify-center gap-2">
      <Express className="size-16 dark:invert" />

      <span className="font-medium">
        Express
      </span>
    </div>
  </Card>

  <Card href="/docs/getting-started/fastify">
    <div className="flex flex-col items-center justify-center text-center gap-2">
      <Fastify className="size-16 dark:invert" />

      <span className="font-medium">
        Fastify
      </span>
    </div>
  </Card>

  <Card href="/docs/getting-started/hono">
    <div className="flex flex-col items-center justify-center gap-2">
      <Hono className="size-16" />

      <span className="font-medium">
        Hono
      </span>
    </div>
  </Card>

  <Card href="/docs/getting-started/nitro">
    <div className="flex flex-col items-center justify-center gap-2">
      <Nitro className="size-16" />

      <span className="font-medium">
        Nitro
      </span>
    </div>
  </Card>

  <Card href="/docs/getting-started/nuxt">
    <div className="flex flex-col items-center justify-center gap-2">
      <Nuxt className="size-16" />

      <span className="font-medium">
        Nuxt
      </span>
    </div>
  </Card>

  <Card href="/docs/getting-started/sveltekit">
    <div className="flex flex-col items-center justify-center gap-2">
      <SvelteKit className="size-16" />

      <span className="font-medium">
        SvelteKit
      </span>
    </div>
  </Card>

  <Card href="/docs/getting-started/nestjs">
    <div className="flex flex-col items-center justify-center gap-2">
      <Nest className="size-16" />

      <span className="font-medium">
        NestJS
      </span>

      <Badge variant="secondary">
        Experimental
      </Badge>
    </div>
  </Card>

  <Card className="opacity-50">
    <div className="flex flex-col items-center justify-center gap-2">
      <TanStack className="size-16 dark:invert grayscale" />

      <span className="font-medium">
        TanStack Start
      </span>

      <Badge variant="secondary">
        Coming soon
      </Badge>
    </div>
  </Card>
</Cards>


---
title: NestJS
description: Set up your first durable workflow in a NestJS application.
type: guide
summary: Set up Workflow DevKit in a NestJS app.
prerequisites:
  - /docs/getting-started
related:
  - /docs/foundations/workflows-and-steps
---

# NestJS





This guide will walk through setting up your first workflow in a NestJS app. Along the way, you'll learn more about the concepts that are fundamental to using the development kit in your own projects.

***

<Steps>
  <Step>
    ## Create Your NestJS Project

    Start by creating a new NestJS project using the NestJS CLI.

    ```bash
    npm i -g @nestjs/cli
    nest new my-workflow-app
    ```

    Enter the newly made directory:

    ```bash
    cd my-workflow-app
    ```

    ### Install `workflow`

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow @workflow/nest
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow @workflow/nest
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow @workflow/nest
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow @workflow/nest
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    ### Configure NestJS for ESM

    NestJS with SWC uses ES modules. Add `"type": "module"` to your `package.json`:

    ```json title="package.json" lineNumbers
    {
      "name": "my-workflow-app",
      "type": "module",
      // ... rest of your config
    }
    ```

    <Callout>
      When using ESM with NestJS, local imports must include the `.js` extension (e.g., `import { AppModule } from './app.module.js'`). This applies even though your source files are `.ts`.
    </Callout>

    ### Configure NestJS to use SWC

    NestJS supports SWC as an alternative compiler for faster builds. The Workflow DevKit uses an SWC plugin to transform workflow files.

    Install the required SWC packages:

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i -D @swc/cli @swc/core
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add -D @swc/cli @swc/core
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add --dev @swc/cli @swc/core
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add --dev @swc/cli @swc/core
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    Ensure your `nest-cli.json` has SWC as the builder:

    ```json title="nest-cli.json" lineNumbers
    {
      "$schema": "https://json.schemastore.org/nest-cli",
      "collection": "@nestjs/schematics",
      "sourceRoot": "src",
      "compilerOptions": {
        "builder": "swc",
        "deleteOutDir": true
      }
    }
    ```

    ### Initialize SWC Configuration

    Run the init command to generate the SWC configuration:

    ```bash
    npx @workflow/nest init
    ```

    This creates a `.swcrc` file configured with the Workflow SWC plugin for client-mode transformations.

    <Callout>
      Add `.swcrc` to your `.gitignore` as it contains machine-specific absolute paths that shouldn't be committed.
    </Callout>

    ### Update `package.json`

    Add scripts to regenerate the SWC configuration before builds:

    ```json title="package.json" lineNumbers
    {
      "scripts": {
        "prebuild": "npx @workflow/nest init --force",
        "build": "nest build",
        "start:dev": "npx @workflow/nest init --force && nest start --watch"
      }
    }
    ```

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="[&_p]:my-0 text-lg [&_p]:text-foreground">
          Setup IntelliSense for TypeScript (Optional)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          To enable helpful hints in your IDE, setup the workflow plugin in `tsconfig.json`:

          ```json title="tsconfig.json" lineNumbers
          {
            "compilerOptions": {
              // ... rest of your TypeScript config
              "plugins": [
                {
                  "name": "workflow" // [!code highlight]
                }
              ]
            }
          }
          ```
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Step>

  <Step>
    ## Import the WorkflowModule

    In your `app.module.ts`, import the `WorkflowModule`:

    ```typescript title="src/app.module.ts" lineNumbers
    import { Module } from '@nestjs/common';
    import { WorkflowModule } from '@workflow/nest';
    import { AppController } from './app.controller.js';
    import { AppService } from './app.service.js';

    @Module({
      imports: [WorkflowModule.forRoot()], // [!code highlight]
      controllers: [AppController],
      providers: [AppService],
    })
    export class AppModule {}
    ```

    The `WorkflowModule` handles workflow bundle building and provides HTTP routing for workflow execution at `.well-known/workflow/v1/`.
  </Step>

  <Step>
    ## Create Your First Workflow

    Create a new file for our first workflow in the `src/workflows` directory:

    <Callout>
      Workflow files must be inside the `src/` directory so they get compiled with the SWC plugin that enables the `start()` function to work correctly.
    </Callout>

    ```typescript title="src/workflows/user-signup.ts" lineNumbers
    import { sleep } from "workflow";

    export async function handleUserSignup(email: string) {
      "use workflow"; // [!code highlight]

      const user = await createUser(email);
      await sendWelcomeEmail(user);

      await sleep("5s"); // Pause for 5s - doesn't consume any resources
      await sendOnboardingEmail(user);

      return { userId: user.id, status: "onboarded" };
    }
    ```

    We'll fill in those functions next, but let's take a look at this code:

    * We define a **workflow** function with the directive `"use workflow"`. Think of the workflow function as the *orchestrator* of individual **steps**.
    * The Workflow DevKit's `sleep` function allows us to suspend execution of the workflow without using up any resources. A sleep can be a few seconds, hours, days, or even months long.

    ## Create Your Workflow Steps

    Let's now define those missing functions.

    ```typescript title="src/workflows/user-signup.ts" lineNumbers
    import { FatalError } from "workflow";

    // Our workflow function defined earlier

    async function createUser(email: string) {
      "use step"; // [!code highlight]

      console.log(`Creating user with email: ${email}`);

      // Full Node.js access - database calls, APIs, etc.
      return { id: crypto.randomUUID(), email };
    }

    async function sendWelcomeEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]

      console.log(`Sending welcome email to user: ${user.id}`);

      if (Math.random() < 0.3) {
        // By default, steps will be retried for unhandled errors
        throw new Error("Retryable!");
      }
    }

    async function sendOnboardingEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]

      if (!user.email.includes("@")) {
        // To skip retrying, throw a FatalError instead
        throw new FatalError("Invalid Email");
      }

      console.log(`Sending onboarding email to user: ${user.id}`);
    }
    ```

    Taking a look at this code:

    * Business logic lives inside **steps**. When a step is invoked inside a **workflow**, it gets enqueued to run on a separate request while the workflow is suspended, just like `sleep`.
    * If a step throws an error, like in `sendWelcomeEmail`, the step will automatically be retried until it succeeds (or hits the step's max retry count).
    * Steps can throw a `FatalError` if an error is intentional and should not be retried.

    <Callout>
      We'll dive deeper into workflows, steps, and other ways to suspend or handle
      events in [Foundations](/docs/foundations).
    </Callout>
  </Step>

  <Step>
    ## Create Your Controller

    To invoke your new workflow, update your controller with a new endpoint:

    {/*@skip-typecheck - NestJS decorators require special TypeScript config*/}

    ```typescript title="src/app.controller.ts" lineNumbers
    import { Body, Controller, Post } from '@nestjs/common';
    import { start } from 'workflow/api';
    import { handleUserSignup } from './workflows/user-signup.js';

    @Controller()
    export class AppController {
      @Post('signup')
      async signup(@Body() body: { email: string }) {
        await start(handleUserSignup, [body.email]);
        return { message: 'User signup workflow started' };
      }
    }
    ```

    This creates a `POST` endpoint at `/signup` that will trigger your workflow.
  </Step>

  <Step>
    ## Run in development

    To start your development server, run the following command in your terminal:

    ```bash
    npm run start:dev
    ```

    Once your development server is running, you can trigger your workflow by running this command in the terminal:

    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"email":"hello@example.com"}' http://localhost:3000/signup
    ```

    Check the NestJS development server logs to see your workflow execute as well as the steps that are being processed.

    Additionally, you can use the [Workflow DevKit CLI or Web UI](/docs/observability) to inspect your workflow runs and steps in detail.

    ```bash
    # Open the observability Web UI
    npx workflow web
    # or if you prefer a terminal interface, use the CLI inspect command
    npx workflow inspect runs
    ```

        <img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />
  </Step>
</Steps>

***

## Configuration Options

The `WorkflowModule.forRoot()` method accepts optional configuration:

{/*@skip-typecheck - Configuration snippet, WorkflowModule not imported*/}

```typescript
WorkflowModule.forRoot({
  // Directory to scan for workflow files (default: ['src'])
  dirs: ['src'],

  // Output directory for generated bundles (default: '.nestjs/workflow')
  outDir: '.nestjs/workflow',

  // Skip building in production when bundles are pre-built
  skipBuild: false,
});
```

## Deploying to production

Workflow DevKit apps currently work best when deployed to [Vercel](https://vercel.com/home) and needs no special configuration.

Check the [Deploying](/docs/deploying) section to learn how your workflows can be deployed elsewhere.

## Next Steps

* Learn more about the [Foundations](/docs/foundations).
* Check [Errors](/docs/errors) if you encounter issues.
* Explore the [API Reference](/docs/api-reference).


---
title: Next.js
description: This guide will walk through setting up your first workflow in a Next.js app. Along the way, you'll learn more about the concepts that are fundamental to using the development kit in your own projects.
type: guide
summary: Set up Workflow DevKit in a Next.js app.
prerequisites:
  - /docs/getting-started
related:
  - /docs/api-reference/workflow-next
  - /docs/deploying/world/vercel-world
---

# Next.js





<Steps>
  <Step>
    ## Create Your Next.js Project

    Start by creating a new Next.js project. This command will create a new directory named `my-workflow-app` and set up a Next.js project inside it.

    ```bash
    npm create next-app@latest my-workflow-app
    ```

    Enter the newly created directory:

    ```bash
    cd my-workflow-app
    ```

    ### Install `workflow`

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    ### Configure Next.js

    Wrap your `next.config.ts` with `withWorkflow()`. This enables usage of the `"use workflow"` and `"use step"` directives.

    ```typescript title="next.config.ts" lineNumbers
    import { withWorkflow } from "workflow/next"; // [!code highlight]
    import type { NextConfig } from "next";

    const nextConfig: NextConfig = {
      // … rest of your Next.js config
    };

    export default withWorkflow(nextConfig); // [!code highlight]
    ```

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="text-sm">
          ### Setup IntelliSense for TypeScript (Optional)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          To enable helpful hints in your IDE, setup the workflow plugin in `tsconfig.json`:

          ```json title="tsconfig.json" lineNumbers
          {
            "compilerOptions": {
              // ... rest of your TypeScript config
              "plugins": [
                {
                  "name": "workflow" // [!code highlight]
                }
              ]
            }
          }
          ```
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="text-sm">
          ### Configure Proxy Handler (if applicable)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          If your Next.js app has a [proxy handler](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
          (formerly known as "middleware"), you'll need to update the matcher pattern to exclude Workflow's
          internal paths to prevent the proxy handler from running on them.

          Add `.well-known/workflow/*` to your middleware's exclusion list:

          ```typescript title="proxy.ts" lineNumbers
          import { NextResponse } from "next/server";
          import type { NextRequest } from "next/server";

          export function proxy(request: NextRequest) {
            // Your middleware logic
            return NextResponse.next();
          }

          export const config = {
            matcher: [
              // ... your existing matchers
              {
                source: "/((?!_next/static|_next/image|favicon.ico|.well-known/workflow/).*)", // [!code highlight]
              },
            ],
          };
          ```

          This ensures that internal Workflow paths are not intercepted by your middleware, which could interfere with workflow execution and resumption.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Step>

  <Step>
    ## Create Your First Workflow

    Create a new file for our first workflow:

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { sleep } from "workflow";

    export async function handleUserSignup(email: string) {
     "use workflow"; // [!code highlight]

     const user = await createUser(email);
     await sendWelcomeEmail(user);

     await sleep("5s"); // Pause for 5s - doesn't consume any resources
     await sendOnboardingEmail(user);

     console.log("Workflow is complete! Run 'npx workflow web' to inspect your run")

     return { userId: user.id, status: "onboarded" };
    }

    ```

    We'll fill in those functions next, but let's take a look at this code:

    * We define a **workflow** function with the directive `"use workflow"`. Think of the workflow function as the *orchestrator* of individual **steps**.
    * The Workflow DevKit's `sleep` function allows us to suspend execution of the workflow without using up any resources. A sleep can be a few seconds, hours, days, or even months long.

    ## Create Your Workflow Steps

    Let's now define those missing functions.

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { FatalError } from "workflow"

    // Our workflow function defined earlier

    async function createUser(email: string) {
      "use step"; // [!code highlight]

      console.log(`Creating user with email: ${email}`);

      // Full Node.js access - database calls, APIs, etc.
      return { id: crypto.randomUUID(), email };
    }

    async function sendWelcomeEmail(user: { id: string; email: string; }) {
      "use step"; // [!code highlight]

      console.log(`Sending welcome email to user: ${user.id}`);

      if (Math.random() < 0.3) {
      // By default, steps will be retried for unhandled errors
       throw new Error("Retryable!");
      }
    }

    async function sendOnboardingEmail(user: { id: string; email: string}) {
     "use step"; // [!code highlight]

      if (!user.email.includes("@")) {
        // To skip retrying, throw a FatalError instead
        throw new FatalError("Invalid Email");
      }

     console.log(`Sending onboarding email to user: ${user.id}`);
    }
    ```

    Taking a look at this code:

    * Business logic lives inside **steps**. When a step is invoked inside a **workflow**, it gets enqueued to run on a separate request while the workflow is suspended, just like `sleep`.
    * If a step throws an error, like in `sendWelcomeEmail`, the step will automatically be retried until it succeeds (or hits the step's max retry count).
    * Steps can throw a `FatalError` if an error is intentional and should not be retried.

    <Callout>
      We'll dive deeper into workflows, steps, and other ways to suspend or handle events in [Foundations](/docs/foundations).
    </Callout>
  </Step>

  <Step>
    ## Create Your Route Handler

    To invoke your new workflow, we'll need to add your workflow to a `POST` API Route Handler, `app/api/signup/route.ts`, with the following code:

    ```typescript title="app/api/signup/route.ts"
    import { start } from "workflow/api";
    import { handleUserSignup } from "@/workflows/user-signup";
    import { NextResponse } from "next/server";

    export async function POST(request: Request) {
     const { email } = await request.json();

     // Executes asynchronously and doesn't block your app
     await start(handleUserSignup, [email]);

     return NextResponse.json({
      message: "User signup workflow started",
     });
    }
    ```

    This Route Handler creates a `POST` request endpoint at `/api/signup` that will trigger your workflow.

    <Callout>
      Workflows can be triggered from API routes, Server Actions, or any server-side code.
    </Callout>
  </Step>
</Steps>

## Run in development

To start your development server, run the following command in your terminal in the Next.js root directory:

```bash
npm run dev
```

Once your development server is running, you can trigger your workflow by running this command in the terminal:

```bash
curl -X POST --json '{"email":"hello@example.com"}' http://localhost:3000/api/signup
```

Check the Next.js development server logs to see your workflow execute, as well as the steps that are being processed.

Additionally, you can use the [Workflow DevKit CLI or Web UI](/docs/observability) to inspect your workflow runs and steps in detail.

```bash
# Open the observability Web UI
npx workflow web
# or if you prefer a terminal interface, use the CLI inspect command
npx workflow inspect runs
```

<img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />

## Deploying to production

Workflow DevKit apps currently work best when deployed to [Vercel](https://vercel.com/home) and need no special configuration.

Check the [Deploying](/docs/deploying) section to learn how your workflows can be deployed elsewhere.

## Troubleshooting

### Next.js 16.1+ compatibility

If you see this error when upgrading to Next.js 16.1 or later:

```
Build error occurred
Error: Cannot find module 'next/dist/lib/server-external-packages.json'
```

Upgrade to `workflow@4.0.1-beta.26` or later:

<CodeBlockTabs defaultValue="npm">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">
      npm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="pnpm">
      pnpm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="yarn">
      yarn
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="bun">
      bun
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">
    ```bash
    npm install workflow@latest
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm add workflow@latest
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn add workflow@latest
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bun add workflow@latest
    ```
  </CodeBlockTab>
</CodeBlockTabs>

## Next Steps

* Learn more about the [Foundations](/docs/foundations).
* Check [Errors](/docs/errors) if you encounter issues.
* Explore the [API Reference](/docs/api-reference).


---
title: Nitro
description: This guide will walk through setting up your first workflow in a Nitro v3 project. Along the way, you'll learn more about the concepts that are fundamental to using the development kit in your own projects.
type: guide
summary: Set up Workflow DevKit in a Nitro app.
prerequisites:
  - /docs/getting-started
related:
  - /docs/foundations/workflows-and-steps
---

# Nitro





<Steps>
  <Step>
    ## Create Your Nitro Project

    Start by creating a new [Nitro v3](https://v3.nitro.build/) project. This command will create a new directory named `nitro-app` and setup a Nitro project inside it.

    ```bash
    npx create-nitro-app
    ```

    Enter the newly made directory:

    ```bash
    cd nitro-app
    ```

    ### Install `workflow`

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    ### Configure Nitro

    Add `workflow/nitro` module to your `nitro.config.ts` This enables usage of the `"use workflow"` and `"use step"` directives.

    ```typescript title="nitro.config.ts" lineNumbers
    import { defineConfig } from "nitro";

    export default defineConfig({
      serverDir: "./server",
      modules: ["workflow/nitro"],
    });

    ```

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="[&_p]:my-0 text-lg [&_p]:text-foreground">
          Setup IntelliSense for TypeScript (Optional)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          To enable helpful hints in your IDE, setup the workflow plugin in `tsconfig.json`:

          ```json title="tsconfig.json" lineNumbers
          {
            "compilerOptions": {
              // ... rest of your TypeScript config
              "plugins": [
                {
                  "name": "workflow" // [!code highlight]
                }
              ]
            }
          }
          ```
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Step>

  <Step>
    ## Create Your First Workflow

    Create a new file for our first workflow:

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { sleep } from "workflow";

    export async function handleUserSignup(email: string) {
      "use workflow"; // [!code highlight]

      const user = await createUser(email);
      await sendWelcomeEmail(user);

      await sleep("5s"); // Pause for 5s - doesn't consume any resources
      await sendOnboardingEmail(user);

      console.log("Workflow is complete! Run 'npx workflow web' to inspect your run")

      return { userId: user.id, status: "onboarded" };
    }
    ```

    We'll fill in those functions next, but let's take a look at this code:

    * We define a **workflow** function with the directive `"use workflow"`. Think of the workflow function as the *orchestrator* of individual **steps**.
    * The Workflow DevKit's `sleep` function allows us to suspend execution of the workflow without using up any resources. A sleep can be a few seconds, hours, days, or even months long.

    ## Create Your Workflow Steps

    Let's now define those missing functions.

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { FatalError } from "workflow";

    // Our workflow function defined earlier

    async function createUser(email: string) {
      "use step"; // [!code highlight]

      console.log(`Creating user with email: ${email}`);

      // Full Node.js access - database calls, APIs, etc.
      return { id: crypto.randomUUID(), email };
    }

    async function sendWelcomeEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]

      console.log(`Sending welcome email to user: ${user.id}`);

      if (Math.random() < 0.3) {
        // By default, steps will be retried for unhandled errors
        throw new Error("Retryable!");
      }
    }

    async function sendOnboardingEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]

      if (!user.email.includes("@")) {
        // To skip retrying, throw a FatalError instead
        throw new FatalError("Invalid Email");
      }

      console.log(`Sending onboarding email to user: ${user.id}`);
    }
    ```

    Taking a look at this code:

    * Business logic lives inside **steps**. When a step is invoked inside a **workflow**, it gets enqueued to run on a separate request while the workflow is suspended, just like `sleep`.
    * If a step throws an error, like in `sendWelcomeEmail`, the step will automatically be retried until it succeeds (or hits the step's max retry count).
    * Steps can throw a `FatalError` if an error is intentional and should not be retried.

    <Callout>
      We'll dive deeper into workflows, steps, and other ways to suspend or handle
      events in [Foundations](/docs/foundations).
    </Callout>
  </Step>

  <Step>
    ## Create Your Route Handler

    To invoke your new workflow, we'll create a new API route handler at `server/api/signup.post.ts` with the following code:

    ```typescript title="server/api/signup.post.ts"
    import { start } from "workflow/api";
    import { defineEventHandler } from "nitro/h3";
    import { handleUserSignup } from "../../workflows/user-signup";

    export default defineEventHandler(async ({ req }) => {
      const { email } = await req.json() as { email: string };
      // Executes asynchronously and doesn't block your app
      await start(handleUserSignup, [email]);
      return {
        message: "User signup workflow started",
      }
    });
    ```

    This Route Handler creates a `POST` request endpoint at `/api/signup` that will trigger your workflow.

    <Callout>
      Workflows can be triggered from API routes or any server-side
      code.
    </Callout>
  </Step>

  <Step>
    ## Run in development

    To start your development server, run the following command in your terminal in the Nitro root directory:

    ```bash
    npm run dev
    ```

    Once your development server is running, you can trigger your workflow by running this command in the terminal:

    ```bash
    curl -X POST --json '{"email":"hello@example.com"}' http://localhost:3000/api/signup
    ```

    Check the Nitro development server logs to see your workflow execute as well as the steps that are being processed.

    Additionally, you can use the [Workflow DevKit CLI or Web UI](/docs/observability) to inspect your workflow runs and steps in detail.

    ```bash
    # Open the observability Web UI
    npx workflow web
    # or if you prefer a terminal interface, use the CLI inspect command
    npx workflow inspect runs
    ```

        <img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />
  </Step>
</Steps>

## Deploying to production

Workflow DevKit apps currently work best when deployed to [Vercel](https://vercel.com/home) and needs no special configuration.

Check the [Deploying](/docs/deploying) section to learn how your workflows can be deployed elsewhere.

## Next Steps

* Learn more about the [Foundations](/docs/foundations).
* Check [Errors](/docs/errors) if you encounter issues.
* Explore the [API Reference](/docs/api-reference).


---
title: Nuxt
description: This guide will walk through setting up your first workflow in a Nuxt app. Along the way, you'll learn more about the concepts that are fundamental to using the development kit in your own projects.
type: guide
summary: Set up Workflow DevKit in a Nuxt app.
prerequisites:
  - /docs/getting-started
related:
  - /docs/foundations/workflows-and-steps
---

# Nuxt





<Steps>
  <Step>
    ## Create Your Nuxt Project

    Start by creating a new Nuxt project. This command will create a new directory named `nuxt-app` and setup a Nuxt project inside it.

    ```bash
    npm create nuxt@latest nuxt-app
    ```

    Enter the newly made directory:

    ```bash
    cd nuxt-app
    ```

    ### Install `workflow`

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    ### Configure Nuxt

    Add `workflow` to your `nuxt.config.ts`. This automatically configures the Nitro integration and enables usage of the `"use workflow"` and `"use step"` directives.

    ```typescript title="nuxt.config.ts" lineNumbers
    import { defineNuxtConfig } from "nuxt/config";

    export default defineNuxtConfig({
      modules: ["workflow/nuxt"], // [!code highlight]
      compatibilityDate: "latest",
    });
    ```

    This will also automatically enable the TypeScript plugin, which provides helpful IntelliSense hints in your IDE for workflow and step functions.

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="[&_p]:my-0 text-lg [&_p]:text-foreground">
          Disable TypeScript Plugin (Optional)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          The TypeScript plugin is enabled by default. If you need to disable it, you can configure it in your `nuxt.config.ts`:

          {/* @skip-typecheck: incomplete code sample */}

          ```typescript title="nuxt.config.ts" lineNumbers
          export default defineNuxtConfig({
            modules: ["workflow/nuxt"],
            workflow: {
              typescriptPlugin: false, // [!code highlight]
            },
            compatibilityDate: "latest",
          });
          ```
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Step>

  <Step>
    ## Create Your First Workflow

    Create a new file for our first workflow:

    ```typescript title="server/workflows/user-signup.ts" lineNumbers
    import { sleep } from "workflow";

    export async function handleUserSignup(email: string) {
      "use workflow"; // [!code highlight]

      const user = await createUser(email);
      await sendWelcomeEmail(user);

      await sleep("5s"); // Pause for 5s - doesn't consume any resources
      await sendOnboardingEmail(user);

      console.log("Workflow is complete! Run 'npx workflow web' to inspect your run")

      return { userId: user.id, status: "onboarded" };
    }
    ```

    We'll fill in those functions next, but let's take a look at this code:

    * We define a **workflow** function with the directive `"use workflow"`. Think of the workflow function as the *orchestrator* of individual **steps**.
    * The Workflow DevKit's `sleep` function allows us to suspend execution of the workflow without using up any resources. A sleep can be a few seconds, hours, days, or even months long.

    ## Create Your Workflow Steps

    Let's now define those missing functions.

    ```typescript title="server/workflows/user-signup.ts" lineNumbers
    import { FatalError } from "workflow";

    // Our workflow function defined earlier

    async function createUser(email: string) {
      "use step"; // [!code highlight]

      console.log(`Creating user with email: ${email}`);

      // Full Node.js access - database calls, APIs, etc.
      return { id: crypto.randomUUID(), email };
    }

    async function sendWelcomeEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]

      console.log(`Sending welcome email to user: ${user.id}`);

      if (Math.random() < 0.3) {
        // By default, steps will be retried for unhandled errors
        throw new Error("Retryable!");
      }
    }

    async function sendOnboardingEmail(user: { id: string; email: string }) {
      "use step"; // [!code highlight]

      if (!user.email.includes("@")) {
        // To skip retrying, throw a FatalError instead
        throw new FatalError("Invalid Email");
      }

      console.log(`Sending onboarding email to user: ${user.id}`);
    }
    ```

    Taking a look at this code:

    * Business logic lives inside **steps**. When a step is invoked inside a **workflow**, it gets enqueued to run on a separate request while the workflow is suspended, just like `sleep`.
    * If a step throws an error, like in `sendWelcomeEmail`, the step will automatically be retried until it succeeds (or hits the step's max retry count).
    * Steps can throw a `FatalError` if an error is intentional and should not be retried.

    <Callout>
      We'll dive deeper into workflows, steps, and other ways to suspend or handle
      events in [Foundations](/docs/foundations).
    </Callout>
  </Step>

  <Step>
    ## Create Your API Route

    To invoke your new workflow, we'll create a new API route handler at `server/api/signup.post.ts` with the following code:

    ```typescript title="server/api/signup.post.ts"
    import { start } from "workflow/api";
    import { defineEventHandler, readBody } from "h3";
    import { handleUserSignup } from "../workflows/user-signup";

    export default defineEventHandler(async (event) => {
      const { email } = await readBody(event);

      // Executes asynchronously and doesn't block your app
      await start(handleUserSignup, [email]);

      return {
        message: "User signup workflow started",
      };
    });
    ```

    This API route creates a `POST` request endpoint at `/api/signup` that will trigger your workflow.

    <Callout>
      Workflows can be triggered from API routes or any server-side
      code.
    </Callout>
  </Step>

  <Step>
    ## Run in development

    To start your development server, run the following command in your terminal in the Nuxt root directory:

    ```bash
    npm run dev
    ```

    Once your development server is running, you can trigger your workflow by running this command in the terminal:

    ```bash
    curl -X POST --json '{"email":"hello@example.com"}' http://localhost:3000/api/signup
    ```

    Check the Nuxt development server logs to see your workflow execute as well as the steps that are being processed.

    Additionally, you can use the [Workflow DevKit CLI or Web UI](/docs/observability) to inspect your workflow runs and steps in detail.

    ```bash
    # Open the observability Web UI
    npx workflow web
    # or if you prefer a terminal interface, use the CLI inspect command
    npx workflow inspect runs
    ```

        <img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />
  </Step>
</Steps>

## Deploying to production

Workflow DevKit apps currently work best when deployed to [Vercel](https://vercel.com/home) and needs no special configuration.

Check the [Deploying](/docs/deploying) section to learn how your workflows can be deployed elsewhere.

## Next Steps

* Learn more about the [Foundations](/docs/foundations).
* Check [Errors](/docs/errors) if you encounter issues.
* Explore the [API Reference](/docs/api-reference).


---
title: SvelteKit
description: This guide will walk through setting up your first workflow in a SvelteKit app. Along the way, you'll learn more about the concepts that are fundamental to using the development kit in your own projects.
type: guide
summary: Set up Workflow DevKit in a SvelteKit app.
prerequisites:
  - /docs/getting-started
related:
  - /docs/foundations/workflows-and-steps
---

# SvelteKit





<Steps>
  <Step>
    ## Create Your SvelteKit Project

    Start by creating a new SvelteKit project. This command will create a new directory named `my-workflow-app` with a minimal setup and setup a SvelteKit project inside it.

    ```bash
    npx sv create my-workflow-app --template=minimal --types=ts --no-add-ons
    ```

    Enter the newly made directory:

    ```bash
    cd my-workflow-app
    ```

    ### Install `workflow`

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    ### Configure Vite

    Add `workflowPlugin()` to your Vite config. This enables usage of the `"use workflow"` and `"use step"` directives.

    ```typescript title="vite.config.ts" lineNumbers
    import { sveltekit } from "@sveltejs/kit/vite";
    import { defineConfig } from "vite";
    import { workflowPlugin } from "workflow/sveltekit"; // [!code highlight]

    export default defineConfig({
      plugins: [sveltekit(), workflowPlugin()], // [!code highlight]
    });
    ```

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="text-sm">
          ### Setup IntelliSense for TypeScript (Optional)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          To enable helpful hints in your IDE, setup the workflow plugin in `tsconfig.json`:

          ```json title="tsconfig.json" lineNumbers
          {
            "compilerOptions": {
              // ... rest of your TypeScript config
              "plugins": [
                {
                  "name": "workflow" // [!code highlight]
                }
              ]
            }
          }
          ```
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Step>

  <Step>
    ## Create Your First Workflow

    Create a new file for our first workflow:

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { sleep } from "workflow";

    export async function handleUserSignup(email: string) {
      "use workflow"; // [!code highlight]

      const user = await createUser(email);
      await sendWelcomeEmail(user);

      await sleep("5s"); // Pause for 5s - doesn't consume any resources
      await sendOnboardingEmail(user);

      console.log("Workflow is complete! Run 'npx workflow web' to inspect your run")

      return { userId: user.id, status: "onboarded" };
    }

    ```

    We'll fill in those functions next, but let's take a look at this code:

    * We define a **workflow** function with the directive `"use workflow"`. Think of the workflow function as the *orchestrator* of individual **steps**.
    * The Workflow DevKit's `sleep` function allows us to suspend execution of the workflow without using up any resources. A sleep can be a few seconds, hours, days, or even months long.

    ## Create Your Workflow Steps

    Let's now define those missing functions.

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { FatalError } from "workflow"

    // Our workflow function defined earlier

    async function createUser(email: string) {
      "use step"; // [!code highlight]

      console.log(`Creating user with email: ${email}`);

      // Full Node.js access - database calls, APIs, etc.
      return { id: crypto.randomUUID(), email };
    }

    async function sendWelcomeEmail(user: { id: string; email: string; }) {
      "use step"; // [!code highlight]

      console.log(`Sending welcome email to user: ${user.id}`);

      if (Math.random() < 0.3) {
      // By default, steps will be retried for unhandled errors
       throw new Error("Retryable!");
      }
    }

    async function sendOnboardingEmail(user: { id: string; email: string}) {
      "use step"; // [!code highlight]

      if (!user.email.includes("@")) {
        // To skip retrying, throw a FatalError instead
        throw new FatalError("Invalid Email");
      }

      console.log(`Sending onboarding email to user: ${user.id}`);
    }
    ```

    Taking a look at this code:

    * Business logic lives inside **steps**. When a step is invoked inside a **workflow**, it gets enqueued to run on a separate request while the workflow is suspended, just like `sleep`.
    * If a step throws an error, like in `sendWelcomeEmail`, the step will automatically be retried until it succeeds (or hits the step's max retry count).
    * Steps can throw a `FatalError` if an error is intentional and should not be retried.

    <Callout>
      We'll dive deeper into workflows, steps, and other ways to suspend or handle events in [Foundations](/docs/foundations).
    </Callout>
  </Step>

  <Step>
    ## Create Your Route Handler

    To invoke your new workflow, we'll have to add your workflow to a `POST` API route handler, `src/routes/api/signup/+server.ts` with the following code:

    ```typescript title="src/routes/api/signup/+server.ts"
    import { start } from "workflow/api";
    import { handleUserSignup } from "../../../../workflows/user-signup";
    import { json, type RequestHandler } from "@sveltejs/kit";

    export const POST: RequestHandler = async ({
      request,
    }: {
      request: Request;
    }) => {
      const { email } = await request.json();

      // Executes asynchronously and doesn't block your app
      await start(handleUserSignup, [email]);

      return json({ message: "User signup workflow started" });
    };

    ```

    This route handler creates a `POST` request endpoint at `/api/signup` that will trigger your workflow.

    <Callout>
      Workflows can be triggered from API routes or any server-side code.
    </Callout>
  </Step>
</Steps>

## Run in development

To start your development server, run the following command in your terminal in the SvelteKit root directory:

```bash
npm run dev
```

Once your development server is running, you can trigger your workflow by running this command in the terminal:

```bash
curl -X POST --json '{"email":"hello@example.com"}' http://localhost:5173/api/signup
```

Check the SvelteKit development server logs to see your workflow execute as well as the steps that are being processed.

Additionally, you can use the [Workflow DevKit CLI or Web UI](/docs/observability) to inspect your workflow runs and steps in detail.

```bash
# Open the observability Web UI
npx workflow web
# or if you prefer a terminal interface, use the CLI inspect command
npx workflow inspect runs
```

<img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />

## Deploying to production

Workflow DevKit apps currently work best when deployed to [Vercel](https://vercel.com/home) and needs no special configuration.

Check the [Deploying](/docs/deploying) section to learn how your workflows can be deployed elsewhere.

## Next Steps

* Learn more about the [Foundations](/docs/foundations).
* Check [Errors](/docs/errors) if you encounter issues.
* Explore the [API Reference](/docs/api-reference).


---
title: Vite
description: Set up your first durable workflow in a Vite application.
type: guide
summary: Set up Workflow DevKit in a Vite app.
prerequisites:
  - /docs/getting-started
related:
  - /docs/foundations/workflows-and-steps
---

# Vite





This guide will walk through setting up your first workflow in a Vite app. Along the way, you'll learn more about the concepts that are fundamental to using the development kit in your own projects.

***

<Steps>
  <Step>
    ## Create Your Vite Project

    Start by creating a new Vite project. This command will create a new directory named `my-workflow-app` with a minimal setup and setup a Vite project inside it.

    ```bash
    npm create vite@latest my-workflow-app -- --template react-ts
    ```

    Enter the newly made directory:

    ```bash
    cd my-workflow-app
    ```

    ### Install `workflow` and `nitro`

    <CodeBlockTabs defaultValue="npm">
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm i workflow nitro
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add workflow nitro
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add workflow nitro
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add workflow nitro
        ```
      </CodeBlockTab>
    </CodeBlockTabs>

    <Callout>
      While Vite provides the build tooling and development server, Nitro adds the server framework needed for API routes and deployment. Together they enable building full-stack applications with workflow support. Learn more about Nitro [here](https://v3.nitro.build).
    </Callout>

    ### Configure Vite

    Add `workflow()` to your Vite config. This enables usage of the `"use workflow"` and `"use step"` directives.

    ```typescript title="vite.config.ts" lineNumbers
    import { nitro } from "nitro/vite";
    import { defineConfig } from "vite";
    import { workflow } from "workflow/vite";

    export default defineConfig({
      plugins: [nitro(), workflow()], // [!code highlight]
      nitro: { // [!code highlight]
        serverDir: "./", // [!code highlight]
      }, // [!code highlight]
    });
    ```

    <Accordion type="single" collapsible>
      <AccordionItem value="typescript-intellisense" className="[&_h3]:my-0">
        <AccordionTrigger className="text-sm">
          ### Setup IntelliSense for TypeScript (Optional)
        </AccordionTrigger>

        <AccordionContent className="[&_p]:my-2">
          To enable helpful hints in your IDE, setup the workflow plugin in `tsconfig.json`:

          ```json title="tsconfig.json" lineNumbers
          {
            "compilerOptions": {
              // ... rest of your TypeScript config
              "plugins": [
                {
                  "name": "workflow" // [!code highlight]
                }
              ]
            }
          }
          ```
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Step>

  <Step>
    ## Create Your First Workflow

    Create a new file for our first workflow:

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { sleep } from "workflow";

    export async function handleUserSignup(email: string) {
      "use workflow"; // [!code highlight]

      const user = await createUser(email);
      await sendWelcomeEmail(user);

      await sleep("5s"); // Pause for 5s - doesn't consume any resources
      await sendOnboardingEmail(user);

      return { userId: user.id, status: "onboarded" };
    }

    ```

    We'll fill in those functions next, but let's take a look at this code:

    * We define a **workflow** function with the directive `"use workflow"`. Think of the workflow function as the *orchestrator* of individual **steps**.
    * The Workflow DevKit's `sleep` function allows us to suspend execution of the workflow without using up any resources. A sleep can be a few seconds, hours, days, or even months long.

    ## Create Your Workflow Steps

    Let's now define those missing functions.

    ```typescript title="workflows/user-signup.ts" lineNumbers
    import { FatalError } from "workflow"

    // Our workflow function defined earlier

    async function createUser(email: string) {
      "use step"; // [!code highlight]

      console.log(`Creating user with email: ${email}`);

      // Full Node.js access - database calls, APIs, etc.
      return { id: crypto.randomUUID(), email };
    }

    async function sendWelcomeEmail(user: { id: string; email: string; }) {
      "use step"; // [!code highlight]

      console.log(`Sending welcome email to user: ${user.id}`);

      if (Math.random() < 0.3) {
      // By default, steps will be retried for unhandled errors
       throw new Error("Retryable!");
      }
    }

    async function sendOnboardingEmail(user: { id: string; email: string}) {
      "use step"; // [!code highlight]

      if (!user.email.includes("@")) {
        // To skip retrying, throw a FatalError instead
        throw new FatalError("Invalid Email");
      }

      console.log(`Sending onboarding email to user: ${user.id}`);
    }
    ```

    Taking a look at this code:

    * Business logic lives inside **steps**. When a step is invoked inside a **workflow**, it gets enqueued to run on a separate request while the workflow is suspended, just like `sleep`.
    * If a step throws an error, like in `sendWelcomeEmail`, the step will automatically be retried until it succeeds (or hits the step's max retry count).
    * Steps can throw a `FatalError` if an error is intentional and should not be retried.

    <Callout>
      We'll dive deeper into workflows, steps, and other ways to suspend or handle events in [Foundations](/docs/foundations).
    </Callout>
  </Step>

  <Step>
    ## Create Your Route Handler

    To invoke your new workflow, we'll have to add your workflow to a `POST` API route handler, `api/signup.post.ts` with the following code:

    ```typescript title="api/signup.post.ts"
    import { start } from "workflow/api";
    import { defineEventHandler } from "nitro/h3";
    import { handleUserSignup } from "../workflows/user-signup";

    export default defineEventHandler(async ({ req }) => {
      const { email } = await req.json() as { email: string };
      // Executes asynchronously and doesn't block your app
      await start(handleUserSignup, [email]);
      return {
        message: "User signup workflow started",
      }
    });
    ```

    This route handler creates a `POST` request endpoint at `/api/signup` that will trigger your workflow.

    <Callout>
      Workflows can be triggered from API routes or any server-side code.
    </Callout>
  </Step>
</Steps>

## Run in development

To start your development server, run the following command in your terminal in the Vite root directory:

```bash
npm run dev
```

Once your development server is running, you can trigger your workflow by running this command in the terminal:

```bash
curl -X POST --json '{"email":"hello@example.com"}' http://localhost:3000/api/signup
```

Check the Vite development server logs to see your workflow execute as well as the steps that are being processed.

Additionally, you can use the [Workflow DevKit CLI or Web UI](/docs/observability) to inspect your workflow runs and steps in detail.

```bash
# Open the observability Web UI
npx workflow web
# or if you prefer a terminal interface, use the CLI inspect command
npx workflow inspect runs
```

<img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />

***

## Deploying to production

Workflow DevKit apps currently work best when deployed to [Vercel](https://vercel.com/home) and needs no special configuration.

Check the [Deploying](/docs/deploying) section to learn how your workflows can be deployed elsewhere.

## Next Steps

* Learn more about the [Foundations](/docs/foundations).
* Check [Errors](/docs/errors) if you encounter issues.
* Explore the [API Reference](/docs/api-reference).


---
title: How the Directives Work
description: Deep dive into the internals of how Workflow DevKit directives transform your code.
type: conceptual
summary: Learn how the compiler transforms directive-annotated code into three execution modes.
prerequisites:
  - /docs/how-it-works/understanding-directives
related:
  - /docs/foundations/workflows-and-steps
---

# How the Directives Work



<Callout>
  This is an advanced guide that dives into internals of the Workflow DevKit directive and is not required reading to use workflows. To simply use the Workflow DevKit, check out the [getting started](/docs/getting-started) guides for your framework.
</Callout>

Workflows use special directives to mark code for transformation by the Workflow DevKit compiler. This page explains how `"use workflow"` and `"use step"` directives work, what transformations are applied, and why they're necessary for durable execution.

## Directives Overview

Workflows use two directives to mark functions for special handling:

{/* @skip-typecheck: incomplete code sample */}

```typescript
export async function handleUserSignup(email: string) {
  "use workflow"; // [!code highlight]

  const user = await createUser(email);
  await sendWelcomeEmail(user);

  return { userId: user.id };
}

async function createUser(email: string) {
  "use step"; // [!code highlight]

  return { id: crypto.randomUUID(), email };
}
```

**Key directives:**

* `"use workflow"`: Marks a function as a durable workflow entry point
* `"use step"`: Marks a function as an atomic, retryable step

These directives trigger the `@workflow/swc-plugin` compiler to transform your code in different ways depending on the execution context.

## The Three Transformation Modes

The compiler operates in three distinct modes, transforming the same source code differently for each execution context:

<Mermaid
  chart="flowchart LR
    A[&#x22;Source Code<br/>with directives&#x22;] --> B[&#x22;Step Mode&#x22;]
    A --> C[&#x22;Workflow Mode&#x22;]
    A --> D[&#x22;Client Mode&#x22;]
    B --> E[&#x22;step.js<br/>(Step Execution)&#x22;]
    C --> F[&#x22;flow.js<br/>(Workflow Execution)&#x22;]
    D --> G[&#x22;Your App Code<br/>(Enables `start`)&#x22;]"
/>

### Comparison Table

| Mode     | Used In       | Purpose                                    | Output API Route               | Required?  |
| -------- | ------------- | ------------------------------------------ | ------------------------------ | ---------- |
| Step     | Build time    | Bundles step handlers                      | `.well-known/workflow/v1/step` | Yes        |
| Workflow | Build time    | Bundles workflow orchestrators             | `.well-known/workflow/v1/flow` | Yes        |
| Client   | Build/Runtime | Provides workflow IDs and types to `start` | Your application code          | Optional\* |

\* Client mode is **recommended** for better developer experience—it provides automatic ID generation and type safety. Without it, you must manually construct workflow IDs or use the build manifest.

## Detailed Transformation Examples

<Tabs items={["Step Mode", "Workflow Mode", "Client Mode"]}>
  <Tab value="Step Mode">
    **Step Mode** creates the step execution bundle served at `/.well-known/workflow/v1/step`.

    **Input:**

    {/* @skip-typecheck: incomplete code sample */}

    ```typescript
    export async function createUser(email: string) {
      "use step";
      return { id: crypto.randomUUID(), email };
    }
    ```

    **Output:**

    {/* @skip-typecheck: incomplete code sample */}

    ```typescript
    import { registerStepFunction } from "workflow/internal/private"; // [!code highlight]

    export async function createUser(email: string) {
      return { id: crypto.randomUUID(), email };
    }

    registerStepFunction("step//workflows/user.js//createUser", createUser); // [!code highlight]
    ```

    **What happens:**

    * The `"use step"` directive is removed
    * The function body is kept completely intact (no transformation)
    * The function is registered with the runtime using `registerStepFunction()`
    * Step functions run with full Node.js/Deno/Bun access

    **Why no transformation?** Step functions execute in your main runtime with full access to Node.js APIs, file system, databases, etc. They don't need any special handling—they just run normally.

    **ID Format:** Step IDs follow the pattern `step//{filepath}//{functionName}`, where the filepath is relative to your project root.
  </Tab>

  <Tab value="Workflow Mode">
    **Workflow Mode** creates the workflow execution bundle served at `/.well-known/workflow/v1/flow`.

    **Input:**

    {/* @skip-typecheck: incomplete code sample */}

    ```typescript
    export async function createUser(email: string) {
      "use step";
      return { id: crypto.randomUUID(), email };
    }

    export async function handleUserSignup(email: string) {
      "use workflow";
      const user = await createUser(email);
      return { userId: user.id };
    }
    ```

    **Output:**

    {/* @skip-typecheck: incomplete code sample */}

    ```typescript
    export async function createUser(email: string) {
      return globalThis[Symbol.for("WORKFLOW_USE_STEP")]("step//workflows/user.js//createUser")(email); // [!code highlight]
    }

    export async function handleUserSignup(email: string) {
      const user = await createUser(email);
      return { userId: user.id };
    }
    handleUserSignup.workflowId = "workflow//workflows/user.js//handleUserSignup"; // [!code highlight]
    ```

    **What happens:**

    * Step function bodies are **replaced** with calls to `globalThis[Symbol.for("WORKFLOW_USE_STEP")]`
    * Workflow function bodies remain **intact**—they execute deterministically during replay
    * The workflow function gets a `workflowId` property for runtime identification
    * The `"use workflow"` directive is removed

    **Why this transformation?** When a workflow executes, it needs to replay past steps from the [event log](/docs/how-it-works/event-sourcing) rather than re-executing them. The `WORKFLOW_USE_STEP` symbol is a special runtime hook that:

    1. Checks if the step has already been executed (in the event log)
    2. If yes: Returns the cached result
    3. If no: Triggers a suspension and enqueues the step for background execution

    **ID Format:** Workflow IDs follow the pattern `workflow//{filepath}//{functionName}`. The `workflowId` property is attached to the function to allow [`start()`](/docs/api-reference/workflow-api/start) to work at runtime.
  </Tab>

  <Tab value="Client Mode">
    **Client Mode** transforms workflow functions in your application code to prevent direct execution.

    **Input:**

    {/* @skip-typecheck: incomplete code sample */}

    ```typescript
    export async function handleUserSignup(email: string) {
      "use workflow";
      const user = await createUser(email);
      return { userId: user.id };
    }
    ```

    **Output:**

    {/* @skip-typecheck: incomplete code sample */}

    ```typescript
    export async function handleUserSignup(email: string) {
      throw new Error("You attempted to execute ..."); // [!code highlight]
    }
    handleUserSignup.workflowId = "workflow//workflows/user.js//handleUserSignup"; // [!code highlight]
    ```

    **What happens:**

    * Workflow function bodies are **replaced** with an error throw
    * The `workflowId` property is added (same as workflow mode)
    * Step functions are not transformed in client mode

    **Why this transformation?** Workflow functions cannot be called directly—they must be started using [`start()`](/docs/api-reference/workflow-api/start). The error prevents accidental direct execution while the `workflowId` property allows the `start()` function to identify which workflow to launch.

    The IDs are generated exactly like in workflow mode to ensure they can be directly referenced at runtime.

    <Callout type="info">
      **Client mode is optional:** While recommended for better developer experience (automatic IDs and type safety), you can skip client mode and instead:

      * Manually construct workflow IDs using the pattern `workflow//{filepath}//{functionName}`
      * Use the workflow manifest file generated during build to lookup IDs
      * Pass IDs directly to `start()` as strings

      All framework integrations include client mode as a loader by default.
    </Callout>
  </Tab>
</Tabs>

## Generated Files

When you build your application, the Workflow DevKit generates three handler files in `.well-known/workflow/v1/`:

### `flow.js`

Contains all workflow functions transformed in **workflow mode**. This file is imported by your framework to handle workflow execution requests at `POST /.well-known/workflow/v1/flow`.

**How it's structured:**

All workflow code is bundled together and embedded as a string inside `flow.js`. When a workflow needs to execute, this bundled code is run inside a **Node.js VM** (virtual machine) to ensure:

* **Determinism**: The same inputs always produce the same outputs
* **Side-effect prevention**: Direct access to Node.js APIs, file system, network, etc. is blocked
* **Sandboxed execution**: Workflow orchestration logic is isolated from the main runtime

**Build-time validation:**

The workflow mode transformation validates your code during the build:

* Catches invalid Node.js API usage (like `fs`, `http`, `child_process`)
* Prevents imports of modules that would break determinism

Most invalid patterns cause **build-time errors**, catching issues before deployment.

**What it does:**

* Exports a `POST` handler that accepts Web standard `Request` objects
* Executes bundled workflow code inside a Node.js VM for each request
* Handles workflow execution, replay, and resumption
* Returns execution results to the orchestration layer

<Callout type="info">
  **Why a VM?** Workflow functions must be deterministic to support replay. The VM sandbox prevents accidental use of non-deterministic APIs or side effects. All side effects should be performed in [step functions](/docs/foundations/workflows-and-steps#step-functions) instead.
</Callout>

### `step.js`

Contains all step functions transformed in **step mode**. This file is imported by your framework to handle step execution requests at `POST /.well-known/workflow/v1/step`.

**What it does:**

* Exports a `POST` handler that accepts Web standard `Request` objects
* Executes individual steps with full runtime access
* Returns step results to the orchestration layer

### `webhook.js`

Contains webhook handling logic for delivering external data to running workflows via [`createWebhook()`](/docs/api-reference/workflow/create-webhook).

**What it does:**

* Exports a `POST` handler that accepts webhook payloads
* Validates tokens and routes data to the correct workflow run
* Resumes workflow execution after webhook delivery

**Note:** The webhook file structure varies by framework. Next.js generates `webhook/[token]/route.js` to leverage App Router's dynamic routing, while other frameworks generate a single `webhook.js` or `webhook.mjs` handler.

## Why Three Modes?

The multi-mode transformation enables the Workflow DevKit's durable execution model:

1. **Step Mode** (required) - Bundles executable step functions that can access the full runtime
2. **Workflow Mode** (required) - Creates orchestration logic that can replay from event logs
3. **Client Mode** (optional) - Prevents direct execution and enables type-safe workflow references

This separation allows:

* **Deterministic replay**: Workflows can be safely replayed from event logs without re-executing side effects
* **Sandboxed orchestration**: Workflow logic runs in a controlled VM without direct runtime access
* **Stateless execution**: Your compute can scale to zero and resume from any point in the workflow
* **Type safety**: TypeScript works seamlessly with workflow references (when using client mode)

## Determinism and Replay

A key aspect of the transformation is maintaining **deterministic replay** for workflow functions.

**Workflow functions must be deterministic:**

* Same inputs always produce the same outputs
* No direct side effects (no API calls, no database writes, no file I/O)
* Can use seeded random/time APIs provided by the VM (`Math.random()`, `Date.now()`, etc.)

Because workflow functions are deterministic and have no side effects, they can be safely re-run multiple times to calculate what the next step should be. This is why workflow function bodies remain intact in workflow mode—they're pure orchestration logic.

**Step functions can be non-deterministic:**

* Can make API calls, database queries, etc.
* Have full access to Node.js runtime and APIs
* Results are cached in the [event log](/docs/how-it-works/event-sourcing) after first execution

Learn more about [Workflows and Steps](/docs/foundations/workflows-and-steps).

## ID Generation

The compiler generates stable IDs for workflows and steps based on file paths and function names:

**Pattern:** `{type}//{filepath}//{functionName}`

**Examples:**

* `workflow//workflows/user-signup.js//handleUserSignup`
* `step//workflows/user-signup.js//createUser`
* `step//workflows/payments/checkout.ts//processPayment`

**Key properties:**

* **Stable**: IDs don't change unless you rename files or functions
* **Unique**: Each workflow/step has a unique identifier
* **Portable**: Works across different runtimes and deployments

<Callout type="info">
  Although IDs can change when files are moved or functions are renamed, Workflow DevKit function assume atomic versioning in the World. This means changing IDs won't break old workflows from running, but will prevent run from being upgraded and will cause your workflow/step names to change in the observability across deployments.
</Callout>

## Framework Integration

These transformations are framework-agnostic—they output standard JavaScript that works anywhere.

**For users**: Your framework handles all transformations automatically. See the [Getting Started](/docs/getting-started) guide for your framework.

**For framework authors**: Learn how to integrate these transformations into your framework in [Building Framework Integrations](/docs/how-it-works/framework-integrations).

## Debugging Transformed Code

If you need to debug transformation issues, you can inspect the generated files:

1. **Look in `.well-known/workflow/v1/`**: Check the generated `flow.js`, `step.js`,`webhook.js`, and other emitted debug files.
2. **Check build logs**: Most frameworks log transformation activity during builds
3. **Verify directives**: Ensure `"use workflow"` and `"use step"` are the first statements in functions
4. **Check file locations**: Transformations only apply to files in configured source directories


---
title: Event Sourcing
description: Learn how Workflow DevKit uses event sourcing internally for debugging and observability.
type: conceptual
summary: Understand the event log that powers workflow replay and debugging.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/observability
---

# Event Sourcing



<Callout>
  This guide explores how the Workflow DevKit uses event sourcing internally. Understanding these concepts is helpful for debugging and building observability tools, but is not required to use workflows. For getting started with workflows, see the [getting started](/docs/getting-started) guides for your framework.
</Callout>

The Workflow DevKit uses event sourcing to track all state changes in workflow executions. Every mutation creates an event that is persisted to the event log, and entity state is derived by replaying these events.

This page explains the event sourcing model and entity lifecycles.

## Event Sourcing Overview

Event sourcing is a persistence pattern where state changes are stored as a sequence of events rather than by updating records in place. The current state of any entity is reconstructed by replaying its events from the beginning.

**Benefits for durable workflows:**

* **Complete audit trail**: Every state change is recorded with its timestamp and context
* **Debugging**: Replay the exact sequence of events that led to any state
* **Consistency**: Events provide a single source of truth for all entity state
* **Recoverability**: State can be reconstructed from the event log after failures

In the Workflow DevKit, the following entity types are managed through events:

* **Runs**: Workflow execution instances (materialized in storage)
* **Steps**: Individual atomic operations within a workflow (materialized in storage)
* **Hooks**: Suspension points that can receive external data (materialized in storage)
* **Waits**: Sleep or delay operations (materialized in storage)

## Entity Lifecycles

Each entity type follows a specific lifecycle defined by the events that can affect it. Events transition entities between states, and certain states are terminal—once reached, no further transitions are possible.

<Callout type="info">
  In the diagrams below, <span style={{color: '#8b5cf6', fontWeight: 'bold'}}>purple nodes</span> indicate terminal states that cannot be transitioned out of.
</Callout>

### Run Lifecycle

A run represents a single execution of a workflow function. Runs begin in `pending` state when created, transition to `running` when execution starts, and end in one of three terminal states.

<Mermaid
  chart="flowchart TD
    A[&#x22;(start)&#x22;] -->|&#x22;run_created&#x22;| B[&#x22;pending&#x22;]
    B -->|&#x22;run_started&#x22;| C[&#x22;running&#x22;]
    C -->|&#x22;run_completed&#x22;| D[&#x22;completed&#x22;]
    C -->|&#x22;run_failed&#x22;| E[&#x22;failed&#x22;]
    C -->|&#x22;run_cancelled&#x22;| F[&#x22;cancelled&#x22;]
    B -->|&#x22;run_cancelled&#x22;| F

    style D fill:#a78bfa,stroke:#8b5cf6,color:#000
    style E fill:#a78bfa,stroke:#8b5cf6,color:#000
    style F fill:#a78bfa,stroke:#8b5cf6,color:#000"
/>

**Run states:**

* `pending`: Created but not yet executing
* `running`: Actively executing workflow code
* `completed`: Finished successfully with an output value
* `failed`: Terminated due to an unrecoverable error
* `cancelled`: Explicitly cancelled by the user or system

### Step Lifecycle

A step represents a single invocation of a step function. Steps can retry on failure, either transitioning back to `pending` via `step_retrying` or being re-executed directly with another `step_started` event.

<Mermaid
  chart="flowchart TD
    A[&#x22;(start)&#x22;] -->|&#x22;step_created&#x22;| B[&#x22;pending&#x22;]
    B -->|&#x22;step_started&#x22;| C[&#x22;running&#x22;]
    C -->|&#x22;step_completed&#x22;| D[&#x22;completed&#x22;]
    C -->|&#x22;step_failed&#x22;| E[&#x22;failed&#x22;]
    C -.->|&#x22;step_retrying&#x22;| B

    style D fill:#a78bfa,stroke:#8b5cf6,color:#000
    style E fill:#a78bfa,stroke:#8b5cf6,color:#000"
/>

**Step states:**

* `pending`: Created but not yet executing, or waiting to retry
* `running`: Actively executing step code
* `completed`: Finished successfully with a result value
* `failed`: Terminated after exhausting all retry attempts
* `cancelled`: Reserved for future use (not currently emitted)

<Callout type="info">
  The `step_retrying` event is optional. Steps can retry without it - the retry mechanism works regardless of whether this event is emitted. You may see back-to-back `step_started` events in logs when a step retries after a timeout or when the error is not explicitly captured. See [Errors and Retries](/docs/foundations/errors-and-retries) for more on how retries work.
</Callout>

When present, the `step_retrying` event moves a step back to `pending` state and records the error that caused the retry. This provides two benefits:

* **Cleaner observability**: The event log explicitly shows retry transitions rather than consecutive `step_started` events
* **Error history**: The error that triggered the retry is preserved for debugging

### Hook Lifecycle

A hook represents a suspension point that can receive external data, created by [`createHook()`](/docs/api-reference/workflow/create-hook). Hooks enable workflows to pause and wait for external events, user interactions, or HTTP requests. Webhooks (created with [`createWebhook()`](/docs/api-reference/workflow/create-webhook)) are a higher-level abstraction built on hooks that adds automatic HTTP request/response handling.

Hooks can receive multiple payloads while active and are disposed when no longer needed.

<Mermaid
  chart="flowchart TD
    A[&#x22;(start)&#x22;] -->|&#x22;hook_created&#x22;| B[&#x22;active&#x22;]
    A -->|&#x22;hook_conflict&#x22;| D[&#x22;conflicted&#x22;]
    B -->|&#x22;hook_received&#x22;| B
    B -->|&#x22;hook_disposed&#x22;| C[&#x22;disposed&#x22;]

    style C fill:#a78bfa,stroke:#8b5cf6,color:#000
    style D fill:#a78bfa,stroke:#8b5cf6,color:#000"
/>

**Hook states:**

* `active`: Ready to receive payloads (hook exists in storage)
* `disposed`: No longer accepting payloads (hook is deleted from storage)
* `conflicted`: Hook creation failed because the token is already in use by another workflow

Unlike other entities, hooks don't have a `status` field—the states above are conceptual. An "active" hook is one that exists in storage, while "disposed" means the hook has been deleted. When a `hook_disposed` event is created, the hook record is removed rather than updated.

While a hook is active, its token is reserved and cannot be used by other workflows. If a workflow attempts to create a hook with a token that is already in use by another active hook, a `hook_conflict` event is recorded instead of `hook_created`. This causes the hook's promise to reject with a `WorkflowRuntimeError`, failing the workflow gracefully. See the [hook-conflict error](/docs/errors/hook-conflict) documentation for more details.

When a hook is disposed (either explicitly or when its workflow completes), the token is released and can be claimed by future workflows. Hooks are automatically disposed when a workflow reaches a terminal state (`completed`, `failed`, or `cancelled`). The `hook_disposed` event is only needed for explicit disposal before workflow completion.

See [Hooks & Webhooks](/docs/foundations/hooks) for more on how hooks and webhooks work.

### Wait Lifecycle

A wait represents a sleep operation created by [`sleep()`](/docs/api-reference/workflow/sleep). Waits track when a delay period has elapsed.

<Mermaid
  chart="flowchart TD
    A[&#x22;(start)&#x22;] -->|&#x22;wait_created&#x22;| B[&#x22;waiting&#x22;]
    B -->|&#x22;wait_completed&#x22;| C[&#x22;completed&#x22;]

    style C fill:#a78bfa,stroke:#8b5cf6,color:#000"
/>

**Wait states:**

* `waiting`: Delay period has not yet elapsed
* `completed`: Delay period has elapsed, workflow can resume

<Callout type="info">
  Like Runs, Steps, and Hooks, waits are materialized as entities in storage. When a `wait_created` event is processed, a wait entity is created with status `waiting`. When a `wait_completed` event is processed, the wait entity is atomically transitioned to `completed` — this guarantees that a wait can only be completed exactly once, even if multiple concurrent invocations attempt to complete it simultaneously.
</Callout>

## Event Types Reference

Events are categorized by the entity type they affect. Each event contains metadata including a timestamp and a `correlationId` that links the event to a specific entity:

* Step events use the `stepId` as the correlation ID
* Hook events use the `hookId` as the correlation ID
* Wait events use the `waitId` as the correlation ID
* Run events do not require a correlation ID since the `runId` itself identifies the entity

### Run Events

| Event           | Description                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `run_created`   | Creates a new workflow run in `pending` state. Contains the deployment ID, workflow name, input arguments, and optional execution context. |
| `run_started`   | Transitions the run to `running` state when execution begins.                                                                              |
| `run_completed` | Transitions the run to `completed` state with the workflow's return value.                                                                 |
| `run_failed`    | Transitions the run to `failed` state with error details and optional error code.                                                          |
| `run_cancelled` | Transitions the run to `cancelled` state. Can be triggered from `pending` or `running` states.                                             |

### Step Events

| Event            | Description                                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `step_created`   | Creates a new step in `pending` state. Contains the step name and serialized input arguments.                                                                                                                                  |
| `step_started`   | Transitions the step to `running` state. Includes the current attempt number for retries.                                                                                                                                      |
| `step_completed` | Transitions the step to `completed` state with the step's return value.                                                                                                                                                        |
| `step_failed`    | Transitions the step to `failed` state with error details. The step will not be retried.                                                                                                                                       |
| `step_retrying`  | (Optional) Transitions the step back to `pending` state for retry. Contains the error that caused the retry and optional delay before the next attempt. When not emitted, retries appear as consecutive `step_started` events. |

### Hook Events

| Event           | Description                                                                                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hook_created`  | Creates a new hook in `active` state. Contains the hook token and optional metadata.                                                                                                                      |
| `hook_conflict` | Records that hook creation failed because the token is already in use by another active hook. The hook is not created, and the workflow will fail with a `WorkflowRuntimeError` when the hook is awaited. |
| `hook_received` | Records that a payload was delivered to the hook. The hook remains `active` and can receive more payloads.                                                                                                |
| `hook_disposed` | Deletes the hook from storage (conceptually transitioning to `disposed` state). The token is released for reuse by future workflows.                                                                      |

### Wait Events

| Event            | Description                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `wait_created`   | Creates a new wait in `waiting` state. Contains the timestamp when the wait should complete. |
| `wait_completed` | Transitions the wait to `completed` state when the delay period has elapsed.                 |

## Terminal States

Terminal states represent the end of an entity's lifecycle. Once an entity reaches a terminal state, no further events can transition it to another state.

**Run terminal states:**

* `completed`: Workflow finished successfully
* `failed`: Workflow encountered an unrecoverable error
* `cancelled`: Workflow was explicitly cancelled

**Step terminal states:**

* `completed`: Step finished successfully
* `failed`: Step failed after all retry attempts

**Hook terminal states:**

* `disposed`: Hook has been deleted from storage and is no longer active
* `conflicted`: Hook creation failed due to token conflict (hook was never created)

**Wait terminal states:**

* `completed`: Delay period has elapsed

Attempting to create an event that would transition an entity out of a terminal state will result in an error. This prevents inconsistent state and ensures the integrity of the event log.

## Event Correlation

Events use a `correlationId` to link related events together. For step, hook, and wait events, the correlation ID identifies the specific entity instance:

* Step events share the same `correlationId` (the step ID) across all events for that step execution
* Hook events share the same `correlationId` (the hook ID) across all events for that hook
* Wait events share the same `correlationId` (the wait ID) across creation and completion

Run events do not require a correlation ID since the `runId` itself provides the correlation.

This correlation enables:

* Querying all events for a specific step, hook, or wait
* Building timelines of entity lifecycle transitions
* Debugging by tracing the complete history of any entity

## Entity IDs

All entities in the Workflow DevKit use a consistent ID format: a 4-character prefix followed by an underscore and a [ULID](https://github.com/ulid/spec) (Universally Unique Lexicographically Sortable Identifier).

| Entity | Prefix  | Example                         |
| ------ | ------- | ------------------------------- |
| Run    | `wrun_` | `wrun_01HXYZ123ABC456DEF789GHJ` |
| Step   | `step_` | `step_01HXYZ123ABC456DEF789GHJ` |
| Hook   | `hook_` | `hook_01HXYZ123ABC456DEF789GHJ` |
| Wait   | `wait_` | `wait_01HXYZ123ABC456DEF789GHJ` |
| Event  | `evnt_` | `evnt_01HXYZ123ABC456DEF789GHJ` |
| Stream | `strm_` | `strm_01HXYZ123ABC456DEF789GHJ` |

**Why this format?**

* **Prefixes enable introspection**: Given any ID, you can immediately identify what type of entity it refers to. This makes debugging, logging, and cross-referencing entities across the system straightforward.

* **ULIDs enable chronological ordering**: Unlike UUIDs, ULIDs encode a timestamp in their first 48 bits, making them lexicographically sortable by creation time. This property is essential for the event log—events are always stored and retrieved in the correct chronological order simply by sorting their IDs.


---
title: Framework Integrations
description: Guide for framework authors to integrate Workflow DevKit with custom frameworks or runtimes.
type: guide
summary: Build a custom framework integration using the Workflow DevKit compiler and runtime.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/deploying/building-a-world
---

# Framework Integrations



<Callout>
  **For users:** If you just want to use Workflow DevKit with an existing framework, check out the [Getting Started](/docs/getting-started) guide instead. This page is for framework authors who want to integrate Workflow DevKit with their framework or runtime.
</Callout>

This guide walks you through building a framework integration for Workflow DevKit using Bun as a concrete example. The same principles apply to any JavaScript runtime (Node.js, Deno, Cloudflare Workers, etc.).

<Callout type="info">
  **Prerequisites:** Before building a framework integration, we recommend reading [How the Directives Work](/docs/how-it-works/code-transform) to understand the transformation system that powers Workflow DevKit.
</Callout>

## What You'll Build

A framework integration has two main components:

1. **Build-time**: Generate workflow handler files (`flow.js`, `step.js`, `webhook.js`)
2. **Runtime**: Expose these handlers as HTTP endpoints in your application server

<Mermaid
  chart="flowchart TD
    A[&#x22;Source Code<br/>'use workflow'&#x22;] --> B[&#x22;Workflow Builder&#x22;]
    B --> C[&#x22;SWC Transform&#x22;]
    C --> D[&#x22;Step Mode&#x22;]
    C --> E[&#x22;Workflow Mode&#x22;]
    C --> F[&#x22;Client Mode&#x22;]
    D --> G[&#x22;Generated Handlers<br/>step.js&#x22;]
    E --> H[&#x22;Generated Handlers<br/>flow.js&#x22;]
    B --> L[&#x22;Generated Handlers<br/>webhook.js&#x22;]
    F --> I[&#x22;Used by framework loader&#x22;]
    G --> J[&#x22;HTTP Server<br/>(Your Runtime)&#x22;]
    H --> J
    L --> J

    style B fill:#a78bfa,stroke:#8b5cf6,color:#000
    style I fill:#a78bfa,stroke:#8b5cf6,color:#000
    style J fill:#a78bfa,stroke:#8b5cf6,color:#000"
/>

The purple boxes are what you implement—everything else is provided by Workflow DevKit.

## Example: Bun Integration

Let's build a complete integration for Bun. Bun is unique because it serves as both a runtime (needs code transformations) and a framework (provides `Bun.serve()` for HTTP routing).

<Callout type="info">
  A working example can be [found here](https://github.com/vercel/workflow-examples/tree/main/custom-adapter). For a production-ready reference, see the [Next.js integration](https://github.com/vercel/workflow/tree/main/packages/next).
</Callout>

### Step 1: Generate Handler Files

Use the `workflow` CLI to generate the handler bundles. The CLI scans your `workflows/` directory and creates `flow.js`, `step.js`, and `webhook.js`.

```json title="package.json"
{
  "scripts": {
    "dev": "bun x workflow build && PORT=3152 bun run server.ts"
  }
}
```

<Callout>
  **For production integrations:** Instead of using the CLI, extend the `BaseBuilder` class directly in your framework plugin. This gives you control over file watching, custom output paths, and framework-specific hooks. See the [Next.js plugin](https://github.com/vercel/workflow/tree/main/packages/next) for an example.
</Callout>

**What gets generated:**

* `/.well-known/workflow/v1/flow.js` - Handles workflow execution (workflow mode transform)
* `/.well-known/workflow/v1/step.js` - Handles step execution (step mode transform)
* `/.well-known/workflow/v1/webhook.js` - Handles webhook delivery

Each file exports a `POST` function that accepts Web standard `Request` objects.

### Step 2: Add Client Mode Transform (Optional)

Client mode transforms your application code to provide better DX. Add a Bun plugin to apply this transformation at runtime:

{/* @skip-typecheck: incomplete code sample */}

```typescript title="workflow-plugin.ts" lineNumbers
import { plugin } from "bun";
import { transform } from "@swc/core";

plugin({
  name: "workflow-transform",
  setup(build) {
    build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args) => {
      const source = await Bun.file(args.path).text();

      // Optimization: Skip files that do not have any directives
      if (!source.match(/(use step|use workflow)/)) {
        return { contents: source };
      }

      const result = await transform(source, {
        filename: args.path,
        jsc: {
          experimental: {
            plugins: [
              [require.resolve("@workflow/swc-plugin"), { mode: "client" }], // [!code highlight]
            ],
          },
        },
      });

      return { contents: result.code, loader: "ts" };
    });
  },
});
```

Activate the plugin in `bunfig.toml`:

```toml title="bunfig.toml"
preload = ["./workflow-plugin.ts"]
```

**What this does:**

* Attaches workflow IDs to functions for use with `start()`
* Provides TypeScript type safety
* Prevents accidental direct execution of workflows

**Why optional?** Without client mode, you can still use workflows by manually constructing IDs or referencing the build manifest.

### Step 3: Expose HTTP Endpoints

Wire up the generated handlers to HTTP endpoints using `Bun.serve()`:

{/* @skip-typecheck: incomplete code sample */}

```typescript title="server.ts" lineNumbers
import flow from "./.well-known/workflow/v1/flow.js";
import step from "./.well-known/workflow/v1/step.js";
import * as webhook from "./.well-known/workflow/v1/webhook.js";

import { start } from "workflow/api";
import { handleUserSignup } from "./workflows/user-signup.js";

const server = Bun.serve({
  port: process.env.PORT,
  routes: {
    "/.well-known/workflow/v1/flow": {
      POST: (req) => flow.POST(req),
    },
    "/.well-known/workflow/v1/step": {
      POST: (req) => step.POST(req),
    },
    // webhook exports handlers for GET, POST, DELETE, etc.
    "/.well-known/workflow/v1/webhook/:token": webhook,

    // Example: Start a workflow
    "/": {
      GET: async (req) => {
        const email = `test-${crypto.randomUUID()}@test.com`;
        const run = await start(handleUserSignup, [email]);
        return Response.json({
          message: "User signup workflow started",
          runId: run.runId,
        });
      },
    },
  },
});

console.log(`Server listening on http://localhost:${server.port}`);
```

**That's it!** Your Bun integration is complete.

## Understanding the Endpoints

Your integration must expose three HTTP endpoints. The generated handlers manage all protocol details—you just route requests.

### Workflow Endpoint

**Route:** `POST /.well-known/workflow/v1/flow`

Executes workflow orchestration logic. The workflow function is "rendered" multiple times during execution—each time it progresses until it encounters the next step.

**Called when:**

* Starting a new workflow
* Resuming after a step completes
* Resuming after a webhook or hook triggers
* Recovering from failures

### Step Endpoint

**Route:** `POST /.well-known/workflow/v1/step`

Executes individual atomic operations within workflows. Each step runs exactly once per execution (unless retried due to failure). Steps have full runtime access (Node.js APIs, file system, databases, etc.).

### Webhook Endpoint

**Route:** `POST /.well-known/workflow/v1/webhook/:token`

Delivers webhook data to running workflows via [`createWebhook()`](/docs/api-reference/workflow/create-webhook). The `:token` parameter identifies which workflow run should receive the data.

<Callout type="info">
  The webhook file structure varies by framework. Next.js generates `webhook/[token]/route.js` to leverage App Router's dynamic routing, while other frameworks generate a single `webhook.js` handler.
</Callout>

## Adapting to Other Frameworks

The Bun example demonstrates the core pattern. To adapt for your framework:

### Build-Time

**Option 1: Use the CLI** (simplest)

```bash
workflow build
```

This will default to scanning the `./workflows` top-level directory for workflow files, and will output bundled files directly into your working directory.

**Option 2: Extend `BaseBuilder`** (recommended)

{/* @skip-typecheck: @workflow/cli internal module */}

```typescript lineNumbers
import { BaseBuilder } from "@workflow/cli/dist/lib/builders/base-builder";

class MyFrameworkBuilder extends BaseBuilder {
  constructor(options) {
    super({
      dirs: ["workflows"],
      workingDir: options.rootDir,
      watch: options.dev,
    });
  }

  override async build(): Promise<void> {
    const inputFiles = await this.getInputFiles();

    await this.createWorkflowsBundle({
      outfile: "/path/to/.well-known/workflow/v1/flow.js",
      format: "esm",
      inputFiles,
    });

    await this.createStepsBundle({
      outfile: "/path/to/.well-known/workflow/v1/step.js",
      format: "esm",
      inputFiles,
    });

    await this.createWebhookBundle({
      outfile: "/path/to/.well-known/workflow/v1/webhook.js",
    });
  }
}
```

If your framework supports virtual server routes and dev mode watching, make sure to adapt accordingly. Please open a PR to the Workflow DevKit if the base builder class is missing necessary functionality.

Hook into your framework's build:

{/* @skip-typecheck: incomplete code sample */}

```typescript title="pseudocode.ts" lineNumbers
framework.hooks.hook("build:before", async () => {
  await new MyFrameworkBuilder(framework).build();
});
```

### Runtime (Client Mode)

Add a loader/plugin for your bundler:

**Rollup/Vite:**

```typescript lineNumbers
export function workflowPlugin() {
  return {
    name: "workflow-client-transform",
    async transform(code, id) {
      if (!code.match(/(use step|use workflow)/)) return null;

      const result = await transform(code, {
        filename: id,
        jsc: {
          experimental: {
            plugins: [[require.resolve("@workflow/swc-plugin"), { mode: "client" }]], // [!code highlight]
          },
        },
      });

      return { code: result.code, map: result.map };
    },
  };
}
```

**Webpack:**

```javascript lineNumbers
module.exports = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        use: "workflow-client-loader", // Similar implementation
      },
    ],
  },
};
```

### HTTP Server

Route the three endpoints to the generated handlers. The exact implementation depends on your framework's routing API.

In the bun example above, we left routing to the user. Essentially, the user has to serve routes like this:

{/* @skip-typecheck: incomplete code sample */}

```typescript title="server.ts" lineNumbers
import flow from "./.well-known/workflow/v1/flow.js";
import step from "./.well-known/workflow/v1/step.js";
import * as webhook from "./.well-known/workflow/v1/webhook.js";

// Expose the 3 generated routes
const server = Bun.serve({
  routes: {
    "/.well-known/workflow/v1/flow": {
      POST: (req) => flow.POST(req),
    },
    "/.well-known/workflow/v1/step": {
      POST: (req) => step.POST(req),
    },
    // webhook exports handlers for GET, POST, DELETE, etc.
    "/.well-known/workflow/v1/webhook/:token": webhook,
  },
});
```

Production framework integrations should handle this routing in the plugin instead of leaving it to the user, and this depends on each framework's unique implementaiton.
Check the Workflow DevKit source code for examples of production framework implementations.
In the future, the Workflow DevKit will emit more routes under the `.well-known/workflow` namespace.

## Security

**How are these HTTP endpoints secured?**

Security is handled by the **world abstraction** you're using:

**Vercel (`@workflow/world-vercel`):**

* Vercel Queue will support private invoke, making routes inaccessible from the public internet
* Handlers receive only a message ID that must be retrieved from Vercel's backend
* Impossible to craft custom payloads without valid queue-issued message IDs

**Custom implementations:**

* Implement authentication via framework middleware
* Use API keys, JWT validation, or other auth schemes
* Network-level security (VPCs, private networks, firewall rules)
* Rate limiting and request validation

Learn more about [building custom Worlds](/docs/deploying/building-a-world).

## Testing Your Integration

### 1. Test Build Output

Create a test workflow:

```typescript title="workflows/test.ts" lineNumbers
import { sleep, createWebhook } from "workflow";

export async function handleUserSignup(email: string) {
  "use workflow";

  const user = await createUser(email);
  await sendWelcomeEmail(user);

  await sleep("5s");

  const webhook = createWebhook();
  await sendOnboardingEmail(user, webhook.url);

  await webhook;
  console.log("Webhook Resolved");

  return { userId: user.id, status: "onboarded" };
}

async function createUser(email: string) {
  "use step";

  console.log(`Creating a new user with email: ${email}`);

  return { id: crypto.randomUUID(), email };
}

async function sendWelcomeEmail(user: { id: string; email: string }) {
  "use step";

  console.log(`Sending welcome email to user: ${user.id}`);
}

async function sendOnboardingEmail(user: { id: string; email: string }, callback: string) {
  "use step";

  console.log(`Sending onboarding email to user: ${user.id}`);

  console.log(`Click this link to resolve the webhook: ${callback}`);
}

```

Run your build and verify:

* `.well-known/workflow/v1/flow.js` exists
* `.well-known/workflow/v1/step.js` exists
* `.well-known/workflow/v1/webhook.js` exists

### 2. Test HTTP Endpoints

Start your server and verify routes respond:

```bash
curl -X POST http://localhost:3000/.well-known/workflow/v1/flow
curl -X POST http://localhost:3000/.well-known/workflow/v1/step
curl -X POST http://localhost:3000/.well-known/workflow/v1/webhook/test
```

(Should respond but not trigger meaningful code without authentication/proper workflow run)

### 3. Run a Workflow End-to-End

```typescript
import { start } from "workflow/api";
import { handleUserSignup } from "./workflows/test";

const run = await start(handleUserSignup, ["test@example.com"]);
console.log("Workflow started:", run.runId);
```


---
title: Understanding Directives
description: Explore how JavaScript directives enable the Workflow DevKit's durable execution model.
type: conceptual
summary: Explore the design decisions behind "use workflow" and "use step" directives.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/how-it-works/code-transform
---

# Understanding Directives



import { File, Folder, Files } from "fumadocs-ui/components/files";

<Callout>
  This guide explores how JavaScript directives enable the Workflow DevKit's execution model. For getting started with workflows, see the [getting started](/docs/getting-started) guides for your framework.
</Callout>

The Workflow Development Kit uses JavaScript directives (`"use workflow"` and `"use step"`) as the foundation for its durable execution model. Directives provide the compile-time semantic boundary necessary for workflows to suspend, resume, and maintain deterministic behavior across replays.

This page explores how directives enable this execution model and the design principles that led us here.

To understand how directives work, let's first understand what workflows and steps are in the Workflow DevKit.

## Workflows and Steps Primer

The Workflow DevKit has two types of functions:

**Step functions** are side-effecting operations with full Node.js runtime access. Think of them like named RPC calls - they run once, their result is persisted, and they can be [retried on failure](/docs/foundations/errors-and-retries):

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
async function fetchUserData(userId: string) {
  "use step";

  // Full Node.js access: database calls, API requests, file I/O
  const user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  return user;
}
```

**Workflow functions** are deterministic orchestrators that coordinate steps. They must be pure functions - during replay, the same step results always produce the same output. This is necessary because workflows resume by replaying their code from the beginning using cached step results; non-deterministic logic would break resumption. They run in a sandboxed environment without direct Node.js access:

```typescript lineNumbers
export async function onboardUser(userId: string) {
  "use workflow";

  const user = await fetchUserData(userId); // Calls step

  // Non-deterministic code would break replay behavior // [!code highlight]
  if (Math.random() > 0.5) { // [!code highlight]
    await sendWelcomeEmail(user); // [!code highlight]
  } // [!code highlight]

  return `Onboarded ${user.name}!`;
}
```

**The key insight:** Workflows resume from suspension by replaying their code using cached step results from the [event log](/docs/how-it-works/event-sourcing). When a step like `await fetchUserData(userId)` is called:

* **If already executed:** Returns the cached result immediately from the event log
* **If not yet executed:** Suspends the workflow, enqueues the step for background execution, and resumes later with the result

This replay mechanism requires deterministic code. If `Math.random()` weren't seeded, the first execution might return `0.7` (sending the email) but replay might return `0.3` (skipping it), thus breaking resumption. The Workflow DevKit sandbox provides seeded `Math.random()` and `Date` to ensure consistent behavior across replays.

<Callout>
  For a deeper dive into workflows and steps, see [Workflows and Steps](/docs/foundations/workflows-and-steps).
</Callout>

## The Core Challenge

This execution model enables powerful durability features - workflows can suspend for days, survive restarts, and resume from any point. However, it also requires a semantic boundary in the code that tells **the compiler, runtime, and developer** that execution semantics have changed.

The challenge: how do we mark this boundary in a way that:

1. Enables compile-time transformations and validation
2. Prevents accidental use of non-deterministic APIs
3. Allows static analysis of workflow structure
4. Feels natural to JavaScript developers

Let's look at where directives have been used before, and the alternatives we considered:

## Prior art on directives

JavaScript directives have precedent for changing execution semantics within a defined scope:

* `"use strict"` (introduced in ECMAScript 5 in 2009, TC39-standardized) changes language rules to make the runtime faster, safer, and more predictable.
* `"use client"` and `"use server"` (introduced by [React Server Components](https://react.dev/reference/rsc/server-components)) define an explicit boundary of "where" code gets executed - client-side browser JavaScript vs server-side Node.js.
* `"use workflow"` (introduced by the Workflow DevKit) defines both "where" code runs (in a deterministic sandbox environment) and "how" it runs (deterministic, resumable, sandboxed execution semantics).

Directives provide a build-time contract.

When the Workflow DevKit sees `"use workflow"`, it:

* Bundles the workflow and its dependencies into code that can be run in a sandbox
* Restricts access to Node.js APIs in that sandbox
* Enables future functionality and optimizations only possible with a build tool
  * For instance, the bundled workflow code can be statically analyzed to generate UML diagrams/visualizations of the workflow

In addition to being important to the compiler, `"use workflow"` explicitly signals to the developer that you are entering a different execution mode.

<Callout type="info">
  The `"use workflow"` directive is also used by the Language Server Plugin shipped with Workflow DevKit to provide IntelliSense to your IDE. Check the [getting started instructions](/docs/getting-started) for your framework for details on setting up the Language Server Plugin.
</Callout>

But we didn't get here immediately. This took some discovery to arrive at:

## Alternatives We Explored

Before settling on directives, we prototyped several other approaches. Each had significant limitations that made them unsuitable for production use.

### Runtime-Only "Suspense" API

Our first proof of concept used a wrapper-based API without a build step:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
export const myWorkflow = workflow(() => {
  const message = run(async () => step());
  return `${message}!`;
});
```

This implementation used "throwing promises" (similar to early React Suspense) to suspend execution. When a step needed to run, we'd throw a promise, catch it at the workflow boundary, execute the step, and replay the workflow with the result.

**The problems:**

**1. Every side effect needed wrapping**

Any operation that could produce non-deterministic results had to be wrapped in `run()`:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
export const myWorkflow = workflow(async () => {
  // These would be non-deterministic without wrapping
  const now = await run(() => Date.now()); // [!code highlight]
  const random = await run(() => Math.random()); // [!code highlight]
  const user = await run(() => fetchUser()); // [!code highlight]

  return { now, random, user };
});
```

This was verbose and easy to forget. Moreover, if a developer forgot to wrap something innocent like using `Date.now()`, it led to unstable runtime behavior.

For example:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
export const myWorkflow = workflow(async () => {
  // Nothing stops you from doing this:
  const now = Date.now(); // Non-deterministic, untracked! // [!code highlight]
  const user = await run(() => fetchUser());

  // This workflow would produce different results on replay // [!code highlight]
  return { now, user };
});
```

**2. Closures and mutation became unpredictable**

Variables captured in closures would behave unexpectedly when steps mutated them:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
export const myWorkflow = workflow(async () => {
  let counter = 0;

  await run(() => {
    counter++; // This mutation happens during step execution // [!code highlight]
    return saveToDatabase(counter);
  });

  console.log(counter); // What is counter here? // [!code highlight]
  // During execution: 1 (mutation preserved) // [!code highlight]
  // During replay: 0 (mutation lost) // [!code highlight]
  // Inconsistent behavior! // [!code highlight]
});
```

The workflow function would replay multiple times, but mutations inside `run()` callbacks wouldn't persist across replays. This made reasoning about state nearly impossible.

**3. Error handling broke down**

Since we used thrown promises for control flow, `try/catch` blocks became unreliable:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
export const myWorkflow = workflow(async () => {
  try {
    const result = await run(() => step());
    return result;
  } catch (error) { // [!code highlight]
    // This could catch: // [!code highlight]
    // 1. A real error from the step // [!code highlight]
    // 2. The thrown promise used for suspension // [!code highlight]
    // 3. An error during replay // [!code highlight]
    // Hard to distinguish without special handling // [!code highlight]
    console.error(error);
  }
});
```

### Generator-Based API

We explored using generators for explicit suspension points, inspired by libraries like Effect.ts:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
export const myWorkflow = workflow(function*() {
  const message = yield* run(() => step());
  return `${message}!`;
});
```

<Callout type="info">
  We're big fans of [Effect.ts](https://effect.website/) and the power of generator-based APIs for effect management. However, for workflow orchestration specifically, we found the syntax too heavy for developers unfamiliar with generators.
</Callout>

**The problems:**

**1. Syntax felt more like a DSL than JavaScript**

Generators require a custom mental model that differs significantly from familiar async/await patterns. The `yield*` syntax and generator delegation were unfamiliar to many developers:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
// Standard async/await (familiar)
const result = await fetchData();

// Generator-based (unfamiliar)
const result = yield* run(() => fetchData()); // [!code highlight]
```

Complex workflows became particularly verbose and difficult to read:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
export const myWorkflow = workflow(function*() {
  const user = yield* run(() => fetchUser());

  // Can't use Promise.all directly - need sequential calls or custom helpers // [!code highlight]
  const orders = yield* run(() => fetchOrders(user.id)); // [!code highlight]
  const payments = yield* run(() => fetchPayments(user.id)); // [!code highlight]

  // Or create a custom generator-aware parallel helper: // [!code highlight]
  const [orders2, payments2] = yield* all([ // [!code highlight]
    run(() => fetchOrders(user.id)), // [!code highlight]
    run(() => fetchPayments(user.id)) // [!code highlight]
  ]); // [!code highlight]

  return { user, orders, payments };
});
```

**2. Still no compile-time sandboxing**

Like the runtime-only approach, generators couldn't prevent non-deterministic code:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
export const myWorkflow = workflow(function*() {
  const now = Date.now(); // Still possible, still problematic // [!code highlight]
  const user = yield* run(() => fetchUser());
  return { now, user };
});
```

The generator syntax addressed suspension but didn't solve the fundamental sandboxing problem.

### File System-Based Conventions

We explored using file system conventions to identify workflows and steps, similar to how modern frameworks handle routing (Next.js, Hono, Nitro, SvelteKit):

<Files>
  <Folder name="workflows" defaultOpen>
    <File name="onboarding.ts" />

    <File name="checkout.ts" />
  </Folder>

  <Folder name="steps" defaultOpen>
    <File name="send-email.ts" />

    <File name="charge-payment.ts" />
  </Folder>
</Files>

With this approach, any function in the `workflows/` directory would be transformed as a workflow, and any function in `steps/` would be a step. No directives needed, just file locations.

**Why this could work:**

* Clear separation of concerns
* Enables compiler transformations based on file path
* Familiar pattern for developers used to file-based routing, for example Next.js

**Why we moved away:**

**1. Too opinionated for diverse ecosystems**

Different frameworks and developers have strong opinions about project structure. Forcing a specific directory layout often caused conflicts across various conventions, especially in existing codebases.

**2. No support for publishable, reusable functions**

We want developers to be able to publish libraries to npm that include step and workflow directives. Ideally, logic that is isomorphic so it could be used with and without Workflow DevKit. File system conventions made this impossible.

**3. Migration and code reuse became difficult**

Migrating existing code required moving files and restructuring projects rather than adding a single line.

The directive approach solved all these issues: it works in any project structure, supports code reuse and migration, enables npm packages, and allows functions to adapt to their execution context.

### Decorators

We considered decorators, but they presented significant challenges both technical and ergonomic.

**Decorators are non-yet-standard and class-focused**

Decorators are not yet a standard syntax ([TC39 proposal](https://github.com/tc39/proposal-decorators)) and they currently only work with classes. A class decorator approach could look like this:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
import {workflow, step} from "workflow";

class MyWorkflow {
  @workflow() // [!code highlight]
  static async processOrder(orderId: string) { // [!code highlight]
    const order = await this.fetchOrder(orderId);
    const payment = await this.processPayment(order);
    return { orderId, payment };
  }

  @step() // [!code highlight]
  static async fetchOrder(orderId: string) { // [!code highlight]
    // ...
  }
}
```

This approach requires:

* Writing class boilerplate with static methods
* Storing/mutating class properties was not obvious (similar closure/mutation issues as the runtime-only approach)
* Class-based syntax that doesn't feel "JavaScript native" to developers used to functional patterns

As the JavaScript ecosystem has moved toward function-forward programming (exemplified by React's shift from class components to functions and hooks), requiring developers to use classes felt like a step backward and also didn't match our own personal taste as authors of the DevKit.

**The core problem: Presents workflows as regular runtime code**

While decorators can be handled at compile-time with build tool support, they present workflow functions as if they were regular, composable JavaScript code, when they're actually compile-time declarations that need special handling.

<Callout>
  See the [Macro Wrapper](#macro-wrapper-approach) section below for a deeper dive into why this approach breaks down with concrete examples.
</Callout>

### Macro Wrapper Approach

We also explored compile-time macro approaches - using a compiler to transform wrapper functions or decorators into directive-based code:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
// Function wrapper approach
import { useWorkflow } from "workflow"

export const processOrder = useWorkflow(async (orderId: string) => { // [!code highlight]
  const order = await fetchOrder(orderId);
  return { orderId };
});

// Decorator approach (would work similarly)
class MyWorkflow {
  @workflow() // [!code highlight]
  static async processOrder(orderId: string) {
    const order = await fetchOrder(orderId);
    return { orderId };
  }

  // ...
}
```

The compiler could transform both to be equivalent to WDK's directive approach:

```typescript lineNumbers
export const processOrder = async (orderId: string) => {
  "use workflow"; // [!code highlight]
  const order = await fetchOrder(orderId);
  return { orderId };
};
```

The benefit is that macros could enforce types and provide "Go To Definition" or other LSP features out of the box.

However, **the core problem remains: Workflows aren't runtime values**

The fundamental issue is that both wrappers and decorators make workflows appear to be **first-class, runtime values** when they're actually **compile-time declarations**. This mismatch between syntax and semantics creates numerous failure modes.

**Concrete examples of how this breaks:**

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
// Someone writes a "helpful" utility
function withRetry(fn: Function) {
  return useWorkflow(async (...args) => { // Works with useWorkflow // [!code highlight]
    try {
      return await fn(...args);
    } catch (error) {
      return await fn(...args); // Retry once
    }
  });
}

// Note: the same utility would be written similarly for a decorator based syntax

// Usage looks innocent in both cases
export const processOrder = withRetry(async (orderId: string) => { // [!code highlight]
  // Is this deterministic? Can it call steps?
  // Nothing in this function indicates the developer is in the
  // deterministic sandboxed workflow
  // Also where is the retry happening? inside or outside the workflow?
  const order = await fetchOrder(orderId);
  return order;
});
```

The developer writing `processOrder` has no visible signal that they're in a deterministic, sandboxed environment. It's also ambiguous whether the retry logic executes inside the workflow or outside, and the actual behavior likely doesn't match developer intuition.

**Why the compiler can't catch this:**

To detect that `processOrder` is actually a workflow, the compiler would need whole-program analysis to track that:

1. `withRetry` returns the result of `useWorkflow`
2. Therefore `processOrder = withRetry(...)` is a workflow
3. The function passed to `withRetry` will execute in a sandboxed context

This level of cross-function analysis is impractical for build tools - it would require analyzing every function call chain in your entire codebase and all dependencies. The compiler can only reliably detect direct `useWorkflow` calls, not calls hidden behind abstractions.

## How Directives Solve These Problems

Directives address all the issues we encountered with previous approaches:

**1. Compile-time semantic boundary**

The `"use workflow"` directive tells the compiler to treat this code differently:

```typescript lineNumbers
export async function processOrder(orderId: string) {
  "use workflow"; // Compiler knows: transform this for sandbox execution // [!code highlight]

  const order = await fetchOrder(orderId); // Compiler knows: this is a step call // [!code highlight]
  return { orderId, order };
}
```

**2. Build-time validation**

The compiler can enforce restrictions before deployment:

```typescript lineNumbers
export async function badWorkflow() {
  "use workflow";

  const crypto = require("crypto"); // Build error: Node.js module in workflow // [!code highlight]
  return crypto.randomBytes(16);
}
```

In fact, Workflow DevKit will throw an error that links to this error page: [Node.js module in workflow](/docs/errors/node-js-module-in-workflow)

**3. No closure ambiguity**

Steps are transformed into function calls that communicate with the runtime:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
export async function processOrder(orderId: string) {
  "use workflow";

  let counter = 0;

  // This essentially becomes: await enqueueStep("updateCounter", [counter])
  // The step receives counter as a parameter, not a closure
  await updateCounter(counter); // [!code highlight]

  console.log(counter); // Always 0, consistently // [!code highlight]
}
```

Callbacks, however, run inside the workflow sandbox and work as expected:

```typescript lineNumbers
export async function processOrders(orderIds: string[]) {
  "use workflow";

  let successCount = 0;

  // Callbacks run in the workflow context, not skipped on replay
  await Promise.all(orderIds.map(async (orderId) => {
    const order = await fetchOrder(orderId); // Step call
    if (order.status === "completed") {
      successCount++; // Mutation works correctly // [!code highlight]
    }
  }));

  console.log(successCount); // Consistent across replays
  return { total: orderIds.length, successful: successCount };
}
```

The callback runs in the workflow sandbox, so closure reads and mutations behave consistently across replays.

**4. Natural syntax**

Looks and feels like regular JavaScript:

```typescript lineNumbers
export async function processOrder(orderId: string) {
  "use workflow";

  // Standard async/await patterns work naturally // [!code highlight]
  const [order, user] = await Promise.all([ // [!code highlight]
    fetchOrder(orderId), // [!code highlight]
    fetchUser(userId) // [!code highlight]
  ]); // [!code highlight]

  return { order, user };
}
```

**5. Consistent syntax for steps**

The `"use step"` directive maintains consistency. While steps run in the full Node.js runtime and *could* work without a directive, they need some way to signal to the workflow runtime that they're steps.

We could have used a function wrapper just for steps:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
// Mixed approach (inconsistent)
export async function processOrder(orderId: string) {
  "use workflow"; // Directive for workflow // [!code highlight]

  const order = await step(async () => fetchOrder(orderId));
  return order;
}

const fetchOrder = useStep(() => { // Wrapper for step? // [!code highlight]
  // ...
})
```

Mixing syntaxes felt inconsistent.

An alternative approach we considered was to treat *all* async function calls as steps by default:

```typescript lineNumbers
export async function processOrder(orderId: string) {
  "use workflow";

  // Every async call becomes a step automatically?
  const [order, user] = await Promise.all([ // [!code highlight]
    fetchOrder(orderId), // Step
    fetchUser(userId)    // Step
  ]);

  return { order, user };
}
```

This breaks down because many valid async operations inside workflows aren't steps:

{/* @skip-typecheck: incomplete code sample */}

```typescript lineNumbers
export async function processOrder(orderId: string) {
  "use workflow";

  // These are valid async calls that SHOULD NOT be steps:
  const results = await Promise.all([...]); // Language primitive // [!code highlight]
  const winner = await Promise.race([...]); // Language primitive // [!code highlight]

  // Helper function that formats data
  const formatted = await formatOrderData(order); // Pure JavaScript helper // [!code highlight]
}
```

By requiring explicit `"use step"` directives, developers have fine-grained control over what becomes a durable, retryable step versus what runs inline in the workflow sandbox.

<Callout>
  To understand how directives are transformed at compile time, see [How the Code Transform Works](/docs/how-it-works/code-transform).
</Callout>

## What Directives Enable

Because `"use workflow"` defines a compile-time semantic boundary, we can provide:

<Cards>
  <Card title="Build-Time Validation">
    The compiler catches invalid patterns before deployment: detects disallowed imports, prevents direct side effects, and validates workflow structure.
  </Card>

  <Card title="Static Analysis">
    Analyze workflow code without executing it: generate UML or DAG diagrams automatically, provide observability and visualization, and optimize execution paths.
  </Card>

  <Card title="Durable Execution">
    Workflows can safely suspend and resume: persist execution state between steps, resume from checkpoints after failures or deploys, and scale to zero without losing progress.
  </Card>

  <Card title="Future Optimizations">
    The semantic boundary enables planned improvements: smaller serialized state for faster checkpoints, smarter scheduling based on workflow structure, and more efficient suspension and resumption.
  </Card>
</Cards>

## Directives as a JavaScript Pattern

Directives in JavaScript have always been contracts between the developer and the execution environment. `"use strict"` made this pattern familiar - it's a string literal that changes how code is interpreted.

While JavaScript doesn't yet have first-class support for custom directives (like Rust's `#[attribute]` or C++'s `#pragma`), string literal directives are the most pragmatic tool available today.

As TC39 members, we at Vercel are actively working with the standards body and broader ecosystem to explore formal specifications for pragma-like syntax or macro annotations that can express execution semantics.

## Closing Thoughts

Directives aren't about syntax preference, they're about expressing semantic boundaries. `"use workflow"` tells the compiler, developer, and runtime that this code is deterministic, resumable, and sandboxed.

This clarity enables the Workflow Development Kit to provide durable execution with familiar JavaScript patterns, while maintaining the compile-time guarantees necessary for reliable workflow orchestration.


---
title: Observability
description: Inspect, monitor, and debug workflows through the CLI and Web UI with powerful observability tools.
type: guide
summary: Inspect and debug workflow runs using the CLI and Web UI.
prerequisites:
  - /docs/foundations
related:
  - /docs/how-it-works/event-sourcing
---

# Observability





Workflow DevKit provides powerful tools to inspect, monitor, and debug your workflows through the CLI and Web UI. These tools allow you to inspect workflow runs, steps, webhooks, [events](/docs/how-it-works/event-sourcing), and stream output.

## Quick Start

```bash
npx workflow
```

The CLI comes pre-installed with the Workflow DevKit and registers the `workflow` command. If the `workflow` package is not already installed, `npx workflow` will install it globally, or use the local installed version if available.

Get started inspecting your local workflows:

```bash
# See all available commands
npx workflow inspect --help

# List recent workflow runs
npx workflow inspect runs
```

## Web UI

Workflow DevKit ships with a local web UI for inspecting your workflows. The CLI
will locally serve the Web UI when using the `--web` flag.

```bash
# Launch Web UI for visual exploration
npx workflow inspect runs --web
```

<img alt="Workflow DevKit Web UI" src={__img0} placeholder="blur" />

## Backends

The Workflow DevKit CLI can inspect data from any [World](/docs/deploying). By default, it inspects data in your local development environment. For example, if you are using Next.js to develop workflows locally, the
CLI will find the data in your `.next/workflow-data/` directory.

If you're deploying workflows to a production environment, but want to inspect the data by using the CLI, you can specify the world you are using by setting the `--backend` flag to your world's name or package name, e.g. `vercel`.

<Callout>
  Backends might require additional configuration. If you're missing environment variables, the World package should provide instructions on how to configure it.
</Callout>

### Vercel Backend

To inspect workflows running on Vercel, ensure you're logged in to the Vercel CLI and have linked your project. See [Vercel CLI authentication and project linking docs](https://vercel.com/docs/cli/project-linking) for more information. Then, simply specify the backend as `vercel`.

```bash
# Inspect workflows running on Vercel
npx workflow inspect runs --backend vercel
```


---
title: DurableAgent
description: Create AI agents that maintain state, call tools, and handle interruptions gracefully.
type: reference
summary: Use DurableAgent to build AI agents that maintain state across steps and survive interruptions.
prerequisites:
  - /docs/ai
related:
  - /docs/ai/defining-tools
---

# DurableAgent



<Callout type="warn">
  The `@workflow/ai` package is currently in active development and should be considered experimental.
</Callout>

The `DurableAgent` class enables you to create AI-powered agents that can maintain state across workflow steps, call tools, and gracefully handle interruptions and resumptions.

Tool calls can be implemented as workflow steps for automatic retries, or as regular workflow-level logic utilizing core library features such as [`sleep()`](/docs/api-reference/workflow/sleep) and [Hooks](/docs/foundations/hooks).

```typescript lineNumbers
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { z } from "zod";
import type { UIMessageChunk } from "ai";

async function getWeather({ city }: { city: string }) {
  "use step";

  return `Weather in ${city} is sunny`;
}

async function myAgent() {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    system: "You are a helpful weather assistant.",
    temperature: 0.7,
    tools: {
      getWeather: {
        description: "Get weather for a city",
        inputSchema: z.object({ city: z.string() }),
        execute: getWeather,
      },
    },
  });

  // The agent will stream its output to the workflow
  // run's default output stream
  const writable = getWritable<UIMessageChunk>();

  const result = await agent.stream({
    messages: [{ role: "user", content: "How is the weather in San Francisco?" }],
    writable,
  });

  // result contains messages, steps, and optional structured output
  console.log(result.messages);
}
```

## API Signature

### Class

<TSDoc
  definition={`
import { DurableAgent } from "@workflow/ai/agent";
export default DurableAgent;`}
/>

### DurableAgentOptions

<TSDoc
  definition={`
import type { DurableAgentOptions } from "@workflow/ai/agent";
export default DurableAgentOptions;`}
/>

### DurableAgentStreamOptions

<TSDoc
  definition={`
import type { DurableAgentStreamOptions } from "@workflow/ai/agent";
export default DurableAgentStreamOptions;`}
/>

### DurableAgentStreamResult

The result returned from the `stream()` method:

<TSDoc
  definition={`
import type { DurableAgentStreamResult } from "@workflow/ai/agent";
export default DurableAgentStreamResult;`}
/>

### GenerationSettings

Settings that control model generation behavior. These can be set on the constructor or overridden per-stream call:

<TSDoc
  definition={`
import type { GenerationSettings } from "@workflow/ai/agent";
export default GenerationSettings;`}
/>

### PrepareStepInfo

Information passed to the `prepareStep` callback:

<TSDoc
  definition={`
import type { PrepareStepInfo } from "@workflow/ai/agent";
export default PrepareStepInfo;`}
/>

### PrepareStepResult

Return type from the `prepareStep` callback:

<TSDoc
  definition={`
import type { PrepareStepResult } from "@workflow/ai/agent";
export default PrepareStepResult;`}
/>

### TelemetrySettings

Configuration for observability and telemetry:

<TSDoc
  definition={`
import type { TelemetrySettings } from "@workflow/ai/agent";
export default TelemetrySettings;`}
/>

### Callbacks

#### StreamTextOnFinishCallback

Called when streaming completes:

<TSDoc
  definition={`
import type { StreamTextOnFinishCallback } from "@workflow/ai/agent";
export default StreamTextOnFinishCallback;`}
/>

#### StreamTextOnErrorCallback

Called when an error occurs:

<TSDoc
  definition={`
import type { StreamTextOnErrorCallback } from "@workflow/ai/agent";
export default StreamTextOnErrorCallback;`}
/>

#### StreamTextOnAbortCallback

Called when the operation is aborted:

<TSDoc
  definition={`
import type { StreamTextOnAbortCallback } from "@workflow/ai/agent";
export default StreamTextOnAbortCallback;`}
/>

### Advanced Types

#### ToolCallRepairFunction

Function to repair malformed tool calls:

<TSDoc
  definition={`
import type { ToolCallRepairFunction } from "@workflow/ai/agent";
export default ToolCallRepairFunction;`}
/>

#### StreamTextTransform

Transform applied to the stream:

<TSDoc
  definition={`
import type { StreamTextTransform } from "@workflow/ai/agent";
export default StreamTextTransform;`}
/>

#### OutputSpecification

Specification for structured output parsing:

<TSDoc
  definition={`
import type { OutputSpecification } from "@workflow/ai/agent";
export default OutputSpecification;`}
/>

## Key Features

* **Durable Execution**: Agents can be interrupted and resumed without losing state
* **Flexible Tool Implementation**: Tools can be implemented as workflow steps for automatic retries, or as regular workflow-level logic
* **Stream Processing**: Handles streaming responses and tool calls in a structured way
* **Workflow Native**: Fully integrated with Workflow DevKit for production-grade reliability
* **AI SDK Parity**: Supports the same options as AI SDK's `streamText` including generation settings, callbacks, and structured output

## Good to Know

* Tools can be implemented as workflow steps (using `"use step"` for automatic retries), or as regular workflow-level logic
* Tools can use core library features like `sleep()` and Hooks within their `execute` functions
* The agent processes tool calls iteratively until completion or `maxSteps` is reached
* **Default `maxSteps` is unlimited** - set a value to limit the number of LLM calls
* The `stream()` method returns `{ messages, steps, experimental_output, uiMessages }` containing the full conversation history, step details, optional structured output, and optionally accumulated UI messages
* Use `collectUIMessages: true` to accumulate `UIMessage[]` during streaming, useful for persisting conversation state without re-reading the stream
* The `prepareStep` callback runs before each step and can modify model, messages, generation settings, tool choice, and context
* Generation settings (temperature, maxOutputTokens, etc.) can be set on the constructor and overridden per-stream call
* Use `activeTools` to limit which tools are available for a specific stream call
* The `onFinish` callback is called when all steps complete; `onAbort` is called if aborted

## Examples

### Basic Agent with Tools

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { z } from "zod";
import type { UIMessageChunk } from "ai";

async function getWeather({ location }: { location: string }) {
  "use step";
  // Fetch weather data
  const response = await fetch(`https://api.weather.com?location=${location}`);
  return response.json();
}

async function weatherAgentWorkflow(userQuery: string) {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    tools: {
      getWeather: {
        description: "Get current weather for a location",
        inputSchema: z.object({ location: z.string() }),
        execute: getWeather,
      },
    },
    system: "You are a helpful weather assistant. Always provide accurate weather information.",
  });

  await agent.stream({
    messages: [
      {
        role: "user",
        content: userQuery,
      },
    ],
    writable: getWritable<UIMessageChunk>(),
  });
}
```

### Multiple Tools

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { z } from "zod";
import type { UIMessageChunk } from "ai";

async function getWeather({ location }: { location: string }) {
  "use step";
  return `Weather in ${location}: Sunny, 72°F`;
}

async function searchEvents({ location, category }: { location: string; category: string }) {
  "use step";
  return `Found 5 ${category} events in ${location}`;
}

async function multiToolAgentWorkflow(userQuery: string) {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    tools: {
      getWeather: {
        description: "Get weather for a location",
        inputSchema: z.object({ location: z.string() }),
        execute: getWeather,
      },
      searchEvents: {
        description: "Search for upcoming events in a location",
        inputSchema: z.object({ location: z.string(), category: z.string() }),
        execute: searchEvents,
      },
    },
  });

  await agent.stream({
    messages: [
      {
        role: "user",
        content: userQuery,
      },
    ],
    writable: getWritable<UIMessageChunk>(),
  });
}
```

### Multi-turn Conversation

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { z } from "zod";

async function searchProducts({ query }: { query: string }) {
  "use step";
  // Search product database
  return `Found 3 products matching "${query}"`;
}

async function multiTurnAgentWorkflow() {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    tools: {
      searchProducts: {
        description: "Search for products",
        inputSchema: z.object({ query: z.string() }),
        execute: searchProducts,
      },
    },
  });

  const writable = getWritable<UIMessageChunk>();

  // First user message
  //   - Result is streamed to the provided `writable` stream
  //   - Message history is returned in `messages` for LLM context
  let { messages } = await agent.stream({
    messages: [
      { role: "user", content: "Find me some laptops" }
    ],
    writable,
  });

  // Continue the conversation with the accumulated message history
  const result = await agent.stream({
    messages: [
      ...messages,
      { role: "user", content: "Which one has the best battery life?" }
    ],
    writable,
  });

  // result.messages now contains the complete conversation history
  return result.messages;
}
```

### Tools with Workflow Library Features

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { sleep, defineHook, getWritable } from "workflow";
import { z } from "zod";
import type { UIMessageChunk } from "ai";

// Define a reusable hook type
const approvalHook = defineHook<{ approved: boolean; reason: string }>();

async function scheduleTask({ delaySeconds }: { delaySeconds: number }) {
  // Note: No "use step" for this tool call,
  // since `sleep()` is a workflow level function
  await sleep(`${delaySeconds}s`);
  return `Slept for ${delaySeconds} seconds`;
}

async function requestApproval({ message }: { message: string }) {
  // Note: No "use step" for this tool call either,
  // since hooks are awaited at the workflow level

  // Utilize a Hook for Human-in-the-loop approval
  const hook = approvalHook.create({
    metadata: { message }
  });

  console.log(`Approval needed - token: ${hook.token}`);

  // Wait for the approval payload
  const approval = await hook;

  if (approval.approved) {
    return `Request approved: ${approval.reason}`;
  } else {
    throw new Error(`Request denied: ${approval.reason}`);
  }
}

async function agentWithLibraryFeaturesWorkflow(userRequest: string) {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    tools: {
      scheduleTask: {
        description: "Pause the workflow for the specified number of seconds",
        inputSchema: z.object({
          delaySeconds: z.number(),
        }),
        execute: scheduleTask,
      },
      requestApproval: {
        description: "Request approval for an action",
        inputSchema: z.object({ message: z.string() }),
        execute: requestApproval,
      },
    },
  });

  await agent.stream({
    messages: [{ role: "user", content: userRequest }],
    writable: getWritable<UIMessageChunk>(),
  });
}
```

### Dynamic Context with prepareStep

Use `prepareStep` to modify settings before each step in the agent loop:

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import type { UIMessageChunk } from "ai";

async function agentWithPrepareStep(userMessage: string) {
  "use workflow";

  const agent = new DurableAgent({
    model: "openai/gpt-4.1-mini", // Default model
    system: "You are a helpful assistant.",
  });

  await agent.stream({
    messages: [{ role: "user", content: userMessage }],
    writable: getWritable<UIMessageChunk>(),
    prepareStep: async ({ stepNumber, messages }) => {
      // Switch to a stronger model for complex reasoning after initial steps
      if (stepNumber > 2 && messages.length > 10) {
        return {
          model: "anthropic/claude-sonnet-4.5",
        };
      }

      // Trim context if messages grow too large
      if (messages.length > 20) {
        return {
          messages: [
            messages[0], // Keep system message
            ...messages.slice(-10), // Keep last 10 messages
          ],
        };
      }

      return {}; // No changes
    },
  });
}
```

### Message Injection with prepareStep

Inject messages from external sources (like hooks) before each LLM call:

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable, defineHook } from "workflow";
import type { UIMessageChunk } from "ai";

const messageHook = defineHook<{ message: string }>();

async function agentWithMessageQueue(initialMessage: string) {
  "use workflow";

  const messageQueue: Array<{ role: "user"; content: string }> = [];

  // Listen for incoming messages via hook
  const hook = messageHook.create();
  hook.then(({ message }) => {
    messageQueue.push({ role: "user", content: message });
  });

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    system: "You are a helpful assistant.",
  });

  await agent.stream({
    messages: [{ role: "user", content: initialMessage }],
    writable: getWritable<UIMessageChunk>(),
    prepareStep: ({ messages }) => {
      // Inject queued messages before the next step
      if (messageQueue.length > 0) {
        const newMessages = messageQueue.splice(0);
        return {
          messages: [
            ...messages,
            ...newMessages.map(m => ({
              role: m.role,
              content: [{ type: "text" as const, text: m.content }],
            })),
          ],
        };
      }
      return {};
    },
  });
}
```

### Generation Settings

Configure model generation parameters at the constructor or stream level:

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import type { UIMessageChunk } from "ai";

async function agentWithGenerationSettings() {
  "use workflow";

  // Set default generation settings in constructor
  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    temperature: 0.7,
    maxOutputTokens: 2000,
    topP: 0.9,
  });

  // Override settings per-stream call
  await agent.stream({
    messages: [{ role: "user", content: "Write a creative story" }],
    writable: getWritable<UIMessageChunk>(),
    temperature: 0.9, // More creative for this call
    maxSteps: 1,
  });

  // Use different settings for a different task
  await agent.stream({
    messages: [{ role: "user", content: "Summarize this document precisely" }],
    writable: getWritable<UIMessageChunk>(),
    temperature: 0.1, // More deterministic
    maxSteps: 1,
  });
}
```

### Limiting Steps with maxSteps

By default, the agent loops until completion. Use `maxSteps` to limit the number of LLM calls:

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { z } from "zod";
import type { UIMessageChunk } from "ai";

async function searchWeb({ query }: { query: string }) {
  "use step";
  return `Results for "${query}": ...`;
}

async function analyzeResults({ data }: { data: string }) {
  "use step";
  return `Analysis: ${data}`;
}

async function multiStepAgent() {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    tools: {
      searchWeb: {
        description: "Search the web for information",
        inputSchema: z.object({ query: z.string() }),
        execute: searchWeb,
      },
      analyzeResults: {
        description: "Analyze search results",
        inputSchema: z.object({ data: z.string() }),
        execute: analyzeResults,
      },
    },
  });

  // Limit to 10 steps for safety on complex research tasks
  const result = await agent.stream({
    messages: [{ role: "user", content: "Research the latest AI trends and provide an analysis" }],
    writable: getWritable<UIMessageChunk>(),
    maxSteps: 10,
  });

  // Access step-by-step details
  console.log(`Completed in ${result.steps.length} steps`);
}
```

### Callbacks for Monitoring

Use callbacks to monitor streaming progress, handle errors, and react to completion:

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import type { UIMessageChunk } from "ai";

async function agentWithCallbacks() {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
  });

  await agent.stream({
    messages: [{ role: "user", content: "Hello!" }],
    writable: getWritable<UIMessageChunk>(),
    maxSteps: 5,

    // Called after each step completes
    onStepFinish: async (step) => {
      console.log(`Step finished: ${step.finishReason}`);
      console.log(`Tokens used: ${step.usage.totalTokens}`);
    },

    // Called when streaming completes
    onFinish: async ({ steps, messages }) => {
      console.log(`Completed with ${steps.length} steps`);
      console.log(`Final message count: ${messages.length}`);
    },

    // Called on errors
    onError: async ({ error }) => {
      console.error("Stream error:", error);
    },
  });
}
```

### Structured Output

Parse structured data from the LLM response using `Output.object`:

```typescript
import { DurableAgent, Output } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { z } from "zod";
import type { UIMessageChunk } from "ai";

async function agentWithStructuredOutput() {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
  });

  const result = await agent.stream({
    messages: [{ role: "user", content: "Analyze the sentiment of: 'I love this product!'" }],
    writable: getWritable<UIMessageChunk>(),
    experimental_output: Output.object({
      schema: z.object({
        sentiment: z.enum(["positive", "negative", "neutral"]),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
      }),
    }),
  });

  // Access the parsed structured output
  console.log(result.experimental_output);
  // { sentiment: "positive", confidence: 0.95, reasoning: "..." }
}
```

### Tool Choice Control

Control when and which tools the model can use:

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { z } from "zod";
import type { UIMessageChunk } from "ai";

async function agentWithToolChoice() {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    tools: {
      calculator: {
        description: "Perform calculations",
        inputSchema: z.object({ expression: z.string() }),
        execute: async ({ expression }) => `Calculated: ${expression}`,
      },
      search: {
        description: "Search for information",
        inputSchema: z.object({ query: z.string() }),
        execute: async ({ query }) => `Results for: ${query}`,
      },
    },
    toolChoice: "auto", // Default: model decides
  });

  // Force the model to use a tool
  await agent.stream({
    messages: [{ role: "user", content: "What is 2 + 2?" }],
    writable: getWritable<UIMessageChunk>(),
    toolChoice: "required",
    maxSteps: 2,
  });

  // Prevent tool usage
  await agent.stream({
    messages: [{ role: "user", content: "Just chat with me" }],
    writable: getWritable<UIMessageChunk>(),
    toolChoice: "none",
  });

  // Force a specific tool
  await agent.stream({
    messages: [{ role: "user", content: "Calculate something" }],
    writable: getWritable<UIMessageChunk>(),
    toolChoice: { type: "tool", toolName: "calculator" },
    maxSteps: 2,
  });

  // Limit available tools for this call
  await agent.stream({
    messages: [{ role: "user", content: "Just search, don't calculate" }],
    writable: getWritable<UIMessageChunk>(),
    activeTools: ["search"],
    maxSteps: 2,
  });
}
```

### Passing Context to Tools

Use `experimental_context` to pass shared context to tool executions:

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { z } from "zod";
import type { UIMessageChunk } from "ai";

interface UserContext {
  userId: string;
  permissions: string[];
}

async function agentWithContext(userId: string) {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    tools: {
      getUserData: {
        description: "Get user data",
        inputSchema: z.object({}),
        execute: async (_, { experimental_context }) => {
          const ctx = experimental_context as UserContext;
          return { userId: ctx.userId, permissions: ctx.permissions };
        },
      },
    },
  });

  await agent.stream({
    messages: [{ role: "user", content: "What are my permissions?" }],
    writable: getWritable<UIMessageChunk>(),
    maxSteps: 2,
    experimental_context: {
      userId,
      permissions: ["read", "write"],
    } as UserContext,
  });
}
```

### Collecting UI Messages

Use `collectUIMessages` to accumulate `UIMessage[]` during streaming. This is useful when you need to persist the conversation without re-reading the run's output stream:

```typescript lineNumbers
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import type { UIMessage, UIMessageChunk } from "ai";

async function agentWithUIMessages(userMessage: string) {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    system: "You are a helpful assistant.",
  });

  const result = await agent.stream({
    messages: [{ role: "user", content: userMessage }],
    writable: getWritable<UIMessageChunk>(),
    collectUIMessages: true, // [!code highlight]
  });

  // Access the accumulated UI messages
  const uiMessages: UIMessage[] = result.uiMessages ?? []; // [!code highlight]

  // Persist messages to a database
  await saveConversation(uiMessages);

  return result;
}

async function saveConversation(messages: UIMessage[]) {
  "use step";
  // Save to database...
}
```

<Callout type="info">
  The `uiMessages` property is only available when `collectUIMessages` is set to `true`. When disabled, `uiMessages` is `undefined`.
</Callout>

## See Also

* [Building Durable AI Agents](/docs/ai) - Complete guide to creating durable agents
* [Queueing User Messages](/docs/ai/message-queueing) - Using prepareStep for message injection
* [WorkflowChatTransport](/docs/api-reference/workflow-ai/workflow-chat-transport) - Transport layer for AI SDK streams
* [Workflows and Steps](/docs/foundations/workflows-and-steps) - Understanding workflow fundamentals
* [AI SDK Loop Control](https://ai-sdk.dev/docs/agents/loop-control) - AI SDK's agent loop control patterns


---
title: @workflow/ai
description: Helpers for building AI-powered workflows with the AI SDK.
type: overview
summary: Explore helpers for integrating AI SDK to build durable AI-powered workflows.
related:
  - /docs/ai
---

# @workflow/ai



<Callout type="warn">
  The `@workflow/ai` package is currently in active development and should be considered experimental.
</Callout>

Helpers for integrating AI SDK for building AI-powered workflows.

## Classes

<Cards>
  <Card title="DurableAgent" href="/docs/api-reference/workflow-ai/durable-agent">
    A class for building durable AI agents that maintain state across workflow steps and handle tool execution with automatic retries.
  </Card>

  <Card title="WorkflowChatTransport" href="/docs/api-reference/workflow-ai/workflow-chat-transport">
    A drop-in transport for the AI SDK for automatic reconnection in interrupted streams.
  </Card>
</Cards>


---
title: WorkflowChatTransport
description: Chat transport with automatic reconnection and recovery from interrupted streams.
type: reference
summary: Use WorkflowChatTransport as a drop-in AI SDK transport for automatic stream reconnection.
prerequisites:
  - /docs/ai
related:
  - /docs/ai/resumable-streams
---

# WorkflowChatTransport



<Callout type="warn">
  The `@workflow/ai` package is currently in active development and should be considered experimental.
</Callout>

A chat transport implementation for the AI SDK that provides reliable message streaming with automatic reconnection to interrupted streams. This transport is a drop-in replacement for the default AI SDK transport, enabling seamless recovery from network issues, page refreshes, or Vercel Function timeouts.

<Callout>
  `WorkflowChatTransport` implements the [`ChatTransport`](https://ai-sdk.dev/docs/ai-sdk-ui/transport) interface from the AI SDK and is designed to work with workflow-based chat applications. It requires endpoints that return the `x-workflow-run-id` header to enable stream resumption.
</Callout>

```typescript lineNumbers
import { useChat } from "@ai-sdk/react";
import { WorkflowChatTransport } from "@workflow/ai";

export default function Chat() {
  const { messages, sendMessage } = useChat({
    transport: new WorkflowChatTransport(),
  });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>{m.content}</div>
      ))}
    </div>
  );
}
```

## API Signature

### Class

<TSDoc
  definition={`
import { WorkflowChatTransport } from "@workflow/ai";
export default WorkflowChatTransport;`}
/>

### WorkflowChatTransportOptions

<TSDoc
  definition={`
import type { WorkflowChatTransportOptions } from "@workflow/ai";
export default WorkflowChatTransportOptions;`}
/>

## Key Features

* **Automatic Reconnection**: Automatically recovers from interrupted streams with configurable retry limits
* **Workflow Integration**: Seamlessly works with workflow-based endpoints that provide the `x-workflow-run-id` header
* **Customizable Requests**: Allows intercepting and modifying requests via `prepareSendMessagesRequest` and `prepareReconnectToStreamRequest`
* **Stream Callbacks**: Provides hooks for tracking chat lifecycle via `onChatSendMessage` and `onChatEnd`
* **Custom Fetch**: Supports custom fetch implementations for advanced use cases

## Good to Know

* The transport expects chat endpoints to return the `x-workflow-run-id` header in the response to enable stream resumption
* By default, the transport posts to `/api/chat` and reconnects via `/api/chat/{runId}/stream`
* The `onChatSendMessage` callback receives the full response object, allowing you to extract and store the workflow run ID for session resumption
* Stream interruptions are automatically detected when a "finish" chunk is not received in the initial response
* The `maxConsecutiveErrors` option controls how many reconnection attempts are made before giving up (default: 3)

## Examples

### Basic Chat Setup

```typescript
"use client";

import { useChat } from "@ai-sdk/react";
import { WorkflowChatTransport } from "@workflow/ai";
import { useState } from "react";

export default function BasicChat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat({
    transport: new WorkflowChatTransport(),
  });

  return (
    <div>
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

### With Session Persistence and Resumption

```typescript
"use client";

import { useChat } from "@ai-sdk/react";
import { WorkflowChatTransport } from "@workflow/ai";
import { useMemo, useState } from "react";

export default function ChatWithResumption() {
  const [input, setInput] = useState("");
  const activeWorkflowRunId = useMemo(() => {
    if (typeof window === "undefined") return;
    return localStorage.getItem("active-workflow-run-id") ?? undefined;
  }, []);

  const { messages, sendMessage } = useChat({
    resume: !!activeWorkflowRunId,
    transport: new WorkflowChatTransport({
      onChatSendMessage: (response, options) => {
        // Save chat history to localStorage
        localStorage.setItem(
          "chat-history",
          JSON.stringify(options.messages)
        );

        // Extract and store the workflow run ID for session resumption
        const workflowRunId = response.headers.get("x-workflow-run-id");
        if (workflowRunId) {
          localStorage.setItem("active-workflow-run-id", workflowRunId);
        }
      },
      onChatEnd: ({ chatId, chunkIndex }) => {
        console.log(`Chat ${chatId} completed with ${chunkIndex} chunks`);
        // Clear the active run ID when chat completes
        localStorage.removeItem("active-workflow-run-id");
      },
    }),
  });

  return (
    <div>
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

### With Custom Request Configuration

```typescript
"use client";

import { useChat } from "@ai-sdk/react";
import { WorkflowChatTransport } from "@workflow/ai";
import { useState } from "react";

export default function ChatWithCustomConfig() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat({
    transport: new WorkflowChatTransport({
      prepareSendMessagesRequest: async (config) => {
        return {
          ...config,
          api: "/api/chat",
          headers: {
            ...config.headers,
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            "X-Custom-Header": "custom-value",
          },
          credentials: "include",
        };
      },
      prepareReconnectToStreamRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          },
          credentials: "include",
        };
      },
      maxConsecutiveErrors: 5,
    }),
  });

  return (
    <div>
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

## See Also

* [DurableAgent](/docs/api-reference/workflow-ai/durable-agent) - Building durable AI agents within workflows
* [AI SDK `useChat` Documentation](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) - Using `useChat` with custom transports
* [Workflows and Steps](/docs/foundations/workflows-and-steps) - Understanding workflow fundamentals
* ["flight-booking-app" Example](https://github.com/vercel/workflow-examples/tree/main/flight-booking-app) - An example application which uses `WorkflowChatTransport`


---
title: getHookByToken
description: Retrieve hook details and workflow run information by token.
type: reference
summary: Use getHookByToken to look up a hook's metadata and associated workflow run before resuming it.
prerequisites:
  - /docs/foundations/hooks
---

# getHookByToken



Retrieves a hook by its unique token, returning the associated workflow run information and any metadata that was set when the hook was created. This function is useful for inspecting hook details before deciding whether to resume a workflow.

<Callout type="warn">
  `getHookByToken` is a runtime function that must be called from outside a workflow function.
</Callout>

```typescript lineNumbers
import { getHookByToken } from "workflow/api";

export async function POST(request: Request) {
  const { token } = await request.json();
  const hook = await getHookByToken(token);
  console.log("Hook belongs to run:", hook.runId);
}
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { getHookByToken } from "workflow/api";
export default getHookByToken;`}
  showSections={["parameters"]}
/>

### Returns

Returns a `Promise<Hook>` that resolves to:

<TSDoc
  definition={`
import type { Hook } from "@workflow/world";
export default Hook;`}
  showSections={["returns"]}
/>

## Examples

### Basic Hook Lookup

Retrieve hook information before resuming:

```typescript lineNumbers
import { getHookByToken, resumeHook } from "workflow/api";

export async function POST(request: Request) {
  const { token, data } = await request.json();

  try {
    // First, get the hook to inspect its metadata
    const hook = await getHookByToken(token); // [!code highlight]

    console.log("Resuming workflow run:", hook.runId);
    console.log("Hook metadata:", hook.metadata);

    // Then resume the hook with the payload
    await resumeHook(token, data);

    return Response.json({
      success: true,
      runId: hook.runId
    });
  } catch (error) {
    return new Response("Hook not found", { status: 404 });
  }
}
```

### Validating Hook Before Resume

Use `getHookByToken` to validate hook ownership or metadata before resuming:

```typescript lineNumbers
import { getHookByToken, resumeHook } from "workflow/api";

export async function POST(request: Request) {
  const { token, userId, data } = await request.json();

  try {
    const hook = await getHookByToken(token); // [!code highlight]

    // Validate that the hook metadata matches the user
    if (hook.metadata?.allowedUserId !== userId) {
      return Response.json(
        { error: "Unauthorized to resume this hook" },
        { status: 403 }
      );
    }

    await resumeHook(token, data);
    return Response.json({ success: true, runId: hook.runId });
  } catch (error) {
    return Response.json({ error: "Hook not found" }, { status: 404 });
  }
}
```

### Checking Hook Environment

Verify the hook belongs to the expected environment:

```typescript lineNumbers
import { getHookByToken, resumeHook } from "workflow/api";

export async function POST(request: Request) {
  const { token, data } = await request.json();
  const expectedEnv = process.env.VERCEL_ENV || "development";

  try {
    const hook = await getHookByToken(token); // [!code highlight]

    if (hook.environment !== expectedEnv) {
      return Response.json(
        { error: `Hook belongs to ${hook.environment} environment` },
        { status: 400 }
      );
    }

    await resumeHook(token, data);
    return Response.json({ runId: hook.runId });
  } catch (error) {
    return Response.json({ error: "Hook not found" }, { status: 404 });
  }
}
```

### Logging Hook Information

Log hook details for debugging or auditing:

```typescript lineNumbers
import { getHookByToken, resumeHook } from "workflow/api";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const hook = await getHookByToken(token); // [!code highlight]

    // Log for auditing
    console.log({
      action: "hook_resume",
      runId: hook.runId,
      hookId: hook.hookId,
      projectId: hook.projectId,
      createdAt: hook.createdAt,
    });

    const body = await request.json();
    await resumeHook(token, body);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Hook not found" }, { status: 404 });
  }
}
```

## Related Functions

* [`resumeHook()`](/docs/api-reference/workflow-api/resume-hook) - Resume a hook with a payload.
* [`createHook()`](/docs/api-reference/workflow/create-hook) - Create a hook in a workflow.
* [`defineHook()`](/docs/api-reference/workflow/define-hook) - Type-safe hook helper.


---
title: getRun
description: Retrieve workflow run metadata and status without waiting for completion.
type: reference
summary: Use getRun to check a workflow run's status and metadata without blocking on completion.
prerequisites:
  - /docs/foundations/starting-workflows
---

# getRun



Retrieves the workflow run metadata and status information for a given run ID. This function provides immediate access to workflow run details without waiting for completion, making it ideal for status checking and monitoring.

Use this function when you need to check workflow status, get timing information, or access workflow metadata without blocking on workflow completion.

```typescript lineNumbers
import { getRun } from "workflow/api";

const run = getRun("my-run-id");
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { getRun } from "workflow/api";
export default getRun;`}
  showSections={["parameters"]}
/>

### Returns

Returns a `Run` object:

<TSDoc
  definition={`
import { Run } from "workflow/api";
export default Run;`}
  showSections={["returns"]}
/>

#### WorkflowReadableStreamOptions

<TSDoc
  definition={`
import type { WorkflowReadableStreamOptions } from "workflow/api";
export default WorkflowReadableStreamOptions;`}
/>

## Examples

### Basic Status Check

Check the current status of a workflow run:

```typescript lineNumbers
import { getRun } from "workflow/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const runId = url.searchParams.get("runId");

  if (!runId) {
    return Response.json({ error: "No runId provided" }, { status: 400 });
  }

  try {
    const run = getRun(runId); // [!code highlight]
    const status = await run.status;

    return Response.json({ status });
  } catch (error) {
    return Response.json(
      { error: "Workflow run not found" },
      { status: 404 }
    );
  }
}
```

## Related Functions

* [`start()`](/docs/api-reference/workflow-api/start) - Start a new workflow and get its run ID.


---
title: getWorld
description: Access the World instance for low-level storage, queuing, and streaming operations.
type: reference
summary: Use getWorld to access low-level workflow storage, queuing, and streaming backends directly.
prerequisites:
  - /docs/deploying
---

# getWorld



Retrieves the World instance for direct access to workflow storage, queuing, and streaming backends. This function returns a `World` which provides low-level access to manage workflow runs, steps, events, and hooks.

Use this function when you need direct access to the underlying workflow infrastructure, such as listing all runs, querying events, or implementing custom workflow management logic.

```typescript lineNumbers
import { getWorld } from "workflow/runtime";

const world = getWorld();
```

## API Signature

### Parameters

This function does not accept any parameters.

### Returns

Returns a `World` object:

<TSDoc
  definition={`
import type { World } from "@workflow/world";
export default World;`}
  showSections={["returns"]}
/>

## Examples

### List Workflow Runs

List all workflow runs with pagination:

```typescript lineNumbers
import { getWorld } from "workflow/runtime";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;

  try {
    const world = getWorld(); // [!code highlight]
    const runs = await world.runs.list({
      pagination: { cursor },
    });

    return Response.json(runs);
  } catch (error) {
    return Response.json(
      { error: "Failed to list workflow runs" },
      { status: 500 }
    );
  }
}
```

### Cancel a Workflow Run

Cancel a running workflow:

```typescript lineNumbers
import { getWorld } from "workflow/runtime";

export async function POST(req: Request) {
  const { runId } = await req.json();

  if (!runId) {
    return Response.json({ error: "No runId provided" }, { status: 400 });
  }

  try {
    const world = getWorld(); // [!code highlight]
    const run = await world.runs.cancel(runId); // [!code highlight]

    return Response.json({ status: run.status });
  } catch (error) {
    return Response.json(
      { error: "Failed to cancel workflow run" },
      { status: 500 }
    );
  }
}
```

## Related Functions

* [`getRun()`](/docs/api-reference/workflow-api/get-run) - Higher-level API for working with individual runs by ID.
* [`start()`](/docs/api-reference/workflow-api/start) - Start a new workflow run.


---
title: workflow/api
description: Runtime functions to inspect runs, start workflows, and access world data.
type: overview
summary: Explore runtime functions for starting workflows, inspecting runs, and managing hooks.
---

# workflow/api



API reference for runtime functions from the `workflow/api` package.

## Functions

The API package is for access and introspection of workflow data to inspect runs, start new runs, or access anything else directly accessible by the world.

<Cards>
  <Card href="/docs/api-reference/workflow-api/start" title="start()">
    Start/enqueue a new workflow run.
  </Card>

  <Card href="/docs/api-reference/workflow-api/resume-hook" title="resumeHook()">
    Resume a workflow by sending a payload to a hook.
  </Card>

  <Card href="/docs/api-reference/workflow-api/resume-webhook" title="resumeWebhook()">
    Resume a workflow by sending a `Request` to a webhook.
  </Card>

  <Card href="/docs/api-reference/workflow-api/get-hook-by-token" title="getHookByToken()">
    Get hook details and metadata by its token.
  </Card>

  <Card href="/docs/api-reference/workflow-api/get-run" title="getRun()">
    Get workflow run status and metadata without waiting for completion.
  </Card>

  <Card href="/docs/api-reference/workflow-api/get-world" title="getWorld()">
    Get direct access to workflow storage, queuing, and streaming backends.
  </Card>
</Cards>


---
title: resumeHook
description: Resume a paused workflow by sending a payload to a hook token.
type: reference
summary: Use resumeHook to send a payload to a hook token and resume a paused workflow.
prerequisites:
  - /docs/foundations/hooks
related:
  - /docs/api-reference/workflow-api/resume-webhook
---

# resumeHook



Resumes a workflow run by sending a payload to a hook identified by its token.

It creates a `hook_received` event and re-triggers the workflow to continue execution.

<Callout type="warn">
  `resumeHook` is a runtime function that must be called from outside a workflow function.
</Callout>

```typescript lineNumbers
import { resumeHook } from "workflow/api";

export async function POST(request: Request) {
  const { token, data } = await request.json();

  try {
    const result = await resumeHook(token, data); // [!code highlight]
    return Response.json({
      runId: result.runId
    });
  } catch (error) {
    return new Response("Hook not found", { status: 404 });
  }
}
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { resumeHook } from "workflow/api";
export default resumeHook;`}
  showSections={["parameters"]}
/>

### Returns

Returns a `Promise<Hook>` that resolves to:

<TSDoc
  definition={`
import type { Hook } from "@workflow/world";
export default Hook;`}
  showSections={["returns"]}
/>

## Examples

### Basic API Route

Using `resumeHook` in a basic API route to resume a hook:

```typescript lineNumbers
import { resumeHook } from "workflow/api";

export async function POST(request: Request) {
  const { token, data } = await request.json();

  try {
    const result = await resumeHook(token, data); // [!code highlight]

    return Response.json({
      success: true,
      runId: result.runId
    });
  } catch (error) {
    return new Response("Hook not found", { status: 404 });
  }
}
```

### With Type Safety

Defining a payload type and using `resumeHook` to resume a hook with type safety:

```typescript lineNumbers
import { resumeHook } from "workflow/api";

type ApprovalPayload = {
  approved: boolean;
  comment: string;
};

export async function POST(request: Request) {
  const { token, approved, comment } = await request.json();

  try {
    const result = await resumeHook<ApprovalPayload>(token, { // [!code highlight]
      approved, // [!code highlight]
      comment, // [!code highlight]
    }); // [!code highlight]

    return Response.json({ runId: result.runId });
  } catch (error) {
    return Response.json({ error: "Invalid token" }, { status: 404 });
  }
}
```

### Server Action (Next.js)

Using `resumeHook` in Next.js server actions to resume a hook:

```typescript lineNumbers
"use server";

import { resumeHook } from "workflow/api";

export async function approveRequest(token: string, approved: boolean) {
  try {
    const result = await resumeHook(token, { approved });
    return result.runId;
  } catch (error) {
    throw new Error("Invalid approval token");
  }
}
```

### Webhook Handler

Using `resumeHook` in a generic webhook handler to resume a hook:

```typescript lineNumbers
import { resumeHook } from "workflow/api";

// Generic webhook handler that forwards data to a hook
export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const result = await resumeHook(token, body);

    return Response.json({ success: true, runId: result.runId });
  } catch (error) {
    return Response.json({ error: "Hook not found" }, { status: 404 });
  }
}
```

## Related Functions

* [`getHookByToken()`](/docs/api-reference/workflow-api/get-hook-by-token) - Get hook details before resuming.
* [`createHook()`](/docs/api-reference/workflow/create-hook) - Create a hook in a workflow.
* [`defineHook()`](/docs/api-reference/workflow/define-hook) - Type-safe hook helper.


---
title: resumeWebhook
description: Resume a paused workflow by sending an HTTP request to a webhook token.
type: reference
summary: Use resumeWebhook to forward an HTTP request to a webhook token and resume a paused workflow.
prerequisites:
  - /docs/foundations/hooks
related:
  - /docs/api-reference/workflow-api/resume-hook
---

# resumeWebhook



Resumes a workflow run by sending an HTTP `Request` to a webhook identified by its token.

This function creates a `hook_received` event and re-triggers the workflow to continue execution. It's designed to be called from API routes or server actions that receive external HTTP requests.

<Callout type="warn">
  `resumeWebhook` is a runtime function that must be called from outside a workflow function.
</Callout>

```typescript lineNumbers
import { resumeWebhook } from "workflow/api";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  try {
    const response = await resumeWebhook(token, request); // [!code highlight]
    return response;
  } catch (error) {
    return new Response("Webhook not found", { status: 404 });
  }
}
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { resumeWebhook } from "workflow/api";
export default resumeWebhook;`}
  showSections={['parameters']}
/>

### Returns

Returns a `Promise<Response>` that resolves to:

* `Response`: The HTTP response from the workflow's `respondWith()` call

Throws an error if the webhook token is not found or invalid.

## Examples

### Basic API Route

Forward incoming HTTP requests to a webhook by token:

```typescript lineNumbers
import { resumeWebhook } from "workflow/api";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Token required", { status: 400 });
  }

  try {
    const response = await resumeWebhook(token, request); // [!code highlight]
    return response; // Returns the workflow's custom response
  } catch (error) {
    return new Response("Webhook not found", { status: 404 });
  }
}
```

### GitHub Webhook Handler

Handle GitHub webhook events and forward them to workflows:

```typescript lineNumbers
import { resumeWebhook } from "workflow/api";
import { verifyGitHubSignature } from "@/lib/github";

export async function POST(request: Request) {
  // Extract repository name from URL
  const url = new URL(request.url);
  const repo = url.pathname.split("/").pop();

  // Verify GitHub signature
  const signature = request.headers.get("x-hub-signature-256");
  const isValid = await verifyGitHubSignature(request, signature);

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Construct deterministic token
  const token = `github_webhook:${repo}`;

  try {
    const response = await resumeWebhook(token, request); // [!code highlight]
    return response;
  } catch (error) {
    return new Response("Workflow not found", { status: 404 });
  }
}
```

### Slack Slash Command Handler

Process Slack slash commands and route them to workflow webhooks:

```typescript lineNumbers
import { resumeWebhook } from "workflow/api";

export async function POST(request: Request) {
  const formData = await request.formData();
  const channelId = formData.get("channel_id") as string;
  const command = formData.get("command") as string;

  // Verify Slack request signature
  const slackSignature = request.headers.get("x-slack-signature");
  if (!slackSignature) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Construct token from channel ID
  const token = `slack_command:${channelId}`;

  try {
    const response = await resumeWebhook(token, request); // [!code highlight]
    return response;
  } catch (error) {
    // If no workflow is listening, return a default response
    return new Response(
      JSON.stringify({
        response_type: "ephemeral",
        text: "No active workflow for this channel"
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
```

### Multi-Tenant Webhook Router

Route webhooks to different workflows based on tenant/organization:

```typescript lineNumbers
import { resumeWebhook } from "workflow/api";

export async function POST(request: Request) {
  const url = new URL(request.url);

  // Extract tenant and webhook ID from path
  // e.g., /api/webhooks/tenant-123/webhook-abc
  const [, , , tenantId, webhookId] = url.pathname.split("/");

  if (!tenantId || !webhookId) {
    return new Response("Invalid webhook URL", { status: 400 });
  }

  // Verify API key for tenant
  const apiKey = request.headers.get("authorization");
  const isAuthorized = await verifyTenantApiKey(tenantId, apiKey);

  if (!isAuthorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Construct namespaced token
  const token = `tenant:${tenantId}:webhook:${webhookId}`;

  try {
    const response = await resumeWebhook(token, request); // [!code highlight]
    return response;
  } catch (error) {
    return new Response("Webhook not found or expired", { status: 404 });
  }
}

async function verifyTenantApiKey(tenantId: string, apiKey: string | null) {
  // Verify API key logic
  return apiKey === process.env[`TENANT_${tenantId}_API_KEY`];
}
```

### Server Action (Next.js)

Use `resumeWebhook` in a Next.js server action:

```typescript lineNumbers
"use server";

import { resumeWebhook } from "workflow/api";

export async function triggerWebhook(
  token: string,
  payload: Record<string, any>
) {
  // Create a Request object from the payload
  const request = new Request("http://localhost/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  try {
    const response = await resumeWebhook(token, request);

    // Parse and return the response
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    throw new Error("Webhook not found");
  }
}
```

## Related Functions

* [`createWebhook()`](/docs/api-reference/workflow/create-webhook) - Create a webhook in a workflow
* [`resumeHook()`](/docs/api-reference/workflow-api/resume-hook) - Resume a hook with arbitrary payload
* [`defineHook()`](/docs/api-reference/workflow/define-hook) - Type-safe hook helper


---
title: start
description: Start and enqueue a new workflow run.
type: reference
summary: Use start to programmatically enqueue a new workflow run from outside a workflow function.
prerequisites:
  - /docs/foundations/starting-workflows
---

# start



Start/enqueue a new workflow run.

```typescript lineNumbers
import { start } from "workflow/api";
import { myWorkflow } from "./workflows/my-workflow";

const run = await start(myWorkflow); // [!code highlight]
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { start } from "workflow/api";
export default start;`}
  showSections={["parameters"]}
/>

#### StartOptions

<TSDoc
  definition={`
import type { StartOptions } from "workflow/api";
export default StartOptions;`}
/>

### Returns

Returns a `Run` object:

<TSDoc
  definition={`
import { Run } from "workflow/api";
export default Run;`}
  showSections={["returns"]}
/>

Learn more about [`WorkflowReadableStreamOptions`](/docs/api-reference/workflow-api/get-run#workflowreadablestreamoptions).

## Good to Know

* The `start()` function is used in runtime/non-workflow contexts to programmatically trigger workflow executions.
* This is different from calling workflow functions directly, which is the typical pattern in Next.js applications.
* The function returns immediately after enqueuing the workflow - it doesn't wait for the workflow to complete.
* All arguments must be [serializable](/docs/foundations/serialization).

## Examples

### With Arguments

```typescript
import { start } from "workflow/api";
import { userSignupWorkflow } from "./workflows/user-signup";

const run = await start(userSignupWorkflow, ["user@example.com"]); // [!code highlight]
```

### With `StartOptions`

```typescript
import { start } from "workflow/api";
import { myWorkflow } from "./workflows/my-workflow";

const run = await start(myWorkflow, ["arg1", "arg2"], { // [!code highlight]
  deploymentId: "custom-deployment-id" // [!code highlight]
}); // [!code highlight]
```


---
title: workflow/next
description: Next.js integration for automatic bundling and runtime configuration.
type: overview
summary: Explore the Next.js integration for automatic workflow bundling and runtime support.
related:
  - /docs/getting-started/next
---

# workflow/next



Next.js integration for Workflow DevKit that automatically configures bundling and runtime support.

## Functions

<Cards>
  <Card title="withWorkflow" href="/docs/api-reference/workflow-next/with-workflow">
    Configures webpack/turbopack loaders to transform workflow code (`"use step"`/`"use workflow"` directives)
  </Card>
</Cards>


---
title: withWorkflow
description: Configure webpack/turbopack to transform workflow directives in Next.js.
type: reference
summary: Wrap your Next.js config with withWorkflow to enable workflow directive transformation.
prerequisites:
  - /docs/getting-started/next
---

# withWorkflow



Configures webpack/turbopack loaders to transform workflow code (`"use step"`/`"use workflow"` directives)

## Usage

To enable `"use step"` and `"use workflow"` directives while developing locally or deploying to production, wrap your `nextConfig` with `withWorkflow`.

```typescript title="next.config.ts" lineNumbers
import { withWorkflow } from "workflow/next"; // [!code highlight]
import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  // … rest of your Next.js config
};

// not required but allows configuring workflow options
const workflowConfig = {} 

export default withWorkflow(nextConfig, workflowConfig); // [!code highlight]
```

If you are exporting a function in your `next.config` you will need to ensure you call the function returned from `withWorkflow`.

```typescript title="next.config.ts" lineNumbers
import { NextConfig } from "next";
import { withWorkflow } from "workflow/next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

export default async function config(
  phase: string,
  ctx: {
    defaultConfig: NextConfig
  }
): Promise<NextConfig> {
  let nextConfig: NextConfig | typeof config = {};

  for (const configModifier of [withNextIntl, withWorkflow]) {
    nextConfig = configModifier(nextConfig);

    if (typeof nextConfig === "function") {
      nextConfig = await nextConfig(phase, ctx);
    }
  }
  return nextConfig;
}
```


---
title: createHook
description: Create a low-level hook to resume workflows with arbitrary payloads.
type: reference
summary: Use createHook to pause a workflow and resume it with an arbitrary payload from an external system.
prerequisites:
  - /docs/foundations/hooks
related:
  - /docs/api-reference/workflow/define-hook
  - /docs/api-reference/workflow/create-webhook
---

# createHook



Creates a low-level hook primitive that can be used to resume a workflow run with arbitrary payloads.

Hooks allow external systems to send data to a paused workflow without the HTTP-specific constraints of webhooks. They're identified by a token and can receive any serializable payload.

```ts lineNumbers
import { createHook } from "workflow"

export async function hookWorkflow() {
  "use workflow";
  const hook = createHook();  // [!code highlight]
  const result = await hook; // Suspends the workflow until the hook is resumed
}
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { createHook } from "workflow";
export default createHook;`
}
  showSections={['parameters']}
/>

#### HookOptions

<TSDoc
  definition={`
import type { HookOptions } from "workflow";
export default HookOptions;`
}
/>

### Returns

<TSDoc
  definition={`
import { createHook } from "workflow";
export default createHook;`}
  showSections={['returns']}
/>

#### Hook

<TSDoc
  definition={`
import type { Hook } from "workflow";
export default Hook;`}
/>

The returned `Hook` object also implements `AsyncIterable<T>`, which allows you to iterate over incoming payloads using `for await...of` syntax.

## Examples

### Basic Usage

When creating a hook, you can specify a payload type to be used for automatic type safety.

```typescript lineNumbers
import { createHook } from "workflow"

export async function approvalWorkflow() {
  "use workflow";

  const hook = createHook<{ approved: boolean; comment: string }>(); // [!code highlight]
  console.log("Send approval to token:", hook.token);

  const result = await hook;

  if (result.approved) {
    console.log("Approved with comment:", result.comment);
  }
}
```

### Customizing Tokens

Tokens are used to identify a specific hook. You can customize the token to be more specific to a use case.

```typescript lineNumbers
import { createHook } from "workflow";

export async function slackBotWorkflow(channelId: string) {
  "use workflow";

  // Token constructed from channel ID
  const hook = createHook<SlackMessage>({ // [!code highlight]
    token: `slack_webhook:${channelId}`, // [!code highlight]
  }); // [!code highlight]

  for await (const message of hook) {
    if (message.text === "/stop") {
      break;
    }
    await processMessage(message);
  }
}
```

### Waiting for Multiple Payloads

You can also wait for multiple payloads by using the `for await...of` syntax.

```typescript lineNumbers
import { createHook } from "workflow"

export async function collectHookWorkflow() {
  "use workflow";

  const hook = createHook<{ message: string; done?: boolean }>();

  const payloads = [];
  for await (const payload of hook) { // [!code highlight]
    payloads.push(payload);

    if (payload.done) break;
  }

  return payloads;
}
```

## Related Functions

* [`defineHook()`](/docs/api-reference/workflow/define-hook) - Type-safe hook helper
* [`resumeHook()`](/docs/api-reference/workflow-api/resume-hook) - Resume a hook with a payload
* [`createWebhook()`](/docs/api-reference/workflow/create-webhook) - Higher-level HTTP webhook abstraction


---
title: createWebhook
description: Create webhooks to suspend and resume workflows via HTTP requests.
type: reference
summary: Use createWebhook to suspend a workflow until an HTTP request is received at a generated URL.
prerequisites:
  - /docs/foundations/hooks
related:
  - /docs/api-reference/workflow/create-hook
---

# createWebhook



Creates a webhook that can be used to suspend and resume a workflow run upon receiving an HTTP request.

Webhooks provide a way for external systems to send HTTP requests directly to your workflow. Unlike hooks which accept arbitrary payloads, webhooks work with standard HTTP `Request` objects and can return HTTP `Response` objects.

```ts lineNumbers
import { createWebhook } from "workflow"

export async function webhookWorkflow() {
  "use workflow";
  const webhook = createWebhook();  // [!code highlight]
  console.log("Webhook URL:", webhook.url);

  const request = await webhook; // Suspends until HTTP request received
  console.log("Received request:", request.method, request.url);
}
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { createWebhook } from "workflow";
export default createWebhook;`}
  showSections={['parameters']}
/>

### Returns

<TSDoc
  definition={`
import { createWebhook } from "workflow";
export default createWebhook;`}
  showSections={['returns']}
/>

The returned `Webhook` object has:

* `url`: The HTTP endpoint URL that external systems can call
* `token`: The unique token identifying this webhook
* Implements `AsyncIterable<RequestWithResponse>` for handling multiple requests

The `RequestWithResponse` type extends the standard `Request` interface with a `respondWith(response: Response)` method for sending custom responses back to the caller.

## Examples

### Basic Usage

Create a webhook that receives HTTP requests and logs the request details:

```typescript lineNumbers
import { createWebhook } from "workflow"

export async function basicWebhookWorkflow() {
  "use workflow";

  const webhook = createWebhook(); // [!code highlight]
  console.log("Send requests to:", webhook.url);

  const request = await webhook;

  console.log("Method:", request.method);
  console.log("Headers:", Object.fromEntries(request.headers));

  const body = await request.text();
  console.log("Body:", body);
}
```

### Responding to Webhook Requests

Use the `respondWith()` method to send custom HTTP responses. Note that `respondWith()` must be called from within a step function:

```typescript lineNumbers
import { createWebhook, type RequestWithResponse } from "workflow"

async function sendResponse(request: RequestWithResponse) { // [!code highlight]
  "use step"; // [!code highlight]
  await request.respondWith( // [!code highlight]
    new Response(JSON.stringify({ success: true, message: "Received!" }), { // [!code highlight]
      status: 200, // [!code highlight]
      headers: { "Content-Type": "application/json" } // [!code highlight]
    }) // [!code highlight]
  ); // [!code highlight]
} // [!code highlight]

export async function respondingWebhookWorkflow() {
  "use workflow";

  const webhook = createWebhook();
  console.log("Webhook URL:", webhook.url);

  const request = await webhook;

  // Send a custom response back to the caller
  await sendResponse(request);

  // Continue workflow processing
  const data = await request.json();
  await processData(data);
}

async function processData(data: any) {
  "use step";
  // Process the webhook data
  console.log("Processing:", data);
}
```

### Customizing Tokens

Tokens are used to identify a specific webhook. You can customize the token to be more specific to a use case.

```typescript lineNumbers
import { type RequestWithResponse } from "workflow"

async function sendAck(request: RequestWithResponse) {
  "use step";
  await request.respondWith(
    new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" }
    })
  );
}

export async function githubWebhookWorkflow(repoName: string) {
  "use workflow";

  // Use a deterministic token based on the repository
  const webhook = createWebhook({ // [!code highlight]
    token: `github_webhook:${repoName}`, // [!code highlight]
  }); // [!code highlight]

  console.log("Configure GitHub webhook:", webhook.url);

  const request = await webhook;
  const event = await request.json();

  await sendAck(request);

  await deployCommit(event);
}

async function deployCommit(event: any) {
  "use step";
  // Deploy logic here
}
```

### Waiting for Multiple Requests

You can also wait for multiple requests by using the `for await...of` syntax.

```typescript lineNumbers
import { createWebhook, type RequestWithResponse } from "workflow"

async function sendSlackResponse(request: RequestWithResponse, message: string) {
  "use step";
  await request.respondWith(
    new Response(
      JSON.stringify({
        response_type: "in_channel",
        text: message
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  );
}

async function sendStopResponse(request: RequestWithResponse) {
  "use step";
  await request.respondWith(
    new Response("Stopping workflow...")
  );
}

export async function slackCommandWorkflow(channelId: string) {
  "use workflow";

  const webhook = createWebhook({
    token: `slack_command:${channelId}`,
  });

  for await (const request of webhook) { // [!code highlight]
    const formData = await request.formData();
    const command = formData.get("command");
    const text = formData.get("text");

    if (command === "/status") {
      // Respond immediately to Slack
      await sendSlackResponse(request, "Checking status...");

      // Process the command
      const status = await checkSystemStatus();
      await postToSlack(channelId, `Status: ${status}`);
    }

    if (text === "stop") {
      await sendStopResponse(request);
      break;
    }
  }
}

async function checkSystemStatus() {
  "use step";
  return "All systems operational";
}

async function postToSlack(channelId: string, message: string) {
  "use step";
  // Post message to Slack
}
```

## Related Functions

* [`createHook()`](/docs/api-reference/workflow/create-hook) - Lower-level hook primitive for arbitrary payloads
* [`defineHook()`](/docs/api-reference/workflow/define-hook) - Type-safe hook helper
* [`resumeWebhook()`](/docs/api-reference/workflow-api/resume-webhook) - Resume a webhook from an API route


---
title: defineHook
description: Create type-safe hooks with consistent payload types and optional validation.
type: reference
summary: Use defineHook to create a reusable, type-safe hook definition with optional schema validation.
prerequisites:
  - /docs/foundations/hooks
related:
  - /docs/api-reference/workflow/create-hook
---

# defineHook



Creates a type-safe hook helper that ensures the payload type is consistent between hook creation and resumption.

This is a lightweight wrapper around [`createHook()`](/docs/api-reference/workflow/create-hook) and [`resumeHook()`](/docs/api-reference/workflow-api/resume-hook) to avoid type mismatches. It also supports optional runtime validation and transformation of payloads using any [Standard Schema v1](https://standardschema.dev) compliant validator like Zod or Valibot.

<Callout>
  We recommend using `defineHook()` over `createHook()` in production codebases for better type safety and optional runtime validation.
</Callout>

```ts lineNumbers
import { defineHook } from "workflow";

const nameHook = defineHook<{
  name: string;
}>();

export async function nameWorkflow() {
  "use workflow";

  const hook = nameHook.create();  // [!code highlight]
  const result = await hook; // Fully typed as { name: string }
  console.log("Name:", result.name);
}
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { defineHook } from "workflow";
export default defineHook;`}
  showSections={['parameters']}
/>

### Returns

<TSDoc
  definition={`
interface DefineHook<T> {
/**

* Creates a new hook with the defined payload type.
*/
create: (options?: HookOptions) => Hook<T>;

/**

* Resumes a hook by sending a payload with the defined type.
 */
resume: (token: string, payload: T) => Promise<HookEntity | null>;
}
export default DefineHook;`}
/>

## Examples

### Basic Type-Safe Hook Definition

By defining the hook once with a specific payload type, you can reuse it in multiple workflows and API routes with automatic type safety.

```typescript lineNumbers
import { defineHook } from "workflow";

// Define once with a specific payload type
const approvalHook = defineHook<{ // [!code highlight]
  approved: boolean; // [!code highlight]
  comment: string; // [!code highlight]
}>(); // [!code highlight]

// In your workflow
export async function workflowWithApproval() {
  "use workflow";

  const hook = approvalHook.create();
  const result = await hook; // Fully typed as { approved: boolean; comment: string }

  console.log("Approved:", result.approved);
  console.log("Comment:", result.comment);
}
```

### Resuming with Type Safety

Hooks can be resumed using the same defined hook and a token. By using the same hook, you can ensure that the payload matches the defined type when resuming a hook.

```typescript lineNumbers
// Use the same defined hook to resume
export async function POST(request: Request) {
  const { token, approved, comment } = await request.json();

  // Type-safe resumption - TypeScript ensures the payload matches
  const result = await approvalHook.resume(token, { // [!code highlight]
    approved, // [!code highlight]
    comment, // [!code highlight]
  }); // [!code highlight]

  if (!result) {
    return Response.json({ error: "Hook not found" }, { status: 404 });
  }

  return Response.json({ success: true, runId: result.runId });
}
```

### Validate and Transform with Schema

You can provide runtime validation and transformation of hook payloads using the `schema` option. This option accepts any validator that conforms to the [Standard Schema v1](https://standardschema.dev) specification.

<Callout type="info">
  Standard Schema is a standardized specification for schema validation libraries. Most popular validation libraries support it, including Zod, Valibot, ArkType, and Effect Schema. You can also write custom validators.
</Callout>

#### Using Zod with defineHook

Here's an example using [Zod](https://zod.dev) to validate and transform hook payloads:

```typescript lineNumbers
import { defineHook } from "workflow";
import { z } from "zod";

export const approvalHook = defineHook({
  schema: z.object({ // [!code highlight]
    approved: z.boolean(), // [!code highlight]
    comment: z.string().min(1).transform((value) => value.trim()), // [!code highlight]
  }), // [!code highlight]
});

export async function approvalWorkflow(approvalId: string) {
  "use workflow";

  const hook = approvalHook.create({
    token: `approval:${approvalId}`,
  });

  // Payload is automatically typed based on the schema
  const { approved, comment } = await hook;
  console.log("Approved:", approved);
  console.log("Comment (trimmed):", comment);
}
```

When resuming the hook from an API route, the schema validates and transforms the incoming payload before the workflow resumes:

```typescript lineNumbers
export async function POST(request: Request) {
  // Incoming payload: { token: "...", approved: true, comment: "   Ready!   " }
  const { token, approved, comment } = await request.json();

  // The schema validates and transforms the payload:
  // - Checks that `approved` is a boolean
  // - Checks that `comment` is a non-empty string
  // - Trims whitespace from the comment
  // If validation fails, an error is thrown and the hook is not resumed
  await approvalHook.resume(token, { // [!code highlight]
    approved, // [!code highlight]
    comment, // Automatically trimmed to "Ready!" // [!code highlight]
  }); // [!code highlight]

  return Response.json({ success: true });
}
```

#### Using Other Standard Schema Libraries

The same pattern works with any Standard Schema v1 compliant library. Here's an example with [Valibot](https://valibot.dev):

```typescript lineNumbers
import { defineHook } from "workflow";
import * as v from "valibot";

export const approvalHook = defineHook({
  schema: v.object({ // [!code highlight]
    approved: v.boolean(), // [!code highlight]
    comment: v.pipe(v.string(), v.minLength(1), v.trim()), // [!code highlight]
  }), // [!code highlight]
});
```

### Customizing Tokens

Tokens are used to identify a specific hook and for resuming a hook. You can customize the token to be more specific to a use case.

```typescript lineNumbers
const slackHook = defineHook<{ text: string; userId: string }>();

export async function slackBotWorkflow(channelId: string) {
  "use workflow";

  const hook = slackHook.create({
    token: `slack:${channelId}`, // [!code highlight]
  });

  const message = await hook;
  console.log(`Message from ${message.userId}: ${message.text}`);
}
```

## Related Functions

* [`createHook()`](/docs/api-reference/workflow/create-hook) - Create a hook in a workflow.
* [`resumeHook()`](/docs/api-reference/workflow-api/resume-hook) - Resume a hook with a payload.


---
title: FatalError
description: Throw to mark a step as permanently failed without retrying.
type: reference
summary: Throw FatalError in a step to mark it as permanently failed and prevent retries.
prerequisites:
  - /docs/foundations/errors-and-retries
related:
  - /docs/api-reference/workflow/retryable-error
---

# FatalError



When a `FatalError` is thrown in a step, it indicates that the workflow should not retry a step, marking it as failure.

You should use this when you don't want a specific step to retry.

```typescript lineNumbers
import { FatalError } from "workflow"

async function fallibleWorkflow() {
    "use workflow"
    await fallibleStep();
}

async function fallibleStep() {
    "use step"
    throw new FatalError("Fallible!") // [!code highlight]
}
```

## API Signature

### Parameters

<TSDoc
  definition={`
interface Error {
/**

* The error message.
 */
message: string;
}
export default Error;`}
/>


---
title: fetch
description: Make HTTP requests from workflows with automatic serialization and retry semantics.
type: reference
summary: Use the workflow-aware fetch to make HTTP requests with automatic serialization and retry semantics.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/errors/fetch-in-workflow
---

# fetch



Makes HTTP requests from within a workflow. This is a special step function that wraps the standard `fetch` API, automatically handling serialization and providing retry semantics.

This is useful when you need to call external APIs or services from within your workflow.

<Callout>
  `fetch` is a *special* type of step function provided and should be called directly inside workflow functions.
</Callout>

```typescript lineNumbers
import { fetch } from "workflow"

async function apiWorkflow() {
    "use workflow"

    // Fetch data from an API
    const response = await fetch("https://api.example.com/data") // [!code highlight]
    return await response.json()
}
```

## API Signature

### Parameters

Accepts the same arguments as web [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch)

<TSDoc
  definition={`
import { fetch } from "workflow";
export default fetch;`}
  showSections={['parameters']}
/>

### Returns

Returns the same response as web [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch)

<TSDoc
  definition={`
import { fetch } from "workflow";
export default fetch;`}
  showSections={['returns']}
/>

## Examples

### Basic Usage

Here's a simple example of how you can use `fetch` inside your workflow.

```typescript lineNumbers
import { fetch } from "workflow"

async function apiWorkflow() {
    "use workflow"

    // Fetch data from an API
    const response = await fetch("https://api.example.com/data") // [!code highlight]
    const data = await response.json()

    // Make a POST request
    const postResponse = await fetch("https://api.example.com/create", { // [!code highlight]
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: "test" })
    })

    return data
}
```

We call `fetch()` with a URL and optional request options, just like the standard fetch API. The workflow runtime automatically handles the response serialization.

This API is provided as a convenience to easily use `fetch` in workflow, but often, you might want to extend and implement your own fetch for more powerful error handing and retry logic.

### Customizing Fetch Behavior

Here's an example of a custom fetch wrapper that provides more sophisticated error handling with custom retry logic:

```typescript lineNumbers
import { FatalError, RetryableError } from "workflow"

export async function customFetch(
    url: string,
    init?: RequestInit
) {
    "use step"

    const response = await fetch(url, init)

    // Handle client errors (4xx) - don't retry
    if (response.status >= 400 && response.status < 500) {
        if (response.status === 429) {
            // Rate limited - retry with backoff from Retry-After header
            const retryAfter = response.headers.get("Retry-After")

            if (retryAfter) {
                // The Retry-After header is either a number (seconds) or an RFC 7231 date string
                const retryAfterValue = /^\d+$/.test(retryAfter)
                    ? parseInt(retryAfter) * 1000  // Convert seconds to milliseconds
                    : new Date(retryAfter);        // Parse RFC 7231 date format

                // Use `RetryableError` to customize the retry
                throw new RetryableError( // [!code highlight]
                    `Rate limited by ${url}`, // [!code highlight]
                    { retryAfter: retryAfterValue } // [!code highlight]
                ) // [!code highlight]
            }
        }

        // Other client errors are fatal (400, 401, 403, 404, etc.)
        throw new FatalError( // [!code highlight]
            `Client error ${response.status}: ${response.statusText}` // [!code highlight]
        ) // [!code highlight]
    }

    // Handle server errors (5xx) - will retry automatically
    if (!response.ok) {
        throw new Error(
            `Server error ${response.status}: ${response.statusText}`
        )
    }

    return response
}
```

This example demonstrates:

* Setting custom `maxRetries` to 5 retries (6 total attempts including the initial attempt).
* Throwing [`FatalError`](/docs/api-reference/workflow/fatal-error) for client errors (400-499) to prevent retries.
* Handling 429 rate limiting by reading the `Retry-After` header and using [`RetryableError`](/docs/api-reference/workflow/retryable-error).
* Allowing automatic retries for server errors (5xx).


---
title: getStepMetadata
description: Access retry attempts and timing information within step functions.
type: reference
summary: Call getStepMetadata inside a step to access retry counts, timing, and idempotency keys.
prerequisites:
  - /docs/foundations/workflows-and-steps
---

# getStepMetadata



Returns metadata available in the current step function.

You may want to use this function when you need to:

* Track retry attempts in error handling
* Access timing information of a step and execution metadata
* Generate idempotency keys for external APIs

<Callout type="warn">
  This function can only be called inside a step function.
</Callout>

```typescript lineNumbers
import { getStepMetadata } from "workflow";

async function testWorkflow() {
  "use workflow";
  await logStepId();
}

async function logStepId() {
  "use step";
  const ctx = getStepMetadata(); // [!code highlight]
  console.log(ctx.stepId); // Grab the current step ID
}
```

### Example: Use `stepId` as an idempotency key

```typescript lineNumbers
import { getStepMetadata } from "workflow";

async function chargeUser(userId: string, amount: number) {
  "use step";
  const { stepId } = getStepMetadata();

  await stripe.charges.create(
    {
      amount,
      currency: "usd",
      customer: userId,
    },
    {
      idempotencyKey: `charge:${stepId}`, // [!code highlight]
    }
  );
}
```

<Callout type="info">
  Learn more about patterns and caveats in the{" "}
  <a href="/docs/foundations/idempotency">Idempotency</a> guide.
</Callout>

## API Signature

### Parameters

<TSDoc
  definition={`
import { getStepMetadata } from "workflow";
export default getStepMetadata;`}
  showSections={["parameters"]}
/>

### Returns

<TSDoc
  definition={`
import type { StepMetadata } from "workflow";
export default StepMetadata;`}
/>


---
title: getWorkflowMetadata
description: Access run IDs and timing information within workflow functions.
type: reference
summary: Call getWorkflowMetadata inside a workflow to access the run ID and timing information.
prerequisites:
  - /docs/foundations/workflows-and-steps
---

# getWorkflowMetadata



Returns additional metadata available in the current workflow function.

You may want to use this function when you need to:

* Log workflow run IDs
* Access timing information of a workflow

<Callout>
  If you need to access step context, take a look at [`getStepMetadata`](/docs/api-reference/workflow/get-step-metadata).
</Callout>

```typescript lineNumbers
import { getWorkflowMetadata } from "workflow"

async function testWorkflow() {
    "use workflow"

    const ctx = getWorkflowMetadata() // [!code highlight]
    console.log(ctx.workflowRunId)
}
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { getWorkflowMetadata } from "workflow";
export default getWorkflowMetadata;`}
  showSections={['parameters']}
/>

### Returns

<TSDoc
  definition={`
import type { WorkflowMetadata } from "workflow";
export default WorkflowMetadata;`}
/>


---
title: getWritable
description: Retrieves the current workflow run's default writable stream.
type: reference
summary: Use getWritable to access the workflow run's output stream for real-time data streaming.
prerequisites:
  - /docs/foundations/streaming
---

# getWritable



The writable stream can be obtained in workflow functions and passed to steps, or called directly within step functions to write data that can be read outside the workflow by using the `readable` property of the [`Run` object](/docs/api-reference/workflow-api/get-run).

Use this function in your workflows and steps to produce streaming output that can be consumed by clients in real-time.

<Callout type="warn">
  This function can only be called inside a workflow or step function (functions
  with `"use workflow"` or `"use step"` directive)
</Callout>

<Callout type="error">
  **Important:** While you can call `getWritable()` inside a workflow function
  to obtain the stream, you **cannot interact with the stream directly** in the
  workflow context (e.g., calling `getWriter()`, `write()`, or `close()`). The
  stream must be passed to step functions as arguments, or steps can call
  `getWritable()` directly themselves.
</Callout>

```typescript lineNumbers
import { getWritable } from "workflow";

export async function myWorkflow() {
  "use workflow";

  // Get the writable stream
  const writable = getWritable(); // [!code highlight]

  // Pass it to a step function to interact with it
  await writeToStream(writable); // [!code highlight]
}

async function writeToStream(writable: WritableStream) {
  "use step";

  const writer = writable.getWriter();
  await writer.write(new TextEncoder().encode("Hello from workflow!"));
  writer.releaseLock();
  await writable.close();
}
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { getWritable } from "workflow";
export default getWritable;`}
  showSections={["parameters"]}
/>

### Returns

<TSDoc
  definition={`
import { getWritable } from "workflow";
export default getWritable;`}
  showSections={["returns"]}
/>

Returns a `WritableStream<W>` where `W` is the type of data you plan to write to the stream.

## Good to Know

* **Workflow functions can only obtain the stream** - Call `getWritable()` in a workflow to get the stream reference, but you cannot call methods like `getWriter()`, `write()`, or `close()` directly in the workflow context.
* **Step functions can interact with streams** - Steps can receive the stream as an argument or call `getWritable()` directly, and they can freely interact with it (write, close, etc.).
* When called from a workflow, the stream must be passed as an argument to steps for interaction.
* When called from a step, it retrieves the same workflow-scoped stream directly.
* Always release the writer lock after writing to prevent resource leaks.
* The stream can write binary data (using `TextEncoder`) or structured objects.
* Remember to close the stream when finished to signal completion.

## Examples

### Basic Text Streaming

Here's a simple example streaming text data:

```typescript lineNumbers
import { sleep, getWritable } from "workflow";

export async function outputStreamWorkflow() {
  "use workflow";

  const writable = getWritable(); // [!code highlight]

  await sleep("1s");
  await stepWithOutputStream(writable);
  await sleep("1s");
  await stepCloseOutputStream(writable);

  return "done";
}

async function stepWithOutputStream(writable: WritableStream) {
  "use step";

  const writer = writable.getWriter();
  // Write binary data using TextEncoder
  await writer.write(new TextEncoder().encode("Hello, world!"));
  writer.releaseLock();
}

async function stepCloseOutputStream(writable: WritableStream) {
  "use step";

  // Close the stream to signal completion
  await writable.close();
}
```

### Calling `getWritable()` Inside Steps

You can also call `getWritable()` directly inside step functions without passing it as a parameter:

```typescript lineNumbers
import { sleep, getWritable } from "workflow";

export async function outputStreamFromStepWorkflow() {
  "use workflow";

  // No need to create or pass the stream - steps can get it themselves
  await sleep("1s");
  await stepWithOutputStreamInside();
  await sleep("1s");
  await stepCloseOutputStreamInside();

  return "done";
}

async function stepWithOutputStreamInside() {
  "use step";

  // Call getWritable() directly inside the step // [!code highlight]
  const writable = getWritable(); // [!code highlight]
  const writer = writable.getWriter();

  await writer.write(new TextEncoder().encode("Hello from step!"));
  writer.releaseLock();
}

async function stepCloseOutputStreamInside() {
  "use step";

  // Call getWritable() to get the same stream // [!code highlight]
  const writable = getWritable(); // [!code highlight]
  await writable.close();
}
```

### Using Namespaced Streams in Steps

You can also use namespaced streams when calling `getWritable()` from steps:

```typescript lineNumbers
import { getWritable } from "workflow";

export async function multiStreamWorkflow() {
  "use workflow";

  // Steps will access both streams by namespace
  await writeToDefaultStream();
  await writeToNamedStream();
  await closeStreams();

  return "done";
}

async function writeToDefaultStream() {
  "use step";

  const writable = getWritable(); // Default stream
  const writer = writable.getWriter();
  await writer.write({ message: "Default stream data" });
  writer.releaseLock();
}

async function writeToNamedStream() {
  "use step";

  const writable = getWritable({ namespace: "logs" }); // [!code highlight]
  const writer = writable.getWriter();
  await writer.write({ log: "Named stream data" });
  writer.releaseLock();
}

async function closeStreams() {
  "use step";

  await getWritable().close(); // Close default stream
  await getWritable({ namespace: "logs" }).close(); // Close named stream
}
```

### Advanced Chat Streaming

Here's a more complex example showing how you might stream AI chat responses:

```typescript lineNumbers
import { getWritable } from "workflow";
import { generateId, streamText, type UIMessageChunk } from "ai";

export async function chat(messages: UIMessage[]) {
  "use workflow";

  // Get typed writable stream for UI message chunks
  const writable = getWritable<UIMessageChunk>(); // [!code highlight]

  // Start the stream
  await startStream(writable);

  let currentMessages = [...messages];

  // Process messages in steps
  for (let i = 0; i < MAX_STEPS; i++) {
    const result = await streamTextStep(currentMessages, writable);
    currentMessages.push(result.messages);

    if (result.finishReason !== "tool-calls") {
      break;
    }
  }

  // End the stream
  await endStream(writable);
}

async function startStream(writable: WritableStream<UIMessageChunk>) {
  "use step";

  const writer = writable.getWriter();

  // Send start message
  writer.write({
    type: "start",
    messageMetadata: {
      createdAt: Date.now(),
      messageId: generateId(),
    },
  });

  writer.releaseLock();
}

async function streamTextStep(
  messages: UIMessage[],
  writable: WritableStream<UIMessageChunk>
) {
  "use step";

  const writer = writable.getWriter();

  // Call streamText from the AI SDK
  const result = streamText({
    model: "gpt-4",
    messages,
    /* other options */
  });

  // Pipe the AI stream into the writable stream
  const reader = result
    .toUIMessageStream({ sendStart: false, sendFinish: false })
    .getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    await writer.write(value);
  }

  reader.releaseLock();
  writer.releaseLock();

  // Return the result for the workflow to use
  return {
    messages: await result.response.then((r) => r.messages),
    finishReason: await result.finishReason,
  };
}

async function endStream(writable: WritableStream<UIMessageChunk>) {
  "use step";

  // Close the stream to signal completion
  await writable.close();
}
```


---
title: workflow
description: Core workflow primitives for steps, streaming, webhooks, and error handling.
type: overview
summary: Explore the core workflow package for steps, streaming, hooks, and error handling.
related:
  - /docs/foundations/workflows-and-steps
  - /docs/foundations/hooks
  - /docs/foundations/streaming
  - /docs/foundations/errors-and-retries
---

# workflow



Core workflow primitives including steps, context management, streaming, webhooks, and error handling.

## Installation

<CodeBlockTabs defaultValue="npm">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">
      npm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="pnpm">
      pnpm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="yarn">
      yarn
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="bun">
      bun
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">
    ```bash
    npm i workflow
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm add workflow
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn add workflow
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bun add workflow
    ```
  </CodeBlockTab>
</CodeBlockTabs>

## Functions

Workflow DevKit contains the following functions you can use inside your workflow functions:

<Cards>
  <Card href="/docs/api-reference/workflow/get-workflow-metadata" title="getWorkflowMetadata()">
    A function that returns context about the current workflow execution.
  </Card>

  <Card href="/docs/api-reference/workflow/get-step-metadata" title="getStepMetadata()">
    A function that returns context about the current step execution.
  </Card>

  <Card href="/docs/api-reference/workflow/sleep" title="sleep()">
    Sleeping workflows for a specified duration. Deterministic and replay-safe.
  </Card>

  <Card href="/docs/api-reference/workflow/fetch" title="fetch()">
    Make HTTP requests from within a workflow with automatic retry semantics.
  </Card>

  <Card href="/docs/api-reference/workflow/create-hook" title="createHook()">
    Create a low-level hook to receive arbitrary payloads from external systems.
  </Card>

  <Card href="/docs/api-reference/workflow/define-hook" title="defineHook()">
    Type-safe hook helper for consistent payload types.
  </Card>

  <Card href="/docs/api-reference/workflow/create-webhook" title="createWebhook()">
    Create a webhook that suspends the workflow until an HTTP request is received.
  </Card>

  <Card href="/docs/api-reference/workflow/get-writable" title="getWritable()">
    Access the current workflow run's default stream.
  </Card>
</Cards>

## Error Classes

Workflow DevKit includes error classes that can be thrown in a workflow or step to change the error exit strategy of a workflow.

<Cards>
  <Card href="/docs/api-reference/workflow/fatal-error" title="FatalError()">
    When thrown, marks a step as failed and the step is not retried.
  </Card>

  <Card href="/docs/api-reference/workflow/retryable-error" title="RetryableError()">
    When thrown, marks a step as retryable with an optional parameter.
  </Card>
</Cards>


---
title: RetryableError
description: Throw to retry a step, optionally after a specified duration.
type: reference
summary: Throw RetryableError in a step to trigger a retry with an optional delay.
prerequisites:
  - /docs/foundations/errors-and-retries
related:
  - /docs/api-reference/workflow/fatal-error
---

# RetryableError



When a `RetryableError` is thrown in a step, it indicates that the workflow should retry a step. Additionally, it contains a parameter `retryAfter` indicating when the step should be retried after.

You should use this when you want to retry a step or retry after a certain duration.

```typescript lineNumbers
import { RetryableError } from "workflow"

async function retryableWorkflow() {
    "use workflow"
    await retryStep();
}

async function retryStep() {
    "use step"
    throw new RetryableError("Retryable!") // [!code highlight]
}
```

<Callout>
  The difference between `Error` and `RetryableError` may not be entirely obvious, since when both are thrown, they both retry. The difference is that `RetryableError` has an additional configurable `retryAfter` parameter.
</Callout>

## API Signature

### Parameters

<TSDoc
  definition={`
import { type RetryableErrorOptions } from "workflow";
interface RetryableError {
  options?: RetryableErrorOptions;
  message: string;
}

export default RetryableError;`}
/>

#### RetryableErrorOptions

<TSDoc
  definition={`
import { type RetryableErrorOptions } from "workflow";
export default RetryableErrorOptions;`}
/>

## Examples

### Retrying after a duration

`RetryableError` can be configured with a `retryAfter` parameter to specify when the step should be retried after.

```typescript lineNumbers
import { RetryableError } from "workflow"

async function retryableWorkflow() {
    "use workflow"
    await retryStep();
}

async function retryStep() {
    "use step"
    throw new RetryableError("Retryable!", {
        retryAfter: "5m" // - supports "5m", "30s", "1h", etc. // [!code highlight]
    })
}
```

You can also specify the retry delay in milliseconds:

```typescript lineNumbers
import { RetryableError } from "workflow"

async function retryableWorkflow() {
    "use workflow"
    await retryStep();
}

async function retryStep() {
    "use step"
    throw new RetryableError("Retryable!", {
        retryAfter: 5000 // - 5000 milliseconds = 5 seconds // [!code highlight]
    })
}
```

Or retry at a specific date and time:

```typescript lineNumbers
import { RetryableError } from "workflow"

async function retryableWorkflow() {
    "use workflow"
    await retryStep();
}

async function retryStep() {
    "use step"
    throw new RetryableError("Retryable!", {
        retryAfter: new Date(Date.now() + 60000) // - retry after 1 minute // [!code highlight]
    })
}
```


---
title: sleep
description: Suspend a workflow for a duration or until a date without consuming resources.
type: reference
summary: Use sleep to suspend a workflow for a duration or until a specific date without consuming resources.
prerequisites:
  - /docs/foundations/workflows-and-steps
related:
  - /docs/ai/sleep-and-delays
---

# sleep



Suspends a workflow for a specified duration or until an end date without consuming any resources. Once the duration or end date passes, the workflow will resume execution.

This is useful when you want to resume a workflow after some duration or date.

<Callout>
  `sleep` is a *special* type of step function and should be called directly inside workflow functions.
</Callout>

```typescript lineNumbers
import { sleep } from "workflow"

async function testWorkflow() {
    "use workflow"
    await sleep("10s") // [!code highlight]
}
```

## API Signature

### Parameters

<TSDoc
  definition={`
import { sleep } from "workflow";
export default sleep;`}
  showSections={['parameters']}
/>

## Examples

### Sleeping With a Duration

You can specify a duration for `sleep` to suspend the workflow for a fixed amount of time.

```typescript lineNumbers
import { sleep } from "workflow"

async function testWorkflow() {
    "use workflow"
    await sleep("1d") // [!code highlight]
}
```

### Sleeping Until an End Date

You can specify a future `Date` object for `sleep` to suspend the workflow until a specific date.

```typescript lineNumbers
import { sleep } from "workflow"

async function testWorkflow() {
    "use workflow"
    await sleep(new Date(Date.now() + 10_000)) // [!code highlight]
}
```


---
title: Local World
description: Zero-config world bundled with Workflow for local development. No external services required.
type: integration
summary: Set up the Local World for zero-config workflow development on your machine.
prerequisites:
  - /docs/deploying
related:
  - /docs/deploying/world/postgres-world
  - /docs/deploying/world/vercel-world
---

# Local World



The Local World is bundled with `workflow` and used automatically during local development. No installation or configuration required.

To explicitly use the local world in any environment, set the environment variable:

```bash
WORKFLOW_TARGET_WORLD=local
```

## Observability

The `workflow` CLI uses the local world by default. Running these commands inside your workflow project will show your local development workflows:

```bash
# List recent workflow runs
npx workflow inspect runs

# Launch the web UI
npx workflow web
```

Learn more in the [Observability](/docs/observability) documentation.

## Testing & Performance

<WorldTestingPerformance />

## Configuration

The local world works with zero configuration, but you can customize behavior through environment variables or programmatically via `createLocalWorld()`.

### `WORKFLOW_LOCAL_DATA_DIR`

Directory for storing workflow data as JSON files. Default: `.workflow-data/`

### `PORT`

The application dev server port. Used to enqueue steps and workflows. Default: auto-detected

### `WORKFLOW_LOCAL_BASE_URL`

Full base URL override for HTTPS or custom hostnames. Default: `http://localhost:{port}`

Port resolution priority: `baseUrl` > `port` > `PORT` > auto-detected

### `WORKFLOW_LOCAL_QUEUE_CONCURRENCY`

Maximum number of concurrent queue workers. Default: `100`

### Programmatic configuration

{/* @skip-typecheck: incomplete code sample */}

```typescript title="workflow.config.ts" lineNumbers
import { createLocalWorld } from "@workflow/world-local";

const world = createLocalWorld({
  dataDir: "./custom-workflow-data",
  port: 5173,
  // baseUrl overrides port if set
  baseUrl: "https://local.example.com:3000",
});
```

## Limitations

The local world is designed for development, not production:

* **In-memory queue** - Steps are queued in memory and do not persist across server restarts
* **Filesystem storage** - Data is stored in local JSON files
* **Single instance** - Cannot handle distributed deployments
* **No authentication** - Suitable only for local development

For production deployments, use the [Vercel World](/worlds/vercel) or [Postgres World](/worlds/postgres).


---
title: Postgres World
description: Production-ready, self-hosted world using PostgreSQL for storage and pg-boss for job processing.
type: integration
summary: Deploy workflows to your own infrastructure using PostgreSQL and pg-boss.
prerequisites:
  - /docs/deploying
related:
  - /docs/deploying/world/local-world
  - /docs/deploying/world/vercel-world
---

# Postgres World



The Postgres World is a production-ready backend for self-hosted deployments. It uses PostgreSQL for durable storage and [pg-boss](https://github.com/timgit/pg-boss) for reliable job processing.

Use the Postgres World when you need to deploy workflows on your own infrastructure outside of Vercel - such as a Docker container, Kubernetes cluster, or any cloud that supports long-running servers.

## Installation

Install the Postgres World package in your workflow project:

<CodeBlockTabs defaultValue="npm">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">
      npm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="pnpm">
      pnpm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="yarn">
      yarn
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="bun">
      bun
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">
    ```bash
    npm install @workflow/world-postgres
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm add @workflow/world-postgres
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn add @workflow/world-postgres
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bun add @workflow/world-postgres
    ```
  </CodeBlockTab>
</CodeBlockTabs>

Configure the required environment variables to use the world and point it to your PostgreSQL database:

```bash title=".env"
WORKFLOW_TARGET_WORLD="@workflow/world-postgres"
WORKFLOW_POSTGRES_URL="postgres://user:password@host:5432/database"
```

Run the migration script to create the necessary tables in your database. Ensure `WORKFLOW_POSTGRES_URL` is set when running this command:

```bash
npx workflow-postgres-setup
```

<Callout type="info">
  The migration is idempotent and can safely be run as a post-deployment lifecycle script.
</Callout>

## Starting the World

To subscribe to the pg-boss queue, your workflow app needs to start the world on server start. Here are examples for a few frameworks:

<Tabs items={["Next.js", "SvelteKit", "Nitro"]}>
  <Tab value="Next.js">
    Create an `instrumentation.ts` file in your project root:

    ```ts title="instrumentation.ts" lineNumbers
    export async function register() {
      if (process.env.NEXT_RUNTIME !== "edge") {
        const { getWorld } = await import("workflow/runtime");
        await getWorld().start?.();
      }
    }
    ```

    <Callout type="info">
      Learn more about [Next.js Instrumentation](https://nextjs.org/docs/app/guides/instrumentation).
    </Callout>
  </Tab>

  <Tab value="SvelteKit">
    Create a `src/hooks.server.ts` file:

    ```ts title="src/hooks.server.ts" lineNumbers
    import type { ServerInit } from "@sveltejs/kit";

    export const init: ServerInit = async () => {
      const { getWorld } = await import("workflow/runtime");
      await getWorld().start?.();
    };
    ```

    <Callout type="info">
      Learn more about [SvelteKit Hooks](https://svelte.dev/docs/kit/hooks).
    </Callout>
  </Tab>

  <Tab value="Nitro">
    Create a plugin to start the world on server initialization:

    ```ts title="plugins/start-pg-world.ts" lineNumbers
    import { defineNitroPlugin } from "nitro/~internal/runtime/plugin";

    export default defineNitroPlugin(async () => {
      const { getWorld } = await import("workflow/runtime");
      await getWorld().start?.();
    });
    ```

    Register the plugin in your config:

    ```ts title="nitro.config.ts"
    import { defineNitroConfig } from "nitropack";

    export default defineNitroConfig({
      modules: ["workflow/nitro"],
      plugins: ["plugins/start-pg-world.ts"],
    });
    ```

    <Callout type="info">
      Learn more about [Nitro Plugins](https://v3.nitro.build/docs/plugins).
    </Callout>
  </Tab>
</Tabs>

<Callout type="info">
  The Postgres World requires a long-lived worker process that polls the database for jobs. This does not work on serverless environments. For Vercel deployments, use the [Vercel World](/worlds/vercel) instead.
</Callout>

## Observability

Use the `workflow` CLI to inspect workflows stored in PostgreSQL:

```bash
# Set your database URL
export WORKFLOW_POSTGRES_URL="postgres://user:password@host:5432/database"

# List workflow runs
npx workflow inspect runs --backend @workflow/world-postgres

# Launch the web UI
npx workflow web --backend @workflow/world-postgres
```

If `WORKFLOW_POSTGRES_URL` is not set, the CLI defaults to `postgres://world:world@localhost:5432/world`.

Learn more in the [Observability](/docs/observability) documentation.

## Testing & Performance

<WorldTestingPerformance />

## Configuration

All configuration options can be set via environment variables or programmatically via `createWorld()`.

### `WORKFLOW_POSTGRES_URL` (required)

PostgreSQL connection string. Falls back to `DATABASE_URL` if not set.

Default: `postgres://world:world@localhost:5432/world`

### `WORKFLOW_POSTGRES_JOB_PREFIX`

Prefix for pg-boss queue job names. Useful when sharing a database between multiple applications.

### `WORKFLOW_POSTGRES_WORKER_CONCURRENCY`

Number of concurrent workers polling for jobs. Default: `10`

### Programmatic configuration

{/* @skip-typecheck: incomplete code sample */}

```typescript title="workflow.config.ts" lineNumbers
import { createWorld } from "@workflow/world-postgres";

const world = createWorld({
  connectionString: "postgres://user:password@host:5432/database",
  jobPrefix: "myapp_",
  queueConcurrency: 20,
});
```

## How It Works

The Postgres World uses PostgreSQL as a durable backend:

* **Storage** - Workflow runs, events, steps, and hooks are stored in PostgreSQL tables
* **Job Queue** - [pg-boss](https://github.com/timgit/pg-boss) handles reliable job processing with retries
* **Streaming** - PostgreSQL NOTIFY/LISTEN enables real-time event distribution

This architecture ensures workflows survive application restarts with all state reliably persisted. For implementation details, see the [source code](https://github.com/vercel/workflow/tree/main/packages/world-postgres).

## Deployment

Deploy your application to any cloud that supports long-running servers:

* Docker containers
* Kubernetes clusters
* Virtual machines
* Platform-as-a-Service providers (Railway, Render, Fly.io, etc.)

Ensure your deployment has:

1. Network access to your PostgreSQL database
2. Environment variables configured correctly
3. The `start()` function called on server initialization

<Callout type="info">
  The Postgres World is not compatible with Vercel deployments. On Vercel, workflows automatically use the [Vercel World](/worlds/vercel) with zero configuration.
</Callout>

## Limitations

* **Requires long-running process** - Must call `start()` on server initialization; not compatible with serverless platforms
* **PostgreSQL infrastructure** - Requires a PostgreSQL database (self-hosted or managed)
* **Not compatible with Vercel** - Use the [Vercel World](/worlds/vercel) for Vercel deployments

For local development, use the [Local World](/worlds/local) which requires no external services.


---
title: Vercel World
description: Fully-managed world for Vercel deployments with automatic storage, queuing, and authentication.
type: integration
summary: Deploy workflows to Vercel with fully-managed storage, queuing, and authentication.
prerequisites:
  - /docs/deploying
related:
  - /docs/deploying/world/local-world
  - /docs/deploying/world/postgres-world
---

# Vercel World



The Vercel World is a fully-managed workflow backend for applications deployed on Vercel. It provides scalable storage, distributed queuing, and automatic authentication with zero configuration.

When you deploy to Vercel, workflows automatically use the Vercel World - no setup required.

## Usage

Deploy your application to Vercel:

```bash
vercel deploy
```

That's it. Vercel automatically:

* Selects the Vercel World backend
* Configures authentication using OIDC tokens
* Provisions storage and queuing infrastructure
* Isolates data per environment (production, preview, development)

## Observability

Workflow observability is built into the Vercel dashboard on your project page. It respects your existing authentication and project permission settings.

The `workflow` CLI commands open a browser window deeplinked to the Vercel dashboard:

```bash
# List workflow runs (opens Vercel dashboard)
npx workflow inspect runs --backend vercel

# Launch the web UI (opens Vercel dashboard)
npx workflow web --backend vercel
```

The CLI automatically retrieves authentication from the Vercel CLI (`vercel login`) and infers project/team IDs from your local Vercel project linking.

To use the local observability UI instead of the Vercel dashboard:

```bash
npx workflow web --backend vercel --localUi
```

To override the automatic configuration:

```bash
npx workflow inspect runs \
  --backend vercel \
  --env production \
  --project my-project \
  --team my-team \
  --authToken <your-token>
```

Learn more in the [Observability](/docs/observability) documentation.

## Testing & Performance

<WorldTestingPerformance />

## Configuration

The Vercel World requires no configuration when deployed to Vercel. For advanced use cases, you can override settings programmatically via `createVercelWorld()`.

### `WORKFLOW_VERCEL_ENV`

The Vercel environment to use. Options: `production`, `preview`, `development`. Automatically detected.

### `WORKFLOW_VERCEL_AUTH_TOKEN`

Authentication token for API requests. Automatically detected.

### `WORKFLOW_VERCEL_PROJECT`

Vercel project ID for API requests. Automatically detected.

### `WORKFLOW_VERCEL_TEAM`

Vercel team ID for API requests. Automatically detected.

### `WORKFLOW_VERCEL_BACKEND_URL`

Custom base URL for the Vercel workflow API. Automatically detected.

### Programmatic configuration

{/* @skip-typecheck: incomplete code sample */}

```typescript title="workflow.config.ts" lineNumbers
import { createVercelWorld } from "@workflow/world-vercel";

const world = createVercelWorld({
  token: process.env.WORKFLOW_VERCEL_AUTH_TOKEN,
  baseUrl: "https://api.vercel.com/v1/workflow",
  projectConfig: {
    projectId: "my-project",
    teamId: "my-team",
    environment: "production",
  },
});
```

## Versioning

On Vercel, workflow runs are pegged to the deployment that started them. This means:

* Existing workflow runs continue executing on their original deployment, even as new code is deployed
* New workflow runs start on the latest deployment
* Code changes won't break in-flight workflows

This ensures long-running workflows complete reliably without being affected by subsequent deployments.

## How It Works

The Vercel World uses Vercel's infrastructure for workflow execution:

* **Storage** - Workflow data is stored in Vercel's cloud with automatic replication and encryption
* **Queuing** - Steps are distributed across serverless functions with automatic retries
* **Authentication** - OIDC tokens provide secure, automatic authentication

For more details, see the [Vercel Workflow documentation](https://vercel.com/docs/workflow).

## Pricing and More

See the [Vercel Workflow documentation](https://vercel.com/docs/workflow) for current pricing and to learn more.

For self-hosted deployments, use the [Postgres World](/worlds/postgres). For local development, use the [Local World](/worlds/local).

## Limitations

* **Single-region deployment** - The backend infrastructure is currently deployed only in `iad1`. Applications in other regions will route workflow requests to `iad1`, which may result in higher latency. For best performance, deploy your Vercel apps using Workflow to `iad1`. Global deployment is planned to colocate the backend closer to your applications.
