const fs = require("fs");
const files = process.argv.slice(2);
const wrong = "</" + "motion.div>";
const right = String.fromCharCode(60, 47, 100, 105, 118, 62);
for (const p of files) {
  let t = fs.readFileSync(p, "utf8");
  if (!t.includes(wrong)) continue;
  t = t.split(wrong).join(right);
  fs.writeFileSync(p, t);
  console.log("fixed", p);
}
