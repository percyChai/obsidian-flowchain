import { Entity } from "../../engine/entity/Entity";
import { Graph } from "../../engine/graph/Graph";
import type { IGraph } from "../../engine/graph/IGraph";
import type { GraphSnapshot } from "../../engine/layout/GraphSnapshot";
import { LayoutManager } from "../../engine/layout/LayoutManager";
import {
	LayoutType,
	type LayoutType as LayoutTypeValue
} from "../../engine/layout/LayoutType";
import type { LayoutRecommendation } from "../../engine/layout/pipeline/LayoutRecommendation";
import { Relation } from "../../engine/relation/Relation";
import type { ICanvasAdapter } from "../canvas/ICanvasAdapter";
import { CanvasRecovery } from "../metadata/CanvasRecovery";
import { CanvasMetadataManager } from "../metadata/CanvasMetadataManager";
import type {
	FlowChainCanvasMetadata,
	FlowChainGraphMetadata
} from "../metadata/FlowChainMetadata";
import { NodeMetadataManager } from "../metadata/NodeMetadataManager";
import type { CanvasSession } from "../session/CanvasSession";
import { CanvasSessionManager } from "../session/CanvasSessionManager";
import { StyleManager } from "../style/StyleManager";
import {
	STYLE_PALETTES,
	type StylePalette
} from "../style/StylePalette";
import { EdgeSync } from "./EdgeSync";
import type {
	CanvasOperationContext,
	ICanvasSync
} from "./ICanvasSync";

interface InternalCanvasOperationContext
	extends CanvasOperationContext {
	canvas:
		import("../canvas/CanvasTypes")
			.CanvasHandle;
	session: CanvasSession;
}

interface CanvasGraphState {
	graph: IGraph;
	sourceFolderPath: string;
	layoutType: LayoutTypeValue;
}

export class CanvasSync implements ICanvasSync {
	private readonly metadataManager =
		new NodeMetadataManager();
	private readonly canvasMetadataManager:
		CanvasMetadataManager;
	private readonly recovery:
		CanvasRecovery;
	private readonly sessionManager:
		CanvasSessionManager;
	private readonly edgeSync:
		EdgeSync;
	private readonly graphStates =
		new WeakMap<CanvasSession, CanvasGraphState>();
	private readonly styleIndexes =
		new WeakMap<CanvasSession, number>();

	constructor(
		private readonly canvasAdapter: ICanvasAdapter
	) {
		this.recovery =
			new CanvasRecovery(canvasAdapter);
		this.sessionManager =
			new CanvasSessionManager();
		this.edgeSync =
			new EdgeSync(canvasAdapter);
		this.canvasMetadataManager =
			new CanvasMetadataManager(canvasAdapter);
	}

	captureOperationContext():
		CanvasOperationContext | null {
		const canvas =
			this.canvasAdapter.getActiveCanvas();
		const canvasPath =
			this.canvasAdapter.getActiveCanvasKey();

		if (!canvas || !canvasPath) {
			return null;
		}

		const session =
			this.sessionManager.getSession(
				canvas,
				canvasPath
			);

		if (!session.isRecovered) {
			const internalContext:
				InternalCanvasOperationContext = {
					canvas,
					canvasPath,
					session
				};

			this.withContext(
				internalContext,
				() => {
					this.recovery.recover(
						session.context
					);
					session.markRecovered();
				}
			);
		}

		const context:
			InternalCanvasOperationContext = {
			canvas,
			canvasPath,
			session
		};

		return context;
	}

	migrateOperationContext(
		context: CanvasOperationContext,
		newCanvasPath: string
	): void {
		const internalContext =
			this.asInternalContext(context);
		const oldCanvasPath =
			internalContext.canvasPath;

		this.sessionManager.migrateSession(
			internalContext.session,
			oldCanvasPath,
			newCanvasPath
		);
		internalContext.canvasPath =
			newCanvasPath;
	}

	generate(
		context: CanvasOperationContext,
		graph: IGraph,
		snapshot: GraphSnapshot,
		sourceFolderPath: string
	): boolean {
		return this.withContext(
			context,
			() => this.generateInContext(
				context,
				graph,
				snapshot,
				sourceFolderPath
			)
		);
	}

