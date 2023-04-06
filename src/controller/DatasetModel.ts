import {InsightDataset, InsightResult} from "./IInsightFacade";

export interface CombinedInsightDatasetAndResult {
	dataset: InsightDataset;
	result: InsightResult[];
}
