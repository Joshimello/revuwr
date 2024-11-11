import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
		extend: {
			colors: {
				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				}
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)"
			},
			fontFamily: {
				sans: ['Geist Sans', 'Source Han Sans', ...fontFamily.sans],
				mono: ['Geist Mono', ...fontFamily.mono]
			},
			fontSize: {
				xs: ["calc(0.75rem * var(--font-multiplier))", { lineHeight: "1rem" }],
				sm: ["calc(0.875rem * var(--font-multiplier))", { lineHeight: "1.25rem" }],
				base: ["calc(1rem * var(--font-multiplier))", { lineHeight: "1.5rem" }],
				lg: ["calc(1.125rem * var(--font-multiplier))", { lineHeight: "1.75rem" }],
				xl: ["calc(1.25rem * var(--font-multiplier))", { lineHeight: "1.75rem" }],
				"2xl": ["calc(1.5rem * var(--font-multiplier))", { lineHeight: "2rem" }],
				"3xl": ["calc(1.875rem * var(--font-multiplier))", { lineHeight: "2.25rem" }],
				"4xl": ["calc(2.25rem * var(--font-multiplier))", { lineHeight: "2.5rem" }],
				"5xl": ["calc(3rem * var(--font-multiplier))", { lineHeight: "1" }],
				"6xl": ["calc(3.75rem * var(--font-multiplier))", { lineHeight: "1" }],
				"7xl": ["calc(4.5rem * var(--font-multiplier))", { lineHeight: "1" }],
				"8xl": ["calc(6rem * var(--font-multiplier))", { lineHeight: "1" }],
				"9xl": ["calc(8rem * var(--font-multiplier))", { lineHeight: "1" }]
			}
		}
	},
};

export default config;
