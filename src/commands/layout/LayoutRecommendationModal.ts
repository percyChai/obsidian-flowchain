import {
	App,
	Modal,
	Setting
} from "obsidian";
import type { LayoutRecommendation } from "../../engine/layout/pipeline/LayoutRecommendation";

export class LayoutRecommendationModal extends Modal {
	private selectedRecommendation:
		LayoutRecommendation | null = null;

	constructor(
		app: App,
		private readonly recommendations:
			readonly LayoutRecommendation[],
		private readonly resolveSelection:
			(
				recommendation:
					LayoutRecommendation | null
			) => void
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(
			"FlowChain：智能推荐布局"
		);

		this.contentEl.empty();

		for (
			const recommendation
			of this.recommendations
		) {
			const reason =
				recommendation.reasons[0] ??
				recommendation.description;

			const warning =
				recommendation.warnings[0];

			const label =
				recommendation.rank === 1
					? `${recommendation.rank}. ${recommendation.name}（推荐）`
					: `${recommendation.rank}. ${recommendation.name}`;

			const description = [
				`评分：${recommendation.totalScore.toFixed(2)}`,
				reason,
				warning
					? `警告：${warning}`
					: ""
			]
				.filter((part) => part.length > 0)
				.join("\n");

			new Setting(this.contentEl)
				.setName(label)
				.setDesc(description)
				.addButton((button) => {
					button
						.setButtonText("应用")
						.onClick(() => {
							this.selectedRecommendation =
								recommendation;
							this.close();
						});
				});
		}
	}

	onClose(): void {
		this.contentEl.empty();

		this.resolveSelection(
			this.selectedRecommendation
		);
	}
}

export function pickLayoutRecommendation(
	app: App,
	recommendations:
		readonly LayoutRecommendation[]
): Promise<LayoutRecommendation | null> {
	return new Promise((resolve) => {
		new LayoutRecommendationModal(
			app,
			recommendations,
			resolve
		).open();
	});
}
