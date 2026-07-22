import type { IGraph } from "../graph/IGraph";
import { GraphQuery } from "../query/GraphQuery";
import type { EntityPosition } from "./EntityPosition";
import type { GraphSnapshot } from "./GraphSnapshot";
import type { ILayout } from "./ILayout";
import type { RadialLayoutOptions } from "./RadialLayoutOptions";

const DEFAULT_OPTIONS: RadialLayoutOptions = {
	nodeWidth: 240,
	nodeHeight: 100,
	radiusGap: 260,
	componentGap: 900,
	minSiblingAngleGap: Math.PI / 8
};

interface ComponentInfo {
	entityIds: string[];
	centerId: string;
	layers: Map<number, string[]>;
	maxRadius: number;
	layerRadii: Map<number, number>;
}

export class RadialLayout implements ILayout {
	private readonly options: RadialLayoutOptions;

	constructor(
		options: Partial<RadialLayoutOptions> = {}
	) {
		this.options = {
			...DEFAULT_OPTIONS,
			...options
		};
	}

	generate(graph: IGraph): GraphSnapshot {
		const query =
			new GraphQuery(graph);

		const components =
			this.findComponents(graph);

		const componentInfos =
			components
				.map((entityIds) =>
					this.createComponentInfo(
						entityIds,
						graph,
						query
					)
				)
				.sort((first, second) =>
					this.compareStable(
						first.centerId,
						second.centerId
					)
				);

		const positions =
			new Map<string, EntityPosition>();

		let offsetX =
			this.calculateStartOffset(
				componentInfos
			);

		for (const component of componentInfos) {
			this.placeComponent(
				component,
				offsetX,
				positions
			);

			offsetX +=
				component.maxRadius * 2 +
				this.options.componentGap;
		}

		return {
			positions,
			routes: new Map(),
			paths: new Map(),
			expandedEntityIds:
				new Set<string>(),
			collapsedEntityIds:
				new Set<string>(),
			selectedEntityIds:
				new Set<string>()
		};
	}

	private findComponents(
		graph: IGraph
	): string[][] {
		const adjacency =
			new Map<string, Set<string>>();

		for (const entity of graph.entities.values()) {
			adjacency.set(
				entity.id,
				new Set<string>()
			);
		}

		for (const relation of graph.relations.values()) {
			adjacency.get(relation.from)?.add(
				relation.to
			);
			adjacency.get(relation.to)?.add(
				relation.from
			);
		}

		const visited =
			new Set<string>();

		const components: string[][] = [];

		const entityIds =
			Array.from(graph.entities.keys())
				.sort((first, second) =>
					this.compareStable(first, second)
				);

		for (const entityId of entityIds) {
			if (visited.has(entityId)) {
				continue;
			}

			const component: string[] = [];
			const queue = [entityId];
			visited.add(entityId);

			while (queue.length > 0) {
				const currentId =
					queue.shift();

				if (!currentId) {
					continue;
				}

				component.push(currentId);

				const neighbors =
					Array.from(
						adjacency.get(currentId) ??
							[]
					).sort((first, second) =>
						this.compareStable(
							first,
							second
						)
					);

				for (const neighborId of neighbors) {
					if (visited.has(neighborId)) {
						continue;
					}

					visited.add(neighborId);
					queue.push(neighborId);
				}
			}

			components.push(component);
		}

		return components;
	}

	private createComponentInfo(
		entityIds: readonly string[],
		graph: IGraph,
		query: GraphQuery
	): ComponentInfo {
		const centerId =
			this.selectCenter(
				entityIds,
				query
			);

		const layers =
			this.calculateLayers(
				centerId,
				entityIds,
				query
			);

		const layerRadii =
			this.calculateLayerRadii(layers);

		void graph;

		return {
			entityIds: [...entityIds],
			centerId,
			layers,
			layerRadii,
			maxRadius:
				Math.max(
					0,
					...Array.from(
						layerRadii.values()
					)
				)
		};
	}

	private selectCenter(
		entityIds: readonly string[],
		query: GraphQuery
	): string {
		const sortedIds =
			[...entityIds].sort(
				(first, second) => {
					const firstScore =
						this.calculateCenterScore(
							first,
							query
						);

					const secondScore =
						this.calculateCenterScore(
							second,
							query
						);

					if (
						firstScore !== secondScore
					) {
						return secondScore -
							firstScore;
					}

					return this.compareStable(
						first,
						second
					);
				}
			);

		return sortedIds[0] ?? "";
	}

	private calculateCenterScore(
		entityId: string,
		query: GraphQuery
	): number {
		const incoming =
			query.findIncomingRelations(
				entityId
			).length;

		const outgoing =
			query.findOutgoingRelations(
				entityId
			).length;

		const downstreamReach =
			this.countReachableDownstream(
				entityId,
				query
			);

		return (
			downstreamReach * 100 +
			outgoing * 10 -
			incoming * 4
		);
	}

