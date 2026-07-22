import {
	Notice,
	type App
} from "obsidian";
import type { ICanvasSync } from "../runtime/sync/ICanvasSync";
import { buildGraphFromFolder } from "./GraphCommandHelpers";

const NOT_FLOWCHAIN_CANVAS_NOTICE =
	"FlowChain：当前 Canvas 尚未生成关系图，请先执行“生成关系图”。";

export class RefreshGraphCommand {
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

		const sourceFolderPath =
			this.canvasSync
				.getSourceFolderPath(context);

		if (sourceFolderPath === null) {
			new Notice(
				NOT_FLOWCHAIN_CANVAS_NOTICE
			);
			return;
		}

		try {
			const { graph, fileCount } =
				await buildGraphFromFolder(
					this.app,
					sourceFolderPath
				);

			if (
				fileCount === 0 ||
				graph.entities.size === 0
			) {
				new Notice(
					"FlowChain：选择范围内没有有效 Markdown 节点。"
				);
				return;
			}

			const refreshed =
				this.canvasSync.refresh(
					context,
					graph,
					sourceFolderPath
				);

			if (!refreshed) {
				new Notice(
					NOT_FLOWCHAIN_CANVAS_NOTICE
				);
				return;
			}

			new Notice(
				`FlowChain：已刷新 ${graph.entities.size} 个节点、${graph.relations.size} 条关系。`
			);
		} catch (error) {
			console.error(
				"FlowChain refresh failed.",
				error
			);
			new Notice(
				"FlowChain：刷新同步关系图失败，请检查 Markdown 内容。"
			);
		}
	}
}
