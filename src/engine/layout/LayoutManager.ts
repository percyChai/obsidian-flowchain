import type { IGraph } from "../graph/IGraph";
import { CircularLayout } from "./CircularLayout";
import { ForceLayout } from "./ForceLayout";
import type { GraphSnapshot } from "./GraphSnapshot";
import { HierarchyClearPathLayout } from "./HierarchyClearPathLayout";
import { HierarchyLayout } from "./HierarchyLayout";
import type { ILayout } from "./ILayout";
import {
	LayoutType,
	type LayoutType as LayoutTypeValue
} from "./LayoutType";
import { RadialLayout } from "./RadialLayout";
import { TreeLayout } from "./TreeLayout";
import { EdgeNodeIntersectionValidator } from "./pipeline/EdgeNodeIntersectionValidator";
import { LayoutCandidateGenerator } from "./pipeline/LayoutCandidateGenerator";
import { LayoutCandidateSelector } from "./pipeline/LayoutCandidateSelector";
import { LayoutPipeline } from "./pipeline/LayoutPipeline";
import type { LayoutRecommendation } from "./pipeline/LayoutRecommendation";
import { NodeOverlapValidator } from "./pipeline/NodeOverlapValidator";
import { LayoutStructureAnalyzer } from "./pipeline/analyzer/LayoutStructureAnalyzer";
import { AlignmentOptimizer } from "./pipeline/geometry/AlignmentOptimizer";
import { LayerOrderingOptimizer } from "./pipeline/geometry/LayerOrderingOptimizer";
import { DirectionalEdgeRouter } from "./pipeline/routing/DirectionalEdgeRouter";
import type { IEdgeRouter } from "./pipeline/routing/IEdgeRouter";
import type { IEdgePathRouter } from "./pipeline/routing/path/IEdgePathRouter";
import { ObstacleAvoidingEdgePathRouter } from "./pipeline/routing/path/ObstacleAvoidingEdgePathRouter";
import { TreeEdgePathRouter } from "./pipeline/routing/tree/TreeEdgePathRouter";
import { TreeEdgeRouter } from "./pipeline/routing/tree/TreeEdgeRouter";

export class LayoutManager {
	private readonly layouts =
		new Map<LayoutTypeValue, ILayout>();
	private readonly candidateGenerator:
		LayoutCandidateGenerator;
	private readonly candidateSelector:
		LayoutCandidateSelector;

	constructor() {
		this.layouts.set(
			LayoutType.Hierarchy,
			this.createHierarchyPipeline()
		);
		this.layouts.set(
			LayoutType.HierarchyClearPath,
			this.createHierarchyClearPathPipeline()
		);
		this.layouts.set(
			LayoutType.Tree,
			this.createTreePipeline()
		);
		this.layouts.set(
			LayoutType.Radial,
			this.createRadialPipeline()
		);
		this.layouts.set(
			LayoutType.Force,
			this.createForcePipeline()
		);
		this.layouts.set(
			LayoutType.Circular,
			this.createCircularPipeline()
		);

		this.candidateGenerator =
			new LayoutCandidateGenerator([
				{
					id: "hierarchy-default",
					name: "层级布局",
					description:
						"默认层级布局，强调上下游方向和层级阅读。",
					layoutType:
						LayoutType.Hierarchy,
					layout:
						this.layouts.get(
							LayoutType.Hierarchy
						)!
				},
				{
					id:
						"hierarchy-clear-path-default",
					name:
						"层级布局-连线不穿过节点",
					description:
						"在层级布局基础上移动被无关连线穿过的节点，保持整体居中并允许连线交叉。",
					layoutType:
						LayoutType.HierarchyClearPath,
					layout:
						this.layouts.get(
							LayoutType.HierarchyClearPath
						)!
				},
				{
					id: "tree-default",
					name: "树状布局",
					description:
						"默认树状布局，强调主要父子结构。",
					layoutType:
						LayoutType.Tree,
					layout:
						this.layouts.get(
							LayoutType.Tree
						)!
				},
				{
					id: "radial-default",
					name: "放射布局",
					description:
						"默认放射布局，围绕核心节点分层展开。",
					layoutType:
						LayoutType.Radial,
					layout:
						this.layouts.get(
							LayoutType.Radial
						)!
				},
				{
					id: "force-default",
					name: "力导向布局",
					description:
						"默认力导向布局，用排斥和吸引分散复杂关系。",
					layoutType:
						LayoutType.Force,
					layout:
						this.layouts.get(
							LayoutType.Force
						)!
				},
				{
					id: "circular-default",
					name: "环形布局",
					description:
						"将循环关系和闭环知识链按圆周展开。",
					layoutType:
						LayoutType.Circular,
					layout:
						this.layouts.get(
							LayoutType.Circular
						)!
				}
			]);

		this.candidateSelector =
			new LayoutCandidateSelector();
	}

