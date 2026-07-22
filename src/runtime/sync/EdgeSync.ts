import type { IGraph } from "../../engine/graph/IGraph";
import type { IRelation } from "../../engine/relation/IRelation";
import type { GraphSnapshot } from "../../engine/layout/GraphSnapshot";
import type { ICanvasAdapter } from "../canvas/ICanvasAdapter";
import type { CanvasEdgeData } from "../canvas/CanvasTypes";
import { StyleManager } from "../style/StyleManager";
import type { IEdgeSync } from "./IEdgeSync";
import type { SyncContext } from "./SyncContext";

const EDGE_ID_PREFIX = "flowchain-edge-";

export class EdgeSync implements IEdgeSync {
	constructor(
		private readonly canvasAdapter: ICanvasAdapter,
		private readonly styleManager =
			new StyleManager()
	) {}

	sync(
		graph: IGraph,
		snapshot: GraphSnapshot,
		context: SyncContext,
		styleManager = this.styleManager
	): void {
		const expectedEdgeIds =
			new Set<string>();

		for (const relation of graph.relations.values()) {
			const fromNode =
				context.getNode(relation.from);

			const toNode =
				context.getNode(relation.to);

			if (!fromNode || !toNode) {
				continue;
			}

			const edgeId =
				this.createEdgeId(relation);

			expectedEdgeIds.add(edgeId);

			const route =
				snapshot.routes.get(relation.id);

			const existingEdge =
				this.canvasAdapter
					.getEdges()
					.find((edge) =>
						edge.id === edgeId
					);

			const baseEdgeData: CanvasEdgeData = {
				...(existingEdge?.getData() ??
					{}),
				id: edgeId,
				fromNode: fromNode.id,
				fromSide:
					route?.fromPort ??
					"bottom",
				toNode: toNode.id,
				toSide:
					route?.toPort ?? "top"
			};

			const edgeData =
				styleManager.applyEdgeStyle(
					baseEdgeData,
					relation
				);

			if (existingEdge) {
				this.canvasAdapter.updateEdge(
					existingEdge,
					edgeData
				);
				continue;
			}

			this.canvasAdapter.createEdge(edgeData);
		}

		for (const edge of this.canvasAdapter.getEdges()) {
			if (!edge.id.startsWith(EDGE_ID_PREFIX)) {
				continue;
			}

			if (expectedEdgeIds.has(edge.id)) {
				continue;
			}

			this.canvasAdapter.removeEdge(edge);
		}
	}

	applyStyles(
		graph: IGraph,
		context: SyncContext,
		styleManager = this.styleManager
	): void {
		void context;

		for (const relation of graph.relations.values()) {
			const edge =
				this.canvasAdapter
					.getEdges()
					.find((candidate) =>
						candidate.id ===
						this.createEdgeId(relation)
					);

			if (!edge) {
				continue;
			}

			this.applyEdgeStyle(
				edge,
				relation,
				styleManager
			);
		}
	}

	private applyEdgeStyle(
		edge:
			import("../canvas/CanvasTypes")
				.CanvasEdgeHandle,
		relation: IRelation,
		styleManager: StyleManager
	): void {
		this.canvasAdapter.updateEdge(
			edge,
			styleManager.applyEdgeStyle(
				edge.getData(),
				relation
			)
		);
	}

	private createEdgeId(
		relation: IRelation
	): string {
		return (
			EDGE_ID_PREFIX +
			encodeURIComponent(relation.id)
		);
	}
}
