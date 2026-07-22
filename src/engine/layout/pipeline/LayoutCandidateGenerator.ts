import type { IGraph } from "../../graph/IGraph";
import type { LayoutCandidate } from "./LayoutCandidate";
import type { LayoutVariant } from "./LayoutVariant";

interface LayoutWithIssues {
	getValidationIssues():
		readonly import("./LayoutValidationIssue")
			.LayoutValidationIssue[];
}

export class LayoutCandidateGenerator {
	constructor(
		private readonly variants:
			readonly LayoutVariant[]
	) {}

	generate(
		graph: IGraph
	): LayoutCandidate[] {
		const candidates:
			LayoutCandidate[] = [];

		for (const variant of this.variants) {
			const layout =
				variant.layout ??
				variant.preset?.create();

			if (!layout) {
				continue;
			}

			try {
				const snapshot =
					layout.generate(graph);

				const issues =
					this.hasValidationIssues(layout)
						? layout
							.getValidationIssues()
						: [];

				candidates.push({
					id: variant.id,
					name: variant.name,
					description:
						variant.description,
					layoutType:
						variant.layoutType,
					presetId:
						variant.presetId,
					snapshot,
					issues
				});
			} catch (error) {
				console.warn(
					"FlowChain: layout candidate failed.",
					variant.id,
					error
				);
			}
		}

		return candidates;
	}

	private hasValidationIssues(
		layout: unknown
	): layout is LayoutWithIssues {
		return (
			typeof layout === "object" &&
			layout !== null &&
			"getValidationIssues" in layout &&
			typeof (
				layout as {
					getValidationIssues?: unknown;
				}
			).getValidationIssues ===
				"function"
		);
	}
}
