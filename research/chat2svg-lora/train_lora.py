#!/usr/bin/env python3
"""
LoRA SFT: instruction -> JSON {"svg": "<svg ...>...</svg>"} for the Wittgenstein `svg` modality.

Dataset columns vary by mirror; extend INSTRUCTION_KEYS / SVG_KEYS after inspecting the HF card.
"""

from __future__ import annotations

import argparse
import json
import os
from typing import Any

from datasets import load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from trl import SFTTrainer


INSTRUCTION_KEYS = ("instruction", "question", "prompt", "caption", "text", "input")
SVG_KEYS = ("svg", "output", "answer", "code", "content", "target")


def pick(row: dict[str, Any], keys: tuple[str, ...]) -> str | None:
    for k in keys:
        v = row.get(k)
        if v is None:
            continue
        s = str(v).strip()
        if s:
            return s
    return None


def row_to_messages(example: dict[str, Any]) -> list[dict[str, str]] | None:
    inst = pick(example, INSTRUCTION_KEYS)
    svg = pick(example, SVG_KEYS)
    if not inst or not svg:
        return None
    if "<svg" not in svg.lower():
        return None
    payload = json.dumps({"svg": svg.strip()}, ensure_ascii=False)
    return [
        {
            "role": "system",
            "content": (
                "Return JSON only with a single key `svg` whose value is a complete SVG document. "
                "No markdown fences."
            ),
        },
        {"role": "user", "content": inst},
        {"role": "assistant", "content": payload},
    ]


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model_id", default=os.environ.get("WITTGENSTEIN_SVG_MODEL_ID", "Qwen/Qwen2.5-0.5B-Instruct"))
    p.add_argument("--dataset", default=os.environ.get("WITTGENSTEIN_CHAT2SVG_DATASET", "kingno/Chat2SVG"))
    p.add_argument("--split", default="train")
    p.add_argument("--output_dir", default="./out-lora")
    p.add_argument("--max_steps", type=int, default=2000)
    p.add_argument("--learning_rate", type=float, default=2e-4)
    p.add_argument("--per_device_train_batch_size", type=int, default=1)
    p.add_argument("--max_seq_length", type=int, default=4096)
    p.add_argument("--gradient_accumulation_steps", type=int, default=8)
    args = p.parse_args()

    tokenizer = AutoTokenizer.from_pretrained(args.model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    raw = load_dataset(args.dataset, split=args.split, trust_remote_code=True)

    def to_text(example: dict[str, Any]) -> dict[str, str]:
        msgs = row_to_messages(example)
        if msgs is None:
            return {"text": ""}
        return {"text": tokenizer.apply_chat_template(msgs, tokenize=False)}

    mapped = raw.map(to_text, remove_columns=raw.column_names)
    mapped = mapped.filter(lambda ex: bool(ex.get("text")))
    if len(mapped) == 0:
        raise SystemExit(
            "No training rows after column mapping. Inspect the dataset schema on Hugging Face "
            "and extend INSTRUCTION_KEYS / SVG_KEYS in train_lora.py.",
        )

    model = AutoModelForCausalLM.from_pretrained(
        args.model_id,
        trust_remote_code=True,
    )

    peft = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=("q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"),
    )

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        max_steps=args.max_steps,
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.per_device_train_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        logging_steps=10,
        save_steps=500,
        bf16=True,
        report_to=[],
    )

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=mapped,
        peft_config=peft,
        processing_class=tokenizer,
        dataset_text_field="text",
        max_seq_length=args.max_seq_length,
    )
    trainer.train()
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print("saved", args.output_dir)


if __name__ == "__main__":
    main()
