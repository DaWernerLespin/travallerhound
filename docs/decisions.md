# Decisions & known limits (MVP build, 16–17 Nov 2026)

Decisions made while building without the team present. Each one is easy to change.

## Scope / platform
- **Expo Go, fully offline, no backend.** All data and logic run on the phone. The FastAPI backend from the first plan was dropped.
- **No real OCR.** Expo Go can't run on-device OCR and cloud APIs are out of scope. `MenuTextSource` is an interface;
  the MVP version recognises the bundled demo menu (by file size or "chouchou" in the file name). Any other photo/file
  is shown as a preview and the user types the dishes. To add OCR later: implement `MenuTextSource` and change
  `src/features/menu-input/index.ts` (on-device OCR needs a development build, not Expo Go).
- **PDF:** no preview in Expo Go → file name + icon, then typed text.
- **Second demo menu** ("Beispielkarte Brasserie", text only) added because the real Chouchou menu has no dish with
  stated peanuts, so it never shows red.
- **Expo starter template removed** (tabs, explore screen, example components, `reset-project` script). Still in git history.

## Rating
- Statuses: `unsafe` (red), `undefined` "Unklar" and `likely_safe` "Wahrscheinlich sicher – nachfragen" (both orange),
  `safe` (green + "Vom Personal bestätigt"). Green only after staff confirmation.
- **Safe** = staff confirmed no peanut AND no lupin AND no cross-contamination, and was not unsure about any ingredient.
- **A stated allergen ("contains") can never be overridden**, not even by the staff.
- Unknown dish → always `undefined`, even if the listed ingredients look harmless (menus omit ingredients).
- Ingredients found in the **dish name** count too (helps unknown dishes like "Tarte au beurre de cacahuète").
- Unknown listed ingredient → `undefined` with "Zutat kenne ich nicht".
- Tree nuts (noix, noisette, amande), praliné, chocolate, ice cream → peanut `hidden` (traces / shared processing). Conservative on purpose.

## Data – please review before the demo
- ~110 dishes and ~95 ingredients in `src/features/dish-db/data/`. The risk notes (peanut oil for frying, vinaigrette,
  mayonnaise; lupin flour in bread, pastry, croûtons, processed meat) come from Claude's general knowledge,
  **not from checked sources**. The app labels them as "typisch", never as fact.
- Ambiguous one-word aliases (tartare, quiche, fondue, sorbet, éclair, omelette) were removed so e.g.
  "Fondue bourguignonne" (meat in hot oil) is not mistaken for cheese fondue.

## Menu parsing
- One dish per line, optional price; a following comma-separated line counts as ingredients if ≥ 50 % of the items are known.
- ALL-CAPS lines with ≤ 3 words are section headers. Lines that are ≥ 40 % English words are skipped (bilingual menus).
- `(V)`, 🌿, "végétarien" → vegetarian tag (not safety-relevant).
- Matching: exact name/alias → token overlap → "all words of a known dish appear in the menu line" (for "Quiche lorraine, salade verte"). Below 0.6 → unknown.

## Chat
- Same phone, handed over. Traveler picks German question buttons; app shows the French text. Staff screen is French only.
- Questions: allergens, cross-contamination, plus one per hidden-risk ingredient (e.g. "Werden die Pommes in Erdnussöl frittiert?").
- "Je vais demander au chef" keeps the staff screen open so they can answer after checking.
- Translation is a phrase table behind `Translator`; staff answers come from `StaffReplySource`. Both swap in `staff-chat/index.ts`.
- If the staff couldn't confirm everything and no question is left, the app recommends choosing another dish.

## Order notice
- Same text as the Click-Dummy, marked "Die Überwachung ist nicht aktiv."

## Not verified
- Not tested on a real phone (built and checked via Android bundle export, TypeScript, lint, unit tests,
  and screenshots of the web build). Camera and file upload were not tested on a device.
