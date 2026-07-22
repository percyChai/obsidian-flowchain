import type { IGraph } from "../../../../graph/IGraph";
import { GeometryIntersection } from "../../../geometry/GeometryIntersection";
import type { EntityPosition } from "../../../EntityPosition";
import type { GraphSnapshot } from "../../../GraphSnapshot";
import type { EdgePort, EdgeRoute } from "../EdgeRoute";
import type { EdgePath } from "./EdgePath";
import type { EdgePathPoint } from "./EdgePathPoint";
import type { IEdgePathRouter } from "./IEdgePathRouter";

const ROUTE_MARGIN = 80;

export class ObstacleAvoidingEdgePathRouter
	implements IEdgePathRouter {

	route(
		graph: IGraph,
		snapshot: GraphSnapshot,
		routes: ReadonlyMap<string, EdgeRoute>
	): Map<string, EdgePath> {
		const paths =
			new Map<string, EdgePath>();

		for (const relation of graph.relations.values()) {
			const from =
				snapshot.positions.get(relation.from);

			const to =
				snapshot.positions.get(relation.to);

			const route =
				routes.get(relation.id);

			if (!from || !to || !route) {
				continue;
			}

			const start =
				this.getPortPoint(
					from,
					route.fromPort
				);

			const end =
				this.getPortPoint(
					to,
					route.toPort
				);

			const candidates =
				this.createCandidates(
					start,
					end,
					snapshot
				);

			const validCandidates =
				candidates.filter((candidate) =>
					!this.intersectsUnrelatedNode(
						candidate,
						relation.from,
						relation.to,
						snapshot
					)
				);

			const selectedPath =
				this.selectShortestPath(
					validCandidates.length > 0
						? validCandidates
						: candidates
				);

			paths.set(
				relation.id,
				{
					relationId: relation.id,
					points: selectedPath
				}
			);
		}

		return paths;
	}

	private createCandidates(
		start: EdgePathPoint,
		end: EdgePathPoint,
		snapshot: GraphSnapshot
	): EdgePathPoint[][] {
		const middleX =
			(start.x + end.x) / 2;

		const middleY =
			(start.y + end.y) / 2;

		const bounds =
			this.getGraphBounds(snapshot);

		return [
			[
				start,
				end
			],
			[
				start,
				{
					x: start.x,
					y: middleY
				},
				{
					x: end.x,
					y: middleY
				},
				end
			],
			[
				start,
				{
					x: middleX,
					y: start.y
				},
				{
					x: middleX,
					y: end.y
				},
				end
			],
			[
				start,
				{
					x:
						bounds.left -
						ROUTE_MARGIN,
					y: start.y
				},
				{
					x:
						bounds.left -
						ROUTE_MARGIN,
					y: end.y
				},
				end
			],
			[
				start,
				{
					x:
						bounds.right +
						ROUTE_MARGIN,
					y: start.y
				},
				{
					x:
						bounds.right +
						ROUTE_MARGIN,
					y: end.y
				},
				end
			],
			[
				start,
				{
					x: start.x,
					y:
						bounds.top -
						ROUTE_MARGIN
				},
				{
					x: end.x,
					y:
						bounds.top -
						ROUTE_MARGIN
				},
				end
			],
			[
				start,
				{
					x: start.x,
					y:
						bounds.bottom +
						ROUTE_MARGIN
				},
				{
					x: end.x,
					y:
						bounds.bottom +
						ROUTE_MARGIN
				},
				end
			]
		];
	}

	private intersectsUnrelatedNode(
		points: readonly EdgePathPoint[],
		fromEntityId: string,
		toEntityId: string,
		snapshot: GraphSnapshot
	): boolean {
		for (
			const [entityId, position]
			of snapshot.positions
		) {
			if (
				entityId === fromEntityId ||
				entityId === toEntityId
			) {
				continue;
			}

			if (
				GeometryIntersection
					.pathIntersectsRectangle(
						points,
						position
					)
			) {
				return true;
			}
		}

		return false;
	}

	private selectShortestPath(
		candidates: readonly EdgePathPoint[][]
	): EdgePathPoint[] {
		const firstCandidate =
			candidates[0];

		if (!firstCandidate) {
			return [];
		}

		let shortestPath =
			firstCandidate;

		let shortestLength =
			this.getPathLength(firstCandidate);

		for (const candidate of candidates.slice(1)) {
			const candidateLength =
				this.getPathLength(candidate);

			if (candidateLength >= shortestLength) {
				continue;
			}

			shortestPath =
				candidate;

			shortestLength =
				candidateLength;
		}

		return shortestPath;
	}

	private getPathLength(
		points: readonly EdgePathPoint[]
	): number {
		let totalLength = 0;

		for (
			let index = 0;
			index < points.length - 1;
			index++
		) {
			const start =
				points[index];

			const end =
				points[index + 1];

			if (!start || !end) {
				continue;
			}

			totalLength +=
				Math.abs(end.x - start.x) +
				Math.abs(end.y - start.y);
		}

		return totalLength;
	}

	private getGraphBounds(
		snapshot: GraphSnapshot
	): {
		left: number;
		right: number;
		top: number;
		bottom: number;
	} {
		const positions =
			Array.from(
				snapshot.positions.values()
			);

		if (positions.length === 0) {
			return {
				left: 0,
				right: 0,
				top: 0,
				bottom: 0
			};
		}

		return {
			left: Math.min(
				...positions.map(
					(position) =>
						position.x
				)
			),
			right: Math.max(
				...positions.map(
					(position) =>
						position.x +
						position.width
				)
			),
			top: Math.min(
				...positions.map(
					(position) =>
						position.y
				)
			),
			bottom: Math.max(
				...positions.map(
					(position) =>
						position.y +
						position.height
				)
			)
		};
	}

	private getPortPoint(
		position: EntityPosition,
		port: EdgePort
	): EdgePathPoint {
		switch (port) {
			case "top":
				return {
					x:
						position.x +
						position.width / 2,
					y: position.y
				};

			case "right":
				return {
					x:
						position.x +
						position.width,
					y:
						position.y +
						position.height / 2
				};

			case "bottom":
				return {
					x:
						position.x +
						position.width / 2,
					y:
						position.y +
						position.height
				};

			case "left":
				return {
					x: position.x,
					y:
						position.y +
						position.height / 2
				};
		}
	}
}