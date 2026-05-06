// Lovable AI gateway proxy for Study Stack
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "google/gemini-2.5-flash";

type Action = "quiz" | "flashcards" | "summary" | "ask";

interface Body {
  action: Action;
  noteTitle?: string;
  noteDescription?: string;
  count?: number;
  question?: string;
  context?: string;
}

function buildMessages(b: Body) {
  switch (b.action) {
    case "quiz":
      return {
        system: "You are an expert academic tutor that creates rigorous multiple-choice quizzes.",
        user: `Generate exactly ${b.count ?? 5} multiple-choice questions based on:\nTitle: ${b.noteTitle}\nDescription: ${b.noteDescription}\nEach question must have 4 options, a correct_answer matching one option, and a clear explanation.`,
        tool: {
          name: "return_quiz",
          description: "Return generated quiz questions",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    correct_answer: { type: "string" },
                    explanation: { type: "string" },
                  },
                  required: ["question", "options", "correct_answer", "explanation"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      };
    case "flashcards":
      return {
        system: "You create concise, high-quality flashcards for active recall.",
        user: `Create exactly ${b.count ?? 8} flashcards for:\nTitle: ${b.noteTitle}\nDescription: ${b.noteDescription}\nFront = question/concept, Back = concise answer/definition.`,
        tool: {
          name: "return_flashcards",
          description: "Return generated flashcards",
          parameters: {
            type: "object",
            properties: {
              cards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    front: { type: "string" },
                    back: { type: "string" },
                  },
                  required: ["front", "back"],
                  additionalProperties: false,
                },
              },
            },
            required: ["cards"],
            additionalProperties: false,
          },
        },
      };
    case "summary":
      return {
        system: "You write concise, exam-focused revision summaries in Markdown with bullet points.",
        user: `Summarize this study material:\nTitle: ${b.noteTitle}\nDescription: ${b.noteDescription}`,
      };
    case "ask":
      return {
        system: "You are a helpful AI study assistant. Provide clear, educational answers.",
        user: `Context: ${b.context ?? ""}\n\nStudent's Question: ${b.question}`,
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const built = buildMessages(body);
    if (!built) throw new Error("Invalid action");

    const payload: any = {
      model: MODEL,
      messages: [
        { role: "system", content: built.system },
        { role: "user", content: built.user },
      ],
    };

    if ("tool" in built && built.tool) {
      payload.tools = [{ type: "function", function: built.tool }];
      payload.tool_choice = { type: "function", function: { name: built.tool.name } };
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error", resp.status, text);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const msg = data.choices?.[0]?.message;
    let result: any;

    if ("tool" in built && built.tool) {
      const args = msg?.tool_calls?.[0]?.function?.arguments;
      const parsed = args ? JSON.parse(args) : {};
      if (body.action === "quiz") result = parsed.questions ?? [];
      else if (body.action === "flashcards") result = parsed.cards ?? [];
    } else {
      result = msg?.content ?? "";
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-study error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
