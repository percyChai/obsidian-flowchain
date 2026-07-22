import type { EdgeStyle } from "./EdgeStyle";
import type { NodeStyle } from "./NodeStyle";

export const StyleTheme = {
	Classic: "classic",
	Clinical: "clinical",
	Aurora: "aurora",
	Graphite: "graphite",
	Candy: "candy"
} as const;

export type StyleTheme =
	typeof StyleTheme[keyof typeof StyleTheme];

export interface StylePalette {
	theme: StyleTheme;
	nodes: {
		factor: NodeStyle;
		mechanism: NodeStyle;
		disease: NodeStyle;
		symptom: NodeStyle;
		drug: NodeStyle;
		test: NodeStyle;
		treatment: NodeStyle;
		lifestyle: NodeStyle;
		nutrition: NodeStyle;
		other: NodeStyle;
	};
	edges: {
		causal: EdgeStyle;
		composition: EdgeStyle;
		promotes: EdgeStyle;
		inhibits: EdgeStyle;
		bidirectional: EdgeStyle;
		association: EdgeStyle;
	};
	edgeAccents: string[];
	nodeAccents: string[];
	opacity: {
		node: number;
		edge: number;
	};
}

function createEdges(
	colors: {
		causal: string;
		composition: string;
		promotes: string;
		inhibits: string;
		bidirectional: string;
		association: string;
	}
): StylePalette["edges"] {
	return {
		causal: {
			color: colors.causal,
			fromEnd: "none",
			toEnd: "arrow",
			lineStyle: "solid",
			width: 2
		},
		composition: {
			color: colors.composition,
			fromEnd: "none",
			toEnd: "arrow",
			lineStyle: "solid",
			width: 2
		},
		promotes: {
			color: colors.promotes,
			fromEnd: "none",
			toEnd: "arrow",
			lineStyle: "solid",
			width: 2
		},
		inhibits: {
			color: colors.inhibits,
			fromEnd: "none",
			toEnd: "arrow",
			lineStyle: "dashed",
			width: 2
		},
		bidirectional: {
			color: colors.bidirectional,
			fromEnd: "arrow",
			toEnd: "arrow",
			lineStyle: "solid",
			width: 2
		},
		association: {
			color: colors.association,
			fromEnd: "none",
			toEnd: "arrow",
			lineStyle: "dashed",
			width: 2
		}
	};
}

const DEFAULT_OPACITY = {
	node: 1,
	edge: 1
};

export const CLASSIC_STYLE_PALETTE:
	StylePalette = {
		theme: StyleTheme.Classic,
		nodes: {
			factor: {
				backgroundColor: "#f4d000",
				borderColor: "#8a5b00",
				textColor: "#241800"
			},
			mechanism: {
				backgroundColor: "#2596ff",
				borderColor: "#064c8f",
				textColor: "#031a33"
			},
			disease: {
				backgroundColor: "#ff4d5e",
				borderColor: "#9f1022",
				textColor: "#35030b"
			},
			symptom: {
				backgroundColor: "#a855f7",
				borderColor: "#5b159f",
				textColor: "#240642"
			},
			drug: {
				backgroundColor: "#22c55e",
				borderColor: "#116b34",
				textColor: "#032510"
			},
			test: {
				backgroundColor: "#64748b",
				borderColor: "#334155",
				textColor: "#ffffff"
			},
			treatment: {
				backgroundColor: "#00b8c8",
				borderColor: "#006a73",
				textColor: "#002326"
			},
			lifestyle: {
				backgroundColor: "#84cc16",
				borderColor: "#4d7c0f",
				textColor: "#172500"
			},
			nutrition: {
				backgroundColor: "#ff7a00",
				borderColor: "#9a3d00",
				textColor: "#2f1100"
			},
			other: {
				backgroundColor: "#d1d5db",
				borderColor: "#4b5563",
				textColor: "#111827"
			}
		},
		edges: createEdges({
			causal: "#dc2626",
			composition: "#6b7280",
			promotes: "#16a34a",
			inhibits: "#7c3aed",
			bidirectional: "#1d4ed8",
			association: "#0891b2"
		}),
		edgeAccents: [
			"#dc2626",
			"#ea580c",
			"#16a34a",
			"#2563eb",
			"#7c3aed",
			"#db2777",
			"#0891b2",
			"#4d7c0f"
		],
		nodeAccents: [
			"#e11d48",
			"#2563eb",
			"#16a34a",
			"#9333ea",
			"#f97316",
			"#0891b2",
			"#ca8a04",
			"#4f46e5",
			"#be123c",
			"#0f766e"
		],
		opacity: DEFAULT_OPACITY
	};

