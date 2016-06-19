const spawn = require("child_process").spawn;
const fs = require("fs");
const os = require("os");

function pawn(scriptPath, scriptName, includePath, deployPath, callback) {
	var stdout = "";
	var stderr = "";
	
	const args = [
		`${scriptPath}/${scriptName}.pwn`,
		`-o${deployPath}/${scriptName}.amx`,
		`-i${includePath}`
	];

	var proc;
	if(os.platform() == "linux") {
		const env = { LD_LIBRARY_PATH: `${__dirname}/pawn/linux`};
		proc = spawn(`${__dirname}/pawn/linux/pawncc`, args, { env: env });
	} else if(os.platform() == "win32") {
		proc = spawn(`${__dirname}/pawn/win32/pawncc`, args);
	}

	proc.stdout.on('data', (data) => {
		stdout += data;
	});

	proc.stderr.on('data', (data) => {
		stderr += data;
	});

	proc.on('close', (code) => {
		callback(code, stdout, stderr);
	});
}

module.exports = pawn;
