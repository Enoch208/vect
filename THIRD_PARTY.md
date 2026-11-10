# Third-party materials

Everything Vect uses that it did not write, with its source and terms. Versions are pinned exactly in `package.json` and `pnpm-lock.yaml`.

## Fonts

| Name                                   | Source                                                                      | Author | Licence                   | Used in                    |
| -------------------------------------- | --------------------------------------------------------------------------- | ------ | ------------------------- | -------------------------- |
| Geist (variable)                       | [@fontsource-variable/geist](https://github.com/fontsource/font-files)      | Vercel | SIL Open Font License 1.1 | Interface text             |
| Geist Mono (variable)                  | [@fontsource-variable/geist-mono](https://github.com/fontsource/font-files) | Vercel | SIL Open Font License 1.1 | Labels, IDs, hashes        |
| Geist Mono (static, latin 500 `.woff`) | [@fontsource/geist-mono](https://github.com/fontsource/font-files)          | Vercel | SIL Open Font License 1.1 | Labels inside the 3D scene |

## 3D models, textures, images and audio

None. All scene geometry, materials and drawings are generated in code or drawn for Vect. Any external asset added later is listed here, with its source URL, author, licence and where it is used, in the same change that adds it.

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

| Service    | Use                                                                         | What is sent                                                                                                         |
| ---------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| OpenAI API | Generating worlds, proposing edits and proposing repairs (server side only) | The user's prompt or instruction and a compact description of the current world. No accounts, keys or personal data. |
| Vercel     | Hosting the site and the API functions                                      | Standard request logs                                                                                                |
