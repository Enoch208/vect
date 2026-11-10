export const repositoryUrl = "https://github.com/Enoch208/vect";

export const sectionIds = {
  product: "product",
  walkthrough: "how-it-works",
  useCases: "use-cases",
} as const;

export const navLinks = [
  { label: "How it works", href: `#${sectionIds.walkthrough}` },
  { label: "Product", href: `#${sectionIds.product}` },
  { label: "Use cases", href: `#${sectionIds.useCases}` },
  { label: "GitHub", href: repositoryUrl },
] as const;
