const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const db = require("./db");

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
  exec("./system_monitor.sh", async (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send({ error: `exec error: ${error.message}` });
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send({ error: `stderr: ${stderr}` });
    }
    let lines = stdout.split("\n");
    let [cpu1, cpu2] = [
      parseInt(lines[0].split(" ").filter((el) => el != "")[3]),
      parseInt(lines[0].split(" ").filter((el) => el != "")[5]),
    ];
    let [ram1, ram2] = [lines[1].split("/")[0], lines[1].split("/")[1]];
    rams = [];
    [ram1, ram2].forEach((el) => {
      var el;
      if (el.includes("Gi")) {
        el = parseInt(parseFloat(el.slice(0, el.indexOf("Gi"))) * 1024);
      } else {
        el = parseInt(el.slice(0, el.indexOf("Mi")));
      }
      rams.push(el);
    });
    let net = lines[2].slice(0, lines[2].indexOf("Mi"));
    console.log(cpu1, cpu2);
    console.log(rams);
    console.log(net);

    const dbRes = await db.query("SELECT * FROM cpu");
    console.log(dbRes.rows);
    res.send({ result: `OK` });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
