import React, {useEffect, useRef, useState} from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from '../../lib/crud/withMulti';
import Messages from "../../lib/collections/messages/collection";
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import withErrorBoundary from '../common/withErrorBoundary';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useTracking } from '../../lib/analyticsEvents';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import { userCanDo } from '../../lib/vulcan-users';

const styles = (theme: ThemeType): JssStyles => ({
  conversationSection: {
    maxWidth: 550,
  },
  conversationTitle: {
    ...theme.typography.commentStyle,
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit*1.5
  },
  editor: {
    marginTop: theme.spacing.unit*4,
    ...theme.typography.commentStyle,
    position:"relative",
  },
  backButton: {
    color: theme.palette.lwTertiary.main
  },
  row: {
    display: "flex",
    justifyContent: "space-between"
  }
})

const getDraftMessageHtml = ({html, displayName, firstName}) => {
  if (!html) return
  let newHtml = html.replace(/.*\\\\/, "")
  if (displayName) {
    newHtml = newHtml.replace(/{{displayName}}/g, displayName)
  }
  if (firstName) {
    newHtml = newHtml.replace(/{{firstName}}/g, firstName)
  }
  return newHtml
}

// The Navigation for the Inbox components
const ConversationPage = ({ documentId, terms, currentUser, classes }: {
  documentId: string,
  terms: MessagesViewTerms,
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const { results, loading: loadingMessages } = useMulti({
    terms,
    collectionName: "Messages",
    fragmentName: 'messageListFragment',
    fetchPolicy: 'cache-and-network',
    limit: 100000,
    enableTotal: false,
  });
  const { document: conversation, loading: loadingConversation } = useSingle({
    documentId,
    collectionName: "Conversations",
    fragmentName: 'conversationsListFragment',
  });
  const loading = loadingMessages || loadingConversation;

  const { query } = useLocation()
  const { captureEvent } = useTracking()

  const { document: template, loading: loadingTemplate } = useSingle({
    documentId: query.templateCommentId,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
  });
  
  // Scroll to bottom when loading finishes. Note that this overlaps with the
  // initialScroll:"bottom" setting in the route, which is handled by the
  // ScrollToTop component, except that the ScrollToTop component does its thing
  // on initial load, which may be while the messages (which make this page tall)
  // are still loading.
  // Also note, if you're refreshing (as opposed to navigating or opening a new
  // tab), this can wind up fighting with the browser's scroll restoration (see
  // client/scrollRestoration.ts).
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  useEffect(() => {
    if (!loadingMessages && !scrolledToBottom) {
      setScrolledToBottom(true);
      setTimeout(()=>{window.scroll(0, document.body.scrollHeight)}, 0);
    }
  }, [loadingMessages,scrolledToBottom]);
  
  // try to attribute this sent message to where the user came from
  const profileViewedFrom = useRef('')
  useEffect(() => {
    const ls = getBrowserLocalStorage()
    if (query.from) {
      profileViewedFrom.current = query.from
    } else if (conversation && conversation.participantIds.length === 2 && ls) {
      // if this is a conversation with one other person, see if we have info on where the current user found them
      const otherUserId = conversation.participantIds.find(id => id !== currentUser._id)
      const lastViewedProfiles = JSON.parse(ls.getItem('lastViewedProfiles'))
      profileViewedFrom.current = lastViewedProfiles?.find(profile => profile.userId === otherUserId)?.from
    }
  }, [query.from, conversation, currentUser._id])

  const { SingleColumnSection, ConversationDetails, WrappedSmartForm, Error404, Loading, MessageItem, Typography } = Components
  
  const renderMessages = () => {
    if (loading) return <Loading />
    if (!results?.length) return null
    
    return <div>
      {results.map((message) => (<MessageItem key={message._id} message={message} />))}
    </div>
  }

  if (loading || (loadingTemplate && query.templateCommentId)) return <Loading />
  if (!conversation) return <Error404 />

  const showModInboxLink = userCanDo(currentUser, 'conversations.view.all') && conversation.moderator

  const templateHtml = getDraftMessageHtml({html: template?.contents?.html, displayName: query.displayName, firstName: query.firstName })

  return (
    <SingleColumnSection>
      <div className={classes.conversationSection}>
        <div className={classes.row}>
          <Typography variant="body2" className={classes.backButton}><Link to="/inbox"> Go back to Inbox </Link></Typography>
          {showModInboxLink && <Typography variant="body2" className={classes.backButton}>
            <Link to="/moderatorInbox"> Moderator Inbox </Link>
          </Typography>}
        </div>
        <Typography variant="display2" className={classes.conversationTitle}>
          { conversationGetTitle(conversation, currentUser)}
        </Typography>
        <ConversationDetails conversation={conversation}/>
        {renderMessages()}
        <div className={classes.editor}>
          <WrappedSmartForm
            collection={Messages}
            prefilledProps={{
              conversationId: conversation._id,
              contents: {
                originalContents: {
                  type: "ckEditorMarkup",
                  data: templateHtml
                }
              }
            }}
            mutationFragment={getFragment("messageListFragment")}
            successCallback={() => {
              captureEvent('messageSent', {
                conversationId: conversation._id,
                sender: currentUser._id,
                participantIds: conversation.participantIds,
                messageCount: (conversation.messageCount || 0) + 1,
                ...(profileViewedFrom.current && {from: profileViewedFrom.current})
              })
            }}
            errorCallback={(message: any) => {
              //eslint-disable-next-line no-console
              console.error("Failed to send", message)
            }}
          />
        </div>
      </div>
    </SingleColumnSection>
  )
}

const ConversationPageComponent = registerComponent('ConversationPage', ConversationPage, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    ConversationPage: typeof ConversationPageComponent
  }
}

