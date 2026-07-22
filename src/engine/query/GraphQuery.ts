import type { IEntity } from "../entity/IEntity";
import type { IGraph } from "../graph/IGraph";
import type { IRelation } from "../relation/IRelation";
import type { IGraphQuery } from "./IGraphQuery";

export class GraphQuery implements IGraphQuery {
    constructor(private readonly graph: IGraph) { }

    findEntity(id: string): IEntity | undefined {
        return this.graph.getEntity(id);
    }

    findParents(entityId: string): IEntity[] {
        return this.findIncomingRelations(entityId)
            .map((relation) => this.graph.getEntity(relation.from))
            .filter((entity): entity is IEntity => entity !== undefined);
    }

    findChildren(entityId: string): IEntity[] {
        return this.findOutgoingRelations(entityId)
            .map((relation) => this.graph.getEntity(relation.to))
            .filter((entity): entity is IEntity => entity !== undefined);
    }

    findNeighbors(entityId: string): IEntity[] {
        const neighbors = new Map<string, IEntity>();

        for (const entity of this.findParents(entityId)) {
            neighbors.set(entity.id, entity);
        }

        for (const entity of this.findChildren(entityId)) {
            neighbors.set(entity.id, entity);
        }

        return Array.from(neighbors.values());
    }

    findIncomingRelations(entityId: string): IRelation[] {
        return Array.from(this.graph.relations.values()).filter(
            (relation) => relation.to === entityId
        );
    }

    findOutgoingRelations(entityId: string): IRelation[] {
        return Array.from(this.graph.relations.values()).filter(
            (relation) => relation.from === entityId
        );
    }

    findPath(fromId: string, toId: string): IEntity[] {
        if (!this.graph.getEntity(fromId) || !this.graph.getEntity(toId)) {
            return [];
        }

        const queue: string[][] = [[fromId]];
        const visited = new Set<string>([fromId]);

        while (queue.length > 0) {
            const currentPath = queue.shift();

            if (!currentPath) {
                continue;
            }

            const currentId = currentPath[currentPath.length - 1];
            if (currentId === undefined) {
                continue;
            }
            if (currentId === toId) {
                return currentPath
                    .map((id) => this.graph.getEntity(id))
                    .filter((entity): entity is IEntity => entity !== undefined);
            }

            for (const child of this.findChildren(currentId)) {
                if (visited.has(child.id)) {
                    continue;
                }

                visited.add(child.id);
                queue.push([...currentPath, child.id]);
            }
        }

        return [];
    }
}