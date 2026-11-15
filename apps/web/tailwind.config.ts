import type { Config } from "tailwindcss";
export default { content: ["./src/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#101828", brand: { 50: "#eef8ff", 500: "#0b78d0", 700: "#075a9e" } } } }, plugins: [] } satisfies Config;
