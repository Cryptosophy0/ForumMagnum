import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useQuery } from '../../lib/crud/useQuery';

const RandomTagPage = () => {
  const {PermanentRedirect, Loading, SingleColumnSection} = Components;
  const {data, loading} = useQuery("GetRandomTag", {
    fetchPolicy: "no-cache",
  });
  const tag = data?.RandomTag;
  return <SingleColumnSection>
    {tag && <PermanentRedirect status={302} url={`/tag/${tag.slug}`}/>}
    {loading && <Loading/>}
  </SingleColumnSection>
}

const RandomTagPageComponent = registerComponent('RandomTagPage', RandomTagPage);

declare global {
  interface ComponentTypes {
    RandomTagPage: typeof RandomTagPageComponent
  }
}

