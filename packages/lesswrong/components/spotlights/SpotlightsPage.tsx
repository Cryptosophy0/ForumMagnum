import React, { useMemo } from 'react';
import Spotlights from '../../lib/collections/spotlights/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  form: {
    padding: 16,
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.palette.boxShadow.featuredResourcesCard,
    marginBottom: 16
  }
});

export const SpotlightsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { Loading, SectionTitle, SingleColumnSection, SpotlightItem, WrappedSmartForm, Typography, SpotlightEditorStyles } = Components;

  const currentUser = useCurrentUser();

  const { results: spotlights = [], loading, refetch } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {
      view: "spotlightsPage",
      limit: 100
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only'
  });

  const spotlightsInDisplayOrder = useMemo(() => {
    if (!spotlights.length) return spotlights;
    const [currentSpotlight] = spotlights;
    const upcomingSpotlights = spotlights.filter(spotlight => spotlight.position > currentSpotlight.position);
    const recycledSpotlights = spotlights.filter(spotlight => spotlight.position < currentSpotlight.position);
    return [currentSpotlight, ...upcomingSpotlights, ...recycledSpotlights];
  }, [spotlights]);

  const upcomingSpotlights = spotlightsInDisplayOrder.filter(spotlight => !spotlight.draft)
  const draftSpotlights = spotlightsInDisplayOrder.filter(spotlight => spotlight.draft)

  if (!userCanDo(currentUser, 'spotlights.edit.all')) {
    return <SingleColumnSection>
      <Typography variant="body2">You must be logged in as an admin to use this page.</Typography>
    </SingleColumnSection>;
  }

  return <SingleColumnSection>
    <SectionTitle title={'Spotlights'} />
    <div className={classes.form}>
      <Typography variant="body2">New Spotlight</Typography>
      <SpotlightEditorStyles>
        <WrappedSmartForm
          collection={Spotlights}
          mutationFragment={getFragment('SpotlightEditQueryFragment')}
        />
      </SpotlightEditorStyles>
    </div>
    {loading && <Loading/>}
    <SectionTitle title="Upcoming Spotlights"/>
    {upcomingSpotlights.map(spotlight => <SpotlightItem key={spotlight._id} spotlight={spotlight} refetchAllSpotlights={refetch} showAdminInfo/>)}
    <SectionTitle title="Draft Spotlights"/>
    {draftSpotlights.map(spotlight => <SpotlightItem key={spotlight._id} spotlight={spotlight} refetchAllSpotlights={refetch} showAdminInfo/>)}
  </SingleColumnSection>
}

const SpotlightsPageComponent = registerComponent('SpotlightsPage', SpotlightsPage, {styles});

declare global {
  interface ComponentTypes {
    SpotlightsPage: typeof SpotlightsPageComponent
  }
}

