---
date: 2026-04-23
status: Draft v0.1 (CRITICAL-PATH)
author: Wittgenstein research
summary: Wittgenstein's "LLM plans in symbols, VQ decoder renders to pixels" bet implicitly takes Ilya Sutskever's compression=intelligence side of a live argument whose other side is Yann LeCun's JEPA / world-models program. This brief steelmans both, sharpens the tension, and picks a position.
---

# B — Compression vs. World Models: Where does Wittgenstein stand?

## Why this brief is critical-path

Wittgenstein's architecture is one layer of abstraction above a philosophical fork. If we believe the Ilya lineage — that a sufficiently good next-token predictor _is_ a sufficiently good model of the world, because compression is intelligence — then the Planner component implied by RFC-0001's codec protocol v2 should be a frozen text LLM producing richer symbolic IR, and the rendering side is where capacity has to go. If we believe the LeCun lineage — that autoregressive symbol prediction will never build the latent action-state-future structure needed for multi-step planning — then the Planner we have not yet written has to be a JEPA-style energy model operating in a non-generative latent, and the codec protocol must eventually carry more than strings. Picking wrong doesn't break the current build; it silently routes 12–18 months of downstream work toward a dead end. Worse: a vague "both matter" answer looks balanced but actually commits us to Ilya-pure by inertia, because the current repo _only_ has the symbol side built. This brief exists so the position is explicit, defensible, and falsifiable.

## Steelman Ilya / compression = intelligence

The lineage is unusually clean for an ML debate. **Shannon (1948)** gives us entropy as the lower bound on average description length. **Kolmogorov (1965)** generalizes: the complexity of a string is the length of the shortest program that produces it. **Solomonoff induction** (1964) closes the loop: the optimal universal predictor weights every program by 2^(-length) and sums, which is equivalent to compressing maximally. Any agent that predicts next symbols optimally is computing an approximation to this uncomputable ideal. Prediction _is_ compression; compression _is_ induction; induction is the formal object we mean by "intelligence."

The practical lineage is equally concrete. **The Hutter Prize** (Hutter, 2006) ties a cash payout to compressing 1 GB of Wikipedia, explicitly framed as "better compression = better language model = progress toward AGI." **Fabrice Bellard's NNCP v2** (January 2021) is the first practical transformer to beat the best classical text compressors on enwik9 using a 56M-parameter Transformer-XL, running on one desktop GPU — empirical proof that neural sequence models are state-of-the-art general-purpose compressors. **Delétang, Ruoss, Duquenne, Catt, Genewein et al. (DeepMind, 2023)**, "Language Modeling Is Compression" (arXiv:2309.10668, submitted 19 Sep 2023, ICLR 2024), closes it formally: arithmetic coding driven by a language model achieves compression ratios bounded by model perplexity. Crucially, they show **Chinchilla 70B, trained only on text, compresses ImageNet patches to 43.4% of raw size (beating PNG at 58.5%) and LibriSpeech samples to 16.4% (beating FLAC at 30.3%)**. A text model is already a better image compressor than a purpose-built image codec. That result is the empirical bedrock of Wittgenstein's bet.

The public-intellectual layer: **Jack Rae, "Compression for AGI," Stanford MLSys #76 (27 Feb 2023)** — OpenAI team lead arguing that lossless compression performance is the cleanest scalar for AGI progress. **Ilya Sutskever, "An Observation on Generalization," Simons Institute workshop on Large Language Models and Transformers (14 August 2023)** — Sutskever, then OpenAI Chief Scientist, explicitly frames unsupervised learning as approximating the joint Kolmogorov complexity of concatenated datasets, positioning large neural nets trained with SGD as tractable approximations to Solomonoff's universal predictor.

Why this supports **Wittgenstein's bet specifically**: a frontier text LLM has ingested billions of image captions, HTML alt-text, diagram descriptions, code that renders figures, and prose discussing physical scenes. By the Delétang result, it has already _compressed_ image structure into its weights — not pixel textures, but the joint distribution of semantic content ("red barn on a hill at sunset" co-occurs with a predictable range of compositional layouts). Wittgenstein rides this compression. The LLM emits a ~60-token scene IR; a small adapter lifts that IR into a VQ decoder's codebook index space; the decoder — trained once, frozen — handles pixel expansion. We are not asking the LLM to model pixels. We are asking it to do what it already does: compress intent into symbols. The architecture is exactly the compression=intelligence thesis made operational.

