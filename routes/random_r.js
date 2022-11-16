const { Router } = require("express");
const process = require("process");
const { fork } = require("child_process");
const path = require("path");

const router = new Router();

router.get("/", (req, res) => {
    const cant = req.query.cant || 1000000;
    const child = fork(
      path.resolve(process.cwd(), "./controller/random_c.js")
    );    
    child.send(cant);
    child.on("message", (msg) => {
      res.json({ numeros: msg });
    });
  });

module.exports = router