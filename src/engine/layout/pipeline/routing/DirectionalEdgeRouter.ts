import type { IGraph } from "../../../graph/IGraph";
import type { EntityPosition } from "../../EntityPosition";
import type { GraphSnapshot } from "../../GraphSnapshot";
import type { IRelation } from "../../../relation/IRelation";
import type { EdgeRoute } from "./EdgeRoute";
import type { EdgePorts } from "./port/EdgePorts";
import type { IEdgeRouter } from "./IEdgeRouter";
import { EdgePortSelector } from "./port/EdgePortSelector";
import { EdgeOrientation } from "./semantic/EdgeOrientation";
import { SemanticEdgeRouter } from "./semantic/SemanticEdgeRouter";

type HorizontalEdgePorts = {
	fromPort: "left" | "right";
	toPort: "left" | "right";
};

export class DirectionalEdgeRouter
    implements IEdgeRouter {
    private readonly semanticRouter =
        new SemanticEdgeRouter();

    private readonly portSelector =
        new EdgePortSelector();
    route(
        graph: IGraph,
        snapshot: GraphSnapshot
    ): Map<string, EdgeRoute> {
        const routes =
            new Map<string, EdgeRoute>();

        for (const relation of graph.relations.values()) {
            const fromPosition =
                snapshot.positions.get(relation.from);

            const toPosition =
                snapshot.positions.get(relation.to);

            if (!fromPosition || !toPosition) {
                continue;
            }

            if (this.isBidirectional(relation)) {
                routes.set(
                    relation.id,
                    {
                        relationId: relation.id,
                        ...this.selectBidirectionalPorts(
                            fromPosition,
                            toPosition
                        )
                    }
                );
                continue;
            }

            const semanticRoutes =
                this.semanticRouter.route(
                    graph,
                    snapshot
                );

            const semanticRoute =
                semanticRoutes.get(
                    relation.id
                );

            const ports =
                this.portSelector.select(
                    semanticRoute?.orientation ??
                    EdgeOrientation.Vertical,
                    fromPosition,
                    toPosition
                );

            routes.set(
                relation.id,
                {
                    relationId: relation.id,
                    fromPort: ports.fromPort,
                    toPort: ports.toPort
                }
            );
        }

        return routes;
    }

    
    private isBidirectional(
        relation: IRelation
    ): boolean {
        return (
            relation.properties.bidirectional ===
                true ||
            relation.type === "bidirectional"
        );
    }

    private selectBidirectionalPorts(
        from: EntityPosition,
        to: EntityPosition
    ): EdgePorts {
        const candidates:
            readonly HorizontalEdgePorts[] = [
                {
                    fromPort: "left",
                    toPort: "left"
                },
                {
                    fromPort: "left",
                    toPort: "right"
                },
                {
                    fromPort: "right",
                    toPort: "left"
                },
                {
                    fromPort: "right",
                    toPort: "right"
                }
            ];

        return candidates
            .map((ports) => ({
                ports,
                score:
                    this.scoreBidirectionalPorts(
                        ports,
                        from,
                        to
                    )
            }))
            .sort(
                (first, second) =>
                    first.score - second.score
            )[0]?.ports ??
            this.portSelector.select(
                EdgeOrientation.Horizontal,
                from,
                to
            );
    }

    private scoreBidirectionalPorts(
        ports: HorizontalEdgePorts,
        from: EntityPosition,
        to: EntityPosition
    ): number {
        const fromPoint =
            this.getHorizontalPortPoint(
                from,
                ports.fromPort
            );
        const toPoint =
            this.getHorizontalPortPoint(
                to,
                ports.toPort
            );
        const distance =
            Math.abs(fromPoint.x - toPoint.x) +
            Math.abs(fromPoint.y - toPoint.y);
        const crossesBetweenNodes =
            this.isBetweenHorizontalCenters(
                fromPoint.x,
                this.getCenterX(from),
                this.getCenterX(to)
            ) ||
            this.isBetweenHorizontalCenters(
                toPoint.x,
                this.getCenterX(from),
                this.getCenterX(to)
            );
        const sameSidePenalty =
            ports.fromPort === ports.toPort
                ? 80
                : 0;

        return (
            distance +
            (crossesBetweenNodes ? 220 : 0) +
            sameSidePenalty
        );
    }

    private getHorizontalPortPoint(
        position: EntityPosition,
        port: "left" | "right"
    ): { x: number; y: number } {
        return {
            x:
                port === "left"
                    ? position.x
                    : position.x +
                        position.width,
            y:
                position.y +
                position.height / 2
        };
    }

    private isBetweenHorizontalCenters(
        x: number,
        firstCenterX: number,
        secondCenterX: number
    ): boolean {
        return (
            x > Math.min(firstCenterX, secondCenterX) &&
            x < Math.max(firstCenterX, secondCenterX)
        );
    }

    private getCenterX(
        position: EntityPosition
    ): number {
        return position.x + position.width / 2;
    }
}
