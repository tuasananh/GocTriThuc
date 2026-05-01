# @app/lexical-editor

Notion-like rich-text editor packaged as a Web Component (`<notion-editor>`).
Vendored from `facebook/lexical` `lexical-playground`. Isolated from host business code
by a pnpm workspace boundary plus ESLint guards in both directions.

    pnpm dev        # http://localhost:5183/  (standalone demo)
    pnpm typecheck
    pnpm build      # emits dist/ for the host frontend
    pnpm test       # vitest unit
    pnpm test:e2e   # playwright smoke