	private generateInContext(
		context: CanvasOperationContext,
		graph: IGraph,
		snapshot: GraphSnapshot,
		sourceFolderPath: string
	): boolean {
		const session =
			this.asInternalContext(context).session;

		if (!session) {
			return false;
		}

		this.removeCurrentGraph(session);
		this.styleIndexes.set(session, 0);
		this.applyGraph(graph, snapshot, session);
		this.saveGraphState(
			session,
			graph,
			sourceFolderPath,
			LayoutType.Hierarchy
		);
		this.updateCanvasMetadata(
			sourceFolderPath,
			LayoutType.Hierarchy,
			graph,
			this.getStyleManager(session).theme
		);
		this.zoomToFit();

		return true;
	}

	sync(
		context: CanvasOperationContext,
		graph: IGraph,
		snapshot: GraphSnapshot,
		sourceFolderPath: string
	): boolean {
		return this.withContext(context, () => {
			const session =
				this.asInternalContext(context).session;

			if (!session) {
				return false;
			}

			if (session.context.entries.size === 0) {
				return false;
			}

			const previousState =
				this.getGraphState(session);
			const layoutType =
				previousState?.layoutType ??
				LayoutType.Hierarchy;

			this.applyGraph(graph, snapshot, session);
			this.saveGraphState(
				session,
				graph,
				sourceFolderPath,
				layoutType
			);
			this.updateCanvasMetadata(
				sourceFolderPath,
				layoutType,
				graph,
				this.getStyleManager(session).theme
			);

			return true;
		});
	}

	refresh(
		context: CanvasOperationContext,
		graph: IGraph,
		sourceFolderPath: string
	): boolean {
		return this.withContext(context, () => {
			const session =
				this.asInternalContext(context).session;

			if (!session) {
				return false;
			}

			const metadata =
				this.canvasMetadataManager
					.getMetadata();

			if (!metadata) {
				return false;
			}

			const previousState =
				this.getGraphState(session);
			const layoutType =
				previousState?.layoutType ??
				this.getMetadataLayoutType(
					metadata.layout
				);
			const snapshot =
				new LayoutManager()
					.generate(
						graph,
						layoutType
					);

			this.applyGraph(
				graph,
				snapshot,
				session
			);
			this.saveGraphState(
				session,
				graph,
				sourceFolderPath,
				layoutType
			);
			this.updateCanvasMetadata(
				sourceFolderPath,
				layoutType,
				graph,
				this.getStyleManager(session).theme
			);

			return true;
		});
	}

	getCurrentSourceFolderPath():
		string | null {
		const context =
			this.captureOperationContext();

		if (!context) {
			return null;
		}

		return this.getSourceFolderPath(context);
	}

	getSourceFolderPath(
		context: CanvasOperationContext
	): string | null {
		return this.withContext(context, () => {
			const session =
				this.asInternalContext(context)
					.session;
			const graphState =
				this.getGraphState(session);

			if (!graphState?.sourceFolderPath) {
				return null;
			}

			return graphState.sourceFolderPath;
		});
	}

	relayout(
		context: CanvasOperationContext,
		layoutType: LayoutTypeValue
	): boolean {
		return this.withContext(context, () => {
			const session =
				this.asInternalContext(context)
					.session;

			if (!session) {
				return false;
			}

			const graphState =
				this.getGraphState(session);

			if (!graphState) {
				return false;
			}

			const layoutManager =
				new LayoutManager();
			const snapshot =
				layoutManager.generate(
					graphState.graph,
					layoutType
				);

			this.applyGraph(
				graphState.graph,
				snapshot,
				session
			);
			this.saveGraphState(
				session,
				graphState.graph,
				graphState.sourceFolderPath,
				layoutType
			);
			this.updateCanvasMetadata(
				graphState.sourceFolderPath,
				layoutType,
				graphState.graph,
				this.getStyleManager(session).theme
			);
			this.zoomToFit();

			return true;
		});
	}

	generateRecommendations():
		LayoutRecommendation[] | null {
		const context =
			this.captureOperationContext();

		if (!context) {
			return null;
		}

		return this.generateRecommendationsForContext(
			context
		);
	}

	generateRecommendationsForContext(
		context: CanvasOperationContext
	): LayoutRecommendation[] | null {
		return this.withContext(context, () => {
			const session =
				this.asInternalContext(context)
					.session;
			const graphState =
				this.getGraphState(session);

			if (!graphState) {
				return null;
			}

			return new LayoutManager()
				.generateRecommendations(
					graphState.graph
				);
		});
	}

