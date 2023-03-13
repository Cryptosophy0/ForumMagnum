import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useRecommendations } from './withRecommendations';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

const RecommendationsList = ({algorithm, translucentBackground}: {
  algorithm: RecommendationsAlgorithm,
  translucentBackground?: boolean
}) => {
  const { PostsItem2, PostsLoading, Typography, PostsNoResults } = Components;
  const {recommendationsLoading, recommendations} = useRecommendations(algorithm);

  if (recommendationsLoading || !recommendations)
    return <PostsLoading/>

  return <div>
    {recommendations.map(post =>
      <PostsItem2 post={post} key={post._id} translucentBackground={translucentBackground}/>)}
    {recommendations.length===0 &&
      <PostsNoResults/>}
  </div>
}

const RecommendationsListComponent = registerComponent('RecommendationsList', RecommendationsList);

declare global {
  interface ComponentTypes {
    RecommendationsList: typeof RecommendationsListComponent
  }
}
