document.addEventListener("DOMContentLoaded", async() => {
    const content = document.getElementById("content");
    const orderTemplate = document.getElementById("order_template");

    const businessApplications = await fetch("/bu").then((res) => res.json());

    const clone = document.importNode(orderTemplate.content, true);
    const tbody = clone.querySelector("tbody");

    const fragment = document.createDocumentFragment();
    for (const [name, trigram, status, lastUpdate] of businessApplications) {
        const tr = document.createElement("tr");

        const trigramElement = document.createElement("td");
        trigramElement.classList.add("center");
        trigramElement.appendChild(document.createTextNode(trigram));

        const nameElement = document.createElement("td");
        nameElement.appendChild(document.createTextNode(name));

        const statusElement = document.createElement("td");
        statusElement.classList.add("center");
        statusElement.appendChild(document.createTextNode(status ? "✔️" : "❌"));

        const updateElement = document.createElement("td");
        updateElement.style.width = "300px";
        updateElement.classList.add("center");
        updateElement.appendChild(document.createTextNode(new Date(lastUpdate).toUTCString()));

        tr.appendChild(trigramElement);
        tr.appendChild(nameElement);
        tr.appendChild(statusElement);
        tr.appendChild(updateElement);
        fragment.appendChild(tr);
    }
    tbody.appendChild(fragment);

    content.appendChild(clone);
});