## Steelman LeCun / JEPA / world models

LeCun's position is older than the current JEPA papers and deeper than Twitter critique. **Yann LeCun, "A Path Towards Autonomous Machine Intelligence," v0.9.2 (OpenReview, 27 June 2022)** is the canonical reference. Its claim: the bottleneck on machine intelligence is not more text prediction; it is that current systems have no _world model_ — no learned forward dynamics that let an agent imagine counterfactual futures conditioned on imagined actions, and search over them. The paper lays out a modular cognitive architecture: a Perception module, a Configurator, a Critic, short/long-term memory, and a hierarchical **Joint Embedding Predictive Architecture (JEPA)** as the predictor, trained by energy minimization in a non-generative latent.

The operational critique of autoregressive LLMs is sharp: pixel-level or token-level generative objectives force the model to model _everything_ in the signal, including stochastic high-entropy detail that is irrelevant to downstream planning. Capacity gets spent predicting the texture of leaves or the exact comma placement, not the causal structure of the scene. Planning requires abstraction — throwing away detail — and generative training punishes exactly that. JEPA fixes this by predicting in a _learned latent_ where the predictor can choose what to represent and what to ignore, trained with an information-bottleneck-style objective so collapse is avoided.

The empirical arm followed. **I-JEPA: Assran, Duval, Misra, Bojanowski, Vincent, Rabbat, LeCun, Ballas**, "Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture" (arXiv:2301.08243, CVPR 2023) demonstrates that predicting the _representations_ of masked image blocks — not their pixels — yields strong semantic features at ~10× the efficiency of MAE. **V-JEPA: Bardes, Garrido, Ponce, Rabbat, LeCun, Assran, Ballas**, "Revisiting Feature Prediction for Learning Visual Representations from Video" (arXiv:2404.08471, February 2024) extends this to video with no text, no negatives, no reconstruction, matching strong supervised baselines on Kinetics-400 and SSv2. **V-JEPA 2** (arXiv:2506.09985, June 2025), 1.2B params trained on >1M hours of video, is the first JEPA system used directly for **zero-shot robot planning** — V-JEPA 2-AC controls Franka arms in unseen labs by latent-space planning against image goals. This is the punchline of LeCun's program: world models trained non-generatively can plan.

LeCun's public critique of autoregressive LLMs — repeated across X/Twitter posts (2023–2025), his 2024 Lex Fridman appearances, and Meta AI's official blog rollouts — is not that LLMs are useless, but that the autoregressive objective is a _dead end for reasoning_: errors compound exponentially over tokens, there is no mechanism for search, and the symbol surface is downstream of perception rather than co-learned with it. "A house cat has a better world model than any LLM" is the deliberately provocative version. The disciplined version is: **symbols that were never grounded in action-conditioned latent dynamics cannot support planning**, no matter how fluently they are sampled.

## The specific tension with Wittgenstein

Sharpened: Wittgenstein's Planner-shaped hole is filled, today, by prompting a frozen text LLM to emit structured IR. That IR is then lifted by an adapter into VQ tokens and decoded. In Ilya's frame this is elegant — we plan in the space the LLM has already compressed into, and we render in the space the decoder was built for. In LeCun's frame this is a category error. The "planning" space is not a world-model latent; it is the surface statistics of web text about images. It has no action-conditioned dynamics, no learned equivariance under composition, no mechanism to reject physically impossible arrangements except insofar as such arrangements were linguistically rare in training.

The failure modes LeCun would predict for us, named concretely:

