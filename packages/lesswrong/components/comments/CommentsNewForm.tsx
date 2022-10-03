import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { Comments } from '../../lib/collections/comments/collection';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'
import { useDialog } from '../common/withDialog';
import { hideUnreviewedAuthorCommentsSettings } from '../../lib/publicSettings';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import { useMessages } from '../common/withMessages';
import { useUpdate } from "../../lib/crud/withUpdate";
import { afNonMemberDisplayInitialPopup, afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import ArrowForward from '@material-ui/icons/ArrowForward';
import { TagCommentType, commentDefaultToAlignment } from '../../lib/collections/comments/types';

export type CommentFormDisplayMode = "default" | "minimalist"

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  rootMinimalist: {
    '& .form-input': {
      width: "100%",
      margin: 0,
      marginTop: 4,
    },
    '& form': {
      display: "flex",
      flexDirection: "row",
    }
  },
  loadingRoot: {
    opacity: 0.5
  },
  form: {
    padding: 10,
  },
  formMinimalist: {
    padding: '12px 10px 8px 10px',
  },
  modNote: {
    paddingTop: '4px',
    color: theme.palette.text.dim2,
  },
  submit: {
    textAlign: 'right',
  },
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      opacity: .5,
      backgroundColor: "none",
    },
    color: theme.palette.lwTertiary.main,
  },
  cancelButton: {
    color: theme.palette.grey[400],
  },
  submitMinimalist: {
    height: 'fit-content',
    marginTop: "auto",
    marginBottom: 4,
  },
  formButtonMinimalist: {
    padding: "2px",
    fontSize: "16px",
    minWidth: 28,
    minHeight: 28,
    marginLeft: "5px",
    "&:hover": {
      opacity: .8,
      backgroundColor: theme.palette.lwTertiary.main,
    },
    backgroundColor: theme.palette.lwTertiary.main,
    color: theme.palette.background.pageActiveAreaBackground,
    overflowX: "hidden",  // to stop loading dots from wrapping around
  },
  moderationGuidelinesWrapper: {
    backgroundColor: theme.palette.panelBackground.newCommentFormModerationGuidelines,
  }
});

