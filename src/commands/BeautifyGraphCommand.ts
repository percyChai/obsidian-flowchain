import { Notice } from "obsidian";
import type { ICanvasSync } from "../runtime/sync/ICanvasSync";

const NOT_FLOWCHAIN_CANVAS_NOTICE =
	"FlowChain：当前 Canvas 尚未生成关系图，请先执行“生成关系图”。";

export class BeautifyGraphCommand {
	constructor(
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

		const beautified =
			this.canvasSync.beautify(context);

		if (!beautified) {
			new Notice(
				NOT_FLOWCHAIN_CANVAS_NOTICE
			);
			return;
		}

		new Notice(
			"FlowChain：已美化关系图。"
		);
	}
}
