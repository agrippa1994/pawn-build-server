const fs = require("fs");
const app = require("express")();
const bodyParser = require("body-parser");
const simpleGit = require("simple-git");
const uuid = require("node-uuid");
const xhub = require("express-x-hub");
const pawn = require("./pawn.js");
const db = require("./db.js");

const config = JSON.parse(fs.readFileSync("./config.json"));
app.use(xhub({ algorithm: "sha1", secret: config.secret }));
app.use(bodyParser.json());
app.use((req, res, next) => {
	res.json = (data, status) => {
		res.set("Content-Type", "application/json");
		res.status(status || 200);
		res.end(JSON.stringify(data));
	};

	next();
});

app.post("/", (req, res) => {
	try {
		if(!req.isXHubValid()) {
			console.log("Invalid X Hub request!");
			return res.json({ error: "No access" }, 403);
		}
		
		const url = req.body.repository.ssh_url || "";
		const message = req.body.head_commit.message || "";
		const author = req.body.head_commit.author.name || "";

		const projectUUID = uuid.v4();
		const folderName = `builds/${projectUUID}`;

		console.log(`Got build request, latest message was: ${message}, author: ${author}`);

		console.log(`Clone started from ${url}`);

		simpleGit().clone(url, folderName, (err, data) => {
			if(err) {
				console.log(`Clone from ${url} failed: ${JSON.stringify(err)}`);
				return res.json(err, 500);
			}

			console.log(`Successfully cloned ${url} to ${folderName}`);
			console.log("Compilation started ...");

			const gameModeFolder = `${__dirname}/${folderName}/gamemodes/`;
			const gameModeName = config.gamemode;
			const includeFolder = `${__dirname}/${folderName}/pawno/include/`;
			const deployPath = config.deployPath;

			const pawnCompileHandler = (code, stdout, stderr) => {
				var status = 200;
				if(code == 0) {
					console.log("Compilation success!");
				}
				else {
					console.log("Compilation failed: " + stderr);
					status = 400;
				}

				const data = { 
					author: author,
					message: message,
					uuid: projectUUID,
					code: code,
					stdout: stdout, 
					stderr: stderr
				};

				db.build.create(data);
				res.json(data, status);
			};

			pawn(gameModeFolder, gameModeName, includeFolder, deployPath, pawnCompileHandler);
		});
	}
	catch(e) {
		res.json(e, 500);
	}
});

app.get("/builds", (req, res) => {
	db.build.findAll({ order: [["id", "DESC"]] }).then(
		(data) => res.json(data),
		(err) => res.json(err, 500)
	);
});

app.get("*", (req, res) => {
    var options = {
        root: `${__dirname}/www/`,
        dotfiles: "deny",
        index: "index.html",
        headers: {
            "x-timestamp": Date.now(),
            "x-sent": true
        }
    };
    
    const fileName = req.params["0"];
    res.sendFile(fileName, options, (error) => {
		if(error) {
			res.status(error.status || 500).end();
		}
    });
});

db.init().then(
	() => {
		console.log("Database initialized, starting Server");
		app.listen(config.port, () => console.log("Server started"));
	},
	(e) => {
		console.log(`Error initializing database ${JSON.stringify(e)}`);
		process.exit(1);
	}
);


