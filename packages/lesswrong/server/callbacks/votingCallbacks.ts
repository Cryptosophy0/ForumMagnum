import Users from '../../lib/collections/users/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import { postPublishedCallback } from '../notificationCallbacks';
import { batchUpdateScore } from '../updateScores';
import { goodHeartStartDate } from '../../components/seasonal/AprilFools2022';

/**
 * @summary Update the karma of the item's owner
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 * @param {string} operation - The operation being performed
 */
const collectionsThatAffectKarma = ["Posts", "Comments", "Revisions"]

const hasPostedAt = (document: any) : document is (DbComment | DbPost) => {
  if (document.createdAt) return true
  return false 
}

const trackGoodheartTokens = (newDocument, user) => {
  const currentDate = new Date()
  const activateGoodHeartTokens = new Date("04/01/2022") < currentDate && currentDate < new Date("04/08/2022")
  return activateGoodHeartTokens && hasPostedAt(newDocument) && newDocument.postedAt > goodHeartStartDate && user.createdAt < goodHeartStartDate
}

const getGoodheartTokenMultiplier = (collectionName) => {
  if (collectionName === "Posts") return 3
  else return 1
}

voteCallbacks.castVoteAsync.add(async function updateKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId && collectionsThatAffectKarma.includes(vote.collectionName)) {
    void Users.rawUpdateOne({_id: newDocument.userId}, {$inc: {"karma": vote.power}});
    if (trackGoodheartTokens(newDocument, user)) {
      const multiplier = getGoodheartTokenMultiplier(collection.collectionName)
      void Users.rawUpdateOne({_id: newDocument.userId}, {$inc: {"goodHeartTokens": multiplier * vote.power}});
    }
  }
});

voteCallbacks.cancelAsync.add(function cancelVoteKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) { 
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId && collectionsThatAffectKarma.includes(vote.collectionName)) {

    void Users.rawUpdateOne({_id: newDocument.userId}, {$inc: {"karma": -vote.power}});
    if (trackGoodheartTokens(newDocument, user)) {
      const multiplier = getGoodheartTokenMultiplier(collection.collectionName)
      void Users.rawUpdateOne({_id: newDocument.userId}, {$inc: {"goodHeartTokens": multiplier * -vote.power}});
    }
  }
});


voteCallbacks.castVoteAsync.add(async function incVoteCount ({newDocument, vote}: VoteDocTuple) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[field]: 1, voteCount: 1}});
  }
});

voteCallbacks.cancelAsync.add(async function cancelVoteCount ({newDocument, vote}: VoteDocTuple) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[field]: -1, voteCount: -1}});
  }
});

voteCallbacks.castVoteAsync.add(async function updateNeedsReview (document: VoteDocTuple) {
  const voter = await Users.findOne(document.vote.userId);
  // voting should only be triggered once (after getting snoozed, they will not re-trigger for sunshine review)
  if (voter && voter.voteCount >= 20 && !voter.reviewedByUserId) {
    void Users.rawUpdateOne({_id:voter._id}, {$set:{needsReview: true}})
  }
});


postPublishedCallback.add(async (publishedPost: DbPost) => {
  // When a post is published (undrafted), update its score. (That is, recompute
  // the time-decaying score used for sorting, since the time that's computed
  // relative to has just changed).
  //
  // To do this, we mark it `inactive:false` and update the scores on the
  // whole collection. (This is already something being done frequently by a
  // cronjob.)
  if (publishedPost.inactive) {
    await Posts.rawUpdateOne({_id: publishedPost._id}, {$set: {inactive: false}});
  }
  
  await batchUpdateScore({collection: Posts});
});
