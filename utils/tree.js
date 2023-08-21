/**
 * @fileoverview
 *   Template definition for the 'Tree' object
 *
 * @author https://github.com/etlu03-portfolio
 * @release 2023
 */

/**
 * Function definition of the 'Tree' object
 * @param {Object} node 'Node' object
 */
module.exports = function (node) {
  this.root = node;
  this.children = [];

  /**
   * Inserts a child to the Array of children
   * @param {Object} subtree 'Tree' object
   */
  this.push = function (subtree) {
    this.children.push(subtree);
  }
}
