export class CheckQueryValidityHelper {
	public validEBNFKeys: string[];
	public integers: string[];
	public strings: string[];
	public validApplyTokens: string[];
	public id: string;
	public group: string[];
	public columns: string[];
	public orderBy: string[];
	public dir: string;
	public applyRules: any;
	constructor() {
		this.integers = ["year", "avg", "pass", "fail", "audit", "lat", "lon", "seats"];
		this.strings = ["uuid", "id", "title", "instructor", "dept", "fullname", "shortname", "number", "name",
			"address", "type", "furniture", "href"];
		this.validEBNFKeys = this.integers.concat(this.strings);
		this.validApplyTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
		this.id = "";
		[this.group, this.columns, this.orderBy, this.applyRules] = [[], [], [], []];
		this.dir = "";
	}

	public getId() {
		return this.id;
	}

	public getGroup() {
		return this.group;
	}

	public getColumns() {
		return this.columns;
	}

	public getOrderBy() {
		return this.orderBy;
	}

	public getDir() {
		return this.dir;
	}

	public getApplyRules() {
		return this.applyRules;
	}

	public CheckQueryType(query: unknown): boolean {
		if (query === undefined) {
			return false;
		}
		return typeof query === "object";
	}

	public CheckQueryValidity(query: any): boolean {
		for (let keyString of Object.keys(query)) {
			if (keyString !== "WHERE" && keyString !== "OPTIONS" && keyString !== "TRANSFORMATIONS") {
				return false;
			}
		}
		if (!this.hasProperty(query, "WHERE") || !this.hasProperty(query, "OPTIONS")) {
			return false;
		}
		const [whereTree, optionsTree] = [query["WHERE"], query["OPTIONS"]];
		if (this.hasProperty(query, "TRANSFORMATIONS")) {
			const transformationsTree = query["TRANSFORMATIONS"];
			if (!this.CheckTransformationsValidity(transformationsTree)) {
				return false;
			}
		}

		return this.CheckOptionsValidity(optionsTree) && this.CheckWhereValidity(whereTree);
	}

	public hasProperty(query: any, key: string): boolean {
		return Object.prototype.hasOwnProperty.call(query, key);
	}

	public CheckTransformationsValidity(transformationsTree: any) {
		let transformationsTreeKeys: string[] = Object.keys(transformationsTree);
		if (transformationsTreeKeys.length !== 2 || !this.hasProperty(transformationsTree, "GROUP") ||
			!this.hasProperty(transformationsTree, "APPLY")) {
			return false;
		}
		let groupArray: string[] = transformationsTree["GROUP"];
		if (groupArray.length === 0) {
			return false;
		}
		for (let groupKey of groupArray) {
			let checkFormat: boolean = this.checkKeyFormat(groupKey);
			if (!checkFormat) {
				return false;
			}
		}
		this.group = groupArray;
		let applyRuleArray: any = transformationsTree["APPLY"];
		let applyKeys: string[] = [];
		for (const applyRule of applyRuleArray) {
			const applyKey: string = Object.keys(applyRule)[0];
			if (applyKeys.includes(applyKey)) {
				return false;
			}
			applyKeys.push(applyKey);
			if (!this.checkApplyKeyFormat(applyKey)) {
				return false;
			}
			const applyValue: any = applyRule[applyKey];
			const applyToken: string = Object.keys(applyValue)[0];
			const key: string = applyValue[applyToken];
			if (!this.checkApplyToken(applyToken, key)) {
				return false;
			}
			if (!this.checkKeyFormat(key)) {
				return false;
			}
		}
		this.applyRules = applyRuleArray;
		return true;
	}

	public CheckOptionsValidity(optionsTree: any): boolean {
		if (!this.checkOptionsKeys(optionsTree)) {
			return false;
		}
		let columnArray: string[] = optionsTree["COLUMNS"];
		if (columnArray.length === 0) {
			return false;
		}
		for (let colKey of columnArray) {
			let checkFormat: boolean = this.checkAnyKeyFormat(colKey);
			if (!checkFormat) {
				return false;
			}
		}
		this.columns = columnArray;
		if (this.hasProperty(optionsTree, "ORDER")) {
			const orderValue = optionsTree["ORDER"];
			if (typeof orderValue === "string") {
				const checkFormat: boolean = this.checkAnyKeyFormat(orderValue);
				if (!checkFormat || !columnArray.includes(orderValue)) {
					return false;
				}
				this.orderBy.push(orderValue);
			} else if (typeof orderValue === "object") {
				const dir = orderValue["dir"];
				if (dir !== "UP" && dir !== "DOWN") {
					return false;
				}
				this.dir = dir;
				const keys: string[] = orderValue["keys"];
				if (keys === undefined || keys.length === 0) {
					return false;
				}
				for (let key of keys) {
					const checkFormat: boolean = this.checkAnyKeyFormat(key);
					if (!checkFormat || !columnArray.includes(key)) {
						return false;
					}
					this.orderBy.push(key);
				}
			} else {
				return false;
			}
		}
		return true;
	}

	public checkOptionsKeys(optionsTree: any): boolean {
		let optionsTreeKeys: string[] = Object.keys(optionsTree);
		if (optionsTreeKeys.length === 0 || optionsTreeKeys.length > 2) {
			return false;
		}
		if (!this.hasProperty(optionsTree, "COLUMNS")) {
			return false;
		}
		for (let keys of optionsTreeKeys) {
			if (!(keys === "COLUMNS") && !(keys === "ORDER")) {
				return false;
			}
		}
		return true;
	}

	public checkAnyKeyFormat(keyString: string): boolean {
		return this.checkApplyKeyFormat(keyString) || this.checkKeyFormat(keyString);
	}

	private checkApplyKeyFormat(keyString: string) {
		return !keyString.includes("_") && keyString !== "";
	}

	private checkApplyToken(applyToken: string, key: string) {
		if (!this.validApplyTokens.includes(applyToken)) {
			return false;
		}
		if (applyToken === "MAX" || applyToken === "MIN" || applyToken === "AVG" || applyToken === "SUM") {
			let tag: string = key.split("_")[1];
			if (!this.integers.includes(tag)) {
				return false;
			}
		}
		return this.validApplyTokens.includes(applyToken);
	}

	private checkKeyFormat(keyString: string) {
		if (keyString.includes("_")) {
			let idKeyList: string[] = keyString.split("_");
			let queryKeyId: string = idKeyList[0];
			let queryKeyEBNF: string = idKeyList[1];
			if (queryKeyId === "") {
				return false;
			}
			if (!this.assignId(queryKeyId)) {
				return false;
			}
			return this.validEBNFKeys.includes(queryKeyEBNF);
		}
		return true;
	}

	public assignId(queryIdString: string): boolean {
		if (this.id === "") {
			this.id = queryIdString;
			return true;
		}
		return this.id === queryIdString;
	}

	public CheckWhereValidity(whereTree: any): boolean {
		let whereKeys: string[] = Object.keys(whereTree);
		if (whereKeys.length === 0) {
			return true;
		} else if (whereKeys.length >= 2) {
			return false;
		}
		let firstLayerKey: string = whereKeys[0];
		return this.CheckSubWhereTreeValidity(firstLayerKey, whereTree);
	}

	public CheckSubWhereTreeValidity(currentKey: string, subTree: any): boolean {
		if (currentKey === "LT" || currentKey === "GT" || currentKey === "EQ" || currentKey === "IS") {
			let subWhereTree: any = subTree[currentKey];
			let subWhereKeys: string[] = Object.keys(subWhereTree);
			if (subWhereKeys.length === 0 || subWhereKeys.length >= 2) {
				return false;
			}
			let subWhereKey: string = subWhereKeys[0];
			if (!subWhereKey.includes("_")) {
				return false;
			}
			let checkFormat: boolean = this.checkAnyKeyFormat(subWhereKey);
			if (!checkFormat) {
				return false;
			}
			let [comparatorKey, value]: [string, any] = [subWhereKey.split("_")[1], subWhereTree[subWhereKey]];
			return this.CheckValue(value, comparatorKey, currentKey);
		} else if (currentKey === "AND" || currentKey === "OR") {
			const subWhereArray = subTree[currentKey];
			if (subWhereArray.length < 1) {
				return false;
			}
			for (const subWhere of subWhereArray) {
				let tree: any = subWhere;
				let subWhereKeys: string[] = Object.keys(tree);
				if (subWhereKeys.length !== 1) {
					return false;
				}
				for (const subWhereKey of subWhereKeys) {
					if (!this.CheckSubWhereTreeValidity(subWhereKey, tree)) {
						return false;
					}
				}
			}
			return true;
		} else if (currentKey === "NOT") {
			const subWhereTree = subTree[currentKey];
			let subWhereKeys: string[] = Object.keys(subWhereTree);
			if (subWhereKeys.length !== 1) {
				return false;
			}
			return this.CheckSubWhereTreeValidity(subWhereKeys[0], subWhereTree);
		}
		return false;
	}

	public CheckValue(value: any, comparatorKey: string, currentKey: string): boolean {
		if (currentKey === "IS") {
			if (this.strings.includes(comparatorKey) && typeof value === "string") {
				if (value.includes("*")) {
					let asteriskIndex: number = value.indexOf("*");
					if (!(asteriskIndex === 0 || asteriskIndex === value.length - 1)) {
						return false;
					}
				}
				return true;
			}
		}
		return this.integers.includes(comparatorKey) && typeof value === "number";
	}
}
