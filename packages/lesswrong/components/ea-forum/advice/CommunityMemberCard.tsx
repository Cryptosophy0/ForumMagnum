import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import LocationIcon from '@material-ui/icons/LocationOn'
import Button from '@material-ui/core/Button';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { Link } from '../../../lib/reactRouterWrapper';
import { useCurrentUser } from '../../common/withUser';
import { SOCIAL_MEDIA_PROFILE_FIELDS } from '../../../lib/collections/users/schema';
import { useCheckMeritsCollapse } from '../../common/useCheckMeritsCollapse';
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import { socialMediaIcon } from '../users/EAUsersProfile';

const COLLAPSED_SECTION_HEIGHT = 90

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    flexDirection: 'column'
  },
  body: {
    flex: '1 1 0'
  },
  photoRow: {
    display: 'flex',
    columnGap: 10,
    alignItems: 'flex-start',
    marginBottom: 12,
    [theme.breakpoints.down('xs')]: {
      display: 'block'
    }
  },
  photoLink: {
    '&:hover': {
      opacity: 0.8
    }
  },
  profileImage: {
    width: 50,
    height: 50,
    background: theme.palette.grey[100],
    'box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    '-webkit-box-shadow': '0px 0px 2px 0px ' + theme.palette.boxShadowColor(.25),
    '-moz-box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    borderRadius: '50%',
  },
  photoRowText: {
    flex: '1 1 0'
  },
  name: {
    marginBottom: 2
  },
  displayName: {
    fontSize: 16,
    fontWeight: 700,
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
  },
  role: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: '18px',
    marginBottom: 5
  },
  locationRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 20,
    rowGap: '9px',
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[700],
    fontSize: 12,
  },
  location: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 3,
  },
  locationIcon: {
    fontSize: 14,
  },
  socialMediaIcons: {
    display: 'flex',
    columnGap: 6,
  },
  socialMediaIcon: {
    flex: 'none',
    height: 16,
    fill: theme.palette.grey[600],
  },
  bio: {
  },
  bioContentStyles: {
    fontSize: '1rem',
  },
  collapsedBio: {
    position: 'relative',
    height: COLLAPSED_SECTION_HEIGHT,
    cursor: "pointer",
    overflow: 'hidden',
    '&::after': {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: 50,
      content: "''",
      background: `linear-gradient(to top, ${theme.palette.grey[0]}, transparent)`,
    }
  },
  sectionSubHeading: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 13,
    fontWeight: 600,
    marginTop: 20,
    marginBottom: 6
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'right',
    marginTop: 4
  },
  showMoreButton: {
    fontFamily: theme.typography.fontFamily,
    background: 'none',
    color: theme.palette.primary.main,
    fontSize: 10,
    letterSpacing: 0.2,
    padding: 0,
    marginTop: 6,
    '&:hover': {
      opacity: 0.5
    },
  },
  showLess: {
    marginTop: 10
  },
  messageBtn: {
    boxShadow: 'none',
  },
})


const CommunityMemberCard = ({user, classes}: {
  user: UsersProfile,
  classes: ClassesType,
}) => {
  const bioRef = useRef<HTMLDivElement>(null)
  
  const currentUser = useCurrentUser()
  const meritsCollapse = useCheckMeritsCollapse({
    ref: bioRef,
    height: COLLAPSED_SECTION_HEIGHT
  })
  // this tracks whether the bio section is collapsed or expanded
  const [collapsed, setCollapsed] = useState(true)

  const { CloudinaryImage2, ContentStyles, ContentItemBody, Typography, NewConversationButton } = Components
  
  const userHasSocialMedia = Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS).some(field => user[field])
  
  const userKarma = user.karma || 0
  const bioNode = (
    user.biography?.html ||
    user.howICanHelpOthers?.html
  ) && <>
    <div
      className={classNames(classes.bio, {[classes.collapsedBio]: collapsed && meritsCollapse})}
      ref={bioRef}
      onClick={() => setCollapsed(false)}
    >
      {user.biography?.html && <ContentStyles contentType="post" className={classes.bioContentStyles}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: user.biography.html }}
          description={`user ${user._id} bio`}
          nofollow={userKarma < nofollowKarmaThreshold.get()}
        />
      </ContentStyles>}
      {user.howICanHelpOthers?.html && <>
        <div className={classes.sectionSubHeading}>How I can help others</div>
        <ContentStyles contentType="post" className={classes.bioContentStyles}>
          <ContentItemBody dangerouslySetInnerHTML={{__html: user.howICanHelpOthers.html }} nofollow={userKarma < nofollowKarmaThreshold.get()}/>
        </ContentStyles>
      </>}
    </div>
    {meritsCollapse && <button className={classNames(classes.showMoreButton, {[classes.showLess]: !collapsed})} onClick={() => setCollapsed(!collapsed)}>
      {collapsed ? "SHOW MORE" : "SHOW LESS"}
    </button>}
  </>
  
  return <div className={classes.root}>
    <div className={classes.body}>
      <div className={classes.photoRow}>
        {user.profileImageId && <Link to={`/users/${user.slug}?from=advisors_page`} className={classes.photoLink}>
          <CloudinaryImage2
            imgProps={{q: '100', w: '100', h: '100'}}
            publicId={user.profileImageId}
            className={classes.profileImage}
          />
        </Link>}
        <div className={classes.photoRowText}>
          <Typography variant="headline" className={classes.name}>
            <Link to={`/users/${user.slug}?from=advisors_page`} className={classes.displayName}>
              {user.displayName}
            </Link>
          </Typography>
          {(user.jobTitle || user.organization) && <div className={classes.role}>
            {user.jobTitle} {user.organization ? `@ ${user.organization}` : ''}
          </div>}
          {(user.mapLocation || userHasSocialMedia) && <div className={classes.locationRow}>
            {user.mapLocation && <div className={classes.location}>
              <LocationIcon className={classes.locationIcon} />
              {user.mapLocation.formatted_address}
            </div>}
            {userHasSocialMedia && <div className={classes.socialMediaIcons}>
              {Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS).map(field => socialMediaIcon(user, field, classes.socialMediaIcon))}
            </div>}
          </div>}
        </div>
      </div>
      {bioNode}
    </div>
    <div className={classes.buttonRow}>
      <NewConversationButton user={user} currentUser={currentUser} from="advisors_page">
        <Button
          variant="outlined"
          color="primary"
          className={classes.messageBtn}
          disabled={currentUser?._id === user._id}
        >
          Message
        </Button>
      </NewConversationButton>
    </div>
  </div>
}

const CommunityMemberCardComponent = registerComponent(
  'CommunityMemberCard', CommunityMemberCard, {styles}
);

declare global {
  interface ComponentTypes {
    CommunityMemberCard: typeof CommunityMemberCardComponent
  }
}