- **Long-horizon compositional prompts degrade non-gracefully.** "A red cube on a blue cube on a green cube, camera rotating 45° counterclockwise" — each additional compositional constraint compounds IR-level inconsistency, because the symbol layer has no notion of spatial state persistence across imagined steps.
- **Physical plausibility failures at the seams.** Shadows, occlusion ordering, and contact physics are handled by the decoder's texture prior, not by any planning step that checks physics. Wrong-side shadows and impossible intersections will show up and we will have nowhere to fix them inside the symbol layer.
- **Counterfactual / editing prompts are second-class.** "Now remove the cube and show what's behind it" requires reasoning about what _was_ occluded. A text IR can phrase the counterfactual; only a world model can answer it consistently.
- **Multi-artifact coherence (the 35-showcase pack!) is the stress test.** If our showcase tells a multi-frame or multi-panel story, the Ilya-pure path has no state beyond the prompt string. A JEPA planner would maintain a latent world state across frames.

This is the honest tension. Our bet works brilliantly for the cases where the LLM's compressed prior is already adequate (single images, conventional compositions, text-describable scenes). It degrades exactly where LeCun predicts it will.

## Four positions, with trade-offs

### (i) Ilya-pure

- **Codec protocol**: Stays text-IR forever. v2 extends the IR vocabulary; no latent channel.
- **Training cost**: Near zero on the planning side — ride frozen LLMs. All capex goes to decoders.
- **Pitch narrative**: "We are the modality harness for text-first models. Text is already the universal IR." Clean, fundable, immediately demo-able.
- **Cost if wrong**: We top out on the failure modes above and get leapfrogged by any system that couples a world model to a renderer. Our harness becomes legacy glue.

### (ii) LeCun-pure

- **Codec protocol**: Rewritten around latent tensors, not strings. VQ indices become one of many latent channels; text is demoted to one input among several.
- **Training cost**: Enormous. We would have to train or license a JEPA-family world model, which today means Meta-scale video compute.
- **Pitch narrative**: "World-model-first multimodal." Scientifically credible but uncompetitive on time-to-first-demo, and we abandon the thing we have working.
- **Cost if wrong**: We burn 12 months re-platforming for a capability that the frontier LLM providers may quietly absorb anyway. Risks extinction before first real user.

### (iii) Layered: compression for rendering, world-models for planning

- **Codec protocol**: Stays text-IR at the boundary we ship _today_; RFC-0001 v2 adds an optional latent side-channel (`planner_latent`) that decoders may ignore. No existing codec breaks.
- **Training cost**: We defer world-model training until external JEPA checkpoints are usable (V-JEPA 2 is already a candidate). We build the _interface_, not the model.
- **Pitch narrative**: "Harness separates planning from rendering. Today's planner is a text LLM; tomorrow's can be a world model. The seam is the contract." This is a _stronger_ narrative than (i) because it preempts the LeCun critique.
- **Cost if wrong**: If world models never deliver planning gains, the latent side-channel is dead weight in the protocol spec — minor cost, recoverable.

### (iv) Agnostic / protocol-pluralist

- **Codec protocol**: Codecs declare which IR shapes they consume (`text`, `latent`, `hybrid`); benchmark suite decides.
- **Training cost**: Similar to (iii), but with explicit A/B infrastructure.
- **Pitch narrative**: "We are the measurement layer for the Ilya–LeCun bake-off." Attractive to researchers, weaker for end users.
- **Cost if wrong**: Surface area grows faster than conviction. Risks becoming a benchmark harness with no opinion.

## Adjacent lineage worth naming

**Geoffrey Hinton, "The Forward-Forward Algorithm: Some Preliminary Investigations"** (arXiv:2212.13345, 27 Dec 2022). Hinton proposes replacing backprop's forward + backward passes with two forward passes — one on positive (real) data, one on negative (synthetic or self-generated) data — with each layer optimizing a local goodness objective. Relevant here because FF sits partly in LeCun's camp (local, contrastive, energy-flavored) and partly orthogonal (not a world model). It is a reminder that the compression-vs-worldmodel axis is not the only axis; the _learning rule_ axis is live too, and any position we pick should not foreclose local-learning research.

**Yoshua Bengio, "The Consciousness Prior"** (arXiv:1709.08568, Sep 2017; revised Dec 2019; subsequent 2023 talks extending it). Bengio posits that high-level thought operates on a sparse, low-dimensional subset of variables selected by attention from a broader representation — analogous to a sentence: few variables, high confidence. This sits _between_ the two camps: it is compatible with JEPA (low-dim bottleneck in a learned latent) and also compatible with symbolic IR (the "sentence-like" analogy is literal). The consciousness prior is the best existing argument that position (iii) is not just a compromise but a principled architecture.

