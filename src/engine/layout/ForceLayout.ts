import type { IGraph } from "../graph/IGraph";
import type { EntityPosition } from "./EntityPosition";
import type { ForceLayoutOptions } from "./ForceLayoutOptions";
import type { GraphSnapshot } from "./GraphSnapshot";
import type { ILayout } from "./ILayout";

const DEFAULT_OPTIONS: ForceLayoutOptions = {
	nodeWidth: 240,
	nodeHeight: 100,
	componentGap: 900,
	initialRadius: 320,
	iterations: 180,
	repulsionStrength: 70000,
	attractionStrength: 0.035,
	centeringStrength: 0.018,
	collisionStrength: 0.45,
	idealEdgeLength: 300,
	initialTemperature: 42,
	cooling: 0.965,
	convergenceThreshold: 0.05
};

interface ForceNode {
	id: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
	componentIndex: number;
}

interface Component {
	entityIds: string[];
	centerX: number;
}

export class ForceLayout implements ILayout {
	private readonly options: ForceLayoutOptions;

	constructor(
		options: Partial<ForceLayoutOptions> = {}
	) {
		this.options = {
			...DEFAULT_OPTIONS,
			...options
		};
	}

	generate(graph: IGraph): GraphSnapshot {
		const components =
			this.findComponents(graph);

		const nodes =
			this.createInitialNodes(
				components
			);

		this.simulate(graph, nodes);

		const positions =
			this.createPositions(nodes);

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
	): Component[] {
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

			components.push(
				component.sort(
					(first, second) =>
						this.compareStable(
							first,
							second
						)
				)
			);
		}

		const totalWidth =
			components.reduce(
				(sum, component) =>
					sum +
					this.getComponentWidth(
						component.length
					),
				0
			) +
			Math.max(
				0,
				components.length - 1
			) *
			this.options.componentGap;

		let currentX =
			-totalWidth / 2;

		return components.map((entityIds) => {
			const width =
				this.getComponentWidth(
					entityIds.length
				);

			const component = {
				entityIds,
				centerX:
					currentX + width / 2
			};

			currentX +=
				width +
				this.options.componentGap;

			return component;
		});
	}

	private createInitialNodes(
		components: readonly Component[]
	): ForceNode[] {
		const nodes: ForceNode[] = [];

		components.forEach(
			(component, componentIndex) => {
				const count =
					component.entityIds.length;

				component.entityIds.forEach(
					(entityId, index) => {
						const angle =
							count === 1
								? 0
								: (
									2 *
									Math.PI *
									index
								) / count;

						const radius =
							count === 1
								? 0
								: this.options
									.initialRadius;

						nodes.push({
							id: entityId,
							x:
								component.centerX +
								Math.cos(angle) *
								radius,
							y:
								Math.sin(angle) *
								radius,
							vx: 0,
							vy: 0,
							componentIndex
						});
					}
				);
			}
		);

		return nodes;
	}

	private simulate(
		graph: IGraph,
		nodes: ForceNode[]
	): void {
		const nodeMap =
			new Map(
				nodes.map((node) => [
					node.id,
					node
				])
			);

		let temperature =
			this.options.initialTemperature;

		for (
			let iteration = 0;
			iteration < this.options.iterations;
			iteration++
		) {
			this.applyRepulsion(nodes);
			this.applyAttraction(graph, nodeMap);
			this.applyComponentCentering(nodes);
			this.applyCollision(nodes);

			const movement =
				this.integrate(
					nodes,
					temperature
				);

			if (
				movement <
				this.options.convergenceThreshold
			) {
				break;
			}

			temperature *=
				this.options.cooling;
		}
	}

	private applyRepulsion(
		nodes: readonly ForceNode[]
	): void {
		for (
			let firstIndex = 0;
			firstIndex < nodes.length;
			firstIndex++
		) {
			const first =
				nodes[firstIndex];

			if (!first) {
				continue;
			}

			for (
				let secondIndex =
					firstIndex + 1;
				secondIndex < nodes.length;
				secondIndex++
			) {
				const second =
					nodes[secondIndex];

				if (!second) {
					continue;
				}

				const dx =
					second.x - first.x;
				const dy =
					second.y - first.y;
				const distanceSquared =
					Math.max(
						1,
						dx * dx + dy * dy
					);
				const distance =
					Math.sqrt(distanceSquared);
				const force =
					this.options
						.repulsionStrength /
					distanceSquared;
				const fx =
					(dx / distance) * force;
				const fy =
					(dy / distance) * force;

				first.vx -= fx;
				first.vy -= fy;
				second.vx += fx;
				second.vy += fy;
			}
		}
	}

	private applyAttraction(
		graph: IGraph,
		nodeMap: ReadonlyMap<string, ForceNode>
	): void {
		for (const relation of graph.relations.values()) {
			const from =
				nodeMap.get(relation.from);
			const to =
				nodeMap.get(relation.to);

			if (!from || !to) {
				continue;
			}

			const dx = to.x - from.x;
			const dy = to.y - from.y;
			const distance =
				Math.max(
					1,
					Math.hypot(dx, dy)
				);
			const displacement =
				distance -
				this.options.idealEdgeLength;
			const force =
				displacement *
				this.options.attractionStrength;
			const fx =
				(dx / distance) * force;
			const fy =
				(dy / distance) * force;

			from.vx += fx;
			from.vy += fy;
			to.vx -= fx;
			to.vy -= fy;
		}
	}

	private applyComponentCentering(
		nodes: readonly ForceNode[]
	): void {
		const centers =
			new Map<number, {
				x: number;
				y: number;
				count: number;
			}>();

		for (const node of nodes) {
			const center =
				centers.get(
					node.componentIndex
				) ?? {
					x: 0,
					y: 0,
					count: 0
				};

			center.x += node.x;
			center.y += node.y;
			center.count++;
			centers.set(
				node.componentIndex,
				center
			);
		}

		for (const center of centers.values()) {
			center.x /= center.count;
			center.y /= center.count;
		}

		for (const node of nodes) {
			const center =
				centers.get(
					node.componentIndex
				);

			if (!center) {
				continue;
			}

			node.vx +=
				(center.x - node.x) *
				this.options.centeringStrength;
			node.vy +=
				(center.y - node.y) *
				this.options.centeringStrength;
		}
	}

	private applyCollision(
		nodes: readonly ForceNode[]
	): void {
		const minDistanceX =
			this.options.nodeWidth * 1.15;
		const minDistanceY =
			this.options.nodeHeight * 1.35;

		for (
			let firstIndex = 0;
			firstIndex < nodes.length;
			firstIndex++
		) {
			const first =
				nodes[firstIndex];

			if (!first) {
				continue;
			}

			for (
				let secondIndex =
					firstIndex + 1;
				secondIndex < nodes.length;
				secondIndex++
			) {
				const second =
					nodes[secondIndex];

				if (!second) {
					continue;
				}

				const dx =
					second.x - first.x;
				const dy =
					second.y - first.y;

				if (
					Math.abs(dx) >= minDistanceX ||
					Math.abs(dy) >= minDistanceY
				) {
					continue;
				}

				const pushX =
					(minDistanceX -
						Math.abs(dx)) *
					Math.sign(dx || 1) *
					this.options
						.collisionStrength;

				const pushY =
					(minDistanceY -
						Math.abs(dy)) *
					Math.sign(dy || 1) *
					this.options
						.collisionStrength;

				first.vx -= pushX;
				second.vx += pushX;
				first.vy -= pushY;
				second.vy += pushY;
			}
		}
	}

	private integrate(
		nodes: readonly ForceNode[],
		temperature: number
	): number {
		let totalMovement = 0;

		for (const node of nodes) {
			const velocity =
				Math.hypot(
					node.vx,
					node.vy
				);

			if (velocity === 0) {
				continue;
			}

			const limitedVelocity =
				Math.min(
					velocity,
					temperature
				);
			const scale =
				limitedVelocity / velocity;
			const dx = node.vx * scale;
			const dy = node.vy * scale;

			node.x += dx;
			node.y += dy;

			node.vx = 0;
			node.vy = 0;

			totalMovement +=
				Math.hypot(dx, dy);
		}

		return nodes.length === 0
			? 0
			: totalMovement / nodes.length;
	}

	private createPositions(
		nodes: readonly ForceNode[]
	): Map<string, EntityPosition> {
		const positions =
			new Map<string, EntityPosition>();

		for (const node of nodes) {
			positions.set(
				node.id,
				{
					x:
						node.x -
						this.options.nodeWidth / 2,
					y:
						node.y -
						this.options.nodeHeight / 2,
					width:
						this.options.nodeWidth,
					height:
						this.options.nodeHeight
				}
			);
		}

		return positions;
	}

	private getComponentWidth(
		nodeCount: number
	): number {
		return Math.max(
			this.options.initialRadius * 2,
			Math.sqrt(nodeCount) *
				this.options.idealEdgeLength
		);
	}

	private compareStable(
		first: string,
		second: string
	): number {
		return first.localeCompare(second);
	}
}
