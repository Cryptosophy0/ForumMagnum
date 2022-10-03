import React, { useCallback, useEffect, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useOrderPreservingArray } from '../hooks/useOrderPreservingArray';
import { useMutation } from '@apollo/client/react/hooks/useMutation';
import { gql } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';

const SubforumCommentsThread = ({ tag, terms }: {
  tag: TagBasicInfo,
  terms: CommentsViewTerms,
}) => {
  const { loading, results, loadMore, loadingMore, totalCount, refetch } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });

  const currentUser = useCurrentUser();
  const [recordSubforumViewMutation] = useMutation(gql`
    mutation recordSubforumView($userId: String!, $tagId: String!) {
      recordSubforumView(userId: $userId, tagId: $tagId)
    }
  `);
  const recordSubforumView = useCallback(async () => recordSubforumViewMutation({variables: {userId: currentUser?._id, tagId: tag._id}}), [currentUser?._id, tag, recordSubforumViewMutation]);

  useEffect(() => {
    if (results && results.length)
      void recordSubforumView();
  }, [results, recordSubforumView]);
  
  const sortByRef = useRef(terms.sortBy);
  const orderedResults = useOrderPreservingArray(
    results || [],
    (comment) => comment._id,
    // If the selected sort order changes, clear the existing ordering
    sortByRef.current === terms.sortBy ? "interleave-new" : "no-reorder"
  );
  sortByRef.current = terms.sortBy;
  
  if (loading && !results) {
    return <Components.Loading />;
  } else if (!results) {
    return null;
  }

  return (
    <Components.CommentsTimelineSection
      tag={tag}
      comments={orderedResults}
      loadMoreComments={loadMore}
      totalComments={totalCount as number}
      commentCount={orderedResults?.length ?? 0}
      loadingMoreComments={loadingMore}
      loadMoreCount={50}
      refetch={refetch}
    />
  );
}

const SubforumCommentsThreadComponent = registerComponent('SubforumCommentsThread', SubforumCommentsThread, {
  areEqual: {
    terms: "deep",
  }
});

declare global {
  interface ComponentTypes {
    SubforumCommentsThread: typeof SubforumCommentsThreadComponent
  }
}
