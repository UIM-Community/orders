async function qWrap(query) {
    const rows = [];
    await query.execute((row) => rows.push(row));

    return rows;
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { qWrap, capitalizeFirstLetter };
