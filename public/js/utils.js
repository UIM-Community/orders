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

function filterTableByActive(active, tdRow = 2) {
    const table = document.querySelector("table");
    const tr = table.getElementsByTagName("tr");

    for (let id = 0; id < tr.length; id++) {
        td = tr[id].getElementsByTagName("td")[tdRow];
        if (!td) {
            continue;
        }

        const txtValue = td.textContent || td.innerText;
        if (active) {
            tr[id].style.display = txtValue === "✔️" ? "" : "none";
        }
        else {
            tr[id].style.display = "";
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

function createMaterialInput(label, options = {}) {
    const { min = 0, max = 255 } = options;

    const bElement = document.createElement("b");
    bElement.textContent = `${min}/${max}`;
    const pElement = document.createElement("p");

    const groupElement = document.createElement("section");
    groupElement.classList.add("form_group");

    const inputElement = document.createElement("input");
    inputElement.setAttribute("type", "text");
    inputElement.required = true;
    inputElement.addEventListener("keydown", (event) => {
        const key = event.keyCode || event.charCode;
        let len = key === 8 ? inputElement.value.length - 1 : inputElement.value.length + 1;
        if (len < 0) {
            len = 0;
        }

        if (len > max) {
            if (!groupElement.classList.contains("error")) {
                groupElement.classList.add("error");
                pElement.textContent = `Input length exceed the maximum length of ${max}...`;
            }
        }
        else if (groupElement.classList.contains("error")) {
            groupElement.classList.remove("error");
            pElement.textContent = "";
        }
        bElement.textContent = `${len}/${max}`;
    });

    const labelElement = document.createElement("label");
    labelElement.appendChild(document.createTextNode(label));

    const detailsElement = document.createElement("section");
    detailsElement.appendChild(pElement);
    detailsElement.appendChild(bElement);

    groupElement.appendChild(inputElement);
    groupElement.appendChild(labelElement);
    groupElement.appendChild(detailsElement);

    return groupElement;
}

function createInputTd(id, text = "") {
    const tdElement = document.createElement("td");
    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.id = id;
    inputElement.value = text;

    tdElement.style.backgroundColor = "#ECEFF1";
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
            if (typeof elem === "object") {
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