const CommentsNewForm = ({prefilledProps = {}, post, tag, tagCommentType = TagCommentType.Discussion, parentComment, successCallback, type, cancelCallback, classes, removeFields, fragment = "CommentsList", formProps, enableGuidelines=true, padding=true, displayMode = "default"}:
{
  prefilledProps?: any,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  tagCommentType?: TagCommentType,
  parentComment?: any,
  successCallback?: any,
  type: string,
  cancelCallback?: any,
  classes: ClassesType,
  removeFields?: any,
  fragment?: FragmentName,
  formProps?: any,
  enableGuidelines?: boolean,
  padding?: boolean
  displayMode?: CommentFormDisplayMode
}) => {
  const currentUser = useCurrentUser();
  const {flash} = useMessages();
  prefilledProps = {
    ...prefilledProps,
    af: commentDefaultToAlignment(currentUser, post, parentComment),
  };
  
  const isMinimalist = displayMode === "minimalist"
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [loading, setLoading] = useState(false)
  const { ModerationGuidelinesBox, WrappedSmartForm, RecaptchaWarning, Loading } = Components
  
  const { openDialog } = useDialog();
  const { mutate: updateComment } = useUpdate({
    collectionName: "Comments",
    fragmentName: 'SuggestAlignmentComment',
  })
  

  const wrappedSuccessCallback = (comment: CommentsList, { form }: {form: any}) => {
    afNonMemberSuccessHandling({currentUser, document: comment, openDialog, updateDocument: updateComment })
    if (comment.deleted) {
      flash(comment.deletedReason);
    }
    if (successCallback) {
      successCallback(comment, { form })
    }
    setLoading(false)
  };

  const wrappedCancelCallback = (...args) => {
    if (cancelCallback) {
      cancelCallback(...args)
    }
    setLoading(false)
  };
  
  if (post) {
    prefilledProps = {
      ...prefilledProps,
      postId: post._id
    };
  }
  
  if (tag) {
    prefilledProps = {
      ...prefilledProps,
      tagId: tag._id,
      tagCommentType: tagCommentType,
    };
  }

  if (parentComment) {
    prefilledProps = {
      ...prefilledProps,
      parentCommentId: parentComment._id,
    };
  }

  const SubmitComponent = ({submitLabel = "Submit"}) => {
    const formButtonClass = isMinimalist ? classes.formButtonMinimalist : classes.formButton
    return <div className={classNames(classes.submit, {[classes.submitMinimalist]: isMinimalist})}>
      {(type === "reply" && !isMinimalist) && <Button
        onClick={cancelCallback}
        className={classNames(formButtonClass, classes.cancelButton)}
      >
        Cancel
      </Button>}
      <Button
        type="submit"
        id="new-comment-submit"
        className={formButtonClass}
        onClick={(ev) => {
          if (!currentUser) {
            openDialog({
              componentName: "LoginPopup",
              componentProps: {}
            });
            ev.preventDefault();
          }
        }}
      >
        {loading ? <Loading /> : (isMinimalist ? <ArrowForward /> : submitLabel)}
      </Button>
    </div>
  };

  // @ts-ignore FIXME: Not enforcing that the post-author fragment has enough fields for userIsAllowedToComment
  if (currentUser && !userCanDo(currentUser, `posts.moderate.all`) && !userIsAllowedToComment(currentUser, prefilledProps, post?.user)) {
    return <span>Sorry, you do not have permission to comment at this time.</span>
  }

  const commentWillBeHidden = hideUnreviewedAuthorCommentsSettings.get() && currentUser && !currentUser.isReviewed
  const extraFormProps = isMinimalist ? {commentMinimalistStyle: true, editorHintText: "Reply..."} : {}
  return (
    <div className={classNames(isMinimalist ? classes.rootMinimalist : classes.root, {[classes.loadingRoot]: loading})} onFocus={()=>{
      // On focus (this bubbles out from the text editor), show moderation guidelines.
      // Defer this through a setTimeout, because otherwise clicking the Cancel button
      // doesn't work (the focus event fires before the click event, the state change
      // causes DOM nodes to get replaced, and replacing the DOM nodes prevents the
      // rest of the click event handlers from firing.)
      setTimeout(() => setShowGuidelines(true), 0);
    }}>
      <RecaptchaWarning currentUser={currentUser}>
        <div className={padding ? classNames({[classes.form]: !isMinimalist, [classes.formMinimalist]: isMinimalist}) : undefined}>
          {commentWillBeHidden && <div className={classes.modNote}><em>
            A moderator will need to review your account before your comments will show up.
          </em></div>}
          <div onFocus={(ev) => {
            afNonMemberDisplayInitialPopup(currentUser, openDialog)
            ev.preventDefault()
          }}>
            <WrappedSmartForm
              id="new-comment-form"
              collection={Comments}
              mutationFragment={getFragment(fragment)}
              successCallback={wrappedSuccessCallback}
              cancelCallback={wrappedCancelCallback}
              submitCallback={(data) => { 
                setLoading(true);
                return data
              }}
              errorCallback={() => setLoading(false)}
              prefilledProps={prefilledProps}
              layout="elementOnly"
              formComponents={{
                FormSubmit: SubmitComponent,
                FormGroupLayout: Components.DefaultStyleFormGroup
              }}
              alignmentForumPost={post?.af}
              addFields={currentUser?[]:["contents"]}
              removeFields={removeFields}
              formProps={{
                ...extraFormProps,
                ...formProps,
              }}
            />
          </div>
        </div>
        {post && enableGuidelines && showGuidelines && <div className={classes.moderationGuidelinesWrapper}>
          <ModerationGuidelinesBox post={post} />
        </div>}
      </RecaptchaWarning>
    </div>
  );
};

const CommentsNewFormComponent = registerComponent('CommentsNewForm', CommentsNewForm, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    CommentsNewForm: typeof CommentsNewFormComponent,
  }
}
