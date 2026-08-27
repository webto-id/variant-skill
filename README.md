# html-to-webto-variant

An AI skill (Claude Code, Cursor, and other agents that read `SKILL.md`) that converts raw HTML/CSS/JS — a landing-page section, a Tailwind snippet, or just a design brief — into a **Webto Variant Format (WVF)** section variant that passes `npx @webto-id/variant-check --strict` and can be uploaded and sold on the [webto.id marketplace](https://app.webto.id/marketplace).

This repo is also the issue tracker for the [`@webto-id/variant-check`](https://www.npmjs.com/package/@webto-id/variant-check) CLI.

## Install

The repo root **is** the skill, so clone it straight into your agent's skills folder:

```bash
# Claude Code (project-level)
git clone https://github.com/webto-id/variant-skill .claude/skills/html-to-webto-variant

# Claude Code (global)
git clone https://github.com/webto-id/variant-skill ~/.claude/skills/html-to-webto-variant
```

Or download the zip from <https://docs.webto.id/downloads/html-to-webto-variant.zip> and extract it to the same place.

## Use

Ask your agent, for example:

> Konversi section ini menjadi variant webto untuk type `features-grid`, lalu jalankan `variant-check --strict`.

The skill always finishes by running the CLI, so the file you get back is already clean:

```bash
npx @webto-id/variant-check my-variant.astro --type features-grid --strict --content sample.json --out preview.html
```

## Contents

| Path | What it is |
|---|---|
| `SKILL.md` | Workflow + file skeleton the agent follows |
| `references/wvf.md` | The exact compiler rules: allowed tags/attributes/expressions, CSS & JavaScript reject lists, macros, lint codes |
| `references/schema.md` | Section types and their base content fields; how `interface Props` is classified |
| `references/tailwind.md` | Theme tokens and which Tailwind classes compile |
| `references/design.md` | What makes a variant good (and what gets it rejected in review) |
| `examples/` | Two complete variants that pass `--strict`, each with a `sample.json` |

## Docs

- Format spec, theme tokens, inline-edit contract, JavaScript rules, submit checklist: <https://docs.webto.id/marketplace/format-variant/>
- Section schema reference: <https://docs.webto.id/marketplace/referensi-schema/>

## License

MIT — see [LICENSE](LICENSE). The variant files *you* generate with this skill are yours.
