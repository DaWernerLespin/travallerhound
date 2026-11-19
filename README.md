# TravAllerHound – MVP

Allergy-safe food ordering in France for German-speaking travellers with a peanut or lupin allergy.
Local demo app for the Startup Engineering course (Expo Go, Android). Fully offline, no backend.

## Run it

```bash
npm install          # once (after pulling)
npm run mobile       # dev server via tunnel – scan the QR code with Expo Go on the phone
npm start            # same without tunnel (phone and laptop on the same Wi-Fi)
npm run web          # in the laptop browser
npm run qr           # regenerate the demo menu QR codes (assets/demo/qr/)
```

`npm run mobile` works on any network (also uni Wi-Fi). Use it when Expo Go shows
"failed to download remote update".

Live website: https://travallerhound.vercel.app/ (deploys from `main`). Demo menus open via
`/karte/<id>`, e.g. https://travallerhound.vercel.app/karte/chouchou – that is what the QR codes contain.

## Checks

```bash
npm test             # rating, matching and chat logic
npx tsc --noEmit     # types
npx expo lint        # lint
```

## Demo flow

1. **Speisekarte prüfen** → pick **Chouchou, Paris** (real menu) or **Beispielkarte Brasserie** (shows all colours).
   Uploading `assets/demo/chouchou-menu.png` also loads the Chouchou menu.
2. Watch the scan: every dish starts red and turns orange/red once checked.
3. Open a dish → **So komme ich darauf** shows where each risk comes from (dish name, menu, typical recipe, staff).
4. **Personal fragen** → pick a question, hand the phone to the "staff", they tap a French answer.
   Confirming allergens + cross-contamination makes the dish green ("Vom Personal bestätigt").
5. **Bestellen** → order notice (monitoring is not active in the MVP).
6. **Meine sichere Karte** → German list of everything that isn't red.

## Structure

| Folder | What |
|---|---|
| `src/app/` | Screens (Expo Router) |
| `src/components/` | Presentational UI |
| `src/features/dish-db/` | Curated dishes + ingredients with peanut/lupin risk, matching |
| `src/features/dish-rating/` | Safety rating (pure TypeScript, tested) |
| `src/features/menu-input/` | Menu text parsing, demo menus, file/photo input |
| `src/features/staff-chat/` | Questions, French quick replies, phrase-table translation |
| `src/features/menu-session/` | In-memory session state, scan animation timing |

Swappable parts (for AI/OCR later) are interfaces with one line to change each:
`menu-input/index.ts` (OCR), `staff-chat/index.ts` (translation, staff replies), `dish-db/index.ts` (dish knowledge).

Design decisions and known limits: [`docs/decisions.md`](docs/decisions.md).
