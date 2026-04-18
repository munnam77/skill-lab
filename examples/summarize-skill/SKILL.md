---
name: summarize
description: Summarize a long text into a 3-bullet TL;DR. Keep each bullet under 20 words. Use when the user asks to summarize, digest, TL;DR, or condense a document.
---

# summarize

Read the user-provided text and return exactly three bullet points. Each bullet:

- States one distinct idea from the source
- Is under 20 words
- Uses plain language
- Preserves any specific numbers, names, or dates if present

Output format:
```
- bullet 1
- bullet 2
- bullet 3
```

No preamble. No "here is your summary." Just the three bullets.