	generate(
		graph: IGraph,
		layoutType: LayoutTypeValue
	): GraphSnapshot {
		const layout =
			this.layouts.get(layoutType);

		if (!layout) {
			throw new Error(
				`Unsupported layout type: ${layoutType}`
			);
		}

		return layout.generate(graph);
	}

	generateRecommendations(
		graph: IGraph
	): LayoutRecommendation[] {
		const candidates =
			this.candidateGenerator.generate(
				graph
			);
		const structureAnalyzer =
			new LayoutStructureAnalyzer();

		return this.candidateSelector.rank(
			graph,
			candidates,
			{
				structure:
					structureAnalyzer.analyze(graph)
			}
		);
	}

	hasLayout(
		layoutType: string
	): layoutType is LayoutTypeValue {
		return this.layouts.has(
			layoutType as LayoutTypeValue
		);
	}

	private createHierarchyPipeline():
		LayoutPipeline {
		return this.createDirectionalPipeline(
			new HierarchyLayout()
		);
	}

	private createHierarchyClearPathPipeline():
		LayoutPipeline {
		return this.createDirectionalPipeline(
			new HierarchyClearPathLayout()
		);
	}

	private createTreePipeline():
		LayoutPipeline {
		return new LayoutPipeline({
			baseLayout:
				new TreeLayout(),
			analyzers: [],
			semanticOptimizers: [],
			geometryOptimizers: [
				new AlignmentOptimizer(),
				new LayerOrderingOptimizer()
			],
			safeLayoutOptimizers: [],
			edgeRouters: [
				new TreeEdgeRouter()
			],
			edgePathRouters: [
				new TreeEdgePathRouter()
			],
			routingOptimizers: [],
			validators: [
				new NodeOverlapValidator(),
				new EdgeNodeIntersectionValidator()
			]
		});
	}

	private createRadialPipeline():
		LayoutPipeline {
		return this.createDirectionalPipeline(
			new RadialLayout()
		);
	}

	private createForcePipeline():
		LayoutPipeline {
		return this.createDirectionalPipeline(
			new ForceLayout()
		);
	}

	private createCircularPipeline():
		LayoutPipeline {
		return this.createDirectionalPipeline(
			new CircularLayout()
		);
	}

	private createDirectionalPipeline(
		baseLayout: ILayout
	): LayoutPipeline {
		const edgeRouters:
			readonly IEdgeRouter[] = [
				new DirectionalEdgeRouter()
			];
		const edgePathRouters:
			readonly IEdgePathRouter[] = [
				new ObstacleAvoidingEdgePathRouter()
			];

		return new LayoutPipeline({
			baseLayout,
			analyzers: [],
			semanticOptimizers: [],
			geometryOptimizers: [],
			safeLayoutOptimizers: [],
			edgeRouters,
			edgePathRouters,
			routingOptimizers: [],
			validators: [
				new NodeOverlapValidator(),
				new EdgeNodeIntersectionValidator()
			]
		});
	}
}
