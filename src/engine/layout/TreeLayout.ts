import type { IGraph } from "../graph/IGraph";
import { GraphQuery } from "../query/GraphQuery";
import type { EntityPosition } from "./EntityPosition";
import type { GraphSnapshot } from "./GraphSnapshot";
import type { ILayout } from "./ILayout";
import type { TreeLayoutOptions } from "./TreeLayoutOptions";

const DEFAULT_OPTIONS: TreeLayoutOptions = {
    nodeWidth: 240,
    nodeHeight: 100,
    horizontalGap: 120,
    verticalGap: 100,
    treeGap: 240
};

interface TreeNode {
    id: string;
    children: TreeNode[];
}

interface TreeBlock {
    positions: Map<string, EntityPosition>;

    /**
     * Total occupied width of this subtree.
     */
    width: number;

    /**
     * Horizontal center of the root node,
     * relative to the left edge of this block.
     */
    rootCenterX: number;
}

export class TreeLayout implements ILayout {
    private readonly options: TreeLayoutOptions;

    constructor(
        options: Partial<TreeLayoutOptions> = {}
    ) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options
        };
    }

    generate(graph: IGraph): GraphSnapshot {
        const query =
            new GraphQuery(graph);

        const roots =
            this.buildForest(
                graph,
                query
            );

        const positions =
            new Map<string, EntityPosition>();

        const treeBlocks =
            roots.map(root =>
                this.createTreeBlock(root)
            );

        const forestWidth =
            this.calculateForestWidth(
                treeBlocks
            );

        let currentX =
            -forestWidth / 2;

        for (const block of treeBlocks) {
            this.copyBlockPositions(
                block,
                currentX,
                0,
                positions
            );

            currentX +=
                block.width +
                this.options.treeGap;
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

    private buildForest(
        graph: IGraph,
        query: GraphQuery
    ): TreeNode[] {
        const primaryParent =
            new Map<string, string>();

        const childrenByParent =
            new Map<string, string[]>();

        /*
         * TreeLayout uses one primary parent for structural
         * placement. Additional incoming relations remain
         * in the graph and are handled by the routing system.
         */
        for (
            const entity
            of graph.entities.values()
        ) {
            const incomingRelations =
                query.findIncomingRelations(
                    entity.id
                );

            const parentRelation =
                incomingRelations.find(
                    relation =>
                        relation.from !==
                        entity.id &&
                        graph.getEntity(
                            relation.from
                        ) !== undefined
                );

            if (!parentRelation) {
                continue;
            }

            primaryParent.set(
                entity.id,
                parentRelation.from
            );

            const children =
                childrenByParent.get(
                    parentRelation.from
                ) ?? [];

            children.push(entity.id);

            childrenByParent.set(
                parentRelation.from,
                children
            );
        }

        const visited =
            new Set<string>();

        const roots: TreeNode[] = [];

        /*
         * First build trees from natural roots.
         */
        for (
            const entity
            of graph.entities.values()
        ) {
            if (
                primaryParent.has(
                    entity.id
                )
            ) {
                continue;
            }

            const root =
                this.buildTreeNode(
                    entity.id,
                    childrenByParent,
                    visited,
                    new Set<string>()
                );

            if (root) {
                roots.push(root);
            }
        }

        /*
         * Cyclic structures may not contain a natural root.
         * Any entity not reached above becomes the root of
         * an additional tree so that no entity is omitted.
         */
        for (
            const entity
            of graph.entities.values()
        ) {
            if (
                visited.has(entity.id)
            ) {
                continue;
            }

            const root =
                this.buildTreeNode(
                    entity.id,
                    childrenByParent,
                    visited,
                    new Set<string>()
                );

            if (root) {
                roots.push(root);
            }
        }

        return roots;
    }

    private buildTreeNode(
        entityId: string,
        childrenByParent:
            ReadonlyMap<string, string[]>,
        visited: Set<string>,
        activePath: Set<string>
    ): TreeNode | null {
        if (visited.has(entityId)) {
            return null;
        }

        if (activePath.has(entityId)) {
            return null;
        }

        visited.add(entityId);
        activePath.add(entityId);

        const node: TreeNode = {
            id: entityId,
            children: []
        };

        const childIds =
            childrenByParent.get(entityId) ??
            [];

        for (const childId of childIds) {
            if (
                activePath.has(childId)
            ) {
                continue;
            }

            const childNode =
                this.buildTreeNode(
                    childId,
                    childrenByParent,
                    visited,
                    activePath
                );

            if (childNode) {
                node.children.push(
                    childNode
                );
            }
        }

        activePath.delete(entityId);

        return node;
    }

    /**
     * Recursively creates a compact relative-position block
     * for one complete subtree.
     */
    private createTreeBlock(
        node: TreeNode
    ): TreeBlock {
        if (node.children.length === 0) {
            return this.createLeafBlock(
                node
            );
        }

        const childBlocks =
            node.children.map(child =>
                this.createTreeBlock(child)
            );

        return this.createParentBlock(
            node,
            childBlocks
        );
    }

    private createLeafBlock(
        node: TreeNode
    ): TreeBlock {
        const positions =
            new Map<string, EntityPosition>();

        positions.set(node.id, {
            x: 0,
            y: 0,
            width:
                this.options.nodeWidth,
            height:
                this.options.nodeHeight
        });

        return {
            positions,
            width:
                this.options.nodeWidth,
            rootCenterX:
                this.options.nodeWidth / 2
        };
    }

    private createParentBlock(
        node: TreeNode,
        childBlocks: readonly TreeBlock[]
    ): TreeBlock {
        const childOffsets =
            this.calculateChildOffsets(
                childBlocks
            );

        const firstChildBlock =
            childBlocks[0];

        const firstChildOffset =
            childOffsets[0];

        const lastIndex =
            childBlocks.length - 1;

        const lastChildBlock =
            childBlocks[lastIndex];

        const lastChildOffset =
            childOffsets[lastIndex];

        if (
            !firstChildBlock ||
            firstChildOffset === undefined ||
            !lastChildBlock ||
            lastChildOffset === undefined
        ) {
            throw new Error(
                "TreeLayout: parent node has no valid child blocks."
            );
        }

        const firstChildCenter =
            firstChildOffset +
            firstChildBlock.rootCenterX;

        const lastChildCenter =
            lastChildOffset +
            lastChildBlock.rootCenterX;

        /*
         * The parent is centered between the first and last
         * direct child roots, rather than centered in the
         * total bounding width of all descendant subtrees.
         */
        const parentCenterX =
            childBlocks.length === 1
                ? firstChildCenter
                : (
                    firstChildCenter +
                    lastChildCenter
                ) / 2;

        const childrenWidth =
            this.calculateBlocksWidth(
                childBlocks
            );

        const parentLeft =
            parentCenterX -
            this.options.nodeWidth / 2;

        const parentRight =
            parentCenterX +
            this.options.nodeWidth / 2;

        /*
         * The block may need to expand left or right when
         * the parent is wider than its children.
         */
        const minimumX =
            Math.min(
                0,
                parentLeft
            );

        const maximumX =
            Math.max(
                childrenWidth,
                parentRight
            );

        const normalizationOffset =
            -minimumX;

        const positions =
            new Map<string, EntityPosition>();

        positions.set(node.id, {
            x:
                parentLeft +
                normalizationOffset,
            y: 0,
            width:
                this.options.nodeWidth,
            height:
                this.options.nodeHeight
        });

        const childY =
            this.options.nodeHeight +
            this.options.verticalGap;

        for (
            let index = 0;
            index < childBlocks.length;
            index++
        ) {
            const childBlock =
                childBlocks[index];

            const childOffset =
                childOffsets[index];

            if (
                !childBlock ||
                childOffset === undefined
            ) {
                continue;
            }

            const childX =
                childOffset +
                normalizationOffset;

            this.copyBlockPositions(
                childBlock,
                childX,
                childY,
                positions
            );
        }

        return {
            positions,
            width:
                maximumX -
                minimumX,
            rootCenterX:
                parentCenterX +
                normalizationOffset
        };
    }

    private calculateChildOffsets(
        childBlocks:
            readonly TreeBlock[]
    ): number[] {
        const offsets: number[] = [];

        let currentX = 0;

        for (const child of childBlocks) {
            offsets.push(currentX);

            currentX +=
                child.width +
                this.options.horizontalGap;
        }

        return offsets;
    }

    private calculateBlocksWidth(
        blocks: readonly TreeBlock[]
    ): number {
        if (blocks.length === 0) {
            return 0;
        }

        let width = 0;

        for (const block of blocks) {
            width += block.width;
        }

        width +=
            Math.max(
                0,
                blocks.length - 1
            ) *
            this.options.horizontalGap;

        return width;
    }

    private calculateForestWidth(
        blocks: readonly TreeBlock[]
    ): number {
        if (blocks.length === 0) {
            return 0;
        }

        let width = 0;

        for (const block of blocks) {
            width += block.width;
        }

        width +=
            Math.max(
                0,
                blocks.length - 1
            ) *
            this.options.treeGap;

        return width;
    }

    private copyBlockPositions(
        block: TreeBlock,
        offsetX: number,
        offsetY: number,
        target:
            Map<string, EntityPosition>
    ): void {
        for (
            const [entityId, position]
            of block.positions
        ) {
            target.set(entityId, {
                x:
                    position.x +
                    offsetX,
                y:
                    position.y +
                    offsetY,
                width:
                    position.width,
                height:
                    position.height
            });
        }
    }
}