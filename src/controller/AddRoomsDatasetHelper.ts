import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {CombinedInsightDatasetAndResult} from "./DatasetModel";
import JSZip from "jszip";
import {ChildNode, Document} from "parse5/dist/cjs/tree-adapters/default";
import * as parse5 from "parse5";
import http_package from "http";
import {AddDatasetHelper} from "./AddDatasetHelper";
export class AddRoomsDatasetHelper {
	constructor() {/* */}

	public unzipHelperRooms(id: string, content: string, kind: InsightDatasetKind, datasets: string[],
		datasetContentMap: Map<string, CombinedInsightDatasetAndResult>): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			let promisesToFulfill: Array<Promise<string>> = [];
			let contentZip = new JSZip();
			let sections: any = [];
			contentZip.loadAsync(content, {base64: true}).then((zip) => {
				if (zip.file("index.htm") === null) {
					return reject(new InsightError("no index.htm file in zip folder"));
				}
				zip.file("index.htm")?.async("text").then(async (i: any) => {
					let document: Document = parse5.parse(i);
					let mapBuilding: Map<string, {[key: string]: string | number}> =
						new Map<string, {[key: string]: string | number}>();
					let table = this.getTableElementFromTree(document.childNodes);
					if (table.length === 0) {
						return reject(new InsightError("empty table"));
					}
					const checkTableLoad = this.loadPrimaryTableValues(table, id, mapBuilding);
					if (!checkTableLoad) {
						return reject(new InsightError("table cannot be found"));
					}
					let result = await this.geoLocationHelper(mapBuilding, id);
					if (result instanceof InsightError) {
						return reject(result);
					}
					let successfulFill = this.fillPromiseArrayHelper(mapBuilding, id, zip, promisesToFulfill);
					if (!successfulFill) {
						return reject(new InsightError("invalid info"));
					}
					const fulfilledPromises = await Promise.all(promisesToFulfill);
					this.fulfillPromiseArrayHelper(fulfilledPromises, sections, mapBuilding, id);
					if (sections.length === 0) {
						return reject(new InsightError("no valid sections in the data"));
					}
					let helper = new AddDatasetHelper();
					let successfulWrite = helper.addContentToModel(id, sections, datasets, datasetContentMap, kind);
					if (!successfulWrite) {
						return reject(new InsightError("unsuccessful write"));
					}
					return resolve(datasets);
				});
			}).catch((err) => {
				return reject(new InsightError(err.message));
			});
		});
	}

	public fulfillPromiseArrayHelper(fulfilledPromises: string[], validSections: any[],
									 mapBuilding: Map<string, {[key: string]: string | number}>, id: string): boolean {
		for (let fileContent of fulfilledPromises) {
			let fileDocument = parse5.parse(fileContent);
			let fileTable = this.getTableElementFromTree(fileDocument.childNodes);
			// checks if a building has a room
			if (fileTable !== null && fileTable !== undefined) {
				for (let trTag of fileTable) {
					if (trTag.nodeName === "tr") {
						let trTagChildren = trTag.childNodes;
						const mapParsedKeys: {[key: string]: string} = {};
						let buildingName = "";
						for (let trElement of trTagChildren) {
							let tdTag: any = trElement;
							if (tdTag.nodeName === "td"){
								const tdClasses = tdTag.attrs[0].value.split(" ");
								let firstValue: string = tdClasses[0];
								let secondValue: string = tdClasses[1];
								this.assignTableValuesRooms(firstValue, secondValue, id,
									mapParsedKeys, tdTag);
								if (firstValue === "views-field" &&
									secondValue === "views-field-nothing") {
									let href = tdTag.childNodes[1].attrs[0].value;
									buildingName = href.substring(href.lastIndexOf("/") + 1).split("-")[0];
								}
							}
						}
						const newMap: {[key: string]: string | number} = {};
						let buildingInfo = mapBuilding.get(buildingName);
						const validity = this.assignMap(buildingInfo, mapParsedKeys, validSections, newMap, id);
						if (!validity) {
							return false;
						}
					}
				}
			}
		}
		return true;
	}

	public assignMap(buildingInfo: any, mapParsedKeys: {[key: string]: string}, validSections: any[],
					 newMap: {[key: string]: string | number}, id: string): boolean {
		if (buildingInfo !== undefined) {
			let fullname = buildingInfo[id + "_fullname"];
			let shortname = buildingInfo[id + "_shortname"];
			let number = mapParsedKeys[id + "_number"];
			let name = buildingInfo[id + "_shortname"] + "_" +
				mapParsedKeys[id + "_number"];
			let address = buildingInfo[id + "_address"];
			let lat = Number(buildingInfo[id + "_lat"]);
			let lon = Number(buildingInfo[id + "_lon"]);
			let seats = Number(mapParsedKeys[id + "_seats"]);
			let type = mapParsedKeys[id + "_type"];
			let furniture = mapParsedKeys[id + "_furniture"];
			let href = buildingInfo[id + "_href"];
			if (this.validateRooms(fullname, shortname, number, name, address, lat, lon, seats, type,
				furniture, href)) {
				newMap[id + "_fullname"] = fullname;
				newMap[id + "_shortname"] = shortname;
				newMap[id + "_number"] = number;
				newMap[id + "_name"] = name;
				newMap[id + "_address"] = address;
				newMap[id + "_lat"] = lat;
				newMap[id + "_lon"] = lon;
				newMap[id + "_seats"] = seats;
				newMap[id + "_type"] = type;
				newMap[id + "_furniture"] = furniture;
				newMap[id + "_href"] = "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/" +
					shortname + "-" + number;
				validSections.push(newMap);
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	public fillPromiseArrayHelper(mapBuilding: Map<string, {[key: string]: string | number}>, id: string, zip: JSZip,
								  promisesToFulfill: Array<Promise<string>>): boolean {
		for (let buildingInfo of mapBuilding.values()) {
			let buildingHref: string = buildingInfo[id + "_href"].toString();
			if (zip.file(buildingHref.substring(2)) === null) {
				return false;
			}
			const fileInfo = zip.file(buildingHref.substring(2))?.async("text");
			if (fileInfo !== undefined) {
				promisesToFulfill.push(fileInfo);
			}
		}
		return true;
	}

	public geoLocationHelper(mapBuilding: Map<string, {[key: string]: string | number}>, id: string):
		Promise<any> {
		return new Promise((resolve, reject) => {
			let promisesToFulfill: Array<Promise<any>> = [];
			for (let buildingTitle of mapBuilding.keys()) {
				const result = this.getBuildingGeoInformation(buildingTitle, mapBuilding, id);
				promisesToFulfill.push(result);
			}
			Promise.all(promisesToFulfill).then((value: any) => {
				return resolve(value);
			}).catch((err) => {
				return reject(err);
			});
		});
	}

	public getBuildingGeoInformation(buildingTitle: string, mapBuilding: Map<string, {[key: string]: string | number}>,
									 id: string): Promise<any> {
		return new Promise((resolve, reject) => {
			let buildingInfo: any = mapBuilding.get(buildingTitle);
			let buildingAddress: string = buildingInfo[id + "_address"];
			let requestLink = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team147/" +
				encodeURIComponent(buildingAddress);
			this.getHttpRequestHelper(requestLink, buildingInfo, id).then((result) => {
				return resolve(result);
			}).catch((err) => {
				return reject(err);
			});
		});
	}

	public getHttpRequestHelper(requestLink: string, buildingInfo: any, id: string):
		Promise<{[key: string]: string}> {
		return new Promise<{[key: string]: string}>((resolve, reject) => {
			// FROM http.get package documentation https://nodejs.org/api/http.html#httpgeturl-options-callback
			http_package.get(requestLink, (res) => {
				res.setEncoding("utf8");
				// console.log(res);
				let rawData: string = "";
				res.on("data", (output) => {
					rawData += output;
				});
				res.on("end", () => {
					try {
						const parsedData = JSON.parse(rawData);
						if (parsedData.error) {
							return reject(new InsightError("Error while requesting GeoLocation"));
						}
						[buildingInfo[id + "_lat"], buildingInfo[id + "_lon"]] = [parsedData.lat, parsedData.lon];
						return resolve(buildingInfo);
					} catch (err) {
						return reject(new InsightError("ERROR WHILE PARSING"));
					}
				});
			});
		});
	}

	public loadPrimaryTableValues(table: ChildNode[], id: string,
								  mapBuilding: Map<string, {[key: string]: string | number}>): boolean {
		if (table !== null && table !== undefined) {
			for (let index in table) {
				let tableElement: any = table[index];
				if (tableElement.nodeName === "tr") {
					let trTagChildren = tableElement.childNodes;
					const mapParsedKeys: {[key: string]: string} = {};
					for (let trIndex in trTagChildren) {
						let trElement: any = trTagChildren[trIndex];
						if (trElement.nodeName === "td") {
							const tdClasses = trElement.attrs[0].value.split(" ");
							let firstValue: string = tdClasses[0];
							let secondValue: string = tdClasses[1];
							this.assignTableValues(firstValue, secondValue, id, mapParsedKeys, trElement);
						}
					}
					mapBuilding.set(mapParsedKeys[id + "_shortname"], mapParsedKeys);
				}
			}
			return true;
		}
		return false;
	}

	public assignTableValues(firstValue: string, secondValue: string, id: string,
							 mapParsedKeys: {[key: string]: string}, trElement: any) {
		if (firstValue === "views-field" && secondValue === "views-field-field-building-code") {
			mapParsedKeys[id + "_shortname"] = trElement.childNodes[0].value.trim();
		}
		if (firstValue === "views-field" && secondValue === "views-field-title") {
			mapParsedKeys[id + "_fullname"] = trElement.childNodes[1].childNodes[0].value;
		}
		if (firstValue === "views-field" && secondValue === "views-field-field-building-address") {
			mapParsedKeys[id + "_address"] = trElement.childNodes[0].value.trim();
		}
		if (firstValue === "views-field" && secondValue === "views-field-nothing") {
			mapParsedKeys[id + "_href"] = trElement.childNodes[1].attrs[0].value;
		}
	}

	public assignTableValuesRooms (firstValue: string, secondValue: string, id: string,
								   mapParsedKeys: {[key: string]: string}, trElement: any) {
		if (firstValue === "views-field" && secondValue === "views-field-field-room-number") {
			mapParsedKeys[id + "_number"] = trElement.childNodes[1].childNodes[0].value.trim();
		}
		if (firstValue === "views-field" && secondValue === "views-field-field-room-capacity") {
			mapParsedKeys[id + "_seats"] = trElement.childNodes[0].value.trim();
		}
		if (firstValue === "views-field" && secondValue === "views-field-field-room-furniture") {
			mapParsedKeys[id + "_furniture"] = trElement.childNodes[0].value.trim();
		}
		if (firstValue === "views-field" && secondValue === "views-field-field-room-type") {
			mapParsedKeys[id + "_type"] = trElement.childNodes[0].value.trim();
		}
	}

	public getTableElementFromTree(children: ChildNode[]): ChildNode[] {
		if (children === null || children === undefined) { // empty or no children element
			return [];
		}
		let childrenOfCurrentNode: ChildNode[] = [];
		for (let index in children) {
			let chld: any = children[index];
			if (chld.nodeName === "tbody") { // found the table, return its child nodes
				return chld.childNodes;
			}
			childrenOfCurrentNode = this.getTableElementFromTree(chld.childNodes);
			if(!(childrenOfCurrentNode.length === 0)) {
				return childrenOfCurrentNode;
			}
		} // should have returned by now if there was a table
		return [];
	}

	public validateRooms(fullname: any, shortname: any, number: any, name: any, address: any, lat: any, lon: any,
		seats: any, type: any, furniture: any, href: any
	): boolean {
		return (
			typeof fullname === "string" && typeof shortname === "string" && typeof number === "string" &&
			typeof name === "string" && typeof address === "string" && typeof lat === "number" &&
			typeof lon === "number" && typeof seats === "number" && typeof type === "string" &&
			typeof furniture === "string" && typeof href === "string"
		);
	}
}
