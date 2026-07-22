import type { IEntity } from "../entity/IEntity";
import { GraphEventDispatcher } from "../events/GraphEventDispatcher";
import type { IGraphListener } from "../events/IGraphListener";
import type { IRelation } from "../relation/IRelation";
import type { IGraph } from "./IGraph";

export class Graph implements IGraph {
	private readonly entityMap = new Map<string, IEntity>();
	private readonly relationMap = new Map<string, IRelation>();
	private readonly eventDispatcher = new GraphEventDispatcher();

	get entities(): ReadonlyMap<string, IEntity> {
		return this.entityMap;
	}

	get relations(): ReadonlyMap<string, IRelation> {
		return this.relationMap;
	}

	getEntity(id: string): IEntity | undefined {
		return this.entityMap.get(id);
	}

	getRelation(id: string): IRelation | undefined {
		return this.relationMap.get(id);
	}

	addListener(listener: IGraphListener): void {
		this.eventDispatcher.addListener(listener);
	}

	removeListener(listener: IGraphListener): void {
		this.eventDispatcher.removeListener(listener);
	}

	addEntity(entity: IEntity): void {
		if (this.entityMap.has(entity.id)) {
			throw new Error(`Entity already exists: ${entity.id}`);
		}

		this.entityMap.set(entity.id, entity);

		this.eventDispatcher.dispatch({
			type: "entity-added",
			entity
		});
	}

	updateEntity(entity: IEntity): void {
		if (!this.entityMap.has(entity.id)) {
			throw new Error(`Entity does not exist: ${entity.id}`);
		}

		this.entityMap.set(entity.id, entity);

		this.eventDispatcher.dispatch({
			type: "entity-updated",
			entity
		});
	}

	removeEntity(id: string): void {
		if (!this.entityMap.has(id)) {
			return;
		}

		const relatedRelationIds: string[] = [];

		for (const [relationId, relation] of this.relationMap) {
			if (relation.from === id || relation.to === id) {
				relatedRelationIds.push(relationId);
			}
		}

		for (const relationId of relatedRelationIds) {
			this.removeRelation(relationId);
		}

		this.entityMap.delete(id);

		this.eventDispatcher.dispatch({
			type: "entity-removed",
			entityId: id
		});
	}

	addRelation(relation: IRelation): void {
		if (this.relationMap.has(relation.id)) {
			throw new Error(`Relation already exists: ${relation.id}`);
		}

		this.validateRelation(relation);

		if (this.hasDuplicateRelation(relation)) {
			throw new Error(
				`Duplicate relation: ${relation.from} -> ${relation.to} (${relation.type})`
			);
		}

		this.relationMap.set(relation.id, relation);

		this.eventDispatcher.dispatch({
			type: "relation-added",
			relation
		});
	}

	updateRelation(relation: IRelation): void {
		if (!this.relationMap.has(relation.id)) {
			throw new Error(`Relation does not exist: ${relation.id}`);
		}

		this.validateRelation(relation);

		if (this.hasDuplicateRelation(relation, relation.id)) {
			throw new Error(
				`Duplicate relation: ${relation.from} -> ${relation.to} (${relation.type})`
			);
		}

		this.relationMap.set(relation.id, relation);

		this.eventDispatcher.dispatch({
			type: "relation-updated",
			relation
		});
	}

	removeRelation(id: string): void {
		if (!this.relationMap.has(id)) {
			return;
		}

		this.relationMap.delete(id);

		this.eventDispatcher.dispatch({
			type: "relation-removed",
			relationId: id
		});
	}

	private validateRelation(relation: IRelation): void {
		if (!this.entityMap.has(relation.from)) {
			throw new Error(`Source entity does not exist: ${relation.from}`);
		}

		if (!this.entityMap.has(relation.to)) {
			throw new Error(`Target entity does not exist: ${relation.to}`);
		}

		if (relation.from === relation.to) {
			throw new Error("Self-relations are not allowed.");
		}
	}

	private hasDuplicateRelation(
		relation: IRelation,
		excludedRelationId?: string
	): boolean {
		for (const existingRelation of this.relationMap.values()) {
			if (existingRelation.id === excludedRelationId) {
				continue;
			}

			if (
				existingRelation.from === relation.from &&
				existingRelation.to === relation.to &&
				existingRelation.type === relation.type
			) {
				return true;
			}
		}

		return false;
	}
}