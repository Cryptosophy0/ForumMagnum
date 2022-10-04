import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import qs from 'qs';
import { Hits, Configure, InstantSearch, SearchBox, Pagination, connectStateResults, connectRefinementList, ToggleRefinement } from 'react-instantsearch-dom';
import { getAlgoliaIndexName, isAlgoliaEnabled, getSearchClient, AlgoliaIndexCollectionName, collectionIsAlgoliaIndexed } from '../../lib/algoliaUtil';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { taggingNameIsSet, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import SearchIcon from '@material-ui/icons/Search';


const hitsPerPage = 10

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: "100%",
    maxWidth: 1200,
    display: 'flex',
    columnGap: 40,
    padding: '0 10px',
    margin: "auto",
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      paddingTop: 24,
    }
  },
  filtersColumn: {
    flex: 'none',
    width: 250,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    paddingTop: 12,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
    '& .ais-ToggleRefinement-label': {
      display: 'flex',
      columnGap: 6,
      alignItems: 'center',
      marginTop: 10
    }
  },
  filtersHeadline: {
    marginBottom: 18
  },
  resultsColumn: {
    flex: '1 1 0',
  },

  searchIcon: {
    marginLeft: 12
  },
  searchInputArea: {
    display: "flex",
    alignItems: "center",
    maxWidth: 625,
    marginBottom: 15,
    height: 48,
    border: theme.palette.border.slightlyIntense2,
    borderRadius: 3,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 12,
    },
    "& .ais-SearchBox": {
      display: 'inline-block',
      position: 'relative',
      width: '100%',
      marginLeft: 12,
      height: 46,
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
    },
    "& .ais-SearchBox-form": {
      height: '100%'
    },
    "& .ais-SearchBox-submit":{
      display: "none"
    },
    // This is a class generated by React InstantSearch, which we don't have direct control over so
    // are doing a somewhat hacky thing to style it.
    "& .ais-SearchBox-input": {
      height: "100%",
      width: "100%",
      paddingRight: 0,
      verticalAlign: "bottom",
      borderStyle: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
      fontSize: 'inherit',
      "-webkit-appearance": "none",
      cursor: "text",
      ...theme.typography.body2,
    },
  },
  tabs: {
    margin: '0 auto 20px',
    '& .MuiTab-root': {
      minWidth: 110,
      [theme.breakpoints.down('xs')]: {
        minWidth: 50
      }
    },
    '& .MuiTab-labelContainer': {
      fontSize: '1rem'
    }
  },
  resultCount: {
    fontFamily: theme.typography.fontFamily,
    fontWeight: 400,
    fontSize: 14,
    color: theme.palette.grey[700],
    marginBottom: 20
  },
  
  pagination: {
    ...theme.typography.commentStyle,
    fontSize: 16,
    '& li': {
      padding: 8
    },
    '& .ais-Pagination-item': {
      color: theme.palette.primary.main,
    },
    '& .ais-Pagination-item--firstPage': {
      paddingLeft: 0
    },
    '& .ais-Pagination-item--page': {
      fontWeight: 600
    },
    '& .ais-Pagination-item--selected': {
      color: theme.palette.grey[900]
    },
    '& .ais-Pagination-item--disabled': {
      color: theme.palette.grey[500]
    }
  }
})

// filters by tags
const TagsRefinementList = ({ refine, tagsFilter, setTagsFilter }) => {
  return <Components.TagMultiselect
    value={tagsFilter}
    path="tags"
    placeholder={`Filter by ${taggingNamePluralSetting.get()}`}
    hidePostCount
    updateCurrentValues={(values: {tags?: Array<string>}) => {
      setTagsFilter(values.tags)
      refine(values.tags)
    }}
  />
}
const CustomTagsRefinementList = connectRefinementList(TagsRefinementList)

// shows total # of results
const ResultsCount = ({ searchResults, className }) => {
  if (!searchResults || !searchResults.nbHits) return null
  
  return <div className={className}>
    {searchResults.nbHits} result{searchResults.nbHits === 1 ? '' : 's'}
  </div>
}
const CustomTotalStateResults = connectStateResults(ResultsCount)