	applyRecommendation(
		context: CanvasOperationContext,
		recommendation: LayoutRecommendation
	): boolean {
		return this.withContext(context, () => {
			const session =
				this.asInternalContext(context)
					.session;

			if (!session) {
				return false;
			}

			const graphState =
				this.getGraphState(session);

			if (!graphState) {
				return false;
			}

			this.applyGraph(
				graphState.graph,
				recommendation.snapshot,
				session
			);
			this.saveGraphState(
				session,
				graphState.graph,
				graphState.sourceFolderPath,
				recommendation.layoutType
			);
			this.updateCanvasMetadata(
				graphState.sourceFolderPath,
				recommendation.layoutType,
				graphState.graph,
				this.getStyleManager(session).theme
			);
			this.zoomToFit();

			return true;
		});
	}

	beautify(
		context: CanvasOperationContext
	): boolean {
		return this.withContext(context, () => {
			const session =
				this.asInternalContext(context)
					.session;

			if (!session) {
				return false;
			}

			const graphState =
				this.getGraphState(session);

			if (!graphState) {
				return false;
			}

			this.advanceStyle(session);
			this.applyStyles(
				graphState.graph,
				session
			);
			this.updateCanvasMetadata(
				graphState.sourceFolderPath,
				graphState.layoutType,
				graphState.graph,
				this.getStyleManager(session).theme
			);
			this.canvasAdapter.requestSave();

			return true;
		});
	}

	clearSessions(): void {
		this.sessionManager.clear();
	}

	private withContext<T>(
		context: CanvasOperationContext,
		callback: () => T
	): T {
		const internalContext =
			this.asInternalContext(context);

		return this.canvasAdapter.withCanvas(
			internalContext.canvas,
			internalContext.canvasPath,
			callback
		);
	}

	private asInternalContext(
		context: CanvasOperationContext
	): InternalCanvasOperationContext {
		const internalContext =
			context as InternalCanvasOperationContext;

		if (
			!internalContext.canvas ||
			!internalContext.session
		) {
			throw new Error(
				"Invalid FlowChain canvas operation context."
			);
		}

		return internalContext;
	}

	private getGraphState(
		session: CanvasSession
	): CanvasGraphState | null {
		const existingState =
			this.graphStates.get(session);

		if (existingState) {
			return existingState;
		}

		const metadata =
			this.canvasMetadataManager
				.getMetadata();

		if (!metadata?.graph) {
			return null;
		}

		const graph =
			this.deserializeGraph(
				metadata.graph
			);
		const layoutType =
			this.getMetadataLayoutType(
				metadata.layout
			);
		const state = {
			graph,
			sourceFolderPath:
				metadata.sourceFolderPath,
			layoutType
		};

		this.styleIndexes.set(
			session,
			this.getPaletteIndex(metadata.style)
		);
		this.graphStates.set(
			session,
			state
		);

		return state;
	}

	private saveGraphState(
		session: CanvasSession,
		graph: IGraph,
		sourceFolderPath: string,
		layoutType: LayoutTypeValue
	): void {
		this.graphStates.set(session, {
			graph,
			sourceFolderPath,
			layoutType
		});
	}

	private getMetadataLayoutType(
		layoutType: string
	): LayoutTypeValue {
		const layoutManager =
			new LayoutManager();

		if (layoutManager.hasLayout(layoutType)) {
			return layoutType;
		}

		return LayoutType.Hierarchy;
	}

	private getStyleManager(
		session: CanvasSession
	): StyleManager {
		const palette =
			this.getPalette(session);

		return new StyleManager(palette);
	}

	private getPalette(
		session: CanvasSession
	): StylePalette {
		const index =
			this.styleIndexes.get(session) ?? 0;

		return (
			STYLE_PALETTES[index] ??
			STYLE_PALETTES[0]!
		);
	}

	private advanceStyle(
		session: CanvasSession
	): void {
		const currentIndex =
			this.styleIndexes.get(session) ?? 0;

		this.styleIndexes.set(
			session,
			(currentIndex + 1) %
				STYLE_PALETTES.length
		);
	}

	private getPaletteIndex(
		style: string
	): number {
		const index =
			STYLE_PALETTES.findIndex(
				(palette) =>
					palette.theme === style
			);

		return index >= 0 ? index : 0;
	}

	private updateCanvasMetadata(
		sourceFolderPath: string,
		layoutType: LayoutTypeValue,
		graph: IGraph,
		style: string
	): void {
		const metadata:
			FlowChainCanvasMetadata = {
				version: 1,
				sourceFolderPath,
				layout: layoutType,
				style,
				graph:
					this.serializeGraph(graph)
			};

		this.canvasMetadataManager
			.setMetadata(metadata);
	}

