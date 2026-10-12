# CLAUDE.md

@AGENTS.md

## Spécifique à Claude Code

- Serveur de dev : configuration `mariage-invitation` de `../.claude/launch.json` (port 3000, le
  même que in-seach : ne pas lancer les deux en même temps). L'arrêter (`preview_stop`) en fin de
  session, sinon le `npm run dev` de l'utilisateur échoue avec EADDRINUSE.
- Vérifier les changements d'interface dans le navigateur intégré, en mobile (375 px) et en
  desktop, en mode clair **et** nuit. Les animations y tournent au ralenti quand le panneau est
  en arrière-plan : attendre quelques secondes avant une capture.
- Comptes de démonstration : voir `DEMO_ACCOUNTS` dans `src/data/seed.ts`.
- Mettre à jour la section « Dernières modifications » d'`AGENTS.md` à la fin d'une fonctionnalité.
