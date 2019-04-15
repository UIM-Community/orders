document.addEventListener("DOMContentLoaded", () => {
    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json"
    };
    const aside = document.getElementById("content");
    const menuBusinessApp = document.getElementById("menu_ba");
    const menuOrders = document.getElementById("menu_orders");
    const whiteBg = document.getElementById("whiteBG");
    const modal = document.querySelector(".modal");
    let activeMenu = null;

    function openModal(templateName, handler) {
        whiteBg.classList.remove("hidden");
        const template = document.getElementById(templateName);
        const clone = document.importNode(template.content, true);
        handler(clone);

        modal.appendChild(clone);
    }

    function setupMenu(menu) {
        if (activeMenu !== null) {
            aside.innerHTML = "";
            activeMenu.classList.remove("active");
        }
        activeMenu = menu;
        activeMenu.classList.add("active");
    }

    menuBusinessApp.addEventListener("click", async() => {
        // Fetch view
        setupMenu(menuBusinessApp);
        const html = await fetch("/view/business_application").then((res) => res.text());
        aside.innerHTML = html;

        const searchBox = document.getElementById("search_active");

        // Add search handlers & events
        document.getElementById("search").addEventListener("submit", (event) => {
            event.preventDefault();
            const searchName = document.getElementById("search_value").value.toLowerCase();
            filterTable("search_value");

            if (searchName.trim() === "") {
                searchBox.dispatchEvent(new Event("change"));
            }
        });

        searchBox.addEventListener("change", (event) => {
            filterTableByActive(event.target.checked);
        });

        // Fetch and hydrate business applications
        let businessApplications = await fetch("/bu").then((res) => res.json());
        businessApplications = businessApplications.sort((left, right) => right[3] - left[3]);

        const _t = new DynamicTable("businessapp_template");
        for (const [name, trigram, status, lastUpdate] of businessApplications) {
            const date = formatDate(new Date(lastUpdate));
            async function click() {
                const result = await fetch(`/bu/${trigram}`).then((res) => res.json());
                openModal("businessapp_modal", (clone) => {
                    clone.querySelector(".title").textContent = name;

                    const attrBody = clone.getElementById("attr");
                    for (const [title, owner, update] of result.attributes) {
                        const tr = document.createElement("tr");
                        tr.appendChild(createTd(title));
                        tr.appendChild(createTd(owner));
                        tr.appendChild(createTd(formatDate(new Date(update))));
                        attrBody.appendChild(tr);
                    }
                });
            }

            _t.addRow([
                trigram,
                { value: name },
                status ? "✔️" : "❌",
                date,
                { value: "🔎", center: true, click }
            ], status);
        }
        aside.appendChild(_t.close());
    });

    menuOrders.addEventListener("click", async() => {
        // Fetch view
        setupMenu(menuOrders);
        const html = await fetch("/view/orders").then((res) => res.text());
        aside.innerHTML = html;

        const searchBox = document.getElementById("search_active");

        // Add search handlers & events
        document.getElementById("search").addEventListener("submit", (event) => {
            event.preventDefault();
            const searchName = document.getElementById("search_value").value.toLowerCase();
            searchOrder("search_value");

            if (searchName.trim() === "") {
                searchBox.dispatchEvent(new Event("change"));
            }
        });

        searchBox.addEventListener("change", (event) => {
            filterTableByActive(event.target.checked, 4);
        });

        const createOrder = document.getElementById("btn_createOrder");
        createOrder.addEventListener("click", () => {
            // eslint-disable-next-line
            openModal("order_create_modal", (clone) => {
                const formCreateOrder = clone.getElementById("create_order");
                formCreateOrder.appendChild(createGroup([
                    createMaterialInput("Title", { max: 50 }),
                    createMaterialInput("Application (Trigram)", { max: 3 })
                ]));
                formCreateOrder.appendChild(createGroup([
                    createMaterialInput("Mail"),
                    createMaterialInput("Information")
                ]));
                formCreateOrder.appendChild(createGroup([
                    createMaterialInput("Service Now"),
                    createMaterialInput("Team")
                ]));
                formCreateOrder.appendChild(createMaterialInput("Description"));
                const submit = document.createElement("input");
                submit.setAttribute("type", "submit");
                submit.value = "Create";

                formCreateOrder.appendChild(submit);

                formCreateOrder.addEventListener("submit", async(event) => {
                    event.preventDefault();
                    const inputs = [...formCreateOrder.querySelectorAll("input")];
                    const [title, app, mail, information, serviceNow, team, description] = inputs;

                    const body = {
                        application: app.value,
                        attr: {
                            title: title.value,
                            description: description.value,
                            team: team.value,
                            servicenow: serviceNow.value,
                            mail: mail.value,
                            information: information.value
                        }
                    };

                    const rawResponse = await fetch("/order", {
                        method: "POST",
                        headers,
                        body: JSON.stringify(body)
                    });

                    if (rawResponse.status === 201) {
                        document.getElementById("modal_close").click();
                        menuOrders.click();
                    }
                    else {
                        const spanEl = document.getElementById("modal_error");
                        spanEl.textContent = await rawResponse.text();
                        spanEl.style.display = "flex";
                    }
                });
            });
        });

        // Fetch and hydrate orders
        let orders = await fetch("/order").then((res) => res.json());
        orders = orders.sort((left, right) => right[3] - left[3]);

        const _t = new DynamicTable("order_template");
        for (const [id, number, status, lastUpdate, trigram, name, title] of orders) {
            const date = formatDate(new Date(lastUpdate));
            async function click() {
                const result = await fetch(`/order/${id}/attr`).then((res) => res.json());

                openModal("order_modal", (clone) => {
                    clone.querySelector(".title").textContent = `Order n'${number} (id: ${id})`;

                    const attrBody = clone.getElementById("attr");
                    for (const [title, value] of Object.entries(result)) {
                        const tr = document.createElement("tr");
                        tr.appendChild(createTd(title));
                        tr.appendChild(createInputTd(title, value));
                        attrBody.appendChild(tr);
                    }

                    const orderActive = clone.getElementById("order_active");
                    if (!status) {
                        orderActive.checked = false;
                    }
                    let initialState = orderActive.checked;

                    const btnSave = clone.getElementById("btn_order_save");
                    btnSave.addEventListener("click", async() => {
                        const inputs = document.querySelectorAll("input.modal_input");

                        if (initialState !== orderActive.checked) {
                            fetch(`/order/${number}`, {
                                method: "PATCH",
                                headers,
                                body: JSON.stringify({ status: orderActive.checked })
                            });
                        }

                        let stayInModal = false;
                        for (const input of inputs) {
                            const body = { key: input.id, value: input.value };
                            if (result[input.id] === body.value) {
                                continue;
                            }

                            const httpResponse = await fetch(`/order/${id}/attr`, {
                                method: "PATCH",
                                headers,
                                body: JSON.stringify(body)
                            });
                            if (httpResponse.status !== 200) {
                                const spanEl = document.getElementById("modal_error");
                                spanEl.textContent = await httpResponse.text();
                                spanEl.style.display = "flex";
                                stayInModal = true;
                                break;
                            }
                        }

                        if (!stayInModal) {
                            document.getElementById("modal_close").click();
                            menuOrders.click();
                        }
                    });
                });
            }

            _t.addRow([
                { value: `🔎 ${number}`, center: true, click: () => {
                    console.log("clicked!");
                } },
                trigram,
                name,
                title,
                status ? "✔️" : "❌",
                date,
                { value: "⚙️", center: true, click }
            ], status);
        }
        aside.appendChild(_t.close());
    });

    function modalClose() {
        whiteBg.classList.add("hidden");
        while (modal.firstChild) {
            modal.removeChild(modal.firstChild);
        }
        modal.innerHTML = "<div id=\"modal_close\">X</div>";
        document.getElementById("modal_close").addEventListener("click", modalClose);
    }
    document.getElementById("modal_close").addEventListener("click", modalClose);
    menuBusinessApp.click();
});