	private applyGraph(
		graph: IGraph,
		snapshot: GraphSnapshot,
		session: CanvasSession
	): void {
		const styleManager =
			this.getStyleManager(session);
		const nodeStyleMap =
			styleManager
				.createNodeStyleMap(graph);

		this.recovery.recover(
			session.context
		);

		this.removeDeletedNodes(
			graph,
			session
		);

		for (const entity of graph.entities.values()) {
			const position =
				snapshot.positions.get(
					entity.id
				);

			if (!position) {
				continue;
			}

			const existingNode =
				session.context.getNode(
					entity.id
				);

			if (existingNode) {
				const dataWithMetadata =
					this.metadataManager
						.setNodeMetadata(
							existingNode.getData(),
							entity
						);

				this.canvasAdapter.updateNode(
					existingNode,
					styleManager
						.applyNodeStyle(
							{
								...dataWithMetadata,
								text: entity.title,
								x: position.x,
								y: position.y,
								width: position.width,
								height: position.height
							},
							entity,
							nodeStyleMap
						)
				);

				continue;
			}

			const node =
				this.canvasAdapter
					.createTextNode({
						position: {
							x: position.x,
							y: position.y
						},
						size: {
							width:
								position.width,
							height:
								position.height
						},
						text: entity.title
					});

			if (!node) {
				continue;
			}

			const dataWithMetadata =
				this.metadataManager
					.setNodeMetadata(
						node.getData(),
						entity
					);

			this.canvasAdapter.updateNode(
				node,
				styleManager
					.applyNodeStyle(
						{
							...dataWithMetadata,
							text: entity.title
						},
						entity,
						nodeStyleMap
					)
			);
			session.context.setNode(
				entity.id,
				node
			);
		}

		this.edgeSync.sync(
			graph,
			snapshot,
			session.context,
			styleManager
		);
		this.canvasAdapter.requestSave();
	}

	private applyStyles(
		graph: IGraph,
		session: CanvasSession
	): void {
		const styleManager =
			this.getStyleManager(session);
		const nodeStyleMap =
			styleManager
				.createNodeStyleMap(graph);

		for (const entity of graph.entities.values()) {
			const node =
				session.context.getNode(
					entity.id
				);

			if (!node) {
				continue;
			}

			this.canvasAdapter.updateNode(
				node,
				styleManager
					.applyNodeStyle(
						node.getData(),
						entity,
						nodeStyleMap
					)
			);
		}

		this.edgeSync.applyStyles(
			graph,
			session.context,
			styleManager
		);
	}

	private removeCurrentGraph(
		session: CanvasSession
	): void {
		for (const node of this.canvasAdapter.getNodes()) {
			this.canvasAdapter.removeNode(
				node
			);
		}

		session.context.clear();
		this.graphStates.delete(session);
	}

	private removeDeletedNodes(
		graph: IGraph,
		session: CanvasSession
	): void {
		for (
			const [entityId, node]
			of session.context.entries
		) {
			if (graph.entities.has(entityId)) {
				continue;
			}

			this.canvasAdapter.removeNode(node);
			session.context.removeNode(
				entityId
			);
		}
	}

	private serializeGraph(
		graph: IGraph
	): FlowChainGraphMetadata {
		return {
			entities:
				Array.from(
					graph.entities.values()
				).map((entity) => ({
					id: entity.id,
					type: entity.type,
					title: entity.title,
					properties:
						entity.properties
				})),
			relations:
				Array.from(
					graph.relations.values()
				).map((relation) => ({
					id: relation.id,
					from: relation.from,
					to: relation.to,
					type: relation.type,
					properties:
						relation.properties
				}))
		};
	}

	private deserializeGraph(
		metadata: FlowChainGraphMetadata
	): IGraph {
		const graph = new Graph();

		for (const entity of metadata.entities) {
			graph.addEntity(
				new Entity(
					entity.id,
					entity.type,
					entity.title,
					entity.properties
				)
			);
		}

		for (const relation of metadata.relations) {
			graph.addRelation(
				new Relation(
					relation.id,
					relation.from,
					relation.to,
					relation.type,
					relation.properties
				)
			);
		}

		return graph;
	}

	private zoomToFit(): void {
		window.requestAnimationFrame(() => {
			this.canvasAdapter.zoomToFit();
		});
	}
}
