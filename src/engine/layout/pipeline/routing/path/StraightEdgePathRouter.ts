import type { IGraph } from "../../../../graph/IGraph";
import type { EntityPosition } from "../../../EntityPosition";
import type { GraphSnapshot } from "../../../GraphSnapshot";
import type { EdgeRoute } from "../EdgeRoute";
import type { EdgePath } from "./EdgePath";
import type { IEdgePathRouter } from "./IEdgePathRouter";
import type { EdgePort } from "../EdgeRoute";
export class StraightEdgePathRouter
    implements IEdgePathRouter {

    route(
        graph: IGraph,
        snapshot: GraphSnapshot,
        routes: ReadonlyMap<string, EdgeRoute>
    ): Map<string, EdgePath> {



        const paths =
            new Map<string, EdgePath>();

        for (
            const relation
            of graph.relations.values()
        ) {
            const from =
                snapshot.positions.get(
                    relation.from
                );

            const to =
                snapshot.positions.get(
                    relation.to
                );

            if (!from || !to) {
                continue;
            }

            const route =
                routes.get(relation.id);

            if (!route) {
                continue;
            }

            paths.set(
                relation.id,
                {
                    relationId: relation.id,
                    points: [
                        this.getPortPoint(
                            from,
                            route.fromPort
                        ),
                        this.getPortPoint(
                            to,
                            route.toPort
                        )
                    ]
                }
            );
        }

        return paths;
    }

    private getPortPoint(
        position: EntityPosition,
        port: EdgePort
    ): {
        x: number;
        y: number;
    } {
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