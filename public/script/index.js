function a() {
    console.log("hey")
    let container = document.getElementById("images");
    fetch(document.location.origin + "/top10").then(res => res.json()).then(res => {
        console.log(res)
        for (let i = 0; i < res.rows.length; i++) {
            console.log(res.rows[i])
            let img = document.createElement("img");
            img.src = "img/" + res.rows[i] + ".jpg";
            img.className = "img-container"
            container.appendChild(img);
        }
    })
}

window.onload = a;