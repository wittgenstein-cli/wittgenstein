"""Synthesize (prompt, painter-params) pairs via the LLM.

Output: train/data.jsonl  each line: {"prompt": str, "params": {...}}

Params target the fallback_painter schema:
  palette (5 RGB), noise_scale, grain, composition, accent_count
"""
from __future__ import annotations
import json
import os
import sys
from polyglot.llm import chat, extract_json_block


SYS = """You generate training data for a tiny text->style-params model.
Given a short image PROMPT, emit ONE fenced ```json object with this exact schema:
{
  "palette": [[r,g,b],[r,g,b],[r,g,b],[r,g,b],[r,g,b]],   // 5 RGB 0-255
  "noise_scale": <float 2..20>,     // larger = smoother blobs
  "grain": <float 0..0.2>,
  "composition": "centered"|"rule-of-thirds"|"diagonal",
  "accent_count": <int 2..12>
}
The palette should fit the prompt's mood. No prose."""


PROMPTS_SEED = [
    "a serene misty mountain at dawn",
    "neon cyberpunk alley, rain, reflections",
    "warm minimalist scandinavian interior",
    "tense thunderstorm over a black ocean",
    "pastel spring cherry blossoms",
    "industrial rusted metal macro",
    "deep space nebula, purple and gold",
    "sunlit desert dune at noon",
    "cozy bookshop interior, amber light",
    "abstract geometric composition, primary colors",
    "underwater coral reef, bright fish",
    "gritty film-noir city street",
    "soft dreamy watercolor garden",
    "volcanic landscape, lava glow",
    "clinical medical laboratory",
    "vintage 1970s poster aesthetic",
    "minimalist zen garden raked sand",
    "snowy alpine village at night",
    "tropical sunset over palm trees",
    "foggy scandinavian forest",
    "retro arcade neon pink and teal",
    "art deco gold and black",
    "muted earthy pottery studio",
    "bright saturday market in kyoto",
    "dramatic chiaroscuro portrait lighting",
]


def synthesize(n_total: int = 400, out_path: str = "train/data.jsonl") -> int:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    written = 0
    with open(out_path, "w") as f:
        for i in range(n_total):
            seed_prompt = PROMPTS_SEED[i % len(PROMPTS_SEED)]
            # ask LLM to rephrase + emit params in one shot
            user = (
                f"Invent a variant of this prompt (keep the mood but change subject slightly): "
                f"'{seed_prompt}'. Then emit the JSON params as specified."
            )
            try:
                r = chat(user, system=SYS, temperature=0.9, max_tokens=500)
                # LLM may put a new prompt line before the JSON. Separate.
                raw = r.text
                params = json.loads(extract_json_block(raw))
                # heuristic: first non-empty non-code line above the fence is the prompt variant
                pre = raw.split("```", 1)[0].strip()
                new_prompt = pre.splitlines()[0].strip(' "-*') if pre else seed_prompt
                if len(new_prompt) < 4:
                    new_prompt = seed_prompt
                rec = {"prompt": new_prompt, "params": params}
                # sanity-validate
                assert len(rec["params"]["palette"]) == 5
                f.write(json.dumps(rec) + "\n"); f.flush()
                written += 1
                if written % 10 == 0:
                    print(f"  .. {written}/{n_total}", file=sys.stderr)
            except Exception as e:
                print(f"skip {i}: {e}", file=sys.stderr)
    print(f"wrote {written} examples to {out_path}", file=sys.stderr)
    return written


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 200
    synthesize(n)
