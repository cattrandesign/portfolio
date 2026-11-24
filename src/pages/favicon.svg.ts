import type { APIRoute } from "astro";

// Two clean, evenly overlapping circles: crisper than the hand-drawn Venn
// at tab-icon sizes.
export const GET: APIRoute = () => {
  const r = 17;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#F8F4ED"/><g fill="none" stroke="#2A2724" stroke-width="4"><circle cx="${32 - r / 2}" cy="32" r="${r}"/><circle cx="${32 + r / 2}" cy="32" r="${r}"/></g></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
};
