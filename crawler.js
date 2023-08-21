/**
 * @fileoverview
 *   Google Play Store web crawler
 *
 * @author https://github.com/etlu03-portfolio
 * @release 2023
 */

const puppeteer = require('puppeteer');

const process = require('process');
const fs = require('fs');
const path = require('path');

const utils = require('./utils');
const visited = new Set();

/**
 * Checks if the current app has a link to their developer's privacy policy
 * @param {Object} page Puppeteer page instance
 * @return {string}
 */
async function fetchPrivacyPolicy(page) {
  const seeDetails = await page.$x('//span[text()="See details"]');
  if (seeDetails.length === 0) {
    return null;
  }

  await seeDetails[0].click();
  await page.waitForTimeout(2000);

  const privacyPolicy = await page.$x('//a[text()="privacy policy"]');
  if (privacyPolicy.length === 0) {
    return null;
  }
  const href = await (await privacyPolicy[0].getProperty('href')).jsonValue();

  return href;
}

/**
 * Collects the URLs of apps found in the "Similar games" section or the
 * "Similar apps" section
 * @param {Object} page Puppeteer page instance
 * @return {Array}
 */
async function getSimilar(page) {
  const similar = await page.$x(
    '//span[text()="Similar games" or text()="Similar apps"]/../../../../..//a[contains(@href, "/store/apps/details?id")]'
  );

  if (similar.length === 0) {
    return [];
  }

  const hrefs = await Promise.all(
    similar.map(
      async (item) => await (await item.getProperty('href')).jsonValue()
    )
  );

  return hrefs;
}

/**
 * Creates generic tree that outlines the relationships between Google Play apps
 * @param {Object} page Puppeteer page instance
 * @param {Number} maximumDepth Maximum level of a generic tree
 * @return {Object}
 */
async function buildTree(page, maximumDepth) {
  const title = await page.title();
  const privacyPolicyURL = await fetchPrivacyPolicy(page);

  const tree = new utils.tree({
    title: title.replace(' - Apps on Google Play', ''),
    privacyPolicyURL: privacyPolicyURL,
  });

  visited.add(privacyPolicyURL);

  /**
   * Collects the privacy policies of neighboring apps
   * @param {Object} page Puppeteer page instance
   * @param {Number} depth Current level
   */
  async function openRelated(page, depth = 0) {
    if (maximumDepth < depth) {
      return;
    }

    const relatedLinks = await getSimilar(page);
    for (const link of Object.values(relatedLinks)) {
      await page.goto(link, {
        waitUntil: 'networkidle2',
      });

      const title = await page.title();
      const privacyPolicyURL = await fetchPrivacyPolicy(page);

      if (visited.has(privacyPolicyURL)) {
        continue;
      }

      if (privacyPolicyURL !== null) {
        const subtree = new utils.tree({
          title: title.replace(' - Apps on Google Play', ''),
          privacyPolicyURL: privacyPolicyURL,
        });
        tree.push(subtree);

        visited.add(privacyPolicyURL);
      }
    }
    await openRelated(page, (depth = depth + 1));
  }

  await openRelated(page);

  return tree;
}

/**
 * Stores the result of the web scrape into a comma-separated values file
 * @param {Array} nodes Array of 'Node' objects
 */
async function transcribe(nodes) {
  const rows = nodes.map((node) => node.title + ',' + node.privacyPolicyURL);
  const data = rows.join('\n');

  const corpusPath = path.join('files', 'corpus.csv');
  await fs.promises
    .writeFile(corpusPath, data, { encoding: 'utf8', flag: 'w' })
    .then(() => console.log('Please see files/corpus.csv for your results'))
    .catch(() => console.error(err));
}

/**
 * Performs depth-first search on a generic tree
 * @param {Object} tree 'Tree' object
 */
async function collectNodes(tree) {
  const nodes = [];

  /**
   * Depth-first search
   * @param {Object} tree 'Tree' object
   */
  function dfs(tree) {
    if (tree.root.privacyPolicyURL !== null) {
      nodes.push(tree.root);
    }

    if (tree.children.length !== 0) {
      for (const child of tree.children) {
        dfs(child);
      }
    }
  }

  dfs(tree);
  await transcribe(nodes);
}

/**
 * Main point of entry for 'crawler.js'
 */
(async () => {
  const argc = process.argv.length;
  try {
    if (argc < 3) {
      throw new TypeError(
        `Incorrect number of arguments. Expected at least 3, recieved ${argc}`
      );
    }

    if (4 < argc) {
      throw new TypeError(
        `Incorrect number of arguments. Expected at most 4, recieved ${argc}`
      );
    }

    const browser = await puppeteer.launch({
      devtools: false,
      defaultViewport: {
        width: 1366,
        height: 768,
      },
      headless: false,
    });
    const page = await browser.newPage();

    await page.goto(process.argv[2], {
      waitUntil: 'networkidle2',
    });
    await page.bringToFront();

    const maximumDepth = isNaN(process.argv[3]) ? -1 : Number(process.argv[3]);
    const tree = await buildTree(page, maximumDepth);
    await collectNodes(tree);

    await browser.close();
  } catch(err) {
    console.error(err);
  }
})();
