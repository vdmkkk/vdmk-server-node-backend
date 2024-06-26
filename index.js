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

app.get("/get-stats", async (req, res) => {
  try {
    const cpu = await db.query("SELECT * FROM cpu");
    const ram = await db.query("SELECT * FROM ram");
    const network = await db.query("SELECT * FROM network");
    res.json({
      cpu: cpu.rows,
      ram: ram.rows,
      network: network.rows,
    });
  } catch (e) {
    res.json({ error: e });
  }
});

const getStats = () => {
  try {
    exec("./system_monitor.sh", async (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
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
      const unixTimestamp = Math.floor(Date.now() / 1000);

      await db.query(
        `INSERT INTO cpu (usr, sys, timestamp) values ($1, $2, $3) RETURNING *`,
        [cpu1, cpu2, unixTimestamp]
      );
      await db.query(
        `INSERT INTO ram (used, max, timestamp) values ($1, $2, $3) RETURNING *`,
        [rams[0], rams[1], unixTimestamp]
      );
      await db.query(
        `INSERT INTO network (used, timestamp) values ($1, $2) RETURNING *`,
        [net, unixTimestamp]
      );
      // console.log(dbRes.rows);
    });
  } catch (e) {
    console.error("error during gathering stats: ", e);
  }
};

const fiveMinutes = 5 * 60 * 1000;
setInterval(getStats, fiveMinutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
