document.addEventListener("DOMContentLoaded", () => {
    const ActionTemplate = {
        api: {
            servicenow: {
                name: "ServiceNow",
                description: "Open a ServiceNow Incident"
            }
        },
        mail: {
            alarm: {
                name: "Alarm by email",
                description: "Send an alarm by Email"
            }
        },
        alarm: {
            pilotage: {
                name: "Command Center",
                description: "Send an alarm to the Command Center"
            }
        },
        snmp: {
            logncall: {
                name: "Log and Call",
                description: "Call a specific technical support",
                extends: {
                    types: {
                        9: "OCTET_STRING"
                    },
                    oid: {
                        9: ".10"
                    }
                }
            }
        },
        nimsoft: {
            default: {
                name: "RAW",
                description: "Specific Nimbus Request"
            },
            cmd: {
                name: "MS-DOS",
                description: "Run a CMD command"
            },
            powershell: {
                name: "Powershell",
                description: "Run a PowerShell command"
            },
            shell: {
                name: "Shell",
                description: "Run a Shell command"
            },
            bash: {
                name: "Bash",
                description: "Run a Bash command"
            }
        }
    };

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

        document.getElementById("btn_createConditon").addEventListener("click", () => {
            openModal("condition_create", (clone) => {
                const form = clone.querySelector("form");
                const group = createGroup([
                    createMaterialInput("Application Name (Trigram)"),
                    createMaterialInput("Time Shift")
                ]);
                form.appendChild(group);
                form.appendChild(createMaterialInput("Token (Regex)", { defaultValue: ".*" }));

                const inputSubmit = document.createElement("input");
                inputSubmit.type = "submit";
                inputSubmit.value = "Create";
                form.appendChild(inputSubmit);

                const inputs = clone.querySelectorAll("input");
                form.addEventListener("submit", async(event) => {
                    event.preventDefault();
                    const [trigram, tShift, token] = inputs;
                    const body = {
                        buTrigram: trigram.value,
                        token: btoa(token.value),
                        timeShift: tShift.value
                    };

                    const raw = await fetch(`order/${id}/condition`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify(body)
                    });
                    if (raw.status === 201) {
                        document.getElementById("modal_close").click();
                        window.location.reload(false);
                    }
                    else {
                        const spanEl = document.getElementById("modal_error");
                        spanEl.textContent = await raw.text();
                        spanEl.style.display = "flex";
                    }
                });
            });
        });

        const title = document.querySelector(".action_title");
        title.textContent = `Order Number: ${number}`;

        const actionElement = document.getElementById("action_groups");
        const conditions = await fetch(`order/${id}/condition`).then((res) => res.json());
        const template = document.getElementById("condition");

        const fragment = document.createDocumentFragment();
        for (const condition of conditions) {
            const details = createDetails(`Condition n'${condition.condition}`);
            const clone = document.importNode(template.content, true);

            const line = clone.querySelector(".double_group");
            const trigramGroup = createMaterialInput("Application Trigram");
            const tokenGroup = createMaterialInput("Regex ( Token )");
            const timeGroup = createMaterialInput("Time Shift");

            trigramGroup.childNodes[0].value = condition.trigram;
            tokenGroup.childNodes[0].value = atob(condition.token);
            timeGroup.childNodes[0].value = condition.time_shift;
            line.appendChild(trigramGroup);
            line.appendChild(tokenGroup);

            const btnSectionTop = document.createElement("section");
            btnSectionTop.classList.add("btn_section");

            const btnAddAction = createButton("Add Action", { icon: "+" });
            btnAddAction.style.height = "35px";
            btnAddAction.addEventListener("click", () => {
                openModal("action_create", (clone) => {
                    const form = clone.querySelector("form");
                    let activeTemplate = false;

                    const templateContent = clone.getElementById("action_template_content");
                    const actionType = clone.getElementById("action_type");
                    const actionTemplate = clone.getElementById("action_template");

                    actionType.addEventListener("change", (event) => {
                        const value = event.target.options[event.target.selectedIndex].value;
                        actionTemplate.innerHTML = "";
                        templateContent.innerHTML = "<p>Please select a <b>Type</b> and a <b>Template</b></p>";
                        activeTemplate = false;
                        submit.disabled = true;
                        if (value === "none") {
                            actionTemplate.disabled = true;
                        }
                        else {
                            actionTemplate.disabled = false;
                            const options = createOptions(ActionTemplate[value]);
                            actionTemplate.appendChild(options);
                        }
                    });

                    actionTemplate.addEventListener("change", async(event) => {
                        const type = actionType.options[actionType.selectedIndex].value;
                        if (type === "none") {
                            return;
                        }

                        const value = event.target.options[event.target.selectedIndex].value;
                        if (value === "none") {
                            templateContent.innerHTML = "<p>Please select a <b>Type</b> and a <b>Template</b></p>";
                            activeTemplate = false;
                            submit.disabled = true;
                        }
                        else {
                            const template = await fetch(`template/${type}/${value}`).then((res) => res.text());
                            templateContent.innerHTML = template;
                            activeTemplate = true;
                            submit.disabled = false;
                        }
                    });

                    const submit = createButton("Create", { disabled: true });
                    const scheduleGroup = createMaterialInput("Schedule");
                    submit.addEventListener("click", (event) => {
                        event.preventDefault();
                        if (!activeTemplate) {
                            return;
                        }

                        const action = actionType.options[actionType.selectedIndex].value;
                        const template = actionTemplate.options[actionTemplate.selectedIndex].value;
                        const schedule = scheduleGroup.childNodes[0].value;
                        const currAt = ActionTemplate[action][template];
                        const json = { action, schedule, arguments: { template } };
                        if (typeof currAt.extends !== "undefined") {
                            json.arguments = Object.assign({}, currAt.extends, json.arguments);
                        }

                        const tInputs = templateContent.querySelectorAll("input");
                        for (const input of tInputs) {
                            const path = input.getAttribute("data-path");
                            setValue(json.arguments, path, input.value);
                        }
                        console.log(json);
                    });

                    form.insertBefore(scheduleGroup, templateContent);
                    form.appendChild(document.createElement("br"));
                    form.appendChild(submit);
                });
            });
            btnSectionTop.appendChild(btnAddAction);

            const btnSection = document.createElement("section");
            btnSection.classList.add("btn_section");

            const btnSave = createButton("Save", { disabled: true });
            const inputs = [trigramGroup.childNodes[0], tokenGroup.childNodes[0], timeGroup.childNodes[0]];
            for (const input of inputs) {
                input.addEventListener("keypress", () => {
                    if (btnSave.disabled) {
                        btnSave.disabled = false;
                    }
                });
            }
            btnSave.style.marginLeft = "auto";
            btnSave.addEventListener("click", async() => {
                const [trigram, token, timeShift] = inputs;
                const body = {
                    buTrigram: trigram.value,
                    token: btoa(token.value),
                    timeShift: timeShift.value
                };

                const raw = await fetch(`order/${condition.id}/condition`, {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify(body)
                });
                if (raw.status === 200) {
                    btnSave.disabled = true;
                }
                else {
                    alert(await raw.text());
                }
            });

            const btnDelete = createButton("Delete Condition", { del: true });
            btnDelete.addEventListener("click", async() => {
                const cDel = confirm(`Are you sure to delete condition id ${condition.condition}`);
                if (cDel) {
                    await fetch(`order/${condition.id}/condition`, {
                        method: "DELETE",
                        headers
                    });
                    window.location.reload(false);
                }
            });

            clone.appendChild(timeGroup);
            clone.appendChild(btnSectionTop);

            const _t = new DynamicTable("action_table");
            for (const { type, schedule, arguments: args } of condition.json) {
                _t.addRow([
                    type,
                    scheduleElement(schedule),
                    { value: args.template, center: false },
                    { value: "✏️", center: true },
                    { value: "❌", center: true }
                ]);
            }
            clone.appendChild(_t.close());
            clone.appendChild(document.createElement("hr"));
            btnSection.appendChild(btnSave);
            btnSection.appendChild(btnDelete);
            clone.appendChild(btnSection);

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
            const formSection = clone.getElementById("action_form_content");

            const inputGroup = createMaterialInput("Number");
            formSection.appendChild(inputGroup);
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

            formSection.appendChild(submit);
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
