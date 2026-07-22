import type { IEntity } from "../entity/IEntity";
import type { IGraph } from "../graph/IGraph";
import { GraphQuery } from "../query/GraphQuery";
import type { EntityPosition } from "./EntityPosition";
import type { GraphSnapshot } from "./GraphSnapshot";
import type { HierarchyLayoutOptions } from "./HierarchyLayoutOptions";
import type { ILayout } from "./ILayout";

const DEFAULT_OPTIONS: HierarchyLayoutOptions = {
	nodeWidth: 240,
	nodeHeight: 100,
	horizontalGap: 120,
	verticalGap: 80
};

const ORDERING_PASSES = 6;
const POSITIONING_PASSES = 8;


interface HierarchyLevels {
	levels: Map<number, IEntity[]>;
	entityLevels: Map<string, number>;
	maxLevel: number;
}

export class HierarchyLayout implements ILayout {
	private readonly options: HierarchyLayoutOptions;

	constructor(
		options: Partial<HierarchyLayoutOptions> = {}
	) {
		this.options = {
			...DEFAULT_OPTIONS,
			...options
		};
	}

	generate(graph: IGraph): GraphSnapshot {
		const query = new GraphQuery(graph);

		const hierarchy =
			this.calculateLevels(
				graph,
				query
			);

		this.optimizeLayerOrder(
			hierarchy.levels,
			hierarchy.entityLevels,
			hierarchy.maxLevel,
			query
		);

		const positions =
			this.createInitialPositions(
				hierarchy.levels
			);

		this.optimizeHorizontalPositions(
			hierarchy.levels,
			hierarchy.entityLevels,
			hierarchy.maxLevel,
			query,
			positions
		);
		this.optimizeComponentHorizontalPositions(
			graph,
			hierarchy.entityLevels,
			hierarchy.maxLevel,
			query,
			positions
		);
		this.separateComponents(
			graph,
			positions
		);
		this.centerWholeGraph(positions);

		return {
			positions,
			routes: new Map(),
			paths: new Map(),
			expandedEntityIds: new Set<string>(),
			collapsedEntityIds: new Set<string>(),
			selectedEntityIds: new Set<string>()
		};
	}

	/**
	 * 计算每个节点所在层级。
	 *
	 * 规则：
	 * - 无父节点的实体进入第 0 层。
	 * - 普通节点位于所有上游路径中的最深层级。
	 * - 无法参与拓扑排序的循环节点放在最后一层。
	 */
	private calculateLevels(
		graph: IGraph,
		query: GraphQuery
	): HierarchyLevels {
		const entityLevels =
			new Map<string, number>();

		const indegree =
			new Map<string, number>();

		const queue: string[] = [];

		for (
			const entity
			of graph.entities.values()
		) {
			const incomingRelations =
				query.findIncomingRelations(
					entity.id
				);

			indegree.set(
				entity.id,
				incomingRelations.length
			);

			if (incomingRelations.length === 0) {
				queue.push(entity.id);
				entityLevels.set(entity.id, 0);
			}
		}

		while (queue.length > 0) {
			const currentId =
				queue.shift();

			if (currentId === undefined) {
				continue;
			}

			const currentLevel =
				entityLevels.get(currentId) ?? 0;

			const outgoingRelations =
				query.findOutgoingRelations(
					currentId
				);

			for (
				const relation
				of outgoingRelations
			) {
				const existingTargetLevel =
					entityLevels.get(
						relation.to
					) ?? 0;

				entityLevels.set(
					relation.to,
					Math.max(
						existingTargetLevel,
						currentLevel + 1
					)
				);

				const nextIndegree =
					(
						indegree.get(
							relation.to
						) ?? 0
					) - 1;

				indegree.set(
					relation.to,
					nextIndegree
				);

				if (nextIndegree === 0) {
					queue.push(
						relation.to
					);
				}
			}
		}

		let maxResolvedLevel = 0;

		for (
			const level
			of entityLevels.values()
		) {
			maxResolvedLevel =
				Math.max(
					maxResolvedLevel,
					level
				);
		}

		const fallbackLevel =
			entityLevels.size === 0
				? 0
				: maxResolvedLevel + 1;

		/*
		 * 循环关系、双向关系或异常图结构，
		 * 可能无法完成普通拓扑排序。
		 *
		 * 这些实体统一放在最后一层，
		 * 避免每发现一个实体就创建一个新层。
		 */
		for (
			const entity
			of graph.entities.values()
		) {
			if (
				entityLevels.has(entity.id)
			) {
				continue;
			}

			entityLevels.set(
				entity.id,
				fallbackLevel
			);
		}

		const levels =
			new Map<number, IEntity[]>();

		let maxLevel = 0;

		for (
			const entity
			of graph.entities.values()
		) {
			const level =
				entityLevels.get(entity.id) ?? 0;

			const entities =
				levels.get(level) ?? [];

			entities.push(entity);
			levels.set(level, entities);

			maxLevel =
				Math.max(maxLevel, level);
		}

		return {
			levels,
			entityLevels,
			maxLevel
		};
	}

