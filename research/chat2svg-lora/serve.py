"""
Local SVG engine for the Wittgenstein `svg` modality.

POST /v1/generate  JSON body: {"prompt": "<expanded harness prompt>", "seed": null|int}
Response: {"text": "<json string with svg field>"}  — same shape the harness expects as `llmOutputRaw`.

Uses Outlines `generate.json` for **JSON-level** grammar constraints, then `xml.etree` to reject
ill-formed XML inside the `svg` string.
"""

from __future__ import annotations

import json
import logging
import os
import xml.etree.ElementTree as ET
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("wittgenstein-svg-serve")

app = FastAPI(title="Wittgenstein SVG grammar engine", version="0.1.0")


class SvgPayload(BaseModel):
    svg: str = Field(..., min_length=1)


class GenerateIn(BaseModel):
    prompt: str
    seed: Optional[int] = None


class GenerateOut(BaseModel):
    text: str


_generator: Any = None
_tokenizer: Any = None


def _load_stack() -> tuple[Any, Any]:
    global _generator, _tokenizer
    if _generator is not None and _tokenizer is not None:
        return _generator, _tokenizer

    try:
        from outlines import generate, models
        from transformers import AutoTokenizer
    except ImportError as e:  # pragma: no cover
        raise HTTPException(
            status_code=503,
            detail="Missing dependency (install `outlines` and `transformers`). " + str(e),
        ) from e

    model_id = os.environ.get("WITTGENSTEIN_SVG_MODEL_ID", "Qwen/Qwen2.5-0.5B-Instruct")
    log.info("loading outlines model %s", model_id)

    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    mdl = models.transformers(model_id)
    gen = generate.json(mdl, SvgPayload)

    _generator, _tokenizer = gen, tokenizer
    return gen, tokenizer


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/generate", response_model=GenerateOut)
def generate(inp: GenerateIn) -> GenerateOut:
    if inp.seed is not None:
        try:
            import torch

            torch.manual_seed(int(inp.seed))
        except Exception:
            pass

    generator, tokenizer = _load_stack()

    messages = [
        {
            "role": "system",
            "content": (
                "You must output JSON only with a single key `svg` whose value is one complete "
                "SVG document starting with <svg and ending with </svg>. No markdown."
            ),
        },
        {"role": "user", "content": inp.prompt},
    ]
    try:
        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"chat template failed: {e}") from e

    try:
        result: SvgPayload = generator(prompt)
    except Exception as e:
        log.exception("generation failed")
        raise HTTPException(status_code=500, detail=f"generation failed: {e}") from e

    try:
        ET.fromstring(result.svg)
    except ET.ParseError as e:
        raise HTTPException(
            status_code=422,
            detail=f"SVG is not well-formed XML: {e}",
        ) from e

    return GenerateOut(text=json.dumps({"svg": result.svg}, ensure_ascii=False))