	private countReachableDownstream(
		entityId: string,
		query: GraphQuery
	): number {
		const visited =
			new Set<string>([entityId]);
		const queue = [entityId];

		while (queue.length > 0) {
			const currentId =
				queue.shift();

			if (!currentId) {
				continue;
			}

			const relations =
				query.findOutgoingRelations(
					currentId
				);

			for (const relation of relations) {
				if (
					visited.has(relation.to)
				) {
					continue;
				}

				visited.add(relation.to);
				queue.push(relation.to);
			}
		}

		return visited.size - 1;
	}

	private calculateLayers(
		centerId: string,
		entityIds: readonly string[],
		query: GraphQuery
	): Map<number, string[]> {
		const entitySet =
			new Set(entityIds);
		const distances =
			new Map<string, number>();
		const queue = [centerId];

		distances.set(centerId, 0);

		while (queue.length > 0) {
			const currentId =
				queue.shift();

			if (!currentId) {
				continue;
			}

			const currentDistance =
				distances.get(currentId) ?? 0;

			const neighbors = [
				...query.findOutgoingRelations(
					currentId
				).map((relation) => relation.to),
				...query.findIncomingRelations(
					currentId
				).map((relation) => relation.from)
			]
				.filter((neighborId) =>
					entitySet.has(neighborId)
				)
				.sort((first, second) =>
					this.compareStable(
						first,
						second
					)
				);

			for (const neighborId of neighbors) {
				if (distances.has(neighborId)) {
					continue;
				}

				distances.set(
					neighborId,
					currentDistance + 1
				);
				queue.push(neighborId);
			}
		}

		const layers =
			new Map<number, string[]>();

		for (const entityId of entityIds) {
			const distance =
				distances.get(entityId) ?? 0;

			const layer =
				layers.get(distance) ?? [];

			layer.push(entityId);
			layers.set(distance, layer);
		}

		for (const layer of layers.values()) {
			layer.sort((first, second) =>
				this.compareStable(first, second)
			);
		}

		return layers;
	}

	private placeComponent(
		component: ComponentInfo,
		offsetX: number,
		positions: Map<string, EntityPosition>
	): void {
		for (const [layer, entityIds] of component.layers) {
			if (layer === 0) {
				for (const entityId of entityIds) {
					positions.set(
						entityId,
						this.createPosition(
							offsetX,
							0
						)
					);
				}

				continue;
			}

			const radius =
				component.layerRadii.get(layer) ??
				layer *
					this.options.radiusGap;

			const count =
				entityIds.length;

			const angleGap =
				Math.max(
					(2 * Math.PI) / count,
					this.options.minSiblingAngleGap
				);

			const startAngle =
				-Math.PI / 2 -
				((count - 1) * angleGap) / 2;

			entityIds.forEach(
				(entityId, index) => {
					const angle =
						startAngle +
						index * angleGap;

					positions.set(
						entityId,
						this.createPosition(
							offsetX +
							Math.cos(angle) *
							radius,
							Math.sin(angle) *
							radius
						)
					);
				}
			);
		}
	}

	private calculateStartOffset(
		components:
			readonly ComponentInfo[]
	): number {
		if (components.length === 0) {
			return 0;
		}

		const totalWidth =
			components.reduce(
				(sum, component) =>
					sum +
					component.maxRadius * 2,
				0
			) +
			Math.max(
				0,
				components.length - 1
			) *
			this.options.componentGap;

		const firstRadius =
			components[0]?.maxRadius ?? 0;

		return -totalWidth / 2 + firstRadius;
	}

	private calculateLayerRadii(
		layers: ReadonlyMap<number, string[]>
	): Map<number, number> {
		const radii =
			new Map<number, number>();
		let previousRadius = 0;

		const sortedLayers =
			Array.from(layers.keys()).sort(
				(first, second) =>
					first - second
			);

		for (const layer of sortedLayers) {
			if (layer === 0) {
				radii.set(layer, 0);
				continue;
			}

			const count =
				layers.get(layer)?.length ?? 0;
			const baseRadius =
				layer * this.options.radiusGap;
			const minimumRadius =
				this.calculateMinimumRadius(
					count
				);
			const radius =
				Math.max(
					baseRadius,
					minimumRadius,
					previousRadius +
						this.options.radiusGap
				);

			radii.set(layer, radius);
			previousRadius = radius;
		}

		return radii;
	}

	private calculateMinimumRadius(
		count: number
	): number {
		if (count <= 1) {
			return this.options.radiusGap;
		}

		const nodeDiagonal =
			Math.hypot(
				this.options.nodeWidth,
				this.options.nodeHeight
			);
		const minimumArcLength =
			nodeDiagonal +
			this.options.nodeWidth * 0.35;

		return (
			(count * minimumArcLength) /
			(2 * Math.PI)
		);
	}

	private createPosition(
		centerX: number,
		centerY: number
	): EntityPosition {
		return {
			x:
				centerX -
				this.options.nodeWidth / 2,
			y:
				centerY -
				this.options.nodeHeight / 2,
			width:
				this.options.nodeWidth,
			height:
				this.options.nodeHeight
		};
	}

	private compareStable(
		first: string,
		second: string
	): number {
		return first.localeCompare(second);
	}
}
