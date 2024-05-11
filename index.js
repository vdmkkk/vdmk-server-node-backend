const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();
const port = 3001; // Ensure this port does not conflict with other services

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.get("/all-hosts", (req, res) => {
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

app.get("/stats", (req, res) => {
  exec("./system_monitor.sh", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send({ error: `exec error: ${error.message}` });
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send({ error: `stderr: ${stderr}` });
    }
    let lines = stdout.split("\n");
    let [cpu1, cpu2] = [lines[0].split(" ")[3], lines[0].split(" ")[5]];
    let [ram1, ram2] = [lines[1].split("/")[0], lines[1].split("/")[1]];
    [ram1, ram2].forEach((el) => {
      if (el.includes("Gi")) {
        el = parseInt(el.slice(0, el.indexOf("Gi"))) * 1024;
      } else {
        el = parseInt(el.slice(0, el.indexOf("Mi")));
      }
    });
    let net = lines[2].slice(0, lines[2].indexOf("Mib"));
    res.send({ result: `${cpu1} ${cpu2} ${ram1} ${ram2} ${net}` });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
