import React from 'react';
import { graphql } from 'gatsby';
import Layout from '../components/layout';
import Content from '../components/content';
import format from 'dateformat';
import Text from '../components/text';
import PodcastCTA from '../components/PodcastCTA';

import './episode.css';

export default function EpisodeRoute({
  data: {
    simplecastEpisode: {
      episodeId,
      title,
      slug,
      descriptionHtml,
      longDescriptionHtml,
      publishedAt,
      authorNodes,
    },
  },
}) {
  let isAfter2021 = new Date(publishedAt).getFullYear() >= 2021;
  let heroImage = `/img/podcast-heroes/${
    isAfter2021 ? slug : 'podcast-default'
  }.png`;

  return (
    <Layout title={title} image={heroImage}>
      <section className="widewrapper herowrapper blog-post-hero w-container">
        <div className="herotext">
          <h1 className="heading blog-post-heading">{title}</h1>
          <p className="subheader blog-post-meta">
            Hosted by
            {authorNodes.filter(Boolean).map((author, i) => (
              <>
                {i === 0 ? '' : authorNodes.length > 2 ? ', ' : ' and '}
                {/* Author links will lead to team member page, which is currently pending. */}
                {/* <Link key={author.slug} to={author.slug}>
                <Text>{author.name}</Text>
              </Link> */}
                <Text key={author?.slug}>{author.name}</Text>
              </>
            ))}
            <br />
            <span className="blog-post-date">
              {format(publishedAt, `" on " mmmm dS, yyyy"."`)}
            </span>
          </p>
        </div>
        <div className="blog-post-hero-image">
          <img src={heroImage} alt="" />
        </div>
      </section>
      <Content>
        <section
          className="episode-markdown"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
        <iframe
          frameBorder="0"
          height="200px"
          scrolling="no"
          seamless
          src={`https://player.simplecast.com/${episodeId}`}
          width="100%"
          title={title}
        />
      </Content>
      <PodcastCTA />
      <Content>
        <section
          className="episode-markdown episode-transcript"
          dangerouslySetInnerHTML={{ __html: longDescriptionHtml }}
        />
      </Content>
      <PodcastCTA />
    </Layout>
  );
}

export const episodePageQuery = graphql`
  query EpisodePage($id: String!) {
    site {
      siteMetadata {
        title
      }
    }
    simplecastEpisode(id: { eq: $id }) {
      episodeId
      title
      slug
      descriptionHtml
      longDescriptionHtml
      publishedAt
      authorNodes {
        name
        slug
      }
    }
  }
`;
