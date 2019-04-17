function filterTable(inputName, tdRow = 1) {
    const searchName = document.getElementById(inputName).value.toLowerCase();
    const table = document.querySelector("table");
    const tr = table.getElementsByTagName("tr");

    for (let id = 0; id < tr.length; id++) {
        td = tr[id].getElementsByTagName("td")[tdRow];
        if (!td) {
            continue;
        }
        const txtValue = (td.textContent || td.innerText).toLowerCase();
        tr[id].style.display = txtValue.indexOf(searchName) > -1 ? "" : "none";
    }
}

function tdValue(tdElement) {
    return (tdElement.textContent || tdElement.innerText).toLowerCase();
}

function searchOrder(inputName) {
    const searchName = document.getElementById(inputName).value.toLowerCase();
    const table = document.querySelector("table");
    const tr = table.getElementsByTagName("tr");

    for (let id = 0; id < tr.length; id++) {
        const td = tr[id].getElementsByTagName("td");
        if (td.length === 0) {
            continue;
        }

        if (tdValue(td[0]).indexOf(searchName) > -1 ||
            tdValue(td[2]).indexOf(searchName) > -1 ||
            tdValue(td[3]).indexOf(searchName) > -1) {
            tr[id].style.display = "";
        }
        else {
            tr[id].style.display = "none";
        }
    }
}

function filterTableByActive(active, tdRow = 2) {
    const table = document.querySelector("table");
    const tr = table.getElementsByTagName("tr");

    for (let id = 0; id < tr.length; id++) {
        td = tr[id].getElementsByTagName("td")[tdRow];
        if (!td) {
            continue;
        }

        const txtValue = td.textContent || td.innerText;
        if (active === null) {
            tr[id].style.display = "";
        }
        else if (active) {
            tr[id].style.display = txtValue === "✔️" ? "" : "none";
        }
        else {
            tr[id].style.display = txtValue === "❌" ? "" : "none";
        }
    }
}

function createGroup(inputs) {
    const group = document.createElement("section");
    group.classList.add("double_group");
    for (const input of inputs) {
        group.appendChild(input);
    }

    return group;
}

function createButton(name = "", options = {}) {
    const btn = document.createElement("button");
    if (options.disabled) {
        btn.disabled = true;
    }
    if (options.del) {
        btn.classList.add("del");
    }
    if (typeof options.icon === "string") {
        const span = document.createElement("span");
        span.classList.add("bull");
        span.appendChild(document.createTextNode(options.icon));
        btn.appendChild(span);
    }
    btn.appendChild(document.createTextNode(name));

    return btn;
}

function createMaterialInput(label, options = {}) {
    const { helpers, defaultValue } = options;
    const groupElement = document.createElement("section");
    groupElement.classList.add("form_group");

    const labelElement = document.createElement("label");
    const inputElement = document.createElement("input");
    inputElement.setAttribute("type", "text");
    inputElement.setAttribute("autocomplete", "off");
    inputElement.setAttribute("autocorrect", "off");
    inputElement.setAttribute("autocapitalize", "off");
    inputElement.setAttribute("spellcheck", "off");
    inputElement.required = true;
    if (typeof defaultValue === "string") {
        inputElement.value = defaultValue;
    }
    labelElement.appendChild(document.createTextNode(label));

    if (typeof helpers === "string") {
        const span = document.createElement("span");
        span.textContent = "?";
        const pElement = document.createElement("p");
        pElement.textContent = helpers;
        span.appendChild(pElement);
        groupElement.appendChild(span);
    }

    groupElement.appendChild(inputElement);
    groupElement.appendChild(labelElement);

    return groupElement;
}

function createDetails(summary) {
    const details = document.createElement("details");
    const summaryElement = document.createElement("summary");
    summaryElement.textContent = summary;
    details.appendChild(summaryElement);

    return details;
}

function createInputTd(id, text = "") {
    const tdElement = document.createElement("td");
    tdElement.classList.add("input_td");
    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.id = id;
    inputElement.classList.add("modal_input");
    inputElement.setAttribute("autocomplete", "off");
    inputElement.setAttribute("autocorrect", "off");
    inputElement.setAttribute("autocapitalize", "off");
    inputElement.setAttribute("spellcheck", "off");
    inputElement.value = text;

    tdElement.appendChild(inputElement);

    return tdElement;
}

function createTd(text = "") {
    const tdElement = document.createElement("td");
    tdElement.appendChild(document.createTextNode(text));

    return tdElement;
}

function formatDate(date) {
    const day = `0${date.getDate()}`.slice(-2);
    const month = `0${date.getMonth() + 1}`.slice(-2);

    return `${day}/${month}/${date.getUTCFullYear()}`;
}

function scheduleElement(scheduleStr) {
    const fragment = document.createDocumentFragment();
    const pDiv = document.createElement("div");
    pDiv.classList.add("schedule-parent");
    const groups = scheduleStr.split(";");

    for (const group of groups) {
        const times = group.slice(2).split("-");

        const cDiv = document.createElement("div");
        cDiv.classList.add("schedule-child");

        const titleEl = document.createElement("b");
        titleEl.appendChild(document.createTextNode(group.charAt(0)));
        cDiv.appendChild(titleEl);
        for (const time of times) {
            const [partOne, partTwo] = time.split(":");
            const span = document.createElement("span");
            span.textContent = `${partOne.slice(0, 2)}-${partTwo.slice(0, 2)}`;
            cDiv.appendChild(span);
        }

        pDiv.appendChild(cDiv);
    }
    fragment.appendChild(pDiv);

    return fragment;
}

/**
 * @class DynamicTable
 */
class DynamicTable {
    /**
     * @constructor
     * @param {String} templateName templateName
     */
    constructor(templateName) {
        const template = document.getElementById(templateName);
        this.clone = document.importNode(template.content, true);

        this.table = this.clone.querySelector("table");
        this.tbody = this.clone.querySelector("tbody");
        this.rowFragments = document.createDocumentFragment();
    }

    /**
     * @method addRow
     * @memberof DynamicTable#
     * @param {String[]} elements elements
     * @param {Boolean} [active=true] active row
     * @returns {void}
     */
    addRow(elements, active = true) {
        if (!Array.isArray(elements)) {
            throw new Error("elements must be an Array");
        }

        const tr = document.createElement("tr");
        for (const elem of elements) {
            const tdElement = document.createElement("td");
            if (elem instanceof DocumentFragment) {
                tdElement.appendChild(elem);
            }
            else if (typeof elem === "object" && elem !== null) {
                if (elem.center) {
                    tdElement.classList.add("center");
                }
                if (typeof elem.click === "function") {
                    tdElement.classList.add("clickable");
                    tdElement.addEventListener("click", elem.click);
                }
                tdElement.appendChild(document.createTextNode(elem.value));
            }
            else {
                tdElement.classList.add("center");
                tdElement.appendChild(document.createTextNode(elem));
            }

            tr.appendChild(tdElement);
        }

        if (!active) {
            tr.style.display = "none";
        }
        this.rowFragments.appendChild(tr);
    }

    /**
     * @method close
     * @membeof DynamicTable#
     * @returns {*}
     */
    close() {
        this.tbody.appendChild(this.rowFragments);

        return this.clone;
    }
}

