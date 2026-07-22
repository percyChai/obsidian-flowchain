import type { GraphSnapshot } from "../GraphSnapshot";
import type { LayoutType } from "../LayoutType";
import type { LayoutScore } from "./evaluation/LayoutScore";

export interface LayoutRecommendation {
	id: string;
	name: string;
	description: string;
	layoutType: LayoutType;
	presetId?: string;
	snapshot: GraphSnapshot;
	totalScore: number;
	scoreBreakdown: LayoutScore;
	reasons: readonly string[];
	warnings: readonly string[];
	rank: number;
}
