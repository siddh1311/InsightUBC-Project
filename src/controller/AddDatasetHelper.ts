import {InsightDataset, InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";
import JSZip from "jszip";
import * as fs from "fs-extra";
import {CombinedInsightDatasetAndResult} from "./DatasetModel";

export class AddDatasetHelper {
	constructor() {
		// empty constructor
	}

	public unzipHelper(id: string, content: string, kind: InsightDatasetKind, addedDatasets: string[],
					   datasetContentMap: Map<string, CombinedInsightDatasetAndResult>
	): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			let promisesToFulfill: Array<Promise<string>> = [];
			let contentZip = new JSZip();
			let validSections: any = [];
			/* JSZIP loadAsync documentation: https://stuk.github.io/jszip/documentation/api_jszip/load_async.html
			Need to unzip the content of the file, so needed to use loadAsync method*/
			try {
				contentZip
					.loadAsync(content, {base64: true})
					.then((zip) => {
						// JSZIP forEach documentation: https://stuk.github.io/jszip/documentation/api_jszip/for_each.html
						// const re = RegExp("courses");
						// if (zip.folder(re).length === 0) {
						// 	return reject(new InsightError("invalid zip folder: no courses sub folder"));
						// }
						try {
							zip.folder("courses")?.forEach(function (fileName, fileObj) {
								promisesToFulfill.push(fileObj.async("text"));
							});
						} catch (err) {
							return reject(new InsightError("could not unzip"));
						}
					})
					.then(() => {
						// Promise.all doc:
						// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
						Promise.all(promisesToFulfill)
							.then((value: any) => {
								let bool = this.parseJSONIntoValidSections(validSections, value, id);
								if (!bool) {
									return reject(new InsightError("Detected a non-json file"));
								}
							})
							.then(() => {
								if (validSections.length === 0) {
									return reject(new InsightError("no valid sections in the data"));
								}
								let successfulWrite: boolean = this.addContentToModel(
									id, validSections, addedDatasets, datasetContentMap, kind
								);
								if (!successfulWrite) {
									return reject(new InsightError("unsuccessful write"));
								}
								return resolve(addedDatasets);
							});
					});
			} catch (err: any) {
				return reject(new InsightError(err.message));
			}
		});
	}

	public addContentToModel(id: string, validSections: any, addedDatasets: string[],
							 datasetContentMap: Map<string, CombinedInsightDatasetAndResult>, kind: InsightDatasetKind
	): boolean {
		addedDatasets.push(id);
		const insightDataset: InsightDataset = {
			id: id, kind: kind, numRows: validSections.length,
		};
		const combinedDatasetResult: CombinedInsightDatasetAndResult = {
			dataset: insightDataset, result: validSections,
		};
		datasetContentMap.set(id, combinedDatasetResult);
		return this.writeToDisk(id, combinedDatasetResult);
	}

	public parseJSONIntoValidSections(validSections: any, value: any, idString: string): boolean {
		for (let course of value) {
			// Received insight from Piazza post @565 and stackoverflow.
			// Needed a way to validate the JSON file when parsing
			// https://stackoverflow.com/questions/17713485/how-to-test-if-the-uploaded-file-is-a-json-file-in-node-js
			let obj = this.validateJson(course);
			if (obj === null) {
				return false;
			}
			for (let section of obj) {
				// missing the 1900 part when section is set to overall
				let intYear: number;
				if (section.Section === "overall") {
					intYear = 1900;
				} else {
					intYear = parseInt(section.Year, 10);
					if (isNaN(intYear)) {
						return false;
					}
				}
				// validate sections
				const valid: boolean = this.validateSections(section.id.toString(), section.Course, section.Title,
					section.Professor, section.Subject, intYear, section.Avg, section.Pass, section.Fail, section.Audit
				);
				if (valid) {
					const mapParsedKeys: {[key: string]: string | number} = {};
					mapParsedKeys[idString + "_uuid"] = section.id.toString();
					mapParsedKeys[idString + "_id"] = section.Course;
					mapParsedKeys[idString + "_title"] = section.Title;
					mapParsedKeys[idString + "_instructor"] = section.Professor;
					mapParsedKeys[idString + "_dept"] = section.Subject;
					mapParsedKeys[idString + "_year"] = intYear;
					mapParsedKeys[idString + "_avg"] = section.Avg;
					mapParsedKeys[idString + "_pass"] = section.Pass;
					mapParsedKeys[idString + "_fail"] = section.Fail;
					mapParsedKeys[idString + "_audit"] = section.Audit;
					validSections.push(mapParsedKeys as InsightResult);
				} else {
					return false;
				}
			}
		}
		return true;
	}

	public validateSections(uuid: any, id: any, title: any, instructor: any, dept: any, year: any, avg: any, pass: any,
		fail: any, audit: any): boolean {
		return (
			typeof uuid === "string" && typeof id === "string" && typeof title === "string" &&
			typeof instructor === "string" && typeof dept === "string" && typeof year === "number" &&
			typeof avg === "number" && typeof pass === "number" && typeof fail === "number" && typeof audit === "number"
		);
	}

	public validateJson(content: any): any {
		try {
			// no error
			return JSON.parse(content)["result"];
		} catch (err) {
			// couldn't parse: not a JSON
			return null;
		}
	}

	public writeToDisk(id: string, combinedDatasetResult: CombinedInsightDatasetAndResult): boolean {
		// add a JSON file for each id to the data folder
		let directory: string = "./data";
		let fileExtension: string = id + ".json";
		fs.ensureDirSync(directory);
		fs.writeJsonSync(directory + "/" + fileExtension, combinedDatasetResult);
		return true;
	}
}
