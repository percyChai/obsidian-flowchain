import type { IGraph } from "../../engine/graph/IGraph";
import type { GraphSnapshot } from "../../engine/layout/GraphSnapshot";
import type { LayoutType } from "../../engine/layout/LayoutType";
import type { LayoutRecommendation } from "../../engine/layout/pipeline/LayoutRecommendation";

export interface CanvasOperationContext {
	canvasPath: string;
}

export interface ICanvasSync {
	captureOperationContext():
		CanvasOperationContext | null;

	migrateOperationContext(
		context: CanvasOperationContext,
		newCanvasPath: string
	): void;

	generate(
		context: CanvasOperationContext,
		graph: IGraph,
		snapshot: GraphSnapshot,
		sourceFolderPath: string
	): boolean;

	sync(
		context: CanvasOperationContext,
		graph: IGraph,
		snapshot: GraphSnapshot,
		sourceFolderPath: string
	): boolean;

	refresh(
		context: CanvasOperationContext,
		graph: IGraph,
		sourceFolderPath: string
	): boolean;

	getCurrentSourceFolderPath():
		string | null;

	getSourceFolderPath(
		context: CanvasOperationContext
	): string | null;

	relayout(
		context: CanvasOperationContext,
		layoutType: LayoutType
	): boolean;

	generateRecommendations():
		LayoutRecommendation[] | null;

	generateRecommendationsForContext(
		context: CanvasOperationContext
	): LayoutRecommendation[] | null;

	applyRecommendation(
		context: CanvasOperationContext,
		recommendation: LayoutRecommendation
	): boolean;

	beautify(
		context: CanvasOperationContext
	): boolean;

	clearSessions(): void;
}
