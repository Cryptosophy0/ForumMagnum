import React, {useEffect, useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { useDialog } from '../common/withDialog';
import { useMulti } from '../../lib/crud/withMulti';
import { useSingle } from '../../lib/crud/withSingle';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import {CENTRAL_COLUMN_WIDTH} from "../posts/PostsPage/PostsPage";
import {commentBodyStyles, postBodyStyles} from "../../themes/stylePiping";
import {useMessages} from "../common/withMessages";
import { useMutation, gql } from '@apollo/client';

const LEFT_COLUMN_WIDTH = 160

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: CENTRAL_COLUMN_WIDTH + LEFT_COLUMN_WIDTH + 64, //should import post
    display: "flex",
    padding: 24,
    justifyContent: 'space-between'
  },
  leftColumn: {
    ...commentBodyStyles(theme),
  },
  // closeButton: {
  // },
  revisionRow: {
    padding: 12,
    cursor: "pointer",
  },
  selectedRevision: {
    background: "#eee",
  },
  versionNumber: {
    color: theme.palette.grey[900],
    marginRight: 8
  },
  editedAt: {
    color: theme.palette.grey[600],
    marginLeft: 8
  },
  selectedRevisionDisplay: {
    width: CENTRAL_COLUMN_WIDTH,
    ...postBodyStyles(theme)
  },
  restoreButton: {
    textAlign: "center",
    marginBottom: 32,
    marginTop: 16,
    paddingRight: 100
  },
  loadMore: {
    paddingLeft: 12
  }
});

const PostVersionHistoryButton = ({postId, classes}: {
  postId: string,
  classes: ClassesType
}) => {
  const { openDialog } = useDialog();
  return <Button
    onClick={() => {
      openDialog({
        componentName: "PostVersionHistory",
        componentProps: {postId},
      })
    }}
  >
    Version History
  </Button>
}

const PostVersionHistory = ({postId, onClose, classes}: {
  postId: string,
  onClose: ()=>void,
  classes: ClassesType
}) => {
  const { LWDialog, Loading, ContentItemBody, FormatDate, LoadMore, ChangeMetricsDisplay } = Components;
  const [selectedRevisionId,setSelectedRevisionId] = useState<string|null>(null);
  const [revertInProgress,setRevertInProgress] = useState(false);
  const [revertMutation] = useMutation(gql`
    mutation revertToRevision($postId: String!, $revisionId: String!) {
      revertPostToRevision(postId: $postId, revisionId: $revisionId) {
        ...PostsEdit
      }
    }
    ${fragmentTextForQuery("PostsEdit")}
  `);
  const [revertLoading, setRevertLoading] = useState(false);
  
  const {flash} = useMessages();
  
  const { results: revisions, loading: loadingRevisions, loadMoreProps } = useMulti({
    terms: {
      view: "revisionsOnDocument",
      documentId: postId,
      fieldName: "contents",
    },
    fetchPolicy: "cache-and-network" as any,
    collectionName: "Revisions",
    fragmentName: "RevisionMetadataWithChangeMetrics",
  });
  
  useEffect(() => {
    revisions && revisions.length > 0 && setSelectedRevisionId(revisions[0]._id)
  }, [revisions])
  
  const { document: revision, loading: loadingRevision } = useSingle({
    skip: !selectedRevisionId,
    documentId: selectedRevisionId||"",
    collectionName: "Revisions",
    fetchPolicy: "cache-first",
    fragmentName: "RevisionDisplay",
  });
  
  
  return <LWDialog open={true} maxWidth={false} onClose={onClose}>
    <div className={classes.root}>
      <div className={classes.leftColumn}>
        {loadingRevisions && <Loading/>}
        {revisions && revisions.map(rev =>
          <div key={rev._id}
            className={classNames(classes.revisionRow, {
              [classes.selectedRevision]: rev._id===selectedRevisionId,
            })}
            onClick={() => setSelectedRevisionId(rev._id)}
          >
            <span className={classes.versionNumber}>{rev.version}</span>
            <ChangeMetricsDisplay changeMetrics={rev.changeMetrics}/>
            <span className={classes.editedAt}><FormatDate date={rev.editedAt}/></span>
          </div>
        )}
        <div className={classes.loadMore}>
          <LoadMore {...loadMoreProps}/>
        </div>
      </div>
      <div className={classes.selectedRevisionDisplay}>
        {revision && <div className={classes.restoreButton}>
          {revertLoading
            ? <Loading/>
            : <Button variant="contained" color="primary" onClick={async () => {
                setRevertInProgress(true);
                await revertMutation({
                  variables: {
                    postId: postId,
                    revisionId: selectedRevisionId,
                  },
                });
                // Hard-refresh the page to get things back in sync
                location.reload();
              }}
            >
              RESTORE THIS VERSION{" "}
              {revertInProgress && <Loading/>}
            </Button>
          }
        </div>}
        {revision && <ContentItemBody
          dangerouslySetInnerHTML={{__html: revision.html}}
          description="PostVersionHistory revision"
        />}
      </div>
    </div>
  </LWDialog>
}

const PostVersionHistoryButtonComponent = registerComponent("PostVersionHistoryButton", PostVersionHistoryButton, {styles});
const PostVersionHistoryComponent = registerComponent("PostVersionHistory", PostVersionHistory, {styles});

declare global {
  interface ComponentTypes {
    PostVersionHistoryButton: typeof PostVersionHistoryButtonComponent
    PostVersionHistory: typeof PostVersionHistoryComponent
  }
}
