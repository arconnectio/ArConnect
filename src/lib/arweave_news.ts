import Parser from "rss-parser";

/**
 * Fetch the RSS feed of arweave.news
 */
export default async function getArweaveNewsFeed() {
  const parser = new Parser<ArweaveNewsFeed[]>();
  const feed = await parser.parseURL("https://arweave.news/feed");

  return feed;
}

export interface ArweaveNewsFeed {
  items: ArweaveNewsArticle[];
}

export interface ArweaveNewsArticle {
  creator: string;
  title: string;
  link: string;
  pubDate: string;
  "content:encoded": string;
  "content:encodedSnippet": string;
  "dc:creator": string;
  comments: string;
  content: string;
  contentSnippet: string;
  guid: string;
  categories: string[];
  isoDate: string;
}
