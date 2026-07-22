import type { IGraph } from "../../graph/IGraph";
import type { GraphSnapshot } from "../GraphSnapshot";
import type { LayoutValidationIssue } from "./LayoutValidationIssue";

export interface ILayoutValidator {
	validate(
		graph: IGraph,
		snapshot: GraphSnapshot
	): LayoutValidationIssue[];
}