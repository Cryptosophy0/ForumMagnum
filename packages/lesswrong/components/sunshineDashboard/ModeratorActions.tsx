import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import DoneIcon from '@material-ui/icons/Done';
import SnoozeIcon from '@material-ui/icons/Snooze';
import AddAlarmIcon from '@material-ui/icons/AddAlarm';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import VisibilityOutlinedIcon from '@material-ui/icons/VisibilityOutlined';
import OutlinedFlagIcon from '@material-ui/icons/OutlinedFlag';
import classNames from 'classnames';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCreate } from '../../lib/crud/withCreate';
import moment from 'moment';
import { LOW_AVERAGE_KARMA_COMMENT_ALERT, LOW_AVERAGE_KARMA_POST_ALERT, MODERATOR_ACTION_TYPES, RATE_LIMIT_ONE_PER_DAY } from '../../lib/collections/moderatorActions/schema';
import FlagIcon from '@material-ui/icons/Flag';
import Input from '@material-ui/core/Input';
import { isLowAverageKarmaContent } from '../../lib/collections/moderatorActions/helpers';
import { sortBy } from 'underscore';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { hideScrollBars } from '../../themes/styleUtils';
import { getSignature, getSignatureWithNote } from '../../lib/collections/users/helpers';
import { useDialog } from '../common/withDialog';

const styles = (theme: ThemeType): JssStyles => ({
  row: {
    display: "flex",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8
  },
  modButton:{
    marginTop: 6,
    marginRight: 16,
    cursor: "pointer",
    '&:hover': {
      opacity: .5
    }
  },
  snooze10: {
    color: theme.palette.primary.main,
    fontSize: 34,
    marginTop: 4
  },
  permissionsButton: {
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    border: theme.palette.border.normal,
    borderRadius: 2,
    cursor: "pointer",
    whiteSpace: "nowrap",
    marginRight: 8
  },
  permissionDisabled: {
    border: "none"
  },
  notes: {
    border: theme.palette.border.faint,
    borderRadius: 2,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 8,
    marginBottom: 8,
    ...hideScrollBars,
    '& *': {
      ...hideScrollBars
    }
  },
});

interface UserContentCountPartial {
  postCount?: number,
  commentCount?: number
}

export function getCurrentContentCount(user: UserContentCountPartial) {
  const postCount = user.postCount ?? 0
  const commentCount = user.commentCount ?? 0
  return postCount + commentCount
}

export function getNewSnoozeUntilContentCount(user: UserContentCountPartial, contentCount: number) {
  return getCurrentContentCount(user) + contentCount
}

export const ModeratorActions = ({classes, user, currentUser, refetch, comments, posts}: {
  user: SunshineUsersList,
  classes: ClassesType,
  currentUser: UsersCurrent,
  refetch: () => void,
  comments: Array<CommentsListWithParentMetadata>|undefined,
  posts: Array<SunshinePostsList>|undefined,
}) => {
  const { LWTooltip } = Components
  const [notes, setNotes] = useState(user.sunshineNotes || "")
  const { openDialog } = useDialog()

  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  })

  const { mutate: updateModeratorAction } = useUpdate({
    collectionName: 'ModeratorActions',
    fragmentName: 'ModeratorActionsDefaultFragment'
  });

  const { create: createModeratorAction } = useCreate({
    collectionName: 'ModeratorActions',
    fragmentName: 'ModeratorActionsDefaultFragment'
  });

  const canReview = !!(user.maxCommentCount || user.maxPostCount)

  const signature = getSignature(currentUser.displayName);

  const getModSignatureWithNote = (note: string) => getSignatureWithNote(currentUser.displayName, note);
  
  const handleNotes = () => {
    if (notes != user.sunshineNotes) {
      void updateUser({
        selector: {_id: user._id},
        data: {
          sunshineNotes: notes
        }
      })
    }
  }

  const signAndDate = (sunshineNotes:string) => {
    if (!sunshineNotes.match(signature)) {
      const padding = !sunshineNotes ? ": " : ": \n\n"
      return signature + padding + sunshineNotes
    }
    return sunshineNotes
  }
  
  const handleClick = () => {
    const signedNotes = signAndDate(notes)
    if (signedNotes != notes) {
      setNotes(signedNotes)
    }
  }
  const handleReview = () => {
    if (canReview) {
      void updateUser({
        selector: {_id: user._id},
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser._id,
          reviewedAt: new Date(),
          needsReview: false,
          sunshineNotes: notes,
          snoozedUntilContentCount: null
        }
      })
    }
  }
  
  const handleSnooze = (contentCount: number) => {
    const newNotes = getModSignatureWithNote(`Snooze ${contentCount}`)+notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        needsReview: false,
        reviewedAt: new Date(),
        reviewedByUserId: currentUser!._id,
        sunshineNotes: newNotes,
        snoozedUntilContentCount: getNewSnoozeUntilContentCount(user, contentCount)
      }
    })
    setNotes( newNotes )
  }
  
  const handleNeedsReview = () => {
    const newNotes = getModSignatureWithNote("set to manual review") + notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        needsReview: true,
        sunshineNotes: newNotes
      }
    })    
    setNotes( newNotes )
  }

  const handleRemoveNeedsReview = () => {
    const newNotes = getModSignatureWithNote("removed from review queue without snooze/approval") + notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        needsReview: false,
        sunshineNotes: newNotes
      }
    })    
    setNotes( newNotes )
  }

  const banMonths = 3
  
  const handleBan = () => {
    const newNotes = getModSignatureWithNote("Ban") + notes;
    if (confirm(`Ban this user for ${banMonths} months?`)) {
      void updateUser({
        selector: {_id: user._id},
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser!._id,
          voteBanned: true,
          needsReview: false,
          reviewedAt: new Date(),
          banned: moment().add(banMonths, 'months').toDate(),
          sunshineNotes: newNotes
        }
      })
      setNotes( newNotes )
    }
  }
  
  const handlePurge = () => {
    if (confirm("Are you sure you want to delete all this user's posts, comments and votes?")) {
      void updateUser({
        selector: {_id: user._id},
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser!._id,
          nullifyVotes: true,
          voteBanned: true,
          deleteContent: true,
          needsReview: false,
          reviewedAt: new Date(),
          banned: moment().add(1000, 'years').toDate(),
          sunshineNotes: notes
        }
      })
      setNotes( getModSignatureWithNote("Purge")+notes )
    }
  }
  
  const handleFlag = () => {
    void updateUser({
      selector: {_id: user._id},
      data: {
        sunshineFlagged: !user.sunshineFlagged,
        sunshineNotes: notes
      }
    })
    
    const flagStatus = user.sunshineFlagged ? "Unflag" : "Flag"
    setNotes( getModSignatureWithNote(flagStatus)+notes )
  }
  
  const handleDisablePosting = () => {
    const abled = user.postingDisabled ? 'enabled' : 'disabled';
    const newNotes = getModSignatureWithNote(`posting ${abled}`) + notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        postingDisabled: !user.postingDisabled,
        sunshineNotes: newNotes
      }
    })
    setNotes( newNotes )
  }
  
  const handleDisableAllCommenting = () => {
    const abled = user.allCommentingDisabled ? 'enabled' : 'disabled';
    const newNotes = getModSignatureWithNote(`all commenting ${abled}`) + notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        allCommentingDisabled: !user.allCommentingDisabled,
        sunshineNotes: newNotes
      }
    })
    setNotes( newNotes )
  }
  
  const handleDisableCommentingOnOtherUsers = () => {
    const abled = user.commentingOnOtherUsersDisabled ? 'enabled' : 'disabled'
    const newNotes = getModSignatureWithNote(`commenting on other's ${abled}`) + notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        commentingOnOtherUsersDisabled: !user.commentingOnOtherUsersDisabled,
        sunshineNotes: newNotes
      }
    })
    setNotes( newNotes )
  }
  
  const handleDisableConversations = () => {
    const abled = user.conversationsDisabled ? 'enabled' : 'disabled'
    const newNotes = getModSignatureWithNote(`conversations ${abled}`) + notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        conversationsDisabled: !user.conversationsDisabled,
        sunshineNotes: newNotes
      }
    })
    setNotes( newNotes )
  }

  const mostRecentRateLimit = user.moderatorActions.find(modAction => modAction.type === RATE_LIMIT_ONE_PER_DAY);

  const createRateLimit = async (endDate?: Date) => {
    const newNotes = getModSignatureWithNote(`rate limit added`) + notes;
    void updateUser({
      selector: { _id: user._id },
      data: { sunshineNotes: newNotes }
    });

    const maybeEndedAt = endDate ? { endedAt: endDate } : {};
    // Otherwise, we want to create a new one
    await createModeratorAction({
      data: {
        type: RATE_LIMIT_ONE_PER_DAY,
        userId: user._id,
        ...maybeEndedAt
      }
    });

    setNotes(newNotes);
    // We have a refetch to ensure the button displays (toggled on/off) properly 
    refetch();
  };

  const endRateLimit = async (rateLimitId: string) => {
    const newNotes = getModSignatureWithNote(`rate limit removed`) + notes;
    void updateUser({
      selector: { _id: user._id },
      data: { sunshineNotes: newNotes }
    });

    await updateModeratorAction({
      selector: { _id: rateLimitId },
      data: { endedAt: new Date() }
    });

    setNotes(newNotes);
    // We have a refetch to ensure the button displays (toggled on/off) properly 
    refetch();
  };

  const handleRateLimit = async () => {
    // If we have an active rate limit, we want to disable it
    if (mostRecentRateLimit?.active) {
      await endRateLimit(mostRecentRateLimit._id);
    } else {
      // Otherwise, we want to create a new one
      openDialog({
        componentName: 'RateLimitDialog',
        componentProps: { createRateLimit },
      });
    }
  };

  const actionRow = <div className={classes.row}>
    <LWTooltip title="Snooze 10 (Appear in sidebar after 10 posts and/or comments)" placement="top">
      <AddAlarmIcon className={classNames(classes.snooze10, classes.modButton)} onClick={() => handleSnooze(10)}/>
    </LWTooltip>
    <LWTooltip title="Snooze 1 (Appear in sidebar on next post or comment)" placement="top">
      <SnoozeIcon className={classes.modButton} onClick={() => handleSnooze(1)}/>
    </LWTooltip>
    <LWTooltip title="Approve" placement="top">
      <DoneIcon onClick={handleReview} className={classNames(classes.modButton, {[classes.canReview]: !classes.disabled })}/>
    </LWTooltip>
    <LWTooltip title="Ban for 3 months" placement="top">
      <RemoveCircleOutlineIcon className={classes.modButton} onClick={handleBan} />
    </LWTooltip>
    <LWTooltip title="Purge (delete and ban)" placement="top">
      <DeleteForeverIcon className={classes.modButton} onClick={handlePurge} />
    </LWTooltip>
    <LWTooltip title={user.sunshineFlagged ? "Unflag this user" : <div>
      <div>Flag this user for more in-depth review</div>
      <div><em>(This will not remove them from sidebar)</em></div>
    </div>} placement="top">
      <div onClick={handleFlag} className={classes.modButton} >
        {user.sunshineFlagged ? <FlagIcon /> : <OutlinedFlagIcon />}
      </div>
    </LWTooltip>
    {!user.needsReview && <LWTooltip title="Return this user to the review queue">
      <VisibilityOutlinedIcon className={classes.modButton} onClick={handleNeedsReview}/>
    </LWTooltip>}
    {user.needsReview && <LWTooltip title="Remove this user from the review queue">
      <VisibilityOffIcon className={classes.modButton} onClick={handleRemoveNeedsReview}/>
    </LWTooltip>}
  </div>

  const permissionsRow = <div className={classes.row}>
    <LWTooltip title={`${user.postingDisabled ? "Enable" : "Disable"} this user's ability to create posts`}>
      <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.postingDisabled})} onClick={handleDisablePosting}>
        Posts
      </div>
    </LWTooltip>
    <LWTooltip title={`${user.allCommentingDisabled ? "Enable" : "Disable"} this user's to comment (including their own shortform)`}>
      <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.allCommentingDisabled})} onClick={handleDisableAllCommenting}>
        All Comments
      </div>
    </LWTooltip>
    <LWTooltip title={`${user.commentingOnOtherUsersDisabled ? "Enable" : "Disable"} this user's ability to comment on other people's posts`}>
      <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.commentingOnOtherUsersDisabled})} onClick={handleDisableCommentingOnOtherUsers}>
        Other Comments
      </div>
    </LWTooltip>
    <LWTooltip title={`${user.conversationsDisabled ? "Enable" : "Disable"} this user's ability to start new private conversations`}>
      <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.conversationsDisabled})}onClick={handleDisableConversations}>
        Conversations
      </div>
    </LWTooltip>
  </div>

  const moderatorActionLog = <div>
    {user.moderatorActions
      .filter(moderatorAction => moderatorAction.active)
      .map(moderatorAction => {
        let averageContentKarma: number | undefined;
        if (moderatorAction.type === LOW_AVERAGE_KARMA_COMMENT_ALERT) {
          const mostRecentComments = sortBy(comments ?? [], 'postedAt').reverse();
          ({ averageContentKarma } = isLowAverageKarmaContent(mostRecentComments ?? [], 'comment'));
        } else if (moderatorAction.type === LOW_AVERAGE_KARMA_POST_ALERT) {
          const mostRecentPosts = sortBy(posts ?? [], 'postedAt').reverse();
          ({ averageContentKarma } = isLowAverageKarmaContent(mostRecentPosts ?? [], 'post'));
        }

        const suffix = typeof averageContentKarma === 'number' ? ` (${averageContentKarma})` : '';
        const endedAt = moderatorAction.endedAt ? `, ends on ${moment(moderatorAction.endedAt).format('YYYY-MM-DD').toString()}` : '';

        return <div key={`${user._id}_${moderatorAction.type}`}>
          {`${MODERATOR_ACTION_TYPES[moderatorAction.type]}${suffix}${endedAt}`}
        </div>;
      })
    }
  </div>

  return <div>
    {actionRow}
    {permissionsRow}
    <div>
      <LWTooltip title={`${mostRecentRateLimit?.active ? "Un-rate-limit" : "Rate-limit"} this user's ability to post and comment`}>
        <div className={classNames(classes.permissionsButton, { [classes.permissionDisabled]: mostRecentRateLimit?.active })} onClick={handleRateLimit}>
          {MODERATOR_ACTION_TYPES[RATE_LIMIT_ONE_PER_DAY]}
        </div>
      </LWTooltip>
    </div>
    <div className={classes.notes}>
      <Input
        value={notes}
        fullWidth
        onChange={e => setNotes(e.target.value)}
        onClick={e => handleClick()}
        onBlur={handleNotes}
        disableUnderline
        placeholder="Notes for other moderators"
        multiline
        rowsMax={5}
      />
    </div>
    {moderatorActionLog}
  </div>
}

const ModeratorActionsComponent = registerComponent('ModeratorActions', ModeratorActions, {styles});

declare global {
  interface ComponentTypes {
    ModeratorActions: typeof ModeratorActionsComponent
  }
}

