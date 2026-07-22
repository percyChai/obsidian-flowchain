import type { CanvasHandle } from "../canvas/CanvasTypes";
import { CanvasSession } from "./CanvasSession";

export class CanvasSessionManager {
	private readonly sessions =
		new Map<string, CanvasSession>();

	getSession(
		canvas: CanvasHandle,
		canvasPath: string
	): CanvasSession {
		const existingSession =
			this.sessions.get(canvasPath);

		if (existingSession) {
			return existingSession;
		}

		const session =
			new CanvasSession(
				canvas,
				canvasPath
			);

		this.sessions.set(canvasPath, session);

		return session;
	}

	migrateSession(
		session: CanvasSession,
		oldCanvasPath: string,
		newCanvasPath: string
	): void {
		if (oldCanvasPath === newCanvasPath) {
			session.canvasPath = newCanvasPath;
			this.sessions.set(
				newCanvasPath,
				session
			);
			return;
		}

		if (
			this.sessions.get(oldCanvasPath) ===
			session
		) {
			this.sessions.delete(oldCanvasPath);
		}

		session.canvasPath = newCanvasPath;
		this.sessions.set(
			newCanvasPath,
			session
		);
	}

	clear(): void {
		for (const session of this.sessions.values()) {
			session.reset();
		}

		this.sessions.clear();
	}
}
