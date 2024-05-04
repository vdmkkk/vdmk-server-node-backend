const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = 3001; // Ensure this port does not conflict with other services

app.use(express.json());

app.post('/run-command', (req, res) => {
    const { command } = req.body;
    exec("sudo arp-scan --localnet", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send({ error: `exec error: ${error.message}` });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send({ error: `stderr: ${stderr}` });
        }
        res.send({ result: stdout });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
