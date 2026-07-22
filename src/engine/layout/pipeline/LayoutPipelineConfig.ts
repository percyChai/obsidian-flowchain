import type { ILayout } from "../ILayout";
import type { ILayoutAnalyzer } from "./analyzer/ILayoutAnalyzer";
import type { ILayoutOptimizer } from "./ILayoutOptimizer";
import type { IRoutingOptimizer } from "./routing/IRoutingOptimizer";
import type { ISafeLayoutOptimizer } from "./ISafeLayoutOptimizer";
import type { ISemanticOptimizer } from "./semantic/ISemanticOptimizer";
import type { ILayoutValidator } from "./ILayoutValidator";
import type { IEdgeRouter } from "./routing/IEdgeRouter";
import type { IEdgePathRouter } from "./routing/path/IEdgePathRouter";

export interface LayoutPipelineConfig {
	baseLayout: ILayout;

	analyzers:
		readonly ILayoutAnalyzer[];

	semanticOptimizers:
		readonly ISemanticOptimizer[];

	geometryOptimizers:
		readonly ILayoutOptimizer[];

	safeLayoutOptimizers:
		readonly ISafeLayoutOptimizer[];

	edgeRouters:
		readonly IEdgeRouter[];

	edgePathRouters:
		readonly IEdgePathRouter[];

	routingOptimizers:
		readonly IRoutingOptimizer[];

	validators:
		readonly ILayoutValidator[];
}