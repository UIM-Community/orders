document.addEventListener("DOMContentLoaded", () => {
    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json"
    };
    const aside = document.getElementById("content");
    const menuBusinessApp = document.getElementById("menu_ba");
    const menuOrders = document.getElementById("menu_orders");
    const menuAction = document.getElementById("menu_action");
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

    function setUrl(args = {}) {
        const currUrl = new URL(window.location);
        currUrl.searchParams.delete("id");
        currUrl.searchParams.delete("number");
        for (const [key, value] of Object.entries(args)) {
            currUrl.searchParams.set(key, value);
        }
        window.history.pushState("page", "Title", currUrl.href);
    }

    function setupMenu(menu) {
        if (activeMenu !== null) {
            aside.innerHTML = "";
            activeMenu.classList.remove("active");
        }
        activeMenu = menu;
        activeMenu.classList.add("active");
    }

    async function openAction(id, number) {
        setupMenu(menuAction);
        setUrl({ page: "action", id, number });
        const html = await fetch("/view/action").then((res) => res.text());
        aside.innerHTML = html;

        const title = document.querySelector(".action_title");
        title.textContent = `Order Number: ${number}`;

        const actionElement = document.getElementById("action_groups");
        const conditions = await fetch(`order/${id}/action`).then((res) => res.json());
        const template = document.getElementById("condition");

        const fragment = document.createDocumentFragment();
        for (const condition of conditions) {
            const details = createDetails(`Condition n'${condition.condition}`);
            const clone = document.importNode(template.content, true);

            const line = clone.querySelector(".double_group");
            const trigramGroup = createMaterialInput("Application Trigram");
            const tokenGroup = createMaterialInput("Regex ( Token )");

            trigramGroup.childNodes[0].value = condition.trigram;
            tokenGroup.childNodes[0].value = atob(condition.token);
            line.appendChild(trigramGroup);
            line.appendChild(tokenGroup);

            const _t = new DynamicTable("action_table");
            for (const { type, schedule, arguments: args } of condition.json) {
                const reSchedule = schedule.slice(0, 50);
                _t.addRow([
                    type,
                    reSchedule,
                    { value: args.template, center: false },
                    { value: "✏️", center: true }
                ]);
            }
            clone.appendChild(_t.close());

            clone.appendChild(document.createElement("hr"));
            const btnSave = document.createElement("button");
            btnSave.disabled = true;
            btnSave.textContent = "Save";
            clone.appendChild(btnSave);

            details.appendChild(clone);
            fragment.appendChild(details);
        }
        actionElement.appendChild(fragment);
    }

    menuBusinessApp.addEventListener("click", async() => {
        // Fetch view
        setupMenu(menuBusinessApp);
        setUrl({ page: "businessapp" });
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
            const value = event.target.options[event.target.selectedIndex].value;
            filterTableByActive(value === "all" ? null : value === "active");
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
        setUrl({ page: "orders" });
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
            const value = event.target.options[event.target.selectedIndex].value;
            filterTableByActive(value === "all" ? null : value === "active", 4);
        });

        const createOrder = document.getElementById("btn_createOrder");
        createOrder.addEventListener("click", () => {
            // eslint-disable-next-line
            openModal("order_create_modal", (clone) => {
                const formCreateOrder = clone.getElementById("create_order");
                formCreateOrder.appendChild(createGroup([
                    createMaterialInput("Title"),
                    createMaterialInput("Application ( Trigram )", { helpers: "Business Application Trigram" })
                ]));
                const fieldSet = document.createElement("fieldset");
                const legend = document.createElement("legend");
                legend.textContent = "Service ( Team / Owner )";
                fieldSet.appendChild(legend);
                fieldSet.appendChild(createMaterialInput("Team Mail"));
                fieldSet.appendChild(createGroup([
                    createMaterialInput("Service Now"),
                    createMaterialInput("Team Name")
                ]));
                formCreateOrder.appendChild(fieldSet);
                formCreateOrder.appendChild(createMaterialInput("Information"));
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
                        const tdTitle = createTd(title);
                        tdTitle.classList.add("title");
                        tr.appendChild(tdTitle);
                        tr.appendChild(createInputTd(title, value));
                        attrBody.appendChild(tr);
                    }

                    const btnSave = clone.getElementById("btn_order_save");
                    const orderActive = clone.getElementById("order_active");
                    orderActive.addEventListener("change", () => {
                        const currValue = orderActive.options[orderActive.selectedIndex].value;

                        const ret = confirm(`Are you use to '${currValue === "true" ? "Enable" : "Disable"}' current Order ?`);
                        if (ret) {
                            btnSave.disabled = false;
                        }
                        else if (currValue === "true") {
                            orderActive.options[0].selected = false;
                            orderActive.options[1].selected = "selected";
                        }
                        else {
                            orderActive.options[0].selected = "selected";
                            orderActive.options[1].selected = false;
                        }
                    });
                    if (!status) {
                        orderActive.options[0].selected = false;
                        orderActive.options[1].selected = "selected";
                    }

                    const initialState = orderActive.options[orderActive.selectedIndex].value === "true";
                    const inputsTemp = clone.querySelectorAll("input.modal_input");
                    for (const input of inputsTemp) {
                        input.addEventListener("keypress", () => {
                            if (btnSave.disabled) {
                                btnSave.disabled = false;
                            }
                        });
                    }

                    btnSave.addEventListener("click", async() => {
                        const inputs = document.querySelectorAll("input.modal_input");
                        const status = orderActive.options[orderActive.selectedIndex].value === "true";
                        if (initialState !== status) {
                            fetch(`/order/${number}`, {
                                method: "PATCH",
                                headers,
                                body: JSON.stringify({ status })
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
                { value: number, center: true, click: () => {
                    openAction(id, number);
                } },
                trigram,
                name,
                title,
                status ? "✔️" : "❌",
                date,
                { value: "⚙️", center: true, click: () => {
                    openAction(id, number);
                } },
                { value: "✏️", center: true, click }
            ], status);
        }
        aside.appendChild(_t.close());
    });

    menuAction.addEventListener("click", async() => {
        openModal("modal_action", (clone) => {
            const formAction = clone.getElementById("action_form");

            const inputGroup = createMaterialInput("Number");
            formAction.appendChild(inputGroup);
            const submit = document.createElement("input");
            submit.setAttribute("type", "submit");
            submit.value = "Find";

            formAction.addEventListener("submit", async(event) => {
                event.preventDefault();
                const inputValue = inputGroup.childNodes[0].value;
                const raw = await fetch(`/order/${inputValue}`);
                if (raw.status === 200) {
                    const result = await raw.json();
                    openAction(result.id, result.number);
                    document.getElementById("modal_close").click();
                }
                else {
                    const spanEl = document.getElementById("modal_error");
                    spanEl.textContent = await raw.text();
                    spanEl.style.display = "flex";
                }
            });

            formAction.appendChild(submit);
        });
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

    const url = new URL(window.location);
    if (url.searchParams.has("page")) {
        switch (url.searchParams.get("page")) {
            case "businessapp":
                menuBusinessApp.click();
                break;
            case "orders":
                menuOrders.click();
                break;
            case "action":
                openAction(url.searchParams.get("id"), url.searchParams.get("number"));
                break;
        }
    }
    else {
        menuBusinessApp.click();
    }
});