	/**
	 * 使用重心排序减少相邻层之间的连线交叉。
	 *
	 * 向下扫描：
	 * 根据父节点的位置重新排列子节点。
	 *
	 * 向上扫描：
	 * 根据子节点的位置重新排列父节点。
	 */
	private optimizeLayerOrder(
		levels: Map<number, IEntity[]>,
		entityLevels: ReadonlyMap<string, number>,
		maxLevel: number,
		query: GraphQuery
	): void {
		for (
			let pass = 0;
			pass < ORDERING_PASSES;
			pass++
		) {
			for (
				let level = 1;
				level <= maxLevel;
				level++
			) {
				this.sortLayerByNeighborOrder(
					level,
					level - 1,
					levels,
					entityLevels,
					query,
					true
				);
			}

			for (
				let level = maxLevel - 1;
				level >= 0;
				level--
			) {
				this.sortLayerByNeighborOrder(
					level,
					level + 1,
					levels,
					entityLevels,
					query,
					false
				);
			}
		}
	}

	private sortLayerByNeighborOrder(
		level: number,
		neighborLevel: number,
		levels: Map<number, IEntity[]>,
		entityLevels: ReadonlyMap<string, number>,
		query: GraphQuery,
		useParents: boolean
	): void {
		const entities =
			levels.get(level);

		const neighborEntities =
			levels.get(neighborLevel);

		if (
			!entities ||
			!neighborEntities ||
			entities.length <= 1
		) {
			return;
		}

		const neighborIndexes =
			new Map<string, number>();

		neighborEntities.forEach(
			(entity, index) => {
				neighborIndexes.set(
					entity.id,
					index
				);
			}
		);

		const originalIndexes =
			new Map<string, number>();

		entities.forEach(
			(entity, index) => {
				originalIndexes.set(
					entity.id,
					index
				);
			}
		);

		const barycenters =
			new Map<string, number>();

		for (const entity of entities) {
			const relations =
				useParents
					? query.findIncomingRelations(
						entity.id
					)
					: query.findOutgoingRelations(
						entity.id
					);

			const indexes: number[] = [];

			for (const relation of relations) {
				const neighborId =
					useParents
						? relation.from
						: relation.to;

				if (
					entityLevels.get(neighborId) !==
					neighborLevel
				) {
					continue;
				}

				const neighborIndex =
					neighborIndexes.get(neighborId);

				if (
					neighborIndex !== undefined
				) {
					indexes.push(neighborIndex);
				}
			}

			if (indexes.length === 0) {
				barycenters.set(
					entity.id,
					originalIndexes.get(
						entity.id
					) ?? 0
				);

				continue;
			}

			const total =
				indexes.reduce(
					(sum, index) =>
						sum + index,
					0
				);

			barycenters.set(
				entity.id,
				total / indexes.length
			);
		}

		entities.sort(
			(first, second) => {
				const firstBarycenter =
					barycenters.get(
						first.id
					) ?? 0;

				const secondBarycenter =
					barycenters.get(
						second.id
					) ?? 0;

				if (
					firstBarycenter !==
					secondBarycenter
				) {
					return (
						firstBarycenter -
						secondBarycenter
					);
				}

				return (
					(
						originalIndexes.get(
							first.id
						) ?? 0
					) -
					(
						originalIndexes.get(
							second.id
						) ?? 0
					)
				);
			}
		);
	}

