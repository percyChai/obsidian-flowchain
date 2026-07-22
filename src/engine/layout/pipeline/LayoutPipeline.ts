import type { IGraph } from "../../graph/IGraph";
import type { GraphSnapshot } from "../GraphSnapshot";
import type { ILayout } from "../ILayout";
import type { LayoutValidationIssue } from "./LayoutValidationIssue";
import type { LayoutProblem } from "./analyzer/LayoutProblem";
import type { EdgeRoute } from "./routing/EdgeRoute";
import type { EdgePath } from "./routing/path/EdgePath";
import type { LayoutPipelineConfig } from "./LayoutPipelineConfig";
import { LayoutStructureAnalyzer } from "./analyzer/LayoutStructureAnalyzer";
import type { LayoutOptimizationContext } from "./LayoutOptimizationContext";

export class LayoutPipeline implements ILayout {
	private validationIssues:
		LayoutValidationIssue[] = [];
	private layoutProblems:
		LayoutProblem[] = [];

	constructor(
		private readonly config:
			LayoutPipelineConfig
	) {}

	generate(graph: IGraph): GraphSnapshot {
		let snapshot =
			this.config.baseLayout.generate(graph);

		const structureAnalyzer =
			new LayoutStructureAnalyzer();

		const optimizationContext:
			LayoutOptimizationContext = {
				structure:
					structureAnalyzer.analyze(graph)
			};

		this.layoutProblems = [];

		for (const analyzer of this.config.analyzers) {
			this.layoutProblems.push(
				...analyzer.analyze(
					graph,
					snapshot
				)
			);
		}

		for (
			const optimizer
			of this.config.semanticOptimizers
		) {
			snapshot =
				optimizer.optimize(
					graph,
					snapshot,
					this.layoutProblems
				);
		}

		for (
			const optimizer
			of this.config.geometryOptimizers
		) {
			snapshot =
				optimizer.optimize(
					graph,
					snapshot,
					optimizationContext
				);
		}

		for (
			const optimizer
			of this.config.safeLayoutOptimizers
		) {
			snapshot =
				optimizer.optimize(
					graph,
					snapshot
				);
		}

		snapshot = {
			...snapshot,
			routes:
				this.routeEdges(
					graph,
					snapshot
				)
		};

		for (
			const optimizer
			of this.config.routingOptimizers
		) {
			snapshot =
				optimizer.optimize(
					graph,
					snapshot
				);
		}

		if (
			this.config.routingOptimizers.length > 0
		) {
			snapshot = {
				...snapshot,
				routes:
					this.routeEdges(
						graph,
						snapshot
					)
			};
		}

		snapshot = {
			...snapshot,
			paths:
				this.routeEdgePaths(
					graph,
					snapshot
				)
		};

		this.validationIssues = [];

		for (const validator of this.config.validators) {
			this.validationIssues.push(
				...validator.validate(
					graph,
					snapshot
				)
			);
		}

		return snapshot;
	}

	private routeEdges(
		graph: IGraph,
		snapshot: GraphSnapshot
	): Map<string, EdgeRoute> {
		const routes =
			new Map<string, EdgeRoute>();

		for (const edgeRouter of this.config.edgeRouters) {
			const generatedRoutes =
				edgeRouter.route(
					graph,
					snapshot
				);

			for (
				const [relationId, route]
				of generatedRoutes
			) {
				routes.set(
					relationId,
					route
				);
			}
		}

		return routes;
	}

	private routeEdgePaths(
		graph: IGraph,
		snapshot: GraphSnapshot
	): Map<string, EdgePath> {
		const paths =
			new Map<string, EdgePath>();

		for (
			const edgePathRouter
			of this.config.edgePathRouters
		) {
			const generatedPaths =
				edgePathRouter.route(
					graph,
					snapshot,
					snapshot.routes
				);

			for (
				const [relationId, path]
				of generatedPaths
			) {
				paths.set(
					relationId,
					path
				);
			}
		}

		return paths;
	}

	getValidationIssues():
		readonly LayoutValidationIssue[] {
		return this.validationIssues;
	}

	getLayoutProblems():
		readonly LayoutProblem[] {
		return this.layoutProblems;
	}
}
