function a() {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('img');
    let container = document.getElementById("images");
    let img = document.createElement("img");
    img.src = "img/" + url + ".jpg";
    img.className = "img-container-big"
    container.appendChild(img);
}

window.onload = a;