	/**
	 * 根据优化后的层内顺序生成初始位置。
	 *
	 * 初始阶段只保证：
	 * - 同层节点不重叠；
	 * - 每层围绕 x = 0 展开；
	 * - 层间距一致。
	 */
	private createInitialPositions(
		levels: ReadonlyMap<number, IEntity[]>
	): Map<string, EntityPosition> {
		const positions =
			new Map<string, EntityPosition>();

		for (
			const [level, entities]
			of levels
		) {
			const totalWidth =
				entities.length *
				this.options.nodeWidth +
				Math.max(
					0,
					entities.length - 1
				) *
				this.options.horizontalGap;

			const startX =
				-totalWidth / 2;

			entities.forEach(
				(entity, index) => {
					positions.set(
						entity.id,
						{
							x:
								startX +
								index *
								(
									this.options.nodeWidth +
									this.options.horizontalGap
								),
							y:
								level *
								(
									this.options.nodeHeight +
									this.options.verticalGap
								),
							width:
								this.options.nodeWidth,
							height:
								this.options.nodeHeight
						}
					);
				}
			);
		}

		return positions;
	}

	/**
	 * 根据上下游节点重心反复调整横向坐标。
	 *
	 * 向下阶段：
	 * 子节点趋近父节点组的中心。
	 *
	 * 向上阶段：
	 * 父节点趋近子节点组的中心。
	 *
	 * 每次调整后重新施加同层最小间距，
	 * 因此不会依赖通用 GeometryOptimizer。
	 */
	private optimizeHorizontalPositions(
		levels: ReadonlyMap<number, IEntity[]>,
		entityLevels: ReadonlyMap<string, number>,
		maxLevel: number,
		query: GraphQuery,
		positions: Map<string, EntityPosition>
	): void {
		for (
			let pass = 0;
			pass < POSITIONING_PASSES;
			pass++
		) {
			for (
				let level = 1;
				level <= maxLevel;
				level++
			) {
				this.alignLayerToNeighbors(
					level,
					levels,
					entityLevels,
					query,
					positions,
					true
				);
			}

			for (
				let level = maxLevel - 1;
				level >= 0;
				level--
			) {
				this.alignLayerToNeighbors(
					level,
					levels,
					entityLevels,
					query,
					positions,
					false
				);
			}
		}

		this.centerWholeGraph(positions);
	}

	private alignLayerToNeighbors(
		level: number,
		levels: ReadonlyMap<number, IEntity[]>,
		entityLevels: ReadonlyMap<string, number>,
		query: GraphQuery,
		positions: Map<string, EntityPosition>,
		useParents: boolean
	): void {
		const entities =
			levels.get(level);

		if (
			!entities ||
			entities.length === 0
		) {
			return;
		}

		const desiredCenters =
			new Map<string, number>();

		for (const entity of entities) {
			const currentPosition =
				positions.get(entity.id);

			if (!currentPosition) {
				continue;
			}

			const relations =
				useParents
					? query.findIncomingRelations(
						entity.id
					)
					: query.findOutgoingRelations(
						entity.id
					);

			const neighborCenters: number[] = [];

			for (const relation of relations) {
				const neighborId =
					useParents
						? relation.from
						: relation.to;

				const neighborLevel =
					entityLevels.get(neighborId);

				if (neighborLevel === undefined) {
					continue;
				}

				if (
					useParents &&
					neighborLevel >= level
				) {
					continue;
				}

				if (
					!useParents &&
					neighborLevel <= level
				) {
					continue;
				}

				const neighborPosition =
					positions.get(neighborId);

				if (!neighborPosition) {
					continue;
				}

				neighborCenters.push(
					this.getCenterX(
						neighborPosition
					)
				);
			}

			if (
				neighborCenters.length === 0
			) {
				desiredCenters.set(
					entity.id,
					this.getCenterX(
						currentPosition
					)
				);

				continue;
			}

			const total =
				neighborCenters.reduce(
					(sum, center) =>
						sum + center,
					0
				);

			desiredCenters.set(
				entity.id,
				total /
				neighborCenters.length
			);
		}

		this.applyLayerCenters(
			entities,
			desiredCenters,
			positions
		);
	}

	/**
	 * 按当前层内顺序应用目标中心点，
	 * 并强制保持最低横向间距。
	 */
	private optimizeComponentHorizontalPositions(
		graph: IGraph,
		entityLevels: ReadonlyMap<string, number>,
		maxLevel: number,
		query: GraphQuery,
		positions: Map<string, EntityPosition>
	): void {
		const components =
			this.findWeakComponents(graph);

		if (components.length === 0) {
			return;
		}

		for (
			let pass = 0;
			pass < POSITIONING_PASSES;
			pass++
		) {
			for (
				let level = 1;
				level <= maxLevel;
				level++
			) {
				this.alignComponentLayerToNeighbors(
					components,
					level,
					entityLevels,
					query,
					positions,
					true
				);
			}

			for (
				let level = maxLevel - 1;
				level >= 0;
				level--
			) {
				this.alignComponentLayerToNeighbors(
					components,
					level,
					entityLevels,
					query,
					positions,
					false
				);
			}
		}
	}

	private alignComponentLayerToNeighbors(
		components: readonly string[][],
		level: number,
		entityLevels: ReadonlyMap<string, number>,
		query: GraphQuery,
		positions: Map<string, EntityPosition>,
		useParents: boolean
	): void {
		for (const component of components) {
			const componentIds =
				new Set(component);

			const entities =
				component
					.filter(
						(entityId) =>
							entityLevels.get(entityId) ===
							level
					)
					.map((entityId) =>
						query.findEntity(entityId)
					)
					.filter(
						(
							entity
						): entity is IEntity =>
							entity !== undefined
					)
					.sort((first, second) => {
						const firstPosition =
							positions.get(first.id);
						const secondPosition =
							positions.get(second.id);

						return (
							firstPosition
								? this.getCenterX(
									firstPosition
								)
								: 0
						) -
						(
							secondPosition
								? this.getCenterX(
									secondPosition
								)
								: 0
						);
					});

			if (entities.length === 0) {
				continue;
			}

			const desiredCenters =
				new Map<string, number>();

			for (const entity of entities) {
				const currentPosition =
					positions.get(entity.id);

				if (!currentPosition) {
					continue;
				}

				const relations =
					useParents
						? query.findIncomingRelations(
							entity.id
						)
						: query.findOutgoingRelations(
							entity.id
						);

				const neighborCenters: number[] = [];

				for (const relation of relations) {
					const neighborId =
						useParents
							? relation.from
							: relation.to;

					if (
						!componentIds.has(neighborId)
					) {
						continue;
					}

					const neighborLevel =
						entityLevels.get(neighborId);

					if (neighborLevel === undefined) {
						continue;
					}

					if (
						useParents &&
						neighborLevel >= level
					) {
						continue;
					}

					if (
						!useParents &&
						neighborLevel <= level
					) {
						continue;
					}

					const neighborPosition =
						positions.get(neighborId);

					if (!neighborPosition) {
						continue;
					}

					neighborCenters.push(
						this.getCenterX(
							neighborPosition
						)
					);
				}

				if (
					neighborCenters.length === 0
				) {
					desiredCenters.set(
						entity.id,
						this.getCenterX(
							currentPosition
						)
					);

					continue;
				}

				desiredCenters.set(
					entity.id,
					neighborCenters.reduce(
						(sum, center) =>
							sum + center,
						0
					) /
					neighborCenters.length
				);
			}

			this.applyLayerCenters(
				entities,
				desiredCenters,
				positions
			);
		}
	}