**Karl Friston, free-energy principle** (various, 2006–). Claim: biological agents minimize variational free energy, which under mild assumptions unifies perception, action, and learning as a single objective. We sketch this only — we do not claim a unification. It is relevant because JEPA's energy-based framing is arguably a machine-learning instantiation of FEP, and because it gives us a vocabulary for saying "planning = inference over a generative model of self-in-world" that is more disciplined than either the Ilya or LeCun marketing.

**Solomonoff induction** (Ray Solomonoff, 1964). The formal ground beneath Ilya's position. A universal predictor that assigns every hypothesis prior 2^(-K(h)) for Kolmogorov complexity K is Bayes-optimal in the limit. Every "scaling laws work because compression = intelligence" argument is, ultimately, a pointer at Solomonoff. Worth naming explicitly because it tells us the Ilya side is not a slogan — it has a theorem under it.

## Red team

_LeCun himself, having read this brief:_

"You have written a careful document that still makes the mistake I keep warning about. You treat 'the LLM has compressed image structure' as if compression of captions implies a model of the world the captions describe. It does not. A perfect compressor of art-history textbooks is not a painter. Your decoder does the painting — fine — but then your 'planner' is a surface-statistics engine that has never once been forced to predict the consequence of an action in a latent that admits search. When your users ask for anything that requires holding world-state across steps, you will ship either incoherence or a very expensive prompt-engineering patch. Your position (iii) is almost right, but you treat the JEPA side as a future optional extension rather than the load-bearing part. That ordering is wrong: you should build the latent channel _first_, so that every codec you ship is already world-model-ready, and fill it with a text projection in the interim."

_Answer:_ The objection is correct that (iii) is the right shape and almost right in ordering. We disagree on the sequencing specifically because of the asymmetry in maturity. Public JEPA checkpoints capable of _planning-grade_ latent prediction are ~1 system old (V-JEPA 2, June 2025), not yet integrated with text conditioning at the level we would need, and not under a license we control. Building the latent _channel_ before we have a tenant for it is protocol-over-engineering — it calcifies a shape around an unknown. What we _will_ do, and what the verdict below commits us to, is make the codec protocol's IR type a sum type from day one (`IR = Text | Latent | Hybrid`), even if only `Text` has an implementation. That is the smallest pre-commitment that keeps LeCun's extension cheap without shipping placeholder bytes. If V-JEPA 2 or a successor hits our kill criterion, we promote `Latent` from declared-but-unimplemented to first-class within one release cycle.

## Kill criteria

1. **JEPA multimodal parity by Q3 2026.** If a well-funded open-source JEPA-only multimodal system with output heads (VL-JEPA successors, V-JEPA 3, or a DeepMind/Meta equivalent) reaches parity on the Wittgenstein 35-artifact showcase suite by Q3 2026 without using a frontier text LLM as planner, position (iii) demotes to (ii) and we begin the replatform. "Parity" = matched or exceeded on at least 28 of 35 artifacts on blind human eval (n≥50 raters, pairwise preference).

2. **Compositional ceiling on our own harness.** If, on a held-out compositional benchmark (≥3 objects with spatial + relational + counterfactual constraints), our text-IR planner cannot exceed 60% success rate after two rounds of IR-vocabulary extension, the text-IR planner is judged structurally insufficient and we escalate to wiring a JEPA planner into the existing `planner_latent` slot. This triggers _within_ position (iii) rather than triggering a demotion — but it converts the Planner work from "future" to "now."

3. **Protocol rot check (stretch kill).** If RFC-0001 codec protocol v2 ships and by v4 we have not added _any_ non-text field to the IR — meaning the sum type remained uninhabited for two full protocol revisions — then (iii) was cosplay for (i) and we should either formally collapse to (i) and remove the dead type, or force-fund a JEPA integration.

## Verdict

**Position (iii) Layered, with (iv) Agnostic as the engineering contract.**

The reasoning is structural. Wittgenstein already separates planning from rendering at the IR boundary. That seam is the exact place LeCun's critique wants us to insert a world model. We do not need to _have_ the world model today to design the seam such that a world model can enter tomorrow. Position (iii) takes the Ilya thesis at its word for the thing it has empirically earned — that a frozen text LLM is an extraordinarily good semantic compressor, good enough to drive VQ rendering via a tiny adapter, which is the entire current product — and concedes the LeCun thesis where _it_ has earned it: that planning, long-horizon coherence, and physical plausibility will not come out of a symbol stream trained on caption co-occurrence, and the clean place to address that is a non-generative latent predictor slotted in at the planner interface.

Operationally:

- RFC-0001 v2 defines `IR = Text | Latent | Hybrid` as a sum type. Only `Text` is implemented in v2. `Latent` is specified as an opaque tensor channel with shape metadata; decoders MAY declare support.
- The existing adapter-to-VQ pipeline is unchanged and remains the default rendering path for `Text` IR.
- The future Planner component is scoped as L1+ and explicitly designed as pluggable — today, a frozen text LLM with prompt templates; tomorrow, a JEPA-family encoder producing `Latent`.
- We adopt position (iv)'s engineering contract — codecs declare consumed IR shapes — as the mechanism that makes (iii) non-lock-in. The codec registry becomes the A/B harness when the second tenant arrives.

This lets us ship today on Ilya's ledger, keeps LeCun from being an existential threat, and converts "we bet wrong on the philosophy" from a re-platform into a patch.

_— Wittgenstein research, 2026-04-23_

## References

- Shannon, C. E. (1948). "A Mathematical Theory of Communication." _Bell System Technical Journal._
- Solomonoff, R. J. (1964). "A Formal Theory of Inductive Inference, Part I." _Information and Control_ 7(1): 1–22.
- Kolmogorov, A. N. (1965). "Three approaches to the quantitative definition of information." _Problems of Information Transmission._
- Bengio, Y. (2017/2019). "The Consciousness Prior." arXiv:1709.08568. https://arxiv.org/abs/1709.08568
- Bellard, F. (2021). "NNCP v2: Lossless Data Compression with Transformer." https://bellard.org/nncp/nncp_v2.pdf
- LeCun, Y. (2022). "A Path Towards Autonomous Machine Intelligence, v0.9.2." OpenReview. https://openreview.net/pdf?id=BZ5a1r-kVsf
- Hinton, G. (2022). "The Forward-Forward Algorithm: Some Preliminary Investigations." arXiv:2212.13345. https://arxiv.org/abs/2212.13345
- Assran, M., Duval, Q., Misra, I., Bojanowski, P., Vincent, P., Rabbat, M., LeCun, Y., Ballas, N. (2023). "Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture" (I-JEPA). arXiv:2301.08243. CVPR 2023. https://arxiv.org/abs/2301.08243
- Rae, J. (2023). "Compression for AGI." Stanford MLSys Seminar #76, 27 February 2023. https://www.youtube.com/watch?v=dO4TPJkeaaU
- Sutskever, I. (2023). "An Observation on Generalization." Simons Institute workshop on LLMs and Transformers, 14 August 2023. https://simons.berkeley.edu/talks/ilya-sutskever-openai-2023-08-14
- Delétang, G., Ruoss, A., Duquenne, P.-A., Catt, E., Genewein, T., et al. (2023). "Language Modeling Is Compression." arXiv:2309.10668. ICLR 2024. https://arxiv.org/abs/2309.10668
- Bardes, A., Garrido, Q., Ponce, J., Rabbat, M., LeCun, Y., Assran, M., Ballas, N. (2024). "Revisiting Feature Prediction for Learning Visual Representations from Video" (V-JEPA). arXiv:2404.08471. https://arxiv.org/abs/2404.08471
- Meta AI / FAIR (2025). "V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning." arXiv:2506.09985. https://arxiv.org/abs/2506.09985
- Friston, K. (2006–). Free-energy principle, various. Sketched only; not load-bearing in this brief.
- Hutter, M. (2006). "The Human Knowledge Compression Prize." http://prize.hutter1.net

_Citation confidence: all arxiv numbers, talk dates, and paper titles above were verified 2026-04-23 via web search. No unconfirmed citations in this brief._
