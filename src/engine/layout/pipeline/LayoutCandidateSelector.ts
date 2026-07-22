import type { IGraph } from "../../graph/IGraph";
import type { LayoutOptimizationContext } from "./LayoutOptimizationContext";
import { LayoutQualityEvaluator } from "./LayoutQualityEvaluator";
import type { LayoutCandidate } from "./LayoutCandidate";
import type { LayoutRecommendation } from "./LayoutRecommendation";
import type { LayoutValidationIssue } from "./LayoutValidationIssue";
import {
	LayoutType,
	type LayoutType as LayoutTypeValue
} from "../LayoutType";
import type { LayoutScore } from "./evaluation/LayoutScore";

const SCORE_SCALE = 10;

export class LayoutCandidateSelector {
	private readonly evaluator =
		new LayoutQualityEvaluator();

	rank(
		graph: IGraph,
		candidates: readonly LayoutCandidate[],
		context: LayoutOptimizationContext
	): LayoutRecommendation[] {
		const recommendations =
			candidates.map((candidate) => {
				const rawScoreBreakdown =
					this.evaluator.evaluateDetailed(
						graph,
						candidate.snapshot,
						context,
						candidate.issues
					);
				const scoreBreakdown =
					this.scaleScore(
						rawScoreBreakdown
					);

				return {
					id: candidate.id,
					name: candidate.name,
					description:
						candidate.description,
					layoutType:
						candidate.layoutType,
					presetId:
						candidate.presetId,
					snapshot:
						candidate.snapshot,
					totalScore:
						scoreBreakdown.total,
					scoreBreakdown,
					reasons:
						this.createReasons(
							candidate.layoutType,
							scoreBreakdown
						),
					warnings:
						this.createWarnings(
							candidate.issues
						),
					rank: 0
				};
			});

		recommendations.sort(
			(first, second) => {
				if (
					first.totalScore !==
					second.totalScore
				) {
					return (
						second.totalScore -
						first.totalScore
					);
				}

				return first.id.localeCompare(
					second.id
				);
			}
		);

		return recommendations.map(
			(recommendation, index) => ({
				...recommendation,
				rank: index + 1
			})
		);
	}

	private scaleScore(
		score: LayoutScore
	): LayoutScore {
		return {
			...score,
			total:
				score.total / SCORE_SCALE,
			crossing:
				score.crossing,
			compactness:
				score.compactness /
				SCORE_SCALE,
			balance:
				score.balance / SCORE_SCALE,
			edgeLength:
				score.edgeLength /
				SCORE_SCALE,
			backbone:
				score.backbone /
				SCORE_SCALE,
			area:
				score.area / SCORE_SCALE,
			validationPenalty:
				score.validationPenalty /
				SCORE_SCALE
		};
	}

	private createReasons(
		layoutType: LayoutTypeValue,
		score: LayoutScore
	): string[] {
		const reasons: string[] = [];

		switch (layoutType) {
			case LayoutType.Hierarchy:
				reasons.push(
					"层级方向清晰，适合当前有向关系图。"
				);
				break;
			case LayoutType.HierarchyClearPath:
				reasons.push(
					"在保持层级主链的同时，会主动避开连线穿过节点。"
				);
				break;
			case LayoutType.Tree:
				reasons.push(
					"树状结构突出主要父子关系，适合严格树形图。"
				);
				break;
			case LayoutType.Radial:
				reasons.push(
					"放射布局便于观察核心节点与外圈关系。"
				);
				break;
			case LayoutType.Force:
				reasons.push(
					"力导向布局能分散复杂交叉关系。"
				);
				break;
			case LayoutType.Circular:
				reasons.push(
					"环形布局适合查看循环关系和闭环知识链。"
				);
				break;
		}

		if (score.crossing === 0) {
			reasons.push(
				"当前候选没有检测到边交叉。"
			);
		}

		if (score.edgeNodeIntersection === 0) {
			reasons.push(
				"没有检测到连线穿过无关节点。"
			);
		}

		if (score.nodeOverlap === 0) {
			reasons.push(
				"没有检测到节点重叠。"
			);
		}

		return reasons;
	}

	private createWarnings(
		issues: readonly LayoutValidationIssue[]
	): string[] {
		return issues.map((issue) =>
			this.translateIssue(issue)
		);
	}

	private translateIssue(
		issue: LayoutValidationIssue
	): string {
		if (
			issue.code ===
			"edge-node-intersection"
		) {
			const from =
				issue.entityIds[0] ?? "未知节点";
			const crossed =
				issue.entityIds[1] ?? "未知节点";
			const to =
				issue.entityIds[2] ?? "未知节点";

			return `关系“${from} → ${to}”的连线穿过无关节点“${crossed}”。`;
		}

		if (issue.code === "node-overlap") {
			const first =
				issue.entityIds[0] ?? "未知节点";
			const second =
				issue.entityIds[1] ?? "未知节点";

			return `节点“${first}”和“${second}”发生重叠。`;
		}

		return `布局存在问题：${issue.message}`;
	}
}
