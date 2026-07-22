import type { IGraph } from "../graph/IGraph";
import type { EntityPosition } from "./EntityPosition";
import type { GraphSnapshot } from "./GraphSnapshot";
import type { ILayout } from "./ILayout";

interface CircularLayoutOptions {
	nodeWidth: number;
	nodeHeight: number;
	minNodeGap: number;
	componentGap: number;
	minRadius: number;
}

const DEFAULT_OPTIONS: CircularLayoutOptions = {
	nodeWidth: 240,
	nodeHeight: 100,
	minNodeGap: 90,
	componentGap: 900,
	minRadius: 260
};

interface ComponentInfo {
	entityIds: string[];
	ringIds: string[];
	attachedIds: Map<string, string[]>;
	radius: number;
	width: number;
}

export class CircularLayout implements ILayout {
	private readonly options: CircularLayoutOptions;

	constructor(
		options: Partial<CircularLayoutOptions> = {}
	) {
		this.options = {
			...DEFAULT_OPTIONS,
			...options
		};
	}

	generate(graph: IGraph): GraphSnapshot {
		const components =
			this.findComponents(graph)
				.map((entityIds) =>
					this.createComponentInfo(
						entityIds,
						graph
					)
				)
				.sort((first, second) =>
					this.compareStable(
						first.entityIds[0] ?? "",
						second.entityIds[0] ?? ""
					)
				);

		const positions =
			new Map<string, EntityPosition>();

		let left =
			-this.getTotalWidth(components) / 2;

		for (const component of components) {
			const centerX =
				left + component.width / 2;

			this.placeComponent(
				component,
				centerX,
				positions
			);

			left +=
				component.width +
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
			this.createAdjacency(graph);
		const visited =
			new Set<string>();
		const components: string[][] = [];

		for (
			const entityId
			of Array.from(graph.entities.keys())
				.sort((first, second) =>
					this.compareStable(first, second)
				)
		) {
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

				for (
					const neighborId
					of Array.from(
						adjacency.get(currentId) ??
							[]
					).sort((first, second) =>
						this.compareStable(
							first,
							second
						)
					)
				) {
					if (visited.has(neighborId)) {
						continue;
					}

					visited.add(neighborId);
					queue.push(neighborId);
				}
			}

			components.push(
				this.orderComponent(
					component,
					adjacency
				)
			);
		}

		return components;
	}

	private createAdjacency(
		graph: IGraph
	): Map<string, Set<string>> {
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

		return adjacency;
	}

	private orderComponent(
		entityIds: readonly string[],
		adjacency: ReadonlyMap<string, Set<string>>
	): string[] {
		const remaining =
			new Set(entityIds);
		const ordered: string[] = [];

		let currentId =
			[...remaining].sort(
				(first, second) =>
					(
						adjacency.get(second)?.size ??
						0
					) -
						(
							adjacency.get(first)
								?.size ?? 0
						) ||
					this.compareStable(
						first,
						second
					)
			)[0];

		while (currentId) {
			ordered.push(currentId);
			remaining.delete(currentId);

			currentId =
				Array.from(
					adjacency.get(currentId) ?? []
				)
					.filter((neighborId) =>
						remaining.has(neighborId)
					)
					.sort(
						(first, second) =>
							(
								adjacency.get(second)
									?.size ?? 0
							) -
								(
									adjacency.get(first)
										?.size ?? 0
								) ||
							this.compareStable(
								first,
								second
							)
					)[0] ??
				[...remaining].sort(
					(first, second) =>
						this.compareStable(
							first,
							second
						)
				)[0];
		}

		return ordered;
	}

