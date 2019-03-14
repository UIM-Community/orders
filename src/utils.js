async function qWrap(query) {
    const rows = [];
    await query.execute((row) => rows.push(row));

    return rows;
}

module.exports = { qWrap };
