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

