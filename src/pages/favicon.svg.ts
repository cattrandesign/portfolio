import type { APIRoute } from "astro";
import { vennStroke, ctStrokes, smoothPath } from "../lib/venn";

export const GET: APIRoute = () => {
  const r = 20;
  const ring = smoothPath(vennStroke({ cx: 32, cy: 32, r, seed: 3, jitter: 0.5 }), true);
  const marks = ctStrokes({ cx: 32, cy: 32, size: r * 1.15 }).map((s) => smoothPath(s));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#F8F4ED"/><g fill="none" stroke="#2A2724" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${ring}"/>${marks.map((d) => `<path d="${d}"/>`).join("")}</g></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
};
