# Third-party materials

Everything Vect uses that it did not write, with its source and terms. Versions are pinned exactly in `package.json` and `pnpm-lock.yaml`.

## Fonts

| Name                                   | Source                                                                      | Author | Licence                   | Used in                    |
| -------------------------------------- | --------------------------------------------------------------------------- | ------ | ------------------------- | -------------------------- |
| Geist (variable)                       | [@fontsource-variable/geist](https://github.com/fontsource/font-files)      | Vercel | SIL Open Font License 1.1 | Interface text             |
| Geist Mono (variable)                  | [@fontsource-variable/geist-mono](https://github.com/fontsource/font-files) | Vercel | SIL Open Font License 1.1 | Labels, IDs, hashes        |
| Geist Mono (static, latin 500 `.woff`) | [@fontsource/geist-mono](https://github.com/fontsource/font-files)          | Vercel | SIL Open Font License 1.1 | Labels inside the 3D scene |

## 3D models, textures, images and audio

All playable scene geometry, materials and technical drawings are generated in code. The landing's loader drawing is drawn by code from the example world. The opening shows an AI-generated shading of that same drawing, captioned as such, which gives way to the code-drawn lines as you scroll. The landing also uses a few AI-generated concept illustrations, separate from the live game renderer. AI-generated images are labelled as such where they appear.

| Asset                                                                                 | Source                                                                                  | Terms                                                 | Used in                                                                           |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| `observatory-engraving.webp`                                                          | OpenAI image generation, based on Vect's own elevation drawing of the example world     | Generated for this project; OpenAI output terms apply | Landing opening, captioned "AI-generated illustration"                            |
| `observatory-study.webp`                                                              | OpenAI image generation, from an AI-generated engraving of Vect's own elevation drawing | Generated for this project; OpenAI output terms apply | Landing statement and use-cases panel, captioned "AI-generated illustration"      |
| `observatory-poster.webp`                                                             | OpenAI image generation, based on the observatory study above                           | Generated for this project; OpenAI output terms apply | Landing use-cases panel, captioned "AI-generated illustration"                    |
| `portal-pavilion.webp`                                                                | OpenAI image generation, original portal pavilion concept                               | Generated for this project; OpenAI output terms apply | Landing use-cases panel and call to action, captioned "AI-generated illustration" |
| `observatory-three-quarter.png`, `observatory-elevation.png`                          | Vect's own Three.js renderer                                                            | Original project renders                              | Landing steps (three-quarter view); example world imagery                         |
| `studio-capture.webp`, `play-capture.webp`, `test-capture.webp`, `proof-capture.webp` | Screenshots of Vect running locally                                                     | Original project captures                             | Landing product cards and steps                                                   |

## Design

The landing page's layout and animation style follow a commercial website template purchased by the team. All of its text, images, logos and drawings were replaced with Vect's own content, made by the team with the help of AI tools. All 3D geometry, materials and technical drawings in the app are generated in code, and the screenshots and renders are of Vect itself.

## Demo video

| Part                    | Source                                | Terms                                                   |
| ----------------------- | ------------------------------------- | ------------------------------------------------------- |
| Narration               | ElevenLabs text-to-speech             | Generated for this project under the ElevenLabs terms   |
| Music and sound effects | ElevenLabs music and sound generation | Generated for this project under the ElevenLabs terms   |
| Footage                 | A recording of Vect running           | Original                                                |
| Editing                 | Remotion                              | Remotion licence (free for individuals and small teams) |

## Runtime libraries

| Package                                      | Version       | Licence                                                            | Source                                         |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| react, react-dom                             | 19.3.1        | MIT                                                                | https://github.com/facebook/react              |
| three                                        | 0.187.0       | MIT                                                                | https://github.com/mrdoob/three.js             |
| @react-three/fiber                           | 9.8.2         | MIT                                                                | https://github.com/pmndrs/react-three-fiber    |
| @react-three/drei                            | 10.7.9        | MIT                                                                | https://github.com/pmndrs/drei                 |
| @react-three/postprocessing                  | 3.2.2         | MIT                                                                | https://github.com/pmndrs/react-postprocessing |
| postprocessing                               | 6.39.6        | Zlib                                                               | https://github.com/pmndrs/postprocessing       |
| zustand                                      | 5.0.16        | MIT                                                                | https://github.com/pmndrs/zustand              |
| zod                                          | 4.6.7         | MIT                                                                | https://github.com/colinhacks/zod              |
| @noble/hashes                                | 2.4.0         | MIT                                                                | https://github.com/paulmillr/noble-hashes      |
| openai (server only)                         | 7.47.0        | Apache-2.0                                                         | https://github.com/openai/openai-node          |
| motion                                       | 14.9.0        | MIT                                                                | https://github.com/motiondivision/motion       |
| gsap                                         | 3.15.0        | GSAP Standard "no charge" licence (free, including commercial use) | https://gsap.com/standard-license              |
| lenis                                        | 1.3.27        | MIT                                                                | https://github.com/darkroomengineering/lenis   |
| @hugeicons/react, @hugeicons/core-free-icons | 1.1.10, 4.4.0 | MIT                                                                | https://github.com/hugeicons/hugeicons         |
| idb-keyval                                   | 6.3.0         | Apache-2.0                                                         | https://github.com/jakearchibald/idb-keyval    |
| clsx                                         | 2.1.1         | MIT                                                                | https://github.com/lukeed/clsx                 |
| tailwind-merge                               | 3.7.0         | MIT                                                                | https://github.com/dcastil/tailwind-merge      |

## Build and test tools

TypeScript (Apache-2.0), Vite, @vitejs/plugin-react, Tailwind CSS and @tailwindcss/vite, Vitest, fast-check, ESLint with typescript-eslint, eslint-plugin-react-hooks and eslint-config-prettier, Prettier, tsx and globals (all MIT); Playwright (Apache-2.0). None of them ship in the browser bundle.

## Services

| Service    | Use                                                                              | What is sent                                                                                                         |
| ---------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| OpenAI API | Generating worlds, proposing edits and proposing repairs (server side only)      | The user's prompt or instruction and a compact description of the current world. No accounts, keys or personal data. |
| Vercel     | Hosting the site and the API functions                                           | Standard request logs                                                                                                |
| ElevenLabs | Narration, music and sound effects for the demo video only (not used by the app) | The video script and music prompts                                                                                   |
