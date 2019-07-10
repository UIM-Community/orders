/**
 * @namespace Utils
 */

/**
 * @async
 * @function qWrap
 * @memberof Utils#
 * @param {any} query xdevapi Query
 * @returns {Promise<any[]>}
 */
async function qWrap(query) {
    const rows = [];
    await query.execute((row) => rows.push(row));

    return rows;
}

/**
 * @function capitalizeFirstLetter
 * @description capitalize the first letter of a given string
 * @memberof Utils#
 * @param {!string} str string to capitalize
 * @returns {string}
 *
 * @example
 * const result = capitalizeFirstLetter("hello");
 * assert.equal("Hello", result);
 */
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { qWrap, capitalizeFirstLetter };
