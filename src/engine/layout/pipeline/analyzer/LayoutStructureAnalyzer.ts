import type { IGraph } from "../../../graph/IGraph";
import { GraphQuery } from "../../../query/GraphQuery";
import type { LayoutStructureInfo } from "./LayoutStructureInfo";
import { EdgePriority }
    from "./EdgePriority";

export class LayoutStructureAnalyzer {


    analyze(
        graph: IGraph
    ): LayoutStructureInfo {


        const query =
            new GraphQuery(graph);


        const nodeImportance =
            new Map<string, number>();


        const edgeImportance =
            new Map<string, number>();
        const edgePriority =
            new Map<string, EdgePriority>();

        const convergenceNodes =
            new Set<string>();


        for (
            const entity
            of graph.entities.values()
        ) {


            const incoming =
                query.findIncomingRelations(
                    entity.id
                );


            const outgoing =
                query.findOutgoingRelations(
                    entity.id
                );



            /*
             * 基础重要度：
             *
             * 入度 + 出度
             *
             * 后续会加入语义权重。
             */
            const importance =
                incoming.length +
                outgoing.length;


            nodeImportance.set(
                entity.id,
                importance
            );



            if (
                incoming.length > 1
            ) {
                convergenceNodes.add(
                    entity.id
                );
            }
        }



        for (
            const relation
            of graph.relations.values()
        ) {


            const fromImportance =
                nodeImportance.get(
                    relation.from
                ) ?? 0;


            const toImportance =
                nodeImportance.get(
                    relation.to
                ) ?? 0;



            const importance =
                fromImportance +
                toImportance +
                1;


            edgeImportance.set(
                relation.id,
                importance
            );


            let priority =
                EdgePriority.Normal;



            const fromOutgoing =
                query.findOutgoingRelations(
                    relation.from
                ).length;


            const toIncoming =
                query.findIncomingRelations(
                    relation.to
                ).length;



            /*
             * 当前规则：
             *
             * 单一路径关系优先级更高。
             *
             * 后续会被 mainChain 分析覆盖。
             */
            if (
                fromOutgoing === 1 &&
                toIncoming === 1
            ) {
                priority =
                    EdgePriority.Important;
            }



            edgePriority.set(
                relation.id,
                priority
            );
        }



        return {

            nodeImportance,

            edgeImportance,

            edgePriority,

            mainChains:
                this.findMainChains(
                    graph,
                    edgePriority
                ),

            convergenceNodes

        };
    }
    private findMainChains(
        graph: IGraph,
        edgePriority: Map<string, EdgePriority>
    ): string[][] {


        const query =
            new GraphQuery(graph);


        const chains: string[][] = [];


        const roots =
            Array.from(
                graph.entities.values()
            )
                .filter(entity =>
                    query.findIncomingRelations(
                        entity.id
                    ).length === 0
                );



		for (const root of roots) {

			const chain =
				this.buildChain(
					root.id,
					query,
					edgePriority,
					new Set<string>()
				);


            if (chain.length > 1) {
                chains.push(chain);
            }
        }


        return chains;
    }
	private buildChain(
		entityId: string,
		query: GraphQuery,
		edgePriority: Map<string, EdgePriority>,
		visited: Set<string>
	): string[] {
		if (visited.has(entityId)) {
			return [];
		}

		visited.add(entityId);


		const chain = [
            entityId
        ];


        const outgoing =
            query.findOutgoingRelations(
                entityId
            );


        if (outgoing.length === 0) {
            return chain;
        }



        const firstRelation =
            outgoing[0];

        if (!firstRelation) {
            return chain;
        }


        let bestRelation =
            firstRelation;


        let bestScore =
            edgePriority.get(
                bestRelation.id
            ) ?? EdgePriority.Normal;



        for (const relation of outgoing) {

            const score =
                edgePriority.get(
                    relation.id
                ) ?? EdgePriority.Normal;


            if (score > bestScore) {

                bestScore = score;

                bestRelation = relation;
            }
        }



		return [
			...chain,
			...this.buildChain(
				bestRelation.to,
				query,
				edgePriority,
				visited
			)
		];
	}
}
