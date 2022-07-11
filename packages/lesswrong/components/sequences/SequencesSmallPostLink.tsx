import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';
import { useItemsRead } from '../common/withRecordPostView';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    position: "relative",
    flexGrow: 1,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.grey[900],
    display: "flex",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 6
  },
  read: {
    width: 12,
    color: theme.palette.primary.light,
    marginRight: 10,
    position: "relative",
    top: -1
  },
  unread: {
    width: 12,
    color: theme.palette.grey[400],
    marginRight: 10,
    top: -1
  }
});

const SequencesSmallPostLink = ({classes, post, sequenceId}: {
  classes: ClassesType,
  post: PostsList,
  sequenceId: string
}) => {
  const { LWTooltip, PostsPreviewTooltip } = Components

  const { postsRead: clientPostsRead } = useItemsRead();

  const isPostRead = post.isRead || clientPostsRead[post._id];

  const icon = isPostRead ? <CheckBoxTwoToneIcon className={classes.read} /> : <CheckBoxOutlineBlankIcon className={classes.unread}/>

  return  <LWTooltip tooltip={false} clickable={true} title={<PostsPreviewTooltip post={post} postsList/>} placement="left-start" inlineBlock={false}>
        <Link to={postGetPageUrl(post, false, sequenceId)} className={classes.title}>
          {icon} {post.title}
        </Link>
      </LWTooltip>
}

const SequencesSmallPostLinkComponent = registerComponent("SequencesSmallPostLink", SequencesSmallPostLink, {styles});

declare global {
  interface ComponentTypes {
    SequencesSmallPostLink: typeof SequencesSmallPostLinkComponent
  }
}

