function filterTable(inputName) {
    const searchName = document.getElementById(inputName).value;
    const table = document.querySelector("table");
    const tr = table.getElementsByTagName("tr");

    for (let id = 0; id < tr.length; id++) {
        td = tr[id].getElementsByTagName("td")[1];
        if (!td) {
            continue;
        }
        const txtValue = td.textContent || td.innerText;
        tr[id].style.display = txtValue.indexOf(searchName) > -1 ? "" : "none";
    }
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
     * @returns {void}
     */
    addRow(elements) {
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
                tdElement.appendChild(document.createTextNode(elem.value));
            }
            else {
                tdElement.classList.add("center");
                tdElement.appendChild(document.createTextNode(elem));
            }

            tr.appendChild(tdElement);
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

