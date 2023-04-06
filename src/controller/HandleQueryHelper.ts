import {InsightError, InsightResult, ResultTooLargeError} from "./IInsightFacade";
import {CombinedInsightDatasetAndResult} from "./DatasetModel";
import {handleTransformations} from "./HandleTransformationsHelper";

export class HandleQueryHelper {
	public queryId: string;
	public queryGroup: string[];
	public queryCols: string[];
	public queryOrderBy: string[];
	public queryDir: string;
	public queryApplyRules: any;
	public allSections: InsightResult[];
	constructor(queryId: string, queryGroup: string[], queryCols: string[], queryOrderBy: string[], queryDir: string,
		queryApplyRules: any) {
		this.queryId = queryId;
		this.queryGroup = queryGroup;
		this.queryCols = queryCols;
		this.queryOrderBy = queryOrderBy;
		this.queryDir = queryDir;
		this.queryApplyRules = queryApplyRules;
		this.allSections = [];
	}

	public convertAllSectionsByCols(queryResult: InsightResult[]): InsightResult[] {
		let convertedSection: InsightResult[] = [];
		for (let section of queryResult) {
			let map: {[key: string]: string | number} = {};
			for (let colString of this.queryCols) {
				map[colString] = section[colString];
			}
			convertedSection.push(map as InsightResult);
		}
		return convertedSection;
	}

	public handleQuery(
		whereTree: any,
		datasetContentMap: Map<string, CombinedInsightDatasetAndResult>,
		addedDatasets: string[]
	): Promise<InsightResult[]> {
		return new Promise<InsightResult[]>((resolve, reject) => {
			let whereKeys: string[] = Object.keys(whereTree);
			if (!addedDatasets.includes(this.queryId)) {
				return reject(new InsightError("DATASET THAT QUERY IS TARGETING HAS NOT BEEN ADDED"));
			}
			let queryDataset: CombinedInsightDatasetAndResult | undefined = datasetContentMap.get(this.queryId);
			if (queryDataset === undefined) {
				return reject(new InsightError("UNEXPECTED ERROR WHEN GETTING DATASET"));
			}
			if (whereKeys.length === 0) {
				let queryResultArray: InsightResult[] = queryDataset.result;
				queryResultArray = handleTransformations(queryResultArray, this.queryGroup, this.queryApplyRules);
				queryResultArray = this.inLineSort(queryResultArray);
				queryResultArray = this.convertAllSectionsByCols(queryResultArray);
				if (queryResultArray.length > 5000) {
					return reject(new ResultTooLargeError("Empty where"));
				}
				return resolve(queryResultArray);
			}
			let whereKey: string = whereKeys[0];
			this.allSections = queryDataset.result;

			let result = this.handleSubWhere(whereKey, whereTree, this.allSections);
			// console.log(result);
			result = handleTransformations(result, this.queryGroup, this.queryApplyRules);
			// console.log(result);
			result = this.inLineSort(result);
			result = this.convertAllSectionsByCols(result);
			if (result.length > 5000) {
				return reject(new ResultTooLargeError("Too many results"));
			}
			return resolve(result);
		});
	}

	public handleSubWhere(currentKey: string, currentTree: any, queryInsightResult: InsightResult[]): InsightResult[] {
		if (currentKey === "LT" || currentKey === "GT" || currentKey === "EQ" || currentKey === "IS") {
			let subWhereTree: any = currentTree[currentKey];
			let subWhereKey: string = Object.keys(subWhereTree)[0];
			let value: any = subWhereTree[subWhereKey];
			if (currentKey === "IS") {
				return this.handleIsHelper(value, queryInsightResult, subWhereKey, currentKey);
			}
			let result = this.applyComparator(currentKey, queryInsightResult, subWhereKey, value);
			result = this.inLineSort(result);
			return result;
		} else if (currentKey === "AND" || currentKey === "OR") {
			const subWhereArray = currentTree[currentKey];
			if (currentKey === "AND") {
				let result: InsightResult[] = queryInsightResult;
				for (let tree of subWhereArray) {
					let key: string = Object.keys(tree)[0];
					result = this.handleSubWhere(key, tree, result);
				}
				result = this.inLineSort(result);
				return result;
			} else {
				let result: InsightResult[] = [];
				for (let tree of subWhereArray) {
					let key: string = Object.keys(tree)[0];
					const curResult = this.handleSubWhere(key, tree, queryInsightResult);
					for (let item of curResult) {
						if (!result.includes(item)) {
							result.push(item);
						}
					}
					// result = result.concat(curResult);
				}
				result = this.inLineSort(result);
				return result;
			}
		} else {
			return this.handleNotHelper(currentKey, currentTree, queryInsightResult);
		}
	}

	public handleIsHelper(
		value: any,
		queryInsightResult: InsightResult[],
		subWhereKey: string,
		currentKey: string
	): InsightResult[] {
		if (value.includes("*")) {
			let result: InsightResult[] = [];
			let subString: string = "";
			if (value === "*") {
				for (let section of queryInsightResult) {
					let sectionInfo: string = section[subWhereKey] as string;
					result.push(section);
				}
			} else if (value.startsWith("*") && value.endsWith("*")) {
				subString = value.substring(1, value.length - 1);
				for (let section of queryInsightResult) {
					let sectionInfo: string = section[subWhereKey] as string;
					if (sectionInfo.includes(subString)) {
						result.push(section);
					}
				}
			} else if (!value.startsWith("*") && value.endsWith("*")) {
				subString = value.substring(0, value.length - 1);
				for (let section of queryInsightResult) {
					let sectionInfo: string = section[subWhereKey] as string;
					if (sectionInfo.startsWith(subString)) {
						result.push(section);
					}
				}
			} else if (value.startsWith("*") && !value.endsWith("*")) {
				subString = value.substring(1, value.length);
				for (let section of queryInsightResult) {
					// console.log(section);
					let sectionInfo: string = section[subWhereKey] as string;
					if (sectionInfo.endsWith(subString)) {
						result.push(section);
					}
				}
			}
			result = this.inLineSort(result);
			return result;
		} else {
			let result = this.applyComparator(currentKey, queryInsightResult, subWhereKey, value);
			result = this.inLineSort(result);
			return result;
		}
	}

	public handleNotHelper(currentKey: string, currentTree: any, queryInsightResult: InsightResult[]): InsightResult[] {
		let notFinalResults: InsightResult[] = [];
		let subTree: any = currentTree[currentKey];
		let key: string = Object.keys(subTree)[0];
		let result: InsightResult[] = this.handleSubWhere(key, subTree, queryInsightResult);
		for (let section of queryInsightResult) {
			if (!result.includes(section)) {
				notFinalResults.push(section);
			}
		}
		return notFinalResults;
	}

	public applyComparator(
		currentKey: string,
		queryInsightResult: InsightResult[],
		comparatorKey: string,
		value: any
	): InsightResult[] {
		let filteredResult: InsightResult[] = [];
		// console.log(comparatorKey);
		for (let insightResultObj of queryInsightResult) {
			if (this.compareOperator(insightResultObj[comparatorKey], currentKey, value)) {
				let map: {[key: string]: string | number} = {};
				for (let colString of this.queryCols) {
					map[colString] = insightResultObj[colString];
				}
				filteredResult.push(insightResultObj);
			}
		}
		return filteredResult;
	}

	public compareOperator(iResult: number | string, operator: string, value: number): boolean {
		if (operator === "GT") {
			return iResult > value;
		}
		if (operator === "LT") {
			return iResult < value;
		}
		return iResult === value;
	}

	public inLineSort(filteredResult: InsightResult[]): InsightResult[] {
		/* inline sort method. https://stackoverflow.com/questions/21687907/typescript-sorting-an-array */
		for (let order of this.queryOrderBy.reverse()) {
			filteredResult.sort((a: InsightResult, b: InsightResult): number => {
				if (a[order] < b[order]) {
					return -1;
				}
				if (a[order] > b[order]) {
					return 1;
				}
				return 0;
			});
		}

		if (this.queryDir === "DOWN") {
			return filteredResult.reverse();
		}
		return filteredResult;
	}
}
