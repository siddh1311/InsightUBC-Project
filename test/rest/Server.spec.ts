import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect, use} from "chai";
import request, {Response} from "supertest";
import * as fs from "fs-extra";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

describe("Server", () => {

	let facade: InsightFacade;
	let server: Server;
	let app: string;
	let sections: string;
	let rooms: string;

	before(async () => {
		server = new Server(4321);
		sections = getContentFromArchives("pair.zip");
		rooms = getContentFromArchives("campus.zip");
		app = "http://localhost:4321";
		server.start().then(() => {
			console.log("success");
		}).catch((err) => {
			console.log(err.message);
		});
		clearDisk();
	});

	after(async () => {
		server.stop().then(() => {
			console.log("successful stop");
		}).catch((err) => {
			console.log("could not stop: " + err.message);
		});
		clearDisk();
	});

	describe("PUT tests", function () {
		before(() => {
			// might want to add some process logging here to keep track of what's going on
			facade = new InsightFacade();
		});

		after(() => {
			// might want to add some process logging here to keep track of what's going on
			clearDisk();
		});

		// Sample on how to format PUT requests
		it("PUT test for courses dataset",async () => {
			try {
				return request(app)
					.put("/dataset/sections/sections")
					.send(fs.readFileSync("test/resources/archives/pair.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(200);
						// more assertions here
						expect(res.body.result).to.have.members(["sections"]);
					})
					.catch((err) => {
						// some logging here please!
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("PUT test rooms kind with section dataset",async () => {
			try {
				return request(app)
					.put("/dataset/sections/rooms")
					.send(fs.readFileSync("test/resources/archives/pair.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(400);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("PUT test sections kind with rooms dataset",async () => {
			try {
				return request(app)
					.put("/dataset/rooms/sections")
					.send(fs.readFileSync("test/resources/archives/campus.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						// console.log(res.error);
						expect(res.status).to.be.equal(400);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("PUT test for incorrect kind",async () => {
			try {
				return request(app)
					.put("/dataset/courses/incorrect")
					.send(fs.readFileSync("test/resources/archives/pair.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(400);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("PUT test for empty dataset",async () => {
			try {
				return request(app)
					.put("/dataset/courses/sections")
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(400);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("PUT test for invalid id",async () => {
			try {
				return request(app)
					.put("/dataset/cou_rses/sections")
					.send(fs.readFileSync("test/resources/archives/pair.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(400);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("PUT test for empty space id",async () => {
			try {
				return request(app)
					.put("/dataset/%20/sections")
					.send(fs.readFileSync("test/resources/archives/pair.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(400);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("PUT test for rooms dataset",async () => {
			try {
				return request(app)
					.put("/dataset/rooms/rooms")
					.send(fs.readFileSync("test/resources/archives/campus.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(200);
						expect(res.body.result).to.have.members(["sections", "rooms"]);
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("PUT test 400 error",async () => {
			try {
				return request(app)
					.put("/dataset/rooms_/rooms")
					.send(fs.readFileSync("test/resources/archives/campus.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(400);
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});
	});

	describe("DELETE tests", function () {
		before(() => {
			clearDisk();
			// might want to add some process logging here to keep track of what's going on
			facade = new InsightFacade();
		});

		after(() => {
			// might want to add some process logging here to keep track of what's going on
			clearDisk();
		});

		it("DELETE test for rooms dataset", async () => {
			try {
				return request(app)
					.delete("/dataset/rooms")
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(200);
						// more assertions here
						// const result = facade.listDatasets();
						expect(res.body.result).to.be.equal("rooms");
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("DELETE test 404 already deleted",async () => {
			// await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			try {
				return request(app)
					.delete("/dataset/rooms")
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(404);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("DELETE test 400 error invalid id", async () => {
			// await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			try {
				return request(app)
					.delete("/dataset/rooms_")
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(400);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		// Sample on how to format PUT requests
		it("DELETE test for courses dataset", async () => {
			try {
				return request(app)
					.delete("/dataset/sections")
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(200);
						// more assertions here
						// const result = facade.listDatasets();
						expect(res.body.result).to.be.equal("sections");
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});
	});

	describe("GET tests", function () {
		before(() => {
			facade = new InsightFacade();
		});
		beforeEach(() => {
			// might want to add some process logging here to keep track of what's going on
			// facade = new InsightFacade();
		});

		after(() => {
			// might want to add some process logging here to keep track of what's going on
			clearDisk();
		});

		it("PUT sections dataset for getting",async () => {
			try {
				return request(app)
					.put("/dataset/sections/sections")
					.send(fs.readFileSync("test/resources/archives/pair.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(200);
						expect(res.body.result).to.have.members(["sections"]);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		// Sample on how to format PUT requests
		it("GET test for courses dataset",async () => {
			try {
				return request(app)
					.get("/datasets")
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						const expected = [
							{
								id: "sections",
								kind: InsightDatasetKind.Sections,
								numRows: 64612,
							},
						];
						expect(res.status).to.be.equal(200);
						expect(res.body.result).to.have.deep.members(expected);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("PUT rooms dataset for getting",async () => {
			try {
				return request(app)
					.put("/dataset/rooms/rooms")
					.send(fs.readFileSync("test/resources/archives/campus.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						expect(res.status).to.be.equal(200);
						expect(res.body.result).to.have.members(["sections", "rooms"]);
					})
					.catch((err) => {
						// some logging here please!
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("GET test for rooms dataset",async () => {
			try {
				return request(app)
					.get("/datasets")
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						const expected = [
							{
								id: "sections",
								kind: InsightDatasetKind.Sections,
								numRows: 64612,
							},
							{
								id: "rooms",
								kind: InsightDatasetKind.Rooms,
								numRows: 364,
							}
						];
						expect(res.status).to.be.equal(200);
						expect(res.body.result).to.have.deep.members(expected);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});
	});

	describe("POST tests", function () {
		before(() => {
			facade = new InsightFacade();
		});

		beforeEach(() => {
			// might want to add some process logging here to keep track of what's going on
		});

		after(() => {
			clearDisk();
		});

		// Sample on how to format PUT requests
		it("POST test for sections dataset query", async () => {
			let expected = [
				{sections_dept: "lfs", sections_avg: 0},
				{sections_dept: "lfs", sections_avg: 0},
				{sections_dept: "frst", sections_avg: 0},
				{sections_dept: "wood", sections_avg: 1},
				{sections_dept: "busi", sections_avg: 4},
				{sections_dept: "busi", sections_avg: 4},
				{sections_dept: "fopr", sections_avg: 4.5}
			];
			let query = JSON.parse(fs.readFileSync("./test/resources/queries/server/lessThan5000Server.json", "utf8"));
			// console.log(query);
			try {
				return request(app)
					.post("/query")
					.send(new Buffer(query))
					.set("Content-Type", "application/json")
					.then((res: Response) => {
						// console.log(res.status);
						expect(res.status).to.be.equal(200);
						// more assertions here
						// console.log(res.body.result);
						expect(res.body.result).to.be.an.instanceof(Array);
						expect(res.body.result).to.have.deep.members(expected);
					})
					.catch((err) => {
						// some logging here please!
						// console.log(err);
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("POST test for sections dataset query fail",async () => {
			let query = JSON.parse(fs.readFileSync("./test/resources/queries/server/invalid.json").toString());
			// let query = JSON.parse(file).input;
			try {
				return request(app)
					.post("/query")
					.send(new Buffer(query))
					.set("Content-Type", "application/json")
					.then((res: Response) => {
						expect(res.status).to.be.equal(400);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("POST test fail: dataset not added", async () => {
			let query = JSON.parse(fs.readFileSync("./test/resources/queries/server/lessThan5000Server.json")
				.toString());
			// let query = JSON.parse(file).input;
			try {
				return await request(app)
					.post("/query")
					.send(new Buffer(query))
					.set("Content-Type", "application/json")
					.then((res: Response) => {
						expect(res.status).to.be.equal(400);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						expect.fail(err.message);
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		// it("POST test persistance", async () => {
		// 	let expected = [
		// 		{sections_dept: "lfs", sections_avg: 0},
		// 		{sections_dept: "lfs", sections_avg: 0},
		// 		{sections_dept: "frst", sections_avg: 0},
		// 		{sections_dept: "wood", sections_avg: 1},
		// 		{sections_dept: "busi", sections_avg: 4},
		// 		{sections_dept: "busi", sections_avg: 4},
		// 		{sections_dept: "fopr", sections_avg: 4.5}
		// 	];
		// 	let query = fs.readFileSync("./test/resources/queries/sections/lessThan5000.json", "utf8");
		// 	await facade.addDataset("courses", sections, InsightDatasetKind.Sections);
		// 	await server.stop();
		// 	let newServer: Server =  new Server(4321);
		// 	await newServer.start();
		// 	try {
		// 		return await request(app)
		// 			.post("/query")
		// 			.send(query)
		// 			.set("Content-Type", "application/x-zip-compressed")
		// 			.then((res: Response) => {
		// 				expect(res.status).to.be.equal(200);
		// 				// more assertions here
		// 				expect(res.body).to.deep.equal(expected);
		// 				newServer.stop().then(() => {
		// 					console.log("successful stop on newServer");
		// 				}).catch((err) => {
		// 					console.log("could not stop newServer: " + err.message);
		// 				});
		// 			})
		// 			.catch((err) => {
		// 				// some logging here please!
		// 				expect.fail(err.message);
		// 			});
		// 	} catch (err) {
		// 		// and some more logging here!
		// 	}
		// });
	});
	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
