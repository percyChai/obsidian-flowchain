import type { IGraph } from "../../../graph/IGraph";
import type { GraphSnapshot } from "../../GraphSnapshot";
import type { EntityPosition } from "../../EntityPosition";
import type { ILayoutOptimizer } from "../ILayoutOptimizer";
import type { LayoutOptimizationContext } from "../LayoutOptimizationContext";
import { GraphQuery } from "../../../query/GraphQuery";


const MAX_SWEEP_ITERATIONS = 4;
export class LayerOrderingOptimizer
    implements ILayoutOptimizer {


    readonly name =
        "LayerOrderingOptimizer";


    optimize(
        graph: IGraph,
        snapshot: GraphSnapshot,
        context: LayoutOptimizationContext
    ): GraphSnapshot {

        void graph;

        const positions =
            new Map<string, EntityPosition>(
                snapshot.positions
            );


        const layers =
            this.collectLayers(
                positions
            );
        const query =
            new GraphQuery(graph);

        for (
            let iteration = 0;
            iteration < MAX_SWEEP_ITERATIONS;
            iteration++
        ) {


            for (
                let index = 1;
                index < layers.length;
                index++
            ) {

                const layer =
                    layers[index];


                if (!layer) {
                    continue;
                }


                this.optimizeLayer(
                    layer,
                    query,
                    positions
                );
            }



            for (
                let index =
                    layers.length - 2;
                index >= 0;
                index--
            ) {

                const layer =
                    layers[index];


                if (!layer) {
                    continue;
                }


                this.optimizeLayer(
                    layer,
                    query,
                    positions
                );
            }

        }


        return {
            ...snapshot,
            positions
        };
    }



    private collectLayers(
        positions:
            Map<string, EntityPosition>
    ): string[][] {


        const layers:
            Map<number, string[]> =
            new Map();


        for (
            const [
                entityId,
                position
            ]
            of positions
        ) {

            const level =
                Math.round(
                    position.y
                );


            const layer =
                layers.get(level) ?? [];


            layer.push(entityId);


            layers.set(
                level,
                layer
            );
        }


        return Array.from(
            layers.values()
        );
    }



    private optimizeLayer(
        layer: string[],
        query: GraphQuery,
        positions: Map<string, EntityPosition>
    ): void {



        layer.sort(
            (a, b) => {

                const aCenter =
                    this.calculateBarycenter(
                        a,
                        query,
                        positions
                    );


                const bCenter =
                    this.calculateBarycenter(
                        b,
                        query,
                        positions
                    );


                return aCenter - bCenter;
            }
        );


        layer.forEach(
            (entityId, index) => {

                const position =
                    positions.get(
                        entityId
                    );


                if (!position) {
                    return;
                }


                positions.set(
                    entityId,
                    {
                        ...position,
                        x:
                            index *
                            (
                                position.width +
                                120
                            )
                    }
                );
            }
        );
    }
    private calculateBarycenter(
        entityId: string,
        query: GraphQuery,
        positions:
            Map<string, EntityPosition>
    ): number {


        const related = [
            ...query.findIncomingRelations(entityId),
            ...query.findOutgoingRelations(entityId)
        ];


        if (related.length === 0) {

            return (
                positions.get(entityId)?.x ?? 0
            );
        }


        let total = 0;
        let count = 0;


        for (const relation of related) {


            const otherId =
                relation.from === entityId
                    ? relation.to
                    : relation.from;


            const position =
                positions.get(otherId);


            if (!position) {
                continue;
            }


            total +=
                position.x +
                position.width / 2;


            count++;
        }


        if (count === 0) {
            return 0;
        }


        return total / count;
    }
    private countCrossings(
        layers: string[][],
        graph: IGraph
    ): number {


        let crossings = 0;


        for (
            let index = 0;
            index < layers.length - 1;
            index++
        ) {


            const upper =
                layers[index];


            const lower =
                layers[index + 1];


            if (!upper || !lower) {
                continue;
            }


            const upperIndex =
                new Map(
                    upper.map(
                        (id, i) =>
                            [id, i]
                    )
                );


            const lowerIndex =
                new Map(
                    lower.map(
                        (id, i) =>
                            [id, i]
                    )
                );



            const edges = [];


            for (
                const relation
                of graph.relations.values()
            ) {


                const from =
                    upperIndex.get(
                        relation.from
                    );


                const to =
                    lowerIndex.get(
                        relation.to
                    );


                if (
                    from !== undefined &&
                    to !== undefined
                ) {

                    edges.push({
                        from,
                        to
                    });

                }

            }



            for (
                let a = 0;
                a < edges.length;
                a++
            ) {

                for (
                    let b = a + 1;
                    b < edges.length;
                    b++
                ) {


                    const first =
                        edges[a];


                    const second =
                        edges[b];


                    if (
                        first &&
                        second &&
                        (
                            first.from -
                            second.from
                        )
                        *
                        (
                            first.to -
                            second.to
                        )
                        < 0
                    ) {

                        crossings++;

                    }

                }

            }

        }


        return crossings;
    }
}