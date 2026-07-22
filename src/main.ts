import { Plugin } from "obsidian";

import { BeautifyGraphCommand } from "./commands/BeautifyGraphCommand";
import { GenerateGraphCommand } from "./commands/GenerateGraphCommand";
import { RefreshGraphCommand } from "./commands/RefreshGraphCommand";
import { RelayoutGraphCommand } from "./commands/RelayoutGraphCommand";
import { CanvasRuntime } from "./runtime/CanvasRuntime";
import { CanvasAdapter } from "./runtime/canvas/CanvasAdapter";
import { CanvasSync } from "./runtime/sync/CanvasSync";

export default class FlowChainPlugin extends Plugin {
	private canvasRuntime:
		CanvasRuntime | null = null;

	private canvasSync:
		CanvasSync | null = null;

	async onload(): Promise<void> {
		this.canvasRuntime =
			new CanvasRuntime(this.app);

		await this.canvasRuntime.start();

		const canvasAdapter =
			new CanvasAdapter(
				this.canvasRuntime
			);

		this.canvasSync =
			new CanvasSync(canvasAdapter);

		const generateGraphCommand =
			new GenerateGraphCommand(
				this.app,
				this.canvasSync
			);
		const refreshGraphCommand =
			new RefreshGraphCommand(
				this.app,
				this.canvasSync
			);
		const relayoutGraphCommand =
			new RelayoutGraphCommand(
				this.app,
				this.canvasSync
			);
		const beautifyGraphCommand =
			new BeautifyGraphCommand(
				this.canvasSync
			);

		this.addCommand({
			id: "generate-flowchain-graph",
			name: "生成关系图",
			callback: async () => {
				await generateGraphCommand.execute();
			}
		});

		this.addCommand({
			id: "refresh-flowchain-graph",
			name: "刷新同步关系图",
			callback: async () => {
				await refreshGraphCommand.execute();
			}
		});

		this.addCommand({
			id: "relayout-flowchain-graph",
			name: "选择布局模式",
			callback: async () => {
				await relayoutGraphCommand.execute();
			}
		});

		this.addCommand({
			id: "beautify-flowchain-graph",
			name: "美化关系图",
			callback: async () => {
				await beautifyGraphCommand.execute();
			}
		});
	}

	onunload(): void {
		this.canvasSync?.clearSessions();
		void this.canvasRuntime?.stop();

		this.canvasSync = null;
		this.canvasRuntime = null;
	}
}
