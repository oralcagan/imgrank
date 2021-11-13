import express from "express";
import pg from "pg";
import fs from 'fs/promises';
import sharp from 'sharp';
import url from 'url';

function timestamp(): string {
    return Date.now().toString()
}

async function toJPG(img: Buffer): Promise<Buffer> {
    return await sharp(img).jpeg({ mozjpeg: true }).toBuffer()
}

let client = new pg.Client({
    connectionString: "postgres://postgres:123@localhost:5432/mydb"
});
client.connect(err => {
    if (err) {
        process.exit(0);
    }
})

let app = express();
let port = 8000;

app.use(express.json({ limit: "100mb" }))
app.use(express.static('public'));
app.use("/img", express.static("img"));

app.get("/top10", async (req, res) => {
    try {
        let q = await client.query("SELECT ts FROM img order by ts_db desc limit 5");
        let top: { rows: string[] } = {
            rows: []
        };
        for (let i = 0; i < q.rows.length; i++) {
            top.rows.push(q.rows[i].ts)
        }
        res.setHeader("Cache-Control","max-age=15")
        res.json(top)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
});

app.get("/random", async (req, res) => {
    try {
        let q = await client.query("select ts from img order by random() limit 1");
        if (q.rows[0]) {
            let ts = q.rows[0].ts as string;
            res.redirect(url.format({
                query: {
                    img: ts
                },
                pathname: "/img.html"
            }));
        } else {
            res.redirect("/")
        }
    } catch (err) {
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
            await fs.writeFile("./img/" + ts + ".jpg", buf);
            await client.query("INSERT INTO img (ts) VALUES($1);", [ts]);
            res.sendStatus(200)
            return
        } catch (err) {
            console.log(err)
            res.sendStatus(400);
            return
        }
    }
    res.sendStatus(400);
})

app.listen(port, () => console.log("running"));