	private applyLayerCenters(
		entities: readonly IEntity[],
		desiredCenters:
			ReadonlyMap<string, number>,
		positions:
			Map<string, EntityPosition>
	): void {
		const minimumCenterGap =
			this.options.nodeWidth +
			this.options.horizontalGap;

		const actualCenters: number[] = [];

		for (
			let index = 0;
			index < entities.length;
			index++
		) {
			const entity =
				entities[index];

			if (!entity) {
				continue;
			}

			const desiredCenter =
				desiredCenters.get(entity.id);

			const position =
				positions.get(entity.id);

			if (
				desiredCenter === undefined ||
				!position
			) {
				continue;
			}

			if (actualCenters.length === 0) {
				actualCenters.push(
					desiredCenter
				);

				continue;
			}

			const previousCenter =
				actualCenters[
				actualCenters.length - 1
				];

			if (previousCenter === undefined) {
				actualCenters.push(
					desiredCenter
				);

				continue;
			}

			actualCenters.push(
				Math.max(
					desiredCenter,
					previousCenter +
					minimumCenterGap
				)
			);
		}

		if (actualCenters.length === 0) {
			return;
		}

		const desiredValues =
			entities
				.map(
					(entity) =>
						desiredCenters.get(
							entity.id
						)
				)
				.filter(
					(
						value
					): value is number =>
						value !== undefined
				);

		if (desiredValues.length === 0) {
			return;
		}

		const desiredAverage =
			desiredValues.reduce(
				(sum, value) =>
					sum + value,
				0
			) /
			desiredValues.length;

		const actualAverage =
			actualCenters.reduce(
				(sum, value) =>
					sum + value,
				0
			) /
			actualCenters.length;

		const layerOffset =
			desiredAverage -
			actualAverage;

		let centerIndex = 0;

		for (const entity of entities) {
			const position =
				positions.get(entity.id);

			const center =
				actualCenters[centerIndex];

			if (
				!position ||
				center === undefined
			) {
				continue;
			}

			positions.set(
				entity.id,
				{
					...position,
					x:
						center +
						layerOffset -
						position.width / 2
				}
			);

			centerIndex++;
		}
	}

	/**
	 * 为跨层边预留中间层通道。
	 *
	 * 这不是最终路由算法，只是用于快速验证“边通道占位”是否能
	 * 减少 A3 → C1 穿过 B2 这类视觉误读。
	 */


	private calculateChannelSafeCenters(
		entities: readonly IEntity[],
		positions: ReadonlyMap<string, EntityPosition>,
		intervals: ReadonlyArray<{ start: number; end: number }>,
		leftToRight: boolean
	): { centers: number[]; cost: number } {
		const minimumCenterGap =
			this.options.nodeWidth +
			this.options.horizontalGap;

		const desired = entities.map((entity) => {
			const position = positions.get(entity.id);
			return position ? this.getCenterX(position) : 0;
		});

		const centers = new Array<number>(entities.length);

		if (leftToRight) {
			let previous = Number.NEGATIVE_INFINITY;

			for (let index = 0; index < desired.length; index++) {
				let center = Math.max(
					desired[index] ?? 0,
					previous + minimumCenterGap
				);

				center = this.pushCenterOutsideIntervals(
					center,
					intervals,
					true
				);

				centers[index] = center;
				previous = center;
			}
		} else {
			let next = Number.POSITIVE_INFINITY;

			for (let index = desired.length - 1; index >= 0; index--) {
				let center = Math.min(
					desired[index] ?? 0,
					next - minimumCenterGap
				);

				center = this.pushCenterOutsideIntervals(
					center,
					intervals,
					false
				);

				centers[index] = center;
				next = center;
			}
		}

		const cost = centers.reduce(
			(total, center, index) =>
				total + Math.abs(center - (desired[index] ?? 0)),
			0
		);

		return { centers, cost };
	}

	private pushCenterOutsideIntervals(
		center: number,
		intervals: ReadonlyArray<{ start: number; end: number }>,
		moveRight: boolean
	): number {
		let result = center;

		for (const interval of intervals) {
			if (
				result >= interval.start &&
				result <= interval.end
			) {
				result = moveRight
					? interval.end
					: interval.start;
			}
		}

		return result;
	}

	private mergeIntervals(
		intervals: ReadonlyArray<{ start: number; end: number }>
	): Array<{ start: number; end: number }> {
		const sorted = [...intervals].sort(
			(first, second) => first.start - second.start
		);

		const merged: Array<{ start: number; end: number }> = [];

		for (const interval of sorted) {
			const last = merged[merged.length - 1];

			if (!last || interval.start > last.end) {
				merged.push({ ...interval });
				continue;
			}

			last.end = Math.max(last.end, interval.end);
		}

		return merged;
	}

	/**
	 * 最终只整体平移整张图。
	 *
	 * 这里不会改变任何节点之间的相对位置，
	 * 因此不属于二次排列。
	 */
	private centerWholeGraph(
		positions:
			Map<string, EntityPosition>
	): void {
		const values =
			Array.from(
				positions.values()
			);

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

		const graphCenter =
			(left + right) / 2;

		for (
			const [entityId, position]
			of positions
		) {
			positions.set(
				entityId,
				{
					...position,
					x:
						position.x -
						graphCenter
				}
			);
		}
	}

	private separateComponents(
		graph: IGraph,
		positions: Map<string, EntityPosition>
	): void {
		const components =
			this.findWeakComponents(graph);

		if (components.length <= 1) {
			return;
		}

		const componentInfos =
			components
				.map((entityIds) => ({
					entityIds,
					bounds:
						this.getComponentBounds(
							entityIds,
							positions
						)
				}))
				.filter(
					(
						info
					): info is {
						entityIds: string[];
						bounds: {
							left: number;
							right: number;
							width: number;
						};
					} =>
						info.bounds !== null
				)
				.sort((first, second) => {
					const firstMinId =
						[...first.entityIds].sort()[0] ??
						"";
					const secondMinId =
						[...second.entityIds].sort()[0] ??
						"";

					return firstMinId.localeCompare(
						secondMinId
					);
				});

		const componentGap =
			Math.max(
				this.options.horizontalGap * 2,
				this.options.nodeWidth
			);
		let currentLeft =
			-this.getTotalComponentWidth(
				componentInfos,
				componentGap
			) / 2;

		for (const component of componentInfos) {
			const offsetX =
				currentLeft -
				component.bounds.left;

			for (const entityId of component.entityIds) {
				const position =
					positions.get(entityId);

				if (!position) {
					continue;
				}

				positions.set(entityId, {
					...position,
					x:
						position.x +
						offsetX
				});
			}

			currentLeft +=
				component.bounds.width +
				componentGap;
		}
	}

	private findWeakComponents(
		graph: IGraph
	): string[][] {
		const adjacency =
			new Map<string, Set<string>>();

		for (const entityId of graph.entities.keys()) {
			adjacency.set(
				entityId,
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

		for (
			const entityId
			of Array.from(graph.entities.keys()).sort()
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
					).sort()
				) {
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

	private getComponentBounds(
		entityIds: readonly string[],
		positions: ReadonlyMap<
			string,
			EntityPosition
		>
	): {
		left: number;
		right: number;
		width: number;
	} | null {
		const componentPositions =
			entityIds
				.map((entityId) =>
					positions.get(entityId)
				)
				.filter(
					(
						position
					): position is EntityPosition =>
						position !== undefined
				);

		if (componentPositions.length === 0) {
			return null;
		}

		const left =
			Math.min(
				...componentPositions.map(
					(position) =>
						position.x
				)
			);
		const right =
			Math.max(
				...componentPositions.map(
					(position) =>
						position.x +
						position.width
				)
			);

		return {
			left,
			right,
			width: right - left
		};
	}

	private getTotalComponentWidth(
		components: ReadonlyArray<{
			bounds: { width: number };
		}>,
		componentGap: number
	): number {
		return (
			components.reduce(
				(sum, component) =>
					sum +
					component.bounds.width,
				0
			) +
			Math.max(
				0,
				components.length - 1
			) *
				componentGap
		);
	}

	private getCenterX(
		position: EntityPosition
	): number {
		return (
			position.x +
			position.width / 2
		);
	}
}
