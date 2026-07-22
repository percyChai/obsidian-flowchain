import type { GraphSnapshot } from "../GraphSnapshot";
import type { LayoutValidationIssue } from "./LayoutValidationIssue";

export interface LayoutVerificationResult {

    snapshot: GraphSnapshot;

    issues:
        readonly LayoutValidationIssue[];

    passed: boolean;

}