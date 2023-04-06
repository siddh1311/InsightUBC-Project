// import {
// 	IInsightFacade,
// 	InsightDatasetKind,
// 	InsightError,
// 	InsightResult,
// 	NotFoundError,
// 	ResultTooLargeError,
// } from "../../src/controller/IInsightFacade";
// import InsightFacade from "../../src/controller/InsightFacade";
// import {folderTest} from "@ubccpsc310/folder-test";
// import {expect, use} from "chai";
// import chaiAsPromised from "chai-as-promised";
// import {clearDisk, getContentFromArchives} from "../TestUtil";
//
// use(chaiAsPromised);
//
// describe("InsightFacade", function () {
// 	let facade: IInsightFacade;
//
// 	// Declare datasets used in tests. You should add more datasets like this!
// 	let sections: string;
// 	let rooms: string;
//
// 	before(function () {
// 		// This block runs once and loads the datasets.
// 		sections = getContentFromArchives("shortCourses.zip");
// 		rooms = getContentFromArchives("campus.zip");
//
// 		// Just in case there is anything hanging around from a previous run of the test suite
// 		clearDisk();
// 	});
//
// 	describe("Add/Remove/List Dataset", function () {
// 		before(function () {
// 			console.info(`Before: ${this.test?.parent?.title}`);
// 		});
//
// 		beforeEach(function () {
// 			// This section resets the insightFacade instance
// 			// This runs before each test
// 			console.info(`BeforeTest: ${this.currentTest?.title}`);
// 			facade = new InsightFacade();
// 		});
//
// 		after(function () {
// 			console.info(`After: ${this.test?.parent?.title}`);
// 		});
//
// 		afterEach(function () {
// 			// This section resets the data directory (removing any cached data)
// 			// This runs after each test, which should make each test independent of the previous one
// 			console.info(`AfterTest: ${this.currentTest?.title}`);
// 			clearDisk();
// 		});
//
// 		describe("Add Dataset", function () {
// 			// This is a unit test. You should create more like this!
// 			it("should reject with an empty dataset id", function () {
// 				const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("given existing dataset id, should not add two of the same", async function () {
// 				// const expected = ['exist'];
// 				await facade.addDataset("exist", sections, InsightDatasetKind.Sections);
// 				const result = facade.addDataset("exist", sections, InsightDatasetKind.Sections);
// 				// expect(temp).to.have.members(['exist']);
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("given valid dataset id, should accept (first) short zip file", function () {
// 				// const expectedResult: string[] = ["courses"];
// 				const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
//
// 				return expect(result).to.eventually.have.members(["courses"]);
// 			});
//
// 			it("given valid dataset id, should accept with full dataset", function () {
// 				// const expectedResult: string[] = ["courses"];
// 				sections = getContentFromArchives("pair.zip");
// 				const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
//
// 				return expect(result).to.eventually.have.members(["courses"]);
// 			});
//
// 			it("given a dataset id containing an underscore, should reject", function () {
// 				const result = facade.addDataset("_", sections, InsightDatasetKind.Sections);
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("given empty zip dataset, should reject", function () {
// 				let emptyZip: string = getContentFromArchives("emptyCourses.zip");
// 				const result = facade.addDataset("emptyZip", emptyZip, InsightDatasetKind.Sections);
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("add multiple valid datasets, should accept short zip file", async function () {
// 				const expectedResult: string[] = ["courses", "secondCourses"];
// 				await facade.addDataset("courses", sections, InsightDatasetKind.Sections);
// 				const result = facade.addDataset("secondCourses", sections, InsightDatasetKind.Sections);
// 				return expect(result).to.eventually.have.members(expectedResult);
// 			});
//
// 			it("should reject with a whitespace dataset id", function () {
// 				const result = facade.addDataset("       ", sections, InsightDatasetKind.Sections);
//
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
// 		});
//
// 		describe("Add Rooms Dataset", function () {
// 			it("should reject with an empty dataset id ROOMS", function () {
// 				const result = facade.addDataset("", rooms, InsightDatasetKind.Rooms);
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("given existing dataset id, should not add two of the same ROOMS", async function () {
// 				// const expected = ['exist'];
// 				await facade.addDataset("exist", rooms, InsightDatasetKind.Rooms);
// 				const result = facade.addDataset("exist", rooms, InsightDatasetKind.Rooms);
// 				// expect(temp).to.have.members(['exist']);
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("given valid ROOMS dataset id, should accept", function () {
// 				// const expectedResult: string[] = ["courses"];
// 				const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
//
// 				return expect(result).to.eventually.have.members(["rooms"]);
// 			});
//
// 			it("given a dataset ROOMS id containing an underscore, should reject", function () {
// 				const result = facade.addDataset("_", rooms, InsightDatasetKind.Rooms);
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("add multiple valid ROOMS datasets, should accept", async function () {
// 				const expectedResult: string[] = ["rooms", "rooms2"];
// 				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
// 				const result = facade.addDataset("rooms2", rooms, InsightDatasetKind.Rooms);
// 				return expect(result).to.eventually.have.members(expectedResult);
// 			});
//
// 			it("should reject with a whitespace dataset id", function () {
// 				const result = facade.addDataset("       ", rooms, InsightDatasetKind.Rooms);
//
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("should reject with a unknown dataset kind", function () {
// 				const result = facade.addDataset("unknown", rooms, "Unknown" as InsightDatasetKind);
//
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
// 		});
//
// 		describe("Remove Dataset", function () {
// 			it("should reject with an empty dataset id for removeDataset", async function () {
// 				const result = await facade.addDataset("rejected", sections, InsightDatasetKind.Sections);
// 				expect(result).to.be.have.members(["rejected"]);
// 				const result2 = facade.removeDataset("");
// 				return expect(result2).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("remove dataset without adding, should reject", function () {
// 				const result = facade.removeDataset("courses");
// 				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
// 			});
//
// 			it("remove dataset given underscore id, should reject", async function () {
// 				const result = await facade.addDataset("rejectedtest", sections, InsightDatasetKind.Sections);
// 				expect(result).to.be.have.members(["rejectedtest"]);
// 				const result2 = facade.removeDataset("_");
// 				return expect(result2).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("remove dataset given short valid dataset, should accept", async function () {
// 				const r1 = await facade.addDataset("courses", sections, InsightDatasetKind.Sections);
// 				expect(r1).to.be.have.members(["courses"]);
// 				// expect(r1).to.have.members(['courses']);
// 				const result = facade.removeDataset("courses");
// 				return expect(result).to.eventually.be.equal("courses");
// 			});
//
// 			it("add 2 and remove 1 dataset given a short valid dataset, should accept", async function () {
// 				await facade.addDataset("courses", sections, InsightDatasetKind.Sections);
// 				const r2 = await facade.addDataset("courses2", sections, InsightDatasetKind.Sections);
// 				expect(r2).to.have.members(["courses", "courses2"]);
// 				const result = facade.removeDataset("courses2");
// 				// const result = facade.removeDataset("courses2");
// 				return expect(result).to.eventually.be.equal("courses2");
// 			});
//
// 			it("remove dataset twice, should reject", async function () {
// 				const r1 = await facade.addDataset("courses", sections, InsightDatasetKind.Sections);
// 				expect(r1).to.have.members(["courses"]);
// 				const r2 = await facade.removeDataset("courses");
// 				expect(r2).to.be.equal("courses");
// 				const result = facade.removeDataset("courses");
// 				// expect(r1).to.eventually.have.members(['courses']);
// 				// expect(r2).to.eventually.equal("courses");
// 				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
// 			});
//
// 			it("should reject because id doesn't match any dataset", function () {
// 				const result = facade.removeDataset("sections2");
//
// 				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
// 			});
//
// 			it("should reject because id is invalid", function () {
// 				const result = facade.removeDataset("ubc_sections");
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("should reject because id is all whitespace", function () {
// 				const result = facade.removeDataset("       ");
//
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("should reject because id is empty", function () {
// 				const result = facade.removeDataset("");
//
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("should return id of dataset removed", async function () {
// 				const r1 = await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
// 				expect(r1).to.have.members(["sections"]);
// 				const result = facade.removeDataset("sections");
//
// 				return expect(result).to.eventually.be.equal("sections");
// 			});
//
// 			it("should reject because dataset was already removed", async function () {
// 				const r1 = await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
// 				expect(r1).to.have.members(["sections"]);
// 				const r2 = await facade.removeDataset("sections");
// 				expect(r2).to.be.equal("sections");
// 				const result = facade.removeDataset("sections");
//
// 				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
// 			});
// 		});
// 		describe("Remove Dataset Rooms", function () {
// 			it("should reject with an empty dataset id ROOMS", async function () {
// 				const result = await facade.addDataset("rejected", rooms, InsightDatasetKind.Rooms);
// 				expect(result).to.be.have.members(["rejected"]);
// 				const result2 = facade.removeDataset("");
// 				return expect(result2).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("remove dataset without adding, should reject ROOMS", function () {
// 				const result = facade.removeDataset("rooms");
// 				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
// 			});
//
// 			it("remove dataset given underscore id, should reject ROOMS", async function () {
// 				const result = await facade.addDataset("rejectedtest", rooms, InsightDatasetKind.Rooms);
// 				expect(result).to.be.have.members(["rejectedtest"]);
// 				const result2 = facade.removeDataset("_");
// 				return expect(result2).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("remove dataset given valid dataset, should accept ROOMS", async function () {
// 				const r1 = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
// 				expect(r1).to.be.have.members(["rooms"]);
// 				// expect(r1).to.have.members(['courses']);
// 				const result = facade.removeDataset("rooms");
// 				return expect(result).to.eventually.be.equal("rooms");
// 			});
//
// 			it("add 2 and remove 1 dataset, should accept ROOMS", async function () {
// 				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
// 				const r2 = await facade.addDataset("rooms2", rooms, InsightDatasetKind.Rooms);
// 				expect(r2).to.have.members(["rooms", "rooms2"]);
// 				const result = facade.removeDataset("rooms2");
// 				// const result = facade.removeDataset("courses2");
// 				return expect(result).to.eventually.be.equal("rooms2");
// 			});
//
// 			it("remove dataset twice, should reject ROOMS", async function () {
// 				const r1 = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
// 				expect(r1).to.have.members(["rooms"]);
// 				const r2 = await facade.removeDataset("rooms");
// 				expect(r2).to.be.equal("rooms");
// 				const result = facade.removeDataset("rooms");
// 				// expect(r1).to.eventually.have.members(['courses']);
// 				// expect(r2).to.eventually.equal("courses");
// 				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
// 			});
//
// 			it("should reject because id doesn't match any dataset ROOMS", function () {
// 				const result = facade.removeDataset("rooms");
//
// 				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
// 			});
//
// 			it("should reject because id is invalid ROOMS", function () {
// 				const result = facade.removeDataset("ubc_rooms");
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("should reject because id is all whitespace ROOMS", function () {
// 				const result = facade.removeDataset("       ");
//
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("should reject because id is empty ROOMS", function () {
// 				const result = facade.removeDataset("");
//
// 				return expect(result).to.eventually.be.rejectedWith(InsightError);
// 			});
//
// 			it("should return id of dataset removed ROOMS", async function () {
// 				const r1 = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
// 				expect(r1).to.have.members(["rooms"]);
// 				const result = facade.removeDataset("rooms");
//
// 				return expect(result).to.eventually.be.equal("rooms");
// 			});
// 		});
//
// 		describe("List Dataset", function () {
// 			it("should list no datasets", async function () {
// 				const datasets = await facade.listDatasets();
//
// 				// Validation
// 				expect(datasets).to.deep.equal([]);
// 			});
//
// 			it("should list one short dataset", async function () {
// 				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
// 				const datasets = facade.listDatasets();
// 				// Validation
// 				expect(datasets).to.eventually.have.deep.members([
// 					{
// 						id: "sections",
// 						kind: InsightDatasetKind.Sections,
// 						numRows: 120,
// 					},
// 				]);
// 			});
//
// 			it("should list two short datasets", async function () {
// 				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
// 				await facade.addDataset("sections5", sections, InsightDatasetKind.Sections);
// 				const datasets = facade.listDatasets();
//
// 				// Validation
// 				expect(datasets).to.eventually.have.deep.members([
// 					{
// 						id: "sections",
// 						kind: InsightDatasetKind.Sections,
// 						numRows: 120,
// 					},
// 					{
// 						id: "sections5",
// 						kind: InsightDatasetKind.Sections,
// 						numRows: 120,
// 					},
// 				]);
// 			});
// 			it("should list one large dataset", async function () {
// 				sections = getContentFromArchives("pair.zip");
// 				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
// 				const datasets = facade.listDatasets();
// 				// Validation
// 				expect(datasets).to.eventually.have.deep.members([
// 					{
// 						id: "sections",
// 						kind: InsightDatasetKind.Sections,
// 						numRows: 64612,
// 					},
// 				]);
// 			});
// 			it("should list one large dataset ROOMS", async function () {
// 				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
// 				const datasets = facade.listDatasets();
// 				// Validation
// 				expect(datasets).to.eventually.have.deep.members([
// 					{
// 						id: "rooms",
// 						kind: InsightDatasetKind.Rooms,
// 						numRows: 364,
// 					},
// 				]);
// 			});
// 			it("should list dataset ROOMS and SECTIONS", async function () {
// 				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
// 				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
// 				const datasets = facade.listDatasets();
// 				// Validation
// 				expect(datasets).to.eventually.have.deep.members([
// 					{
// 						id: "sections",
// 						kind: InsightDatasetKind.Sections,
// 						numRows: 120,
// 					},
// 					{
// 						id: "rooms",
// 						kind: InsightDatasetKind.Rooms,
// 						numRows: 364,
// 					},
// 				]);
// 			});
// 		});
// 	});
// 	describe("Testing Persistance", function () {
// 		before(function () {
// 			console.info(`Before: ${this.test?.parent?.title}`);
// 		});
//
// 		beforeEach(function () {
// 			// This section resets the insightFacade instance
// 			// This runs before each test
// 			console.info(`BeforeTest: ${this.currentTest?.title}`);
// 			facade = new InsightFacade();
// 		});
//
// 		after(function () {
// 			console.info(`After: ${this.test?.parent?.title}`);
// 		});
//
// 		afterEach(function () {
// 			// This section resets the data directory (removing any cached data)
// 			// This runs after each test, which should make each test independent of the previous one
// 			console.info(`AfterTest: ${this.currentTest?.title}`);
// 			clearDisk();
// 		});
// 		it("should show previously added datasets on a new InsightFacade instance", async function () {
// 			sections = getContentFromArchives("pair.zip");
// 			const result = await facade.addDataset("courses", sections, InsightDatasetKind.Sections);
// 			expect(result).to.have.members(["courses"]);
// 			let newFacade: InsightFacade = new InsightFacade();
// 			const newResult = newFacade.listDatasets();
// 			return expect(newResult).to.eventually.have.deep.members([
// 				{
// 					id: "courses",
// 					kind: InsightDatasetKind.Sections,
// 					numRows: 64612,
// 				},
// 			]);
// 		});
// 		it("should show previously added datasets ROOMS on a new InsightFacade instance", async function () {
// 			const result = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
// 			expect(result).to.have.members(["rooms"]);
// 			let newFacade: InsightFacade = new InsightFacade();
// 			const newResult = newFacade.listDatasets();
// 			return expect(newResult).to.eventually.have.deep.members([
// 				{
// 					id: "rooms",
// 					kind: InsightDatasetKind.Rooms,
// 					numRows: 364,
// 				},
// 			]);
// 		});
// 	});
//
// 	/*
// 	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
// 	 * You should not need to modify it; instead, add additional files to the queries directory.
// 	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
// 	 */
// 	describe("PerformQuery", () => {
// 		before(function () {
// 			console.info(`Before: ${this.test?.parent?.title}`);
//
// 			facade = new InsightFacade();
// 			sections = getContentFromArchives("pair.zip");
//
// 			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
// 			// Will *fail* if there is a problem reading ANY dataset.
// 			const loadDatasetPromises = [facade.addDataset("sections", sections, InsightDatasetKind.Sections)];
//
// 			return Promise.all(loadDatasetPromises);
// 		});
//
// 		after(function () {
// 			console.info(`After: ${this.test?.parent?.title}`);
// 			clearDisk();
// 		});
//
// 		type PQErrorKind = "ResultTooLargeError" | "InsightError";
//
// 		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
// 			"Dynamic InsightFacade PerformQuery tests",
// 			(input) => facade.performQuery(input),
// 			"./test/resources/queries/sections",
// 			{
// 				assertOnResult: async (actual, expected) => {
// 					expect(actual).to.be.an.instanceOf(Array);
// 					expect(actual).to.have.length((await expected).length);
// 					expect(actual).to.have.deep.members(await expected);
// 				},
// 				errorValidator: (error): error is PQErrorKind =>
// 					error === "ResultTooLargeError" || error === "InsightError",
// 				assertOnError: (actual, expected) => {
// 					if (expected === "InsightError") {
// 						expect(actual).to.be.instanceof(InsightError);
// 					} else if (expected === "ResultTooLargeError") {
// 						expect(actual).to.be.instanceof(ResultTooLargeError);
// 					} else {
// 						expect.fail("Unexpected error");
// 					}
// 				},
// 			}
// 		);
// 	});
//
// 	describe("PerformQueryRooms", () => {
// 		before(function () {
// 			console.info(`Before: ${this.test?.parent?.title}`);
//
// 			facade = new InsightFacade();
// 			rooms = getContentFromArchives("campus.zip");
//
// 			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
// 			// Will *fail* if there is a problem reading ANY dataset.
// 			const loadDatasetPromises = [facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms)];
//
// 			return Promise.all(loadDatasetPromises);
// 		});
//
// 		after(function () {
// 			console.info(`After: ${this.test?.parent?.title}`);
// 			clearDisk();
// 		});
//
// 		type PQErrorKind = "ResultTooLargeError" | "InsightError";
//
// 		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
// 			"Dynamic InsightFacade PerformQueryRooms tests",
// 			(input) => facade.performQuery(input),
// 			"./test/resources/queries/rooms",
// 			{
// 				assertOnResult: async (actual, expected) => {
// 					// console.log(expected);
// 					expect(actual).to.be.an.instanceOf(Array);
// 					expect(actual).to.have.length((await expected).length);
// 					expect(actual).to.have.deep.members(await expected);
// 				},
// 				errorValidator: (error): error is PQErrorKind =>
// 					error === "ResultTooLargeError" || error === "InsightError",
// 				assertOnError: (actual, expected) => {
// 					if (expected === "InsightError") {
// 						expect(actual).to.be.instanceof(InsightError);
// 					} else if (expected === "ResultTooLargeError") {
// 						expect(actual).to.be.instanceof(ResultTooLargeError);
// 					} else {
// 						expect.fail("Unexpected error");
// 					}
// 				},
// 			}
// 		);
// 	});
// });
