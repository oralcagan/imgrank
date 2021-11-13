"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = __importDefault(require("pg"));
const promises_1 = __importDefault(require("fs/promises"));
const sharp_1 = __importDefault(require("sharp"));
const url_1 = __importDefault(require("url"));
function timestamp() {
    return Date.now().toString();
}
async function toJPG(img) {
    return await (0, sharp_1.default)(img).jpeg({ mozjpeg: true }).toBuffer();
}
let client = new pg_1.default.Client({
    connectionString: "postgres://postgres:123@localhost:5432/mydb"
});
client.connect(err => {
    if (err) {
        process.exit(0);
    }
});
let app = (0, express_1.default)();
let port = 8000;
app.use(express_1.default.json({ limit: "100mb" }));
app.use(express_1.default.static('public'));
app.use("/img", express_1.default.static("img"));
app.get("/top10", async (req, res) => {
    try {
        let q = await client.query("SELECT ts FROM img order by ts_db desc limit 5");
        let top = {
            rows: []
        };
        for (let i = 0; i < q.rows.length; i++) {
            top.rows.push(q.rows[i].ts);
        }
        res.setHeader("Cache-Control", "max-age=15");
        res.json(top);
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});
app.get("/random", async (req, res) => {
    try {
        let q = await client.query("select ts from img order by random() limit 1");
        if (q.rows[0]) {
            let ts = q.rows[0].ts;
            res.redirect(url_1.default.format({
                query: {
                    img: ts
                },
                pathname: "/img.html"
            }));
        }
        else {
            res.redirect("/");
        }
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});
app.post("/submit", async (req, res) => {
    let img = req.body.img;
    if (img) {
        let buf = Buffer.from(img, "base64");
        let ts = timestamp();
        try {
            buf = await toJPG(buf);
            await promises_1.default.writeFile("./img/" + ts + ".jpg", buf);
            await client.query("INSERT INTO img (ts) VALUES($1);", [ts]);
            res.sendStatus(200);
            return;
        }
        catch (err) {
            console.log(err);
            res.sendStatus(400);
            return;
        }
    }
    res.sendStatus(400);
});
app.listen(port, () => console.log("running"));
