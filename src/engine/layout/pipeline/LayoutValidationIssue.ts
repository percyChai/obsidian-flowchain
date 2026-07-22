export type LayoutIssueSeverity =
	| "warning"
	| "error";

export interface LayoutValidationIssue {
	code: string;
	severity: LayoutIssueSeverity;
	message: string;
	entityIds: readonly string[];
}