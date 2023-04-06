import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {AddDatasetHelper} from "./AddDatasetHelper";
import * as fs from "fs-extra";
import {CheckQueryValidityHelper} from "./CheckQueryValidityHelper";
import {HandleQueryHelper} from "./HandleQueryHelper";
import {CombinedInsightDatasetAndResult} from "./DatasetModel";
import {AddRoomsDatasetHelper} from "./AddRoomsDatasetHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// map id to dataset + result
	public datasetContentMap: Map<string, CombinedInsightDatasetAndResult>;
	public addedDatasets: string[];
	constructor() {
		this.addedDatasets = [];
		this.datasetContentMap = new Map<string, CombinedInsightDatasetAndResult>();
		if (fs.pathExistsSync("./data")) {
			let filenames: string[] = fs.readdirSync("./data");
			filenames.forEach((file: string) => {
				let object: CombinedInsightDatasetAndResult = fs.readJSONSync("./data/" + file);
				let dataset = object.dataset;
				this.addedDatasets.push(dataset.id);
				this.datasetContentMap.set(dataset.id, object);
			});
		}
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// return Promise.reject("Not implemented.");
		return new Promise<string[]>((resolve, reject) => {
			if (id === "") {
				return reject(new InsightError("Empty id string"));
			}
			if (id.includes("_")) {
				return reject(new InsightError("id string contains an underscore"));
			}
			if (!id.trim()) {
				return reject(new InsightError("id is all whitespace"));
			}
			if (this.addedDatasets.includes(id)) {
				return reject(new InsightError("this id is already added"));
			}
			if (content === "") {
				return reject(new InsightError("empty dataset"));
			}
			let helper = new AddDatasetHelper();
			let roomsHelper = new AddRoomsDatasetHelper();
			let result;
			if (kind === InsightDatasetKind.Sections) {
				result = helper.unzipHelper(id, content, kind, this.addedDatasets, this.datasetContentMap);
			} else if (kind === InsightDatasetKind.Rooms){
				result = roomsHelper.unzipHelperRooms(id, content, kind, this.addedDatasets, this.datasetContentMap);
			} else {
				return reject(new InsightError("kind is different from sections or rooms"));
			}
			return resolve(result);
		});
	}

	public removeDataset(id: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (id === "") {
				return reject(new InsightError("empty string id"));
			}
			if (id.includes("_")) {
				return reject(new InsightError("id contains and underscore"));
			}
			if (!id.trim()) {
				return reject(new InsightError("id is all whitespace"));
			}
			if (!this.addedDatasets.includes(id)) {
				return reject(new NotFoundError("nonexistent id"));
			}
			// splicing dataset at id location inorder to delete id
			let indexOfId: number = this.addedDatasets.indexOf(id);
			let splicedDataset: string[] = this.addedDatasets.slice(0, indexOfId + 1);
			let poppedElement = splicedDataset.pop();
			if (poppedElement !== id) {
				return reject(new InsightError("removed incorrect element: fix removeDataset method"));
			}
			let splicedDatasetRemaining: string[] = this.addedDatasets.slice(indexOfId + 1);
			this.addedDatasets = splicedDataset.concat(splicedDatasetRemaining);
			let deleted: boolean = this.datasetContentMap.delete(id);
			if (!deleted) {
				return reject(new NotFoundError("could not delete file"));
			}
			// fs.unlinkSync("./data/" + id + ".json");
			fs.removeSync("./data/" + id + ".json");
			return resolve(id);
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return new Promise<InsightResult[]>((resolve, reject) => {
			let checkQueryValidityHelper = new CheckQueryValidityHelper();
			let checkType = checkQueryValidityHelper.CheckQueryType(query);
			if (!checkType) {
				return reject(new InsightError("Invalid query type"));
			}

			// reassign query type
			let newQuery = query as any;
			const checkValidity = checkQueryValidityHelper.CheckQueryValidity(newQuery);
			if (!checkValidity) {
				return reject(new InsightError("Not valid query"));
			}

			let queryId: string = checkQueryValidityHelper.getId();
			let queryGroup: string[] = checkQueryValidityHelper.getGroup();
			let queryCols: string[] = checkQueryValidityHelper.getColumns();
			let queryOrderBy: string[] = checkQueryValidityHelper.getOrderBy();
			let queryDir: string = checkQueryValidityHelper.getDir();
			let queryApplyRules: any = checkQueryValidityHelper.getApplyRules();
			// console.log(queryCols);
			if (queryGroup.length !== 0) {
				for (let key of queryCols) {
					if (key.includes("_") && !queryGroup.includes(key)) {
						return reject(new InsightError("key in GROUP is not in COLS"));
					}
				}
			}
			// console.log(queryApplyRules);
			let handleQueryHelper = new HandleQueryHelper(queryId, queryGroup, queryCols, queryOrderBy, queryDir,
				queryApplyRules);
			const whereTree = newQuery["WHERE"];
			const result = handleQueryHelper.handleQuery(whereTree, this.datasetContentMap, this.addedDatasets);
			return resolve(result);
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return new Promise<InsightDataset[]>((resolve) => {
			let result = [];
			for (let value of this.datasetContentMap.values()) {
				result.push(value.dataset);
			}
			resolve(result);
		});
	}
}
