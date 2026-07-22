import type { GraphSnapshot } from "../GraphSnapshot";
import type { LayoutType } from "../LayoutType";
import type { LayoutValidationIssue } from "./LayoutValidationIssue";

export interface LayoutCandidate {
	id: string;
	name: string;
	description: string;
	layoutType: LayoutType;
	presetId?: string;
	snapshot: GraphSnapshot;
	issues: readonly LayoutValidationIssue[];
}
