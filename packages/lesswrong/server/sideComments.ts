import cheerio from 'cheerio';
import { Comments } from '../lib/collections/comments/collection';

export interface QuoteShardSettings {
  minLength: number
}
const defaultQuoteShardSettings: QuoteShardSettings = {
  minLength: 20,
};

/**
 * Given the HTML of a post body which has IDs on every block (from
 * addBlockIDsToHTML), and the HTML of a comment which might contain
 * blockquotes taken from it, return the ID of the first block which the comment
 * quotes from.
 */
export function getCommentQuotedBlockID(postHTML: string, commentHTML: string, options: QuoteShardSettings): string|null {
  const quoteShards = commentToQuoteShards(commentHTML, options);
  if (!quoteShards?.length) return null;
  
  //@ts-ignore
  const parsedPost = cheerio.load(postHTML, null, false);
  
  return findQuoteInPost(parsedPost, quoteShards);
}

/**
 * Given a comment (as HTML) which might contain blockquotes, extract a list of
 * "quote shards". A quote shard is an HTML substring which, if it matches an
 * HTML substring found in the post, will cause the comment to match that part
 * of the post.
 *
 * This incorporates some slightly complicated heuristics. In particular:
 *  * Split paragraphs, list items, etc into their own blocks.
 *  * If a blockquote-paragraph contains "..." (three dots), "…" (U+2026 Unicode
 *    ellipsis character), or either of those wrapped in parens or square
 *    brackets, split there.
 *  * If there are matching square brackets containing up to 30 characters,
 *    split into a before-the-bracket shard and an after-the-bracket shard.
 *  * Discard shards shorter than 20 characters.
 */
export function commentToQuoteShards(commentHTML: string, options?: QuoteShardSettings): string[] {
  options = options||defaultQuoteShardSettings;
  const result: string[] = [];
  
  // Parse the HTML into cheerio
  //@ts-ignore (cheerio type annotations sadly don't quite match the actual imported library)
  const parsedComment = cheerio.load(commentHTML, null, false);
  
  // Find blockquote elements
  const blockquotes = parsedComment('blockquote');
  for (let i=0; i<blockquotes.length; i++) {
    addQuoteShardsFromElement(result, cheerio(blockquotes[i]), options);
  }
  
  return result;
}

function addQuoteShardsFromElement(outQuoteShards: string[], blockquoteElement: any, options: QuoteShardSettings): void {
  // HACK: Rather than do this in full generality, we first assume that a
  // blockquote element either contains only other block types or no block
  // types.
  // If the element has children that are of block types, recurse into them
  let pos = blockquoteElement[0].firstChild;
  let hasBlockChildren = false;
  while (pos) {
    if (pos.type==='tag' && ['p','li','blockquote'].includes(pos.name)) {
      addQuoteShardsFromElement(outQuoteShards, cheerio(pos), options);
      hasBlockChildren = true;
    }
    pos = pos.nextSibling;
  }
  if (hasBlockChildren) {
    return;
  }
  
  // Split on ellipses
  // HACK: Rather than handle this in full generality, we just ignore the case
  // where ellipses may be inside child elements (eg an italicized section or
  // a link caption). So we split the HTML *as strings*, which in that case
  // produces mismatched tags. This is okay because quote shards are never
  // rendered anywhere, only string-matched to produce a boolean result.
  const quoteHtml = cheerio(blockquoteElement).html() || "";
  
  const ellipsizedSections = quoteHtml.split(/(\[\.\.\.\])|(\[\u2026\])|(\.\.\.)|(\u2026)/);
  for (let section of ellipsizedSections) {
    if (section) {
      const trimmed = section.trim();
      if (trimmed.length >= options.minLength) {
        outQuoteShards.push(trimmed);
      }
    }
  }
}

/**
 * Given a post (as a cheerio parse tree) and a list of quote shards, return the
 * ID of the first block which matches a quote shard (or null if no match is
 * found).
 */
function findQuoteInPost(parsedPost, quoteShards: string[]): string|null {
  let markedElements = parsedPost('p,li,blockquote');
  for (let i=0; i<markedElements.length; i++) {
    const blockID = cheerio(markedElements[i]).attr("id");
    if (blockID) {
      const markedHtml = cheerio(markedElements[i]).html()||"";
      for (let quoteShard of quoteShards) {
        if (markedHtml.indexOf(quoteShard) >= 0) {
          return blockID;
        }
      }
    }
  }
  return null;
}

/**
 * Given a post, fetch all the comments on that post, check them for blockquotes,
 * line those quotes up to sections of the post, and return a mapping from block
 * IDs to arrays of comment IDs.
 *
 * This function is potentially quite slow, if there are a lot of comments and/or
 * the post is very long. FIXME: Build caching for this.
 */
export async function getPostBlockCommentLists(context: ResolverContext, post: DbPost): Promise<Record<string,string[]>> {
  const postHTML = post.contents?.html;
  //@ts-ignore
  const parsedPost = cheerio.load(addBlockIDsToHTML(postHTML), null, false);
  
  const comments = await Comments.find({
    ...Comments.defaultView({}).selector,
    postId: post._id,
  }).fetch();
  
  let result: Record<string,string[]> = {};
  for (let comment of comments) {
    //@ts-ignore
    const quoteShards = commentToQuoteShards(comment.contents?.html);
    const blockID = findQuoteInPost(parsedPost, quoteShards);
    if (blockID) {
      if (blockID in result) result[blockID].push(comment._id);
      else result[blockID] = [comment._id];
    }
  }
  return result;
}
