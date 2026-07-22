export interface IRelayoutGraphCommand {
	execute(): Promise<void>;
}