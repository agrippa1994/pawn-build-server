const fs = require("fs");
const app = require("express")();
const bodyParser = require("body-parser");
const simpleGit = require("simple-git");
const uuid = require("node-uuid");
const xhub = require("express-x-hub");
const pawn = require("./pawn.js");

const config = JSON.parse(fs.readFileSync("./config.json"));
app.use(xhub({ algorithm: "sha1", secret: config.secret }));
app.use(bodyParser.json());

app.post("/", (req, res) => {
	try {
		if(!req.isXHubValid()) {
			console.log("Invalid X Hub request!");
			return res.status(403).send({ error: "No access" });
		}
		
		const url = req.body.repository.ssh_url || "";
		const message = req.body.head_commit.message || "";

		const folderName = `builds/${uuid.v4()}`;

		console.log(`Got build request, latest message was: ${message}`);
		console.log(`Clone started from ${url}`);

		simpleGit().clone(url, folderName, (err, data) => {
			if(err) {
				console.log(`Clone from ${url} failed: ${JSON.stringify(err)}`);
				return res.status(500).end(JSON.stringify(err));
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

				res.status(status).end(JSON.stringify({ 
					code: code, 
					stdout: stdout, 
					stderr: stderr
				}));
			};

			pawn(gameModeFolder, gameModeName, includeFolder, deployPath, pawnCompileHandler);
		});
	}
	catch(e) {
		res.status(500).end(JSON.stringify(e));
	}
});

app.listen(config.port);
