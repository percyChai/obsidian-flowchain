import {
	Notice,
	type App
} from "obsidian";
import {
	LayoutType,
	type LayoutType as LayoutTypeValue
} from "../engine/layout/LayoutType";
import type {
	CanvasOperationContext,
	ICanvasSync
} from "../runtime/sync/ICanvasSync";
import type { IRelayoutGraphCommand } from "./IRelayoutGraphCommand";
import {
	LayoutPicker,
	LayoutPickerSelection
} from "./layout/LayoutPicker";
import { pickLayoutRecommendation } from "./layout/LayoutRecommendationModal";

const NOT_FLOWCHAIN_CANVAS_NOTICE =
	"FlowChain：当前Canvas 尚未生成关系图，请先执行“生成关系图”。";

export class RelayoutGraphCommand
	implements IRelayoutGraphCommand {

	constructor(
		private readonly app: App,
		private readonly canvasSync:
			ICanvasSync
	) {}

	async execute(): Promise<void> {
		const context =
			this.canvasSync
				.captureOperationContext();

		if (!context) {
			new Notice(
				"FlowChain：请先打开一个 Canvas。"
			);
			return;
		}

		if (
			this.canvasSync
				.getSourceFolderPath(context) === null
		) {
			new Notice(
				NOT_FLOWCHAIN_CANVAS_NOTICE
			);
			return;
		}

		const selection =
			await new LayoutPicker(this.app)
				.pickLayout();

		if (selection === null) {
			return;
		}

		if (
			selection ===
			LayoutPickerSelection.Recommendation
		) {
			await this.executeRecommendationFlow(
				context
			);
			return;
		}

		try {
			const relayouted =
				this.canvasSync.relayout(
					context,
					selection
				);

			if (!relayouted) {
				new Notice(
					NOT_FLOWCHAIN_CANVAS_NOTICE
				);
				return;
			}

			new Notice(
				`FlowChain：已切换为${this.getLayoutName(selection)}。`
			);
		} catch (error) {
			console.error(
				"FlowChain relayout failed.",
				error
			);
			new Notice(
				"FlowChain：布局生成失败。"
			);
		}
	}

	private async executeRecommendationFlow(
		context: CanvasOperationContext
	): Promise<void> {
		new Notice(
			"FlowChain：正在分析布局方案……"
		);

		const recommendations =
			this.canvasSync
				.generateRecommendationsForContext(
					context
				);

		if (
			!recommendations ||
			recommendations.length === 0
		) {
			new Notice(
				NOT_FLOWCHAIN_CANVAS_NOTICE
			);
			return;
		}

		const selectedRecommendation =
			await pickLayoutRecommendation(
				this.app,
				recommendations
			);

		if (!selectedRecommendation) {
			return;
		}

		const applied =
			this.canvasSync.applyRecommendation(
				context,
				selectedRecommendation
			);

		if (!applied) {
			new Notice(
				NOT_FLOWCHAIN_CANVAS_NOTICE
			);
			return;
		}

		new Notice(
			`FlowChain：已应用 ${selectedRecommendation.name}。`
		);
	}

	private getLayoutName(
		layoutType: LayoutTypeValue
	): string {
		switch (layoutType) {
			case LayoutType.HierarchyClearPath:
				return "层级布局-连线不穿过节点";
			case LayoutType.Tree:
				return "树状布局";
			case LayoutType.Radial:
				return "放射布局";
			case LayoutType.Force:
				return "力导向布局";
			case LayoutType.Circular:
				return "环形布局";
			case LayoutType.Hierarchy:
			default:
				return "层级布局";
		}
	}
}