export const CLINICAL_STYLE_PALETTE:
	StylePalette = {
		theme: StyleTheme.Clinical,
		nodes: {
			factor: {
				backgroundColor: "#f59e0b",
				borderColor: "#92400e",
				textColor: "#241300"
			},
			mechanism: {
				backgroundColor: "#14b8a6",
				borderColor: "#0f766e",
				textColor: "#022c22"
			},
			disease: {
				backgroundColor: "#ef4444",
				borderColor: "#991b1b",
				textColor: "#ffffff"
			},
			symptom: {
				backgroundColor: "#6366f1",
				borderColor: "#3730a3",
				textColor: "#ffffff"
			},
			drug: {
				backgroundColor: "#10b981",
				borderColor: "#047857",
				textColor: "#022c22"
			},
			test: {
				backgroundColor: "#38bdf8",
				borderColor: "#0369a1",
				textColor: "#082f49"
			},
			treatment: {
				backgroundColor: "#06b6d4",
				borderColor: "#0e7490",
				textColor: "#083344"
			},
			lifestyle: {
				backgroundColor: "#65a30d",
				borderColor: "#3f6212",
				textColor: "#172500"
			},
			nutrition: {
				backgroundColor: "#f97316",
				borderColor: "#9a3412",
				textColor: "#ffffff"
			},
			other: {
				backgroundColor: "#e2e8f0",
				borderColor: "#64748b",
				textColor: "#0f172a"
			}
		},
		edges: createEdges({
			causal: "#be123c",
			composition: "#475569",
			promotes: "#059669",
			inhibits: "#6d28d9",
			bidirectional: "#0284c7",
			association: "#0f766e"
		}),
		edgeAccents: [
			"#be123c",
			"#0284c7",
			"#059669",
			"#7c2d12",
			"#6d28d9",
			"#0f766e",
			"#ca8a04"
		],
		nodeAccents: [
			"#be123c",
			"#0284c7",
			"#059669",
			"#7c3aed",
			"#ca8a04",
			"#0f766e",
			"#db2777"
		],
		opacity: DEFAULT_OPACITY
	};

export const AURORA_STYLE_PALETTE:
	StylePalette = {
		theme: StyleTheme.Aurora,
		nodes: {
			factor: {
				backgroundColor: "#fde047",
				borderColor: "#a16207",
				textColor: "#292000"
			},
			mechanism: {
				backgroundColor: "#22d3ee",
				borderColor: "#0e7490",
				textColor: "#083344"
			},
			disease: {
				backgroundColor: "#fb7185",
				borderColor: "#be123c",
				textColor: "#4c0519"
			},
			symptom: {
				backgroundColor: "#c084fc",
				borderColor: "#7e22ce",
				textColor: "#3b0764"
			},
			drug: {
				backgroundColor: "#4ade80",
				borderColor: "#15803d",
				textColor: "#052e16"
			},
			test: {
				backgroundColor: "#60a5fa",
				borderColor: "#1d4ed8",
				textColor: "#0b1e48"
			},
			treatment: {
				backgroundColor: "#2dd4bf",
				borderColor: "#0f766e",
				textColor: "#042f2e"
			},
			lifestyle: {
				backgroundColor: "#a3e635",
				borderColor: "#65a30d",
				textColor: "#1a2e05"
			},
			nutrition: {
				backgroundColor: "#fb923c",
				borderColor: "#c2410c",
				textColor: "#431407"
			},
			other: {
				backgroundColor: "#cbd5e1",
				borderColor: "#64748b",
				textColor: "#0f172a"
			}
		},
		edges: createEdges({
			causal: "#f43f5e",
			composition: "#64748b",
			promotes: "#22c55e",
			inhibits: "#a855f7",
			bidirectional: "#06b6d4",
			association: "#3b82f6"
		}),
		edgeAccents: [
			"#f43f5e",
			"#fb923c",
			"#22c55e",
			"#06b6d4",
			"#3b82f6",
			"#a855f7",
			"#eab308"
		],
		nodeAccents: [
			"#f43f5e",
			"#06b6d4",
			"#22c55e",
			"#a855f7",
			"#fb923c",
			"#3b82f6",
			"#eab308"
		],
		opacity: DEFAULT_OPACITY
	};

export const GRAPHITE_STYLE_PALETTE:
	StylePalette = {
		theme: StyleTheme.Graphite,
		nodes: {
			factor: {
				backgroundColor: "#713f12",
				borderColor: "#facc15",
				textColor: "#fef9c3"
			},
			mechanism: {
				backgroundColor: "#164e63",
				borderColor: "#67e8f9",
				textColor: "#ecfeff"
			},
			disease: {
				backgroundColor: "#7f1d1d",
				borderColor: "#fda4af",
				textColor: "#fff1f2"
			},
			symptom: {
				backgroundColor: "#581c87",
				borderColor: "#d8b4fe",
				textColor: "#faf5ff"
			},
			drug: {
				backgroundColor: "#14532d",
				borderColor: "#86efac",
				textColor: "#f0fdf4"
			},
			test: {
				backgroundColor: "#334155",
				borderColor: "#cbd5e1",
				textColor: "#f8fafc"
			},
			treatment: {
				backgroundColor: "#155e75",
				borderColor: "#67e8f9",
				textColor: "#ecfeff"
			},
			lifestyle: {
				backgroundColor: "#365314",
				borderColor: "#bef264",
				textColor: "#f7fee7"
			},
			nutrition: {
				backgroundColor: "#7c2d12",
				borderColor: "#fdba74",
				textColor: "#fff7ed"
			},
			other: {
				backgroundColor: "#3f3f46",
				borderColor: "#d4d4d8",
				textColor: "#fafafa"
			}
		},
		edges: createEdges({
			causal: "#fb7185",
			composition: "#94a3b8",
			promotes: "#86efac",
			inhibits: "#c084fc",
			bidirectional: "#67e8f9",
			association: "#facc15"
		}),
		edgeAccents: [
			"#fb7185",
			"#fdba74",
			"#86efac",
			"#67e8f9",
			"#93c5fd",
			"#c084fc",
			"#facc15"
		],
		nodeAccents: [
			"#7f1d1d",
			"#164e63",
			"#14532d",
			"#581c87",
			"#713f12",
			"#155e75",
			"#7c2d12"
		],
		opacity: DEFAULT_OPACITY
	};

export const CANDY_STYLE_PALETTE:
	StylePalette = {
		theme: StyleTheme.Candy,
		nodes: {
			factor: {
				backgroundColor: "#ffcf33",
				borderColor: "#b77900",
				textColor: "#2b1b00"
			},
			mechanism: {
				backgroundColor: "#7dd3fc",
				borderColor: "#0284c7",
				textColor: "#082f49"
			},
			disease: {
				backgroundColor: "#ff6b81",
				borderColor: "#be123c",
				textColor: "#4c0519"
			},
			symptom: {
				backgroundColor: "#f0abfc",
				borderColor: "#c026d3",
				textColor: "#4a044e"
			},
			drug: {
				backgroundColor: "#86efac",
				borderColor: "#16a34a",
				textColor: "#052e16"
			},
			test: {
				backgroundColor: "#bfdbfe",
				borderColor: "#2563eb",
				textColor: "#172554"
			},
			treatment: {
				backgroundColor: "#99f6e4",
				borderColor: "#0d9488",
				textColor: "#042f2e"
			},
			lifestyle: {
				backgroundColor: "#bef264",
				borderColor: "#65a30d",
				textColor: "#1a2e05"
			},
			nutrition: {
				backgroundColor: "#fdba74",
				borderColor: "#ea580c",
				textColor: "#431407"
			},
			other: {
				backgroundColor: "#e5e7eb",
				borderColor: "#6b7280",
				textColor: "#111827"
			}
		},
		edges: createEdges({
			causal: "#e11d48",
			composition: "#6b7280",
			promotes: "#16a34a",
			inhibits: "#c026d3",
			bidirectional: "#0284c7",
			association: "#f97316"
		}),
		edgeAccents: [
			"#e11d48",
			"#f97316",
			"#16a34a",
			"#0284c7",
			"#c026d3",
			"#2563eb",
			"#ca8a04"
		],
		nodeAccents: [
			"#ff6b81",
			"#7dd3fc",
			"#86efac",
			"#f0abfc",
			"#fdba74",
			"#bfdbfe",
			"#bef264"
		],
		opacity: DEFAULT_OPACITY
	};

export const STYLE_PALETTES:
	readonly StylePalette[] = [
		CLASSIC_STYLE_PALETTE,
		CLINICAL_STYLE_PALETTE,
		AURORA_STYLE_PALETTE,
		GRAPHITE_STYLE_PALETTE,
		CANDY_STYLE_PALETTE
	];
