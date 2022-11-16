const process = require("process");
const result = {};
function numerosRandom(numeros) {  
  let randomN = [];
  for (let i = 0; i < numeros; i++) {
    randomN.push(Math.floor(Math.random() * 1000) + 1);
  }
  randomN.forEach((x) => {
    result[x] = (result[x] || 0) + 1;
  });
  return randomN.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});
}

process.on("exit", () => {
  console.log(`Saliendo del proceso ${process.pid}`);
  console.log(result);
});

process.on("message", (cantidad) => {
  let random_numeros = numerosRandom(cantidad);  
  process.send(random_numeros);
  process.exit();
});