const SearchPageTabbed = ({classes}:{
  classes: ClassesType
}) => {
  const { history } = useNavigation()
  const { location, query } = useLocation()

  // initialize the tab & search filters from the URL
  const [tab, setTab] = useState<AlgoliaIndexCollectionName>(() => {
    const contentType = query.contentType as AlgoliaIndexCollectionName
    return collectionIsAlgoliaIndexed(contentType) ? contentType : 'Posts'
  })
  const [keywordSearch, setKeywordSearch] = useState(query.terms ?? '')
  const [tagsFilter, setTagsFilter] = useState<Array<string>>(
    // query.tags can be a string array, but it's typed incorrectly
    (query.tags && typeof query.tags === typeof []) ? query.tags as any : []
  )

  const { ErrorBoundary, ExpandedUsersSearchHit, ExpandedPostsSearchHit, ExpandedCommentsSearchHit,
    ExpandedTagsSearchHit, ExpandedSequencesSearchHit, Typography } = Components
  
  const handleUpdateSearch = (e) => {
    setKeywordSearch(e.currentTarget.value)
    history.replace({...location, search: qs.stringify({contentType: tab, terms: e.currentTarget.value, tags: tagsFilter})})
  }
  const handleUpdateTagsFilter = (tags) => {
    setTagsFilter(tags)
    history.replace({...location, search: qs.stringify({contentType: tab, terms: keywordSearch, tags})})
  }
  const handleChangeTab = (e, value) => {
    setTab(value)
    history.replace({...location, search: qs.stringify({contentType: value, terms: keywordSearch, tags: tagsFilter})})
  }

  if (!isAlgoliaEnabled()) {
    return <div className={classes.root}>
      Search is disabled (Algolia App ID not configured on server)
    </div>
  }
  
  // component for search results depends on which content type tab we're on
  const hitComponents = {
    'Posts': ExpandedPostsSearchHit,
    'Comments': ExpandedCommentsSearchHit,
    'Tags': ExpandedTagsSearchHit,
    'Sequences': ExpandedSequencesSearchHit,
    'Users': ExpandedUsersSearchHit
  }
  const HitComponent = hitComponents[tab]

  return <div className={classes.root}>
    <InstantSearch
      indexName={getAlgoliaIndexName(tab)}
      searchClient={getSearchClient()}
    >
      <div className={classes.filtersColumn}>
        <Typography variant="headline" className={classes.filtersHeadline}>Filters</Typography>
        {['Posts', 'Comments', 'Users'].includes(tab) && <CustomTagsRefinementList
            attribute="tags"
            defaultRefinement={tagsFilter}
            tagsFilter={tagsFilter}
            setTagsFilter={handleUpdateTagsFilter}
          />
        }
        {tab === 'Posts' && <ToggleRefinement
          attribute="curated"
          label="Curated"
          value={true}
        />}
        {tab === 'Tags' && <ToggleRefinement
          attribute="isSubforum"
          label="Has subforum"
          value={true}
        />}
      </div>

      <div className={classes.resultsColumn}>
        <div className={classes.searchInputArea}>
          <SearchIcon className={classes.searchIcon}/>
          {/* Ignored because SearchBox is incorrectly annotated as not taking null for its reset prop, when
            * null is the only option that actually suppresses the extra X button.
          // @ts-ignore */}
          <SearchBox defaultRefinement={query.terms} reset={null} focusShortcuts={[]} autoFocus={true} onChange={handleUpdateSearch} />
        </div>
        
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          className={classes.tabs}
          textColor="primary"
          aria-label="select content type to search"
          scrollable
          scrollButtons="off"
        >
          <Tab label="Posts" value="Posts" />
          <Tab label="Comments" value="Comments" />
          <Tab label={taggingNameIsSet.get() ? taggingNamePluralCapitalSetting.get() : 'Tags and Wiki'} value="Tags" />
          <Tab label="Sequences" value="Sequences" />
          <Tab label="Users" value="Users" />
        </Tabs>
        
        <ErrorBoundary>
          <Configure hitsPerPage={hitsPerPage} />
          <CustomTotalStateResults className={classes.resultCount} />
          <Hits hitComponent={(props) => <HitComponent {...props} />} />
          <Pagination showLast className={classes.pagination} />
        </ErrorBoundary>
      </div>
    </InstantSearch>
  </div>
}

const SearchPageTabbedComponent = registerComponent("SearchPageTabbed", SearchPageTabbed, {styles})

declare global {
  interface ComponentTypes {
    SearchPageTabbed: typeof SearchPageTabbedComponent
  }
}