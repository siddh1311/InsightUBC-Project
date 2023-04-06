import {InsightResult} from "./IInsightFacade";
import Decimal from "decimal.js";

export function handleTransformations(insightResults: InsightResult[], queryGroup: string[],
									  queryApplyRules: any): InsightResult[] {
	if (queryGroup.length === 0) {
		return insightResults;
	}

	let resultGroups = groupResults(insightResults, queryGroup);
	// console.log(resultGroups);
	let results = [];
	for (const resultGroup of resultGroups) {
		let newInsightResult: InsightResult = {};
		for (const groupKey of queryGroup) {
			newInsightResult[groupKey] = resultGroup[0][groupKey];
		}
		applyRules(queryApplyRules, resultGroup, newInsightResult);
		// console.log(newInsightResult);
		results.push(newInsightResult);
	}

	return results;
}

function groupResults(insightResults: InsightResult[], queryGroup: string[]) {
	let resultGroups: InsightResult[][] = [];
	resultGroups.push(insightResults);

	for (let groupKey of queryGroup) {
		let newGroupsArray: InsightResult[][] = [];

		for (let group of resultGroups) {
			let groupValues: Array<string | number> = [];
			let newGroupsObj: {[key: string]: InsightResult[]} = {};
			for (let insightResult of group) {
				let groupValue = insightResult[groupKey].toString();
				if (!groupValues.includes(groupValue)) {
					groupValues.push(groupValue);
					newGroupsObj[groupValue] = [];
				}
				newGroupsObj[groupValue].push(insightResult);
			}
			// console.log(groupValues);
			// console.log(newGroupsObj);
			for (let newGroupKey of Object.keys(newGroupsObj)) {
				newGroupsArray.push(newGroupsObj[newGroupKey]);
			}
			// console.log(newGroupsArray);
		}
		resultGroups = newGroupsArray;
	}
	return resultGroups;
}

function applyRules(queryApplyRules: any, resultGroup: InsightResult[], newInsightResult: InsightResult): boolean {
	for (let applyRule of queryApplyRules) {
		const applyKey: string = Object.keys(applyRule)[0];
		const applyValue: any = applyRule[applyKey];
		const applyToken: string = Object.keys(applyValue)[0];
		const key: string = applyValue[applyToken];
		const values: any[] = resultGroup.map((insightResult) => insightResult[key]);
		let applyResult, decimalNums, total, avg;
		let uniqueValues: any[] = [];
		switch (applyToken) {
			case "MAX":
				applyResult = Math.max(...values);
				break;
			case "MIN":
				applyResult = Math.min(...values);
				break;
			case "AVG":
				decimalNums = values.map((v: number) => new Decimal(v));
				total = new Decimal(0);
				for (const num of decimalNums) {
					total = Decimal.add(total, num);
				}
				avg = total.toNumber() / decimalNums.length;
				applyResult = Number(avg.toFixed(2));
				break;
			case "SUM":
				decimalNums = values.map((v: number) => new Decimal(v));
				total = new Decimal(0);
				for (const num of decimalNums) {
					total = Decimal.add(total, num);
				}
				applyResult = Number(total.toFixed(2));
				break;
			default:
				for (const v of values) {
					if (!uniqueValues.includes(v)) {
						uniqueValues.push(v);
					}
				}
				applyResult = uniqueValues.length;
				break;
		}
		// if (isNaN(applyResult)) {
		// 	return false;
		// }
		newInsightResult[applyKey] = applyResult;
	}
	return true;
}