	private createComponentInfo(
		entityIds: readonly string[],
		graph: IGraph
	): ComponentInfo {
		const ringIds =
			this.findDirectedCycle(
				entityIds,
				graph
			) ??
			[...entityIds];
		const attachedIds =
			this.createAttachedIds(
				entityIds,
				ringIds,
				graph
			);
		const radius =
			this.calculateRadius(
				ringIds.length
			);
		const largestAttachment =
			Math.max(
				0,
				...Array.from(
					attachedIds.values()
				).map((ids) => ids.length)
			);

		return {
			entityIds: [...entityIds],
			ringIds,
			attachedIds,
			radius,
			width:
				radius * 2 +
				this.options.nodeWidth +
				largestAttachment *
					(
						this.options.nodeWidth +
						this.options.minNodeGap
					)
		};
	}

	private placeComponent(
		component: ComponentInfo,
		centerX: number,
		positions: Map<string, EntityPosition>
	): void {
		if (component.ringIds.length === 1) {
			const entityId =
				component.ringIds[0];

			if (!entityId) {
				return;
			}

			positions.set(entityId, {
				x:
					centerX -
					this.options.nodeWidth / 2,
				y:
					-this.options.nodeHeight / 2,
				width: this.options.nodeWidth,
				height: this.options.nodeHeight
			});

			return;
		}

		const angleStep =
			(Math.PI * 2) /
			component.ringIds.length;
		const startAngle =
			-Math.PI / 2;

		for (
			let index = 0;
			index < component.ringIds.length;
			index++
		) {
			const entityId =
				component.ringIds[index];

			if (!entityId) {
				continue;
			}

			const angle =
				startAngle +
				index * angleStep;

			positions.set(entityId, {
				x:
					centerX +
					Math.cos(angle) *
						component.radius -
					this.options.nodeWidth / 2,
				y:
					Math.sin(angle) *
						component.radius -
					this.options.nodeHeight / 2,
				width: this.options.nodeWidth,
				height: this.options.nodeHeight
			});

			this.placeAttachedNodes(
				entityId,
				angle,
				component,
				centerX,
				positions
			);
		}
	}

	private placeAttachedNodes(
		anchorId: string,
		anchorAngle: number,
		component: ComponentInfo,
		centerX: number,
		positions: Map<string, EntityPosition>
	): void {
		const attached =
			component.attachedIds.get(anchorId) ?? [];

		if (attached.length === 0) {
			return;
		}

		const outwardX =
			Math.cos(anchorAngle);
		const outwardY =
			Math.sin(anchorAngle);
		const tangentX =
			-outwardY;
		const tangentY =
			outwardX;
		const baseDistance =
			component.radius +
			this.options.nodeWidth +
			this.options.minNodeGap;
		const tangentGap =
			this.options.nodeHeight +
			this.options.minNodeGap;

		for (
			let index = 0;
			index < attached.length;
			index++
		) {
			const entityId =
				attached[index];

			if (!entityId) {
				continue;
			}

			const offset =
				(
					index -
					(attached.length - 1) / 2
				) * tangentGap;

			positions.set(entityId, {
				x:
					centerX +
					outwardX * baseDistance +
					tangentX * offset -
					this.options.nodeWidth / 2,
				y:
					outwardY * baseDistance +
					tangentY * offset -
					this.options.nodeHeight / 2,
				width: this.options.nodeWidth,
				height: this.options.nodeHeight
			});
		}
	}

	private findDirectedCycle(
		entityIds: readonly string[],
		graph: IGraph
	): string[] | null {
		const componentIds =
			new Set(entityIds);
		const outgoing =
			new Map<string, string[]>();

		for (const entityId of entityIds) {
			outgoing.set(entityId, []);
		}

		for (const relation of graph.relations.values()) {
			if (
				!componentIds.has(relation.from) ||
				!componentIds.has(relation.to)
			) {
				continue;
			}

			outgoing.get(relation.from)?.push(
				relation.to
			);
		}

		for (const targets of outgoing.values()) {
			targets.sort((first, second) =>
				this.compareStable(first, second)
			);
		}

		let bestCycle: string[] | null = null;

		for (
			const startId
			of [...entityIds].sort(
				(first, second) =>
					this.compareStable(first, second)
			)
		) {
			const cycle =
				this.findCycleFrom(
					startId,
					startId,
					outgoing,
					[],
					new Set<string>()
				);

			if (
				cycle &&
				(
					!bestCycle ||
					cycle.length > bestCycle.length ||
					(
						cycle.length === bestCycle.length &&
						cycle.join("\u0000")
							.localeCompare(
								bestCycle.join("\u0000")
							) < 0
					)
				)
			) {
				bestCycle = cycle;
			}
		}

		return bestCycle;
	}

	private findCycleFrom(
		startId: string,
		currentId: string,
		outgoing: ReadonlyMap<string, readonly string[]>,
		path: readonly string[],
		visited: ReadonlySet<string>
	): string[] | null {
		const nextPath = [...path, currentId];
		const nextVisited =
			new Set(visited);
		nextVisited.add(currentId);

		for (
			const targetId
			of outgoing.get(currentId) ?? []
		) {
			if (
				targetId === startId &&
				nextPath.length > 2
			) {
				return this.rotateCycle(nextPath);
			}

			if (nextVisited.has(targetId)) {
				continue;
			}

			const cycle =
				this.findCycleFrom(
					startId,
					targetId,
					outgoing,
					nextPath,
					nextVisited
				);

			if (cycle) {
				return cycle;
			}
		}

		return null;
	}

	private rotateCycle(
		cycle: readonly string[]
	): string[] {
		let bestIndex = 0;

		for (
			let index = 1;
			index < cycle.length;
			index++
		) {
			if (
				(cycle[index] ?? "").localeCompare(
					cycle[bestIndex] ?? ""
				) < 0
			) {
				bestIndex = index;
			}
		}

		return [
			...cycle.slice(bestIndex),
			...cycle.slice(0, bestIndex)
		];
	}

	private createAttachedIds(
		entityIds: readonly string[],
		ringIds: readonly string[],
		graph: IGraph
	): Map<string, string[]> {
		const ringSet =
			new Set(ringIds);
		const attachedIds =
			new Map<string, string[]>();

		for (const ringId of ringIds) {
			attachedIds.set(ringId, []);
		}

		for (const entityId of entityIds) {
			if (ringSet.has(entityId)) {
				continue;
			}

			const anchorId =
				this.findAttachmentAnchor(
					entityId,
					ringSet,
					ringIds,
					graph
				);

			attachedIds.get(anchorId)?.push(
				entityId
			);
		}

		for (const ids of attachedIds.values()) {
			ids.sort((first, second) =>
				this.compareStable(first, second)
			);
		}

		return attachedIds;
	}

	private findAttachmentAnchor(
		entityId: string,
		ringSet: ReadonlySet<string>,
		ringIds: readonly string[],
		graph: IGraph
	): string {
		const connectedRingIds =
			Array.from(graph.relations.values())
				.filter(
					(relation) =>
						(
							relation.from === entityId &&
							ringSet.has(relation.to)
						) ||
						(
							relation.to === entityId &&
							ringSet.has(relation.from)
						)
				)
				.map((relation) =>
					relation.from === entityId
						? relation.to
						: relation.from
				)
				.sort((first, second) =>
					this.compareStable(
						first,
						second
					)
				);

		return (
			connectedRingIds[0] ??
			ringIds[0] ??
			entityId
		);
	}

	private calculateRadius(
		nodeCount: number
	): number {
		if (nodeCount <= 1) {
			return 0;
		}

		const minimumArc =
			this.options.nodeWidth +
			this.options.minNodeGap;

		return Math.max(
			this.options.minRadius,
			(nodeCount * minimumArc) /
				(2 * Math.PI)
		);
	}

	private getTotalWidth(
		components: readonly ComponentInfo[]
	): number {
		return components.reduce(
			(total, component, index) =>
				total +
				component.width +
				(
					index ===
					components.length - 1
						? 0
						: this.options.componentGap
				),
			0
		);
	}

	private compareStable(
		first: string,
		second: string
	): number {
		return first.localeCompare(second);
	}
}
