const _ = require('lodash');
const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');
const { fmImagesToRelative } = require('gatsby-remark-relative-images');
const fs = require('fs/promises');

const POSTS_PER_PAGE = 8;
const getBlogUrl = page => `/blog${page > 1 ? `/${page}` : ''}`;

exports.createPages = async ({ actions: { createPage }, graphql }) => {
  let result = await graphql(`
    {
      allBlogPost {
        totalCount
        nodes {
          id
          slug
          post {
            frontmatter {
              tags
            }
          }
        }
      }
      allPeople {
        nodes {
          id
          slug
        }
      }
      allSimplecastEpisode {
        edges {
          node {
            id
            number
            slug
          }
        }
      }
    }
  `);

  if (result.errors) {
    result.errors.forEach(e => console.error(e.toString()));
    throw result.errors;
  }

  const posts = result.data.allBlogPost.nodes;

  // creates a set of paginated blog list pages
  const pages = Math.floor(posts.length / POSTS_PER_PAGE);
  _.range(pages - 1).forEach(p => {
    createPage({
      path: getBlogUrl(p + 1),
      component: path.resolve('./src/templates/blog-list.js'),
      context: {
        limit: POSTS_PER_PAGE,
        skip: p * POSTS_PER_PAGE,
        page: p + 1,
        pages,
      },
    });
  });

  // create a page for each post
  posts.forEach(({ id, slug }) =>
    createPage({
      path: slug,
      component: path.resolve(`src/templates/blog-post.js`),
      // additional data can be passed via context
      context: {
        id,
      },
    })
  );

  // find all tags
  let tags = posts.reduce((acc, { post: { frontmatter: { tags } } }) => {
    if (tags) {
      return [...acc, ...tags];
    } else {
      return acc;
    }
  }, []);

  // Eliminate duplicate tags
  tags = _.uniq(tags);

  // create a page for each tag
  tags.forEach(tag =>
    createPage({
      path: `/tags/${_.kebabCase(tag)}/`,
      component: path.resolve(`src/templates/tags.js`),
      context: {
        tag,
      },
    })
  );

  // create a page for each person
  result.data.allPeople.nodes.forEach(node =>
    createPage({
      path: node.slug,
      component: path.resolve(`src/templates/people.js`),
      // additional data can be passed via context
      context: {
        id: node.id,
      },
    })
  );

  // create a page for each podcast episode
  result.data.allSimplecastEpisode.edges.forEach(
    ({ node: { id, season, number, slug } }) =>
      createPage({
        path: `/podcast/${slug}/`,
        component: path.resolve('src/templates/episode.js'),
        context: {
          id,
          season,
          number,
        },
      })
  );

  return result;
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;
  fmImagesToRelative(node); // convert image paths for gatsby images

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode });
    createNodeField({
      name: `slug`,
      node,
      value,
    });
  }
};

const webflowHTML = [
  'about',
  'code-of-conduct',
  'consulting',
  'contact-thanks',
  'contact',
  'index',
  'privacy-policy',
  'tools',
];

// sets the dev server to serve the webflow files instead of gatsby produced things
exports.onCreateDevServer = async ({ app }) => {
  const webflowFiles = await Promise.all(
    webflowHTML.map(async route => {
      const file = await fs.readFile(`./static/${route}.html`);
      return { route, file };
    })
  );

  webflowFiles.forEach(staticRoute => {
    const route = staticRoute.route === 'index' ? '' : staticRoute.route;
    app.get(`/${route}`, function(req, res) {
      res.set('Content-Type', 'text/html').send(staticRoute.file.toString());
    });
  });
};

exports.onPostBuild = async ({ graphql }) => {
  // webflow pages in static get copied automatically, but it won't overwrite
  // if a page exists so we manually do that here
  await fs.copyFile('./static/index.html', './public/index.html');

  // to confirm all of our urls are coming through as expected
  // we create and commit a list of urls in the text file
  // then our PR makes makes adding a new page an explicit intention
  const { data: queryRecords, errors } = await graphql(`
    {
      allSitePage(sort: { fields: path }) {
        edges {
          node {
            path
          }
        }
      }
    }
  `);

  const urlList = queryRecords.allSitePage.edges
    .map(({ node }) => node.path)
    .concat(
      webflowHTML
        .filter(staticRoute => staticRoute !== 'index')
        .map(staticRoute => `/${staticRoute}`)
    )
    .join('\n');

  await fs.writeFile('./sitemap.txt', urlList);
};
