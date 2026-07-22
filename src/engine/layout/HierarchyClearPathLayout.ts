import type { IGraph } from "../graph/IGraph";
import { GeometryIntersection } from "./geometry/GeometryIntersection";
import type { EntityPosition } from "./EntityPosition";
import type { GraphSnapshot } from "./GraphSnapshot";
import { HierarchyLayout } from "./HierarchyLayout";
import type { HierarchyLayoutOptions } from "./HierarchyLayoutOptions";
import type { ILayout } from "./ILayout";
import type { EdgePathPoint } from "./pipeline/routing/path/EdgePathPoint";

interface HierarchyClearPathOptions
	extends HierarchyLayoutOptions {
	clearance: number;
	maxPasses: number;
}

const DEFAULT_OPTIONS: HierarchyClearPathOptions = {
	nodeWidth: 240,
	nodeHeight: 100,
	horizontalGap: 120,
	verticalGap: 80,
	clearance: 140,
	maxPasses: 6
};

export class HierarchyClearPathLayout
	implements ILayout {
	private readonly options:
		HierarchyClearPathOptions;
	private readonly hierarchyLayout:
		HierarchyLayout;

	constructor(
		options:
			Partial<HierarchyClearPathOptions> = {}
	) {
		this.options = {
			...DEFAULT_OPTIONS,
			...options
		};

		this.hierarchyLayout =
			new HierarchyLayout(this.options);
	}

	generate(graph: IGraph): GraphSnapshot {
		const snapshot =
			this.hierarchyLayout.generate(graph);
		const positions =
			new Map<string, EntityPosition>(
				snapshot.positions
			);

		const mainPath =
			this.findLongestDirectedPath(graph);

		this.alignMainPath(
			graph,
			mainPath,
			positions
		);
		this.moveNodesAwayFromEdges(
			graph,
			positions
		);
		this.centerWholeGraph(positions);

		return {
			...snapshot,
			positions,
			routes: new Map(),
			paths: new Map()
		};
	}

	private findLongestDirectedPath(
		graph: IGraph
	): string[] {
		const outgoing =
			new Map<string, string[]>();

		for (const entityId of graph.entities.keys()) {
			outgoing.set(entityId, []);
		}

		for (const relation of graph.relations.values()) {
			outgoing.get(relation.from)?.push(
				relation.to
			);
		}

		for (const targets of outgoing.values()) {
			targets.sort();
		}

		let bestPath: string[] = [];

		for (
			const entityId
			of Array.from(graph.entities.keys()).sort()
		) {
			const path =
				this.findLongestPathFrom(
					entityId,
					outgoing,
					new Set<string>()
				);

			if (
				path.length > bestPath.length ||
				(
					path.length === bestPath.length &&
					path.join("\u0000")
						.localeCompare(
							bestPath.join("\u0000")
						) < 0
				)
			) {
				bestPath = path;
			}
		}

		return bestPath;
	}

	private findLongestPathFrom(
		entityId: string,
		outgoing: ReadonlyMap<string, readonly string[]>,
		visited: ReadonlySet<string>
	): string[] {
		if (visited.has(entityId)) {
			return [];
		}

		const nextVisited =
			new Set(visited);
		nextVisited.add(entityId);

		let bestTail: string[] = [];

		for (
			const targetId
			of outgoing.get(entityId) ?? []
		) {
			const tail =
				this.findLongestPathFrom(
					targetId,
					outgoing,
					nextVisited
				);

			if (
				tail.length > bestTail.length ||
				(
					tail.length === bestTail.length &&
					tail.join("\u0000")
						.localeCompare(
							bestTail.join("\u0000")
						) < 0
				)
			) {
				bestTail = tail;
			}
		}

		return [entityId, ...bestTail];
	}

	private alignMainPath(
		graph: IGraph,
		mainPath: readonly string[],
		positions: Map<string, EntityPosition>
	): void {
		if (mainPath.length === 0) {
			return;
		}

		const mainPathSet =
			new Set(mainPath);
		const incoming =
			this.createIncomingMap(graph);
		const outgoing =
			this.createOutgoingMap(graph);

		for (const entityId of mainPath) {
			const position =
				positions.get(entityId);

			if (!position) {
				continue;
			}

			positions.set(entityId, {
				...position,
				x: -position.width / 2
			});
		}

		const layers =
			this.groupByLayer(positions);

		for (const layer of layers.values()) {
			const mainEntities =
				layer.filter(([entityId]) =>
					mainPathSet.has(entityId)
				);

			if (mainEntities.length === 0) {
				this.centerLayerByNeighborGravity(
					layer,
					incoming,
					outgoing,
					positions
				);
				continue;
			}

			const sideEntities =
				layer
					.filter(([entityId]) =>
						!mainPathSet.has(entityId)
					)
					.sort((first, second) =>
						this.scoreSideEntity(
							first[0],
							incoming,
							outgoing,
							mainPathSet
						) -
						this.scoreSideEntity(
							second[0],
							incoming,
							outgoing,
							mainPathSet
						) ||
						first[1].x - second[1].x
					);

			this.placeSideEntitiesAroundMainPath(
				sideEntities,
				positions
			);
		}

		this.resolveLayerOverlaps(positions);
	}

	private placeSideEntitiesAroundMainPath(
		entities: ReadonlyArray<[
			string,
			EntityPosition
		]>,
		positions: Map<string, EntityPosition>
	): void {
		let leftIndex = 0;
		let rightIndex = 0;

		for (const [entityId, position] of entities) {
			const preferLeft =
				position.x + position.width / 2 < 0;
			const index =
				preferLeft
					? leftIndex++
					: rightIndex++;
			const distance =
				position.width +
				this.options.horizontalGap +
				index *
					(
						position.width +
						this.options.horizontalGap
					);

			positions.set(entityId, {
				...position,
				x:
					preferLeft
						? -position.width / 2 -
							distance
						: -position.width / 2 +
							distance
			});
		}
	}

	private centerLayerByNeighborGravity(
		layer: ReadonlyArray<[
			string,
			EntityPosition
		]>,
		incoming: ReadonlyMap<string, readonly string[]>,
		outgoing: ReadonlyMap<string, readonly string[]>,
		positions: Map<string, EntityPosition>
	): void {
		for (const [entityId, position] of layer) {
			const neighborCenters =
				[
					...(incoming.get(entityId) ?? []),
					...(outgoing.get(entityId) ?? [])
				]
					.map((neighborId) =>
						positions.get(neighborId)
					)
					.filter(
						(
							neighbor
						): neighbor is EntityPosition =>
							neighbor !== undefined
					)
					.map((neighbor) =>
						this.getCenterX(neighbor)
					);

			if (neighborCenters.length === 0) {
				continue;
			}

			const center =
				neighborCenters.reduce(
					(sum, value) =>
						sum + value,
					0
				) / neighborCenters.length;

			positions.set(entityId, {
				...position,
				x: center - position.width / 2
			});
		}
	}

	private scoreSideEntity(
		entityId: string,
		incoming: ReadonlyMap<string, readonly string[]>,
		outgoing: ReadonlyMap<string, readonly string[]>,
		mainPathSet: ReadonlySet<string>
	): number {
		const mainConnections =
			[
				...(incoming.get(entityId) ?? []),
				...(outgoing.get(entityId) ?? [])
			].filter((neighborId) =>
				mainPathSet.has(neighborId)
			).length;

		return -mainConnections;
	}

	private createIncomingMap(
		graph: IGraph
	): Map<string, string[]> {
		const incoming =
			new Map<string, string[]>();

		for (const entityId of graph.entities.keys()) {
			incoming.set(entityId, []);
		}

		for (const relation of graph.relations.values()) {
			incoming.get(relation.to)?.push(
				relation.from
			);
		}

		for (const values of incoming.values()) {
			values.sort();
		}

		return incoming;
	}

	private createOutgoingMap(
		graph: IGraph
	): Map<string, string[]> {
		const outgoing =
			new Map<string, string[]>();

		for (const entityId of graph.entities.keys()) {
			outgoing.set(entityId, []);
		}

		for (const relation of graph.relations.values()) {
			outgoing.get(relation.from)?.push(
				relation.to
			);
		}

		for (const values of outgoing.values()) {
			values.sort();
		}

		return outgoing;
	}

	private groupByLayer(
		positions: ReadonlyMap<string, EntityPosition>
	): Map<number, Array<[string, EntityPosition]>> {
		const layers =
			new Map<number, Array<[
				string,
				EntityPosition
			]>>();

		for (const entry of positions) {
			const [, position] = entry;
			const layer =
				layers.get(position.y) ?? [];

			layer.push(entry);
			layers.set(position.y, layer);
		}

		return layers;
	}

	private moveNodesAwayFromEdges(
		graph: IGraph,
		positions: Map<string, EntityPosition>
	): void {
		let direction = 1;

		for (
			let pass = 0;
			pass < this.options.maxPasses;
			pass++
		) {
			let moved = false;

			for (const relation of graph.relations.values()) {
				const from =
					positions.get(relation.from);
				const to =
					positions.get(relation.to);

				if (!from || !to) {
					continue;
				}

				const segment =
					this.createEdgeSegment(
						from,
						to
					);

				for (
					const [entityId, position]
					of positions
				) {
					if (
						entityId === relation.from ||
						entityId === relation.to
					) {
						continue;
					}

					if (
						!GeometryIntersection
							.pathIntersectsRectangle(
								segment,
								position
							)
					) {
						continue;
					}

					positions.set(entityId, {
						...position,
						x:
							position.x +
							(
								position.width +
								this.options.clearance
							) *
							direction
					});

					direction *= -1;
					moved = true;
				}
			}

			this.resolveLayerOverlaps(
				positions
			);

			if (!moved) {
				return;
			}
		}
	}

	private createEdgeSegment(
		from: EntityPosition,
		to: EntityPosition
	): EdgePathPoint[] {
		const fromCenterX =
			this.getCenterX(from);
		const toCenterX =
			this.getCenterX(to);
		const fromCenterY =
			this.getCenterY(from);
		const toCenterY =
			this.getCenterY(to);

		if (fromCenterY <= toCenterY) {
			return [
				{
					x: fromCenterX,
					y: from.y + from.height
				},
				{
					x: toCenterX,
					y: to.y
				}
			];
		}

		return [
			{
				x: fromCenterX,
				y: from.y
			},
			{
				x: toCenterX,
				y: to.y + to.height
			}
		];
	}

	private resolveLayerOverlaps(
		positions: Map<string, EntityPosition>
	): void {
		const layers =
			new Map<number, Array<[
				string,
				EntityPosition
			]>>();

		for (const entry of positions) {
			const [, position] = entry;
			const layer =
				layers.get(position.y) ?? [];

			layer.push(entry);
			layers.set(position.y, layer);
		}

		for (const layer of layers.values()) {
			layer.sort(
				(first, second) =>
					this.getCenterX(first[1]) -
					this.getCenterX(second[1])
			);

			const originalCenter =
				this.getLayerCenter(layer);

			for (
				let index = 1;
				index < layer.length;
				index++
			) {
				const previous =
					layer[index - 1];
				const current =
					layer[index];

				if (!previous || !current) {
					continue;
				}

				const minimumX =
					previous[1].x +
					previous[1].width +
					this.options.horizontalGap;

				if (current[1].x >= minimumX) {
					continue;
				}

				const nextPosition = {
					...current[1],
					x: minimumX
				};

				current[1] = nextPosition;
				positions.set(
					current[0],
					nextPosition
				);
			}

			const newCenter =
				this.getLayerCenter(layer);
			const offset =
				originalCenter - newCenter;

			for (const [entityId, position] of layer) {
				positions.set(entityId, {
					...position,
					x: position.x + offset
				});
			}
		}
	}

	private getLayerCenter(
		layer: ReadonlyArray<[
			string,
			EntityPosition
		]>
	): number {
		const left =
			Math.min(
				...layer.map(
					([, position]) =>
						position.x
				)
			);
		const right =
			Math.max(
				...layer.map(
					([, position]) =>
						position.x +
						position.width
				)
			);

		return (left + right) / 2;
	}

	private centerWholeGraph(
		positions: Map<string, EntityPosition>
	): void {
		const values =
			Array.from(positions.values());

		if (values.length === 0) {
			return;
		}

		const left =
			Math.min(
				...values.map(
					(position) =>
						position.x
				)
			);
		const right =
			Math.max(
				...values.map(
					(position) =>
						position.x +
						position.width
				)
			);
		const center =
			(left + right) / 2;

		for (const [entityId, position] of positions) {
			positions.set(entityId, {
				...position,
				x: position.x - center
			});
		}
	}

	private getCenterX(
		position: EntityPosition
	): number {
		return position.x + position.width / 2;
	}

	private getCenterY(
		position: EntityPosition
	): number {
		return position.y + position.height / 2;
	}
}
