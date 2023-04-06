import express, {Application, NextFunction, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "../controller/IInsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private static insightFacade: InsightFacade = new InsightFacade();
	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		/** NOTE: you can serve static frontend files in from your express server
		 * by uncommenting the line below. This makes files in ./frontend/public
		 * accessible at http://localhost:<port>/
		 */
		this.express.use(express.static("./frontend/public"));
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				return reject("server was already started");
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					return resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					return reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				return reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					return resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here
		this.express.put("/dataset/:id/:kind", Server.put);
		this.express.delete("/dataset/:id", Server.delete);
		this.express.get("/datasets", Server.get);
		this.express.post("/query", Server.post);
	}

	/**
	 * The next two methods handle the echo service.
	 * These are almost certainly not the best place to put these, but are here for your reference.
	 * By updating the Server.echo function pointer above, these methods can be easily moved.
	 */
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private static put(req: Request, res: Response, next: NextFunction) {
		// console.log(`Server::put(..) - params: ${JSON.stringify(req.params)}`)
		const buffer = new Buffer(req.body);
		const zip = buffer.toString("base64");
		const kindString = req.params.kind;
		let kind: InsightDatasetKind;
		if (kindString === "sections") {
			kind = InsightDatasetKind.Sections;
		} else if (kindString === "rooms"){
			kind = InsightDatasetKind.Rooms;
		} else {
			res.status(400).json({error: "invalid kind"});
			return;
		}
		const id = req.params.id;
		if (id === null) {
			res.status(400).json({error: "no id in path"});
			return;
		}
		Server.insightFacade.addDataset(id, zip, kind).then((arr: string[]) => {
			res.status(200).json({result: arr});
		}).catch((err) => {
			res.status(400).json({error: err.message});
		});
		// try {
		// 	const result = await Server.insightFacade.addDataset(id, zip, kind);
		// 	res.status(200).json({result: result});
		// } catch (err: any) {
		// 	res.status(400).json({error: err.message});
		// }
		// res.status(200).json({result: []});
	}

	private static delete(req: Request, res: Response) {
		const id = req.params.id;
		if (id === null) {
			res.status(400).json({error: "no id in path"});
			return;
		}
		Server.insightFacade.removeDataset(id).then((str: string) => {
			res.status(200).json({result: str});
		}).catch((err) => {
			if (err instanceof InsightError) {
				res.status(400).json({error: err.message});
			}
			if (err instanceof NotFoundError) {
				res.status(404).json({error: err.message});
			}
		});
	}

	private static get(req: Request, res: Response) {
		Server.insightFacade.listDatasets().then((arr: InsightDataset[]) => {
			res.status(200).json({result: arr});
		});
	}

	private static post(req: Request, res: Response) {
		// const query = JSON.parse(req.body).input;
		const query = req.body;
		Server.insightFacade.performQuery(query).then((arr: InsightResult[]) => {
			res.status(200).json({result: arr});
		}).catch((err) => {
			res.status(400).json({error: err.message});
		});
	}
}
