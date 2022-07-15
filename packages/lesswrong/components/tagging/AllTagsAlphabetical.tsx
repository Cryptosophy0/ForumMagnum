import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@material-ui/icons/AddBox';
import _sortBy from 'lodash/sortBy';
import { userCanCreateTags } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { taggingNameCapitalSetting, taggingNameIsSet, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    margin: "auto",
    maxWidth: 1000
  },
  alphabetical: {
    columns: 5,
    columnWidth: 225,
    columnGap: 0,
    background: theme.palette.panelBackground.default,
    padding: 20,
    marginBottom: 24
  }
})

const AllTagsAlphabetical = ({classes}: {
  classes: ClassesType,
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "allTagsHierarchical",
    },
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
    limit: 750,
  });
  const { TagsListItem, SectionTitle, SectionButton, Loading } = Components;
  const currentUser = useCurrentUser()

  const alphabetical = _sortBy(results, tag=>tag.name)

  return (
    <div className={classes.root}>
      <SectionTitle
        title={`All ${taggingNamePluralCapitalSetting.get()} (${loading ? "loading" : results?.length})`}
        anchor={`all-${taggingNamePluralSetting.get()}`}
      >
        {userCanCreateTags(currentUser) && <SectionButton>
          <AddBoxIcon/>
          <Link to={`/${taggingNameIsSet.get() ? taggingNamePluralSetting.get() : 'tag'}/create`}>
            New {taggingNameCapitalSetting.get()}
          </Link>
        </SectionButton>}
      </SectionTitle>
      {loading && <Loading/>}
      <div className={classes.alphabetical}>
        {alphabetical.map(tag => <TagsListItem key={tag._id} tag={tag} postCount={6}/>)}
      </div>
    </div>
  );
}

const AllTagsAlphabeticalComponent = registerComponent("AllTagsAlphabetical", AllTagsAlphabetical, {styles});

declare global {
  interface ComponentTypes {
    AllTagsAlphabetical: typeof AllTagsAlphabeticalComponent
  }
}
