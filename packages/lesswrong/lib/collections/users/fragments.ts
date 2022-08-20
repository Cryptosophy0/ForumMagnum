import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment UsersMinimumInfo on User {
    _id
    slug
    createdAt
    username
    displayName
    previousDisplayName
    fullName
    karma
    afKarma
    deleted
    isAdmin
    htmlBio
    postCount
    commentCount
    sequenceCount
    afPostCount
    afCommentCount
    spamRiskScore
    tagRevisionCount
  }
`);

registerFragment(`
  fragment UsersProfile on User {
    ...UsersMinimumInfo
    oldSlugs
    groups
    jobTitle
    organization
    careerStage
    biography {
      ...RevisionDisplay
    }
    howOthersCanHelpMe {
      ...RevisionEdit
    }
    howICanHelpOthers {
      ...RevisionEdit
    }
    organizerOfGroupIds
    organizerOfGroups {
      ...localGroupsBase
    }
    programParticipation
    website
    linkedinProfileURL
    facebookProfileURL
    twitterProfileURL
    githubProfileURL
    frontpagePostCount
    afSequenceCount
    afSequenceDraftCount
    sequenceDraftCount
    moderationStyle
    moderationGuidelines {
      ...RevisionDisplay
    }
    profileImageId
    bannedUserIds
    location
    googleLocation
    mapLocation
    mapLocationSet
    mapMarkerText
    htmlMapMarkerText
    mongoLocation
    shortformFeedId
    viewUnreviewedComments
    auto_subscribe_to_my_posts
    auto_subscribe_to_my_comments
    autoSubscribeAsOrganizer
    petrovPressedButtonDate
    sortDraftsBy
    ...SunshineUsersList
    ...SharedUserBooleans
    noindex
    paymentEmail
    paymentInfo
    goodHeartTokens
    postingDisabled
    allCommentingDisabled
    commentingOnOtherUsersDisabled
    conversationsDisabled
  }
`);

registerFragment(`
  fragment UsersCurrent on User {
    ...UsersProfile

    beta
    email
    services
    pageUrl
    voteBanned
    banned
    isReviewed
    nullifyVotes
    hideIntercom
    hideNavigationSidebar
    currentFrontpageFilter
    frontpageFilterSettings
    allPostsTimeframe
    allPostsSorting
    allPostsFilter
    allPostsShowLowKarma
    allPostsIncludeEvents
    allPostsOpenSettings
    draftsListSorting
    draftsListShowArchived
    draftsListShowShared
    lastNotificationsCheck
    bannedUserIds
    bannedPersonalUserIds
    biography {
      ...RevisionEdit
    }
    moderationStyle
    moderationGuidelines {
      ...RevisionEdit
    }
    showHideKarmaOption
    markDownPostEditor
    hideElicitPredictions
    hideAFNonMemberInitialWarning
    commentSorting
    location
    googleLocation
    mongoLocation
    mapLocation
    mapLocationSet
    mapMarkerText
    htmlMapMarkerText
    nearbyEventsNotifications
    nearbyEventsNotificationsLocation
    nearbyEventsNotificationsRadius
    nearbyPeopleNotificationThreshold
    hideFrontpageMap
    emailSubscribedToCurated
    subscribedToDigest
    unsubscribeFromAll
    emails
    whenConfirmationEmailSent
    hideSubscribePoke
    hideMeetupsPoke
    noCollapseCommentsFrontpage
    noCollapseCommentsPosts
    noSingleLineComments
    karmaChangeNotifierSettings
    karmaChangeLastOpened
    shortformFeedId
    viewUnreviewedComments
    recommendationSettings

    bookmarkedPostsMetadata

    hiddenPostsMetadata
    auto_subscribe_to_my_posts
    auto_subscribe_to_my_comments
    autoSubscribeAsOrganizer
    noExpandUnreadCommentsReview
    reviewVotesQuadratic
    reviewVotesQuadratic2019
    reviewVotesQuadratic2020
    hideTaggingProgressBar
    hideFrontpageBookAd
    hideFrontpageBook2019Ad

    abTestKey
    abTestOverrides

    sortDraftsBy

    petrovPressedButtonDate
    petrovLaunchCodeDate
    lastUsedTimezone
    ...SharedUserBooleans
  }
`);

registerFragment(`
  fragment UserBookmarkedPosts on User {
    _id
    bookmarkedPosts {
      ...PostsList
    }
  }
`);

registerFragment(`
  fragment UserKarmaChanges on User {
    _id
    karmaChanges {
      totalChange
      updateFrequency
      startDate
      endDate
      nextBatchDate
      posts {
        _id
        scoreChange
        title
        slug
      }
      comments {
        _id
        scoreChange
        description
        postId
        tagSlug
      }
      tagRevisions {
        _id
        scoreChange
        tagId
        tagSlug
        tagName
      }
    }
  }
`);

registerFragment(`
  fragment UsersBannedFromUsersModerationLog on User {
    _id
    slug
    displayName
    bannedUserIds
  }
`)

registerFragment(`
  fragment SunshineUsersList on User {
    ...UsersMinimumInfo
    karma
    htmlBio
    website
    createdAt
    email
    commentCount
    maxCommentCount
    postCount
    maxPostCount
    voteCount
    smallUpvoteCount
    bigUpvoteCount
    smallDownvoteCount
    bigDownvoteCount
    banned
    reviewedByUserId
    reviewedAt
    signUpReCaptchaRating
    
    needsReview
    sunshineNotes
    sunshineFlagged
    postingDisabled
    allCommentingDisabled
    commentingOnOtherUsersDisabled
    conversationsDisabled
    snoozedUntilContentCount
  }
`);

registerFragment(`
  fragment SharedUserBooleans on User {
    walledGardenInvite
    hideWalledGardenUI
    walledGardenPortalOnboarded
    taggingDashboardCollapsed
    usernameUnset
  }
`)

registerFragment(`
  fragment UsersMapEntry on User {
    ...UsersMinimumInfo
    createdAt
    isAdmin
    groups
    location
    googleLocation
    mapLocation
    mapLocationSet
    mapMarkerText
    htmlMapMarkerText
    mongoLocation
  }
`);


registerFragment(`
  fragment UsersEdit on User {
    ...UsersProfile
    biography {
      ...RevisionEdit
    }
    # Moderation Guidelines editor information
    moderationGuidelines {
      ...RevisionEdit
    }

    # UI Settings
    markDownPostEditor
    hideElicitPredictions
    hideAFNonMemberInitialWarning
    hideIntercom
    commentSorting
    currentFrontpageFilter
    noCollapseCommentsPosts
    noCollapseCommentsFrontpage
    noSingleLineComments
    beta

    # Emails
    email
    whenConfirmationEmailSent
    emailSubscribedToCurated
    subscribedToDigest
    unsubscribeFromAll
    hasAuth0Id

    # Moderation
    moderatorAssistance
    collapseModerationGuidelines
    bannedUserIds
    bannedPersonalUserIds
    showHideKarmaOption

    # Ban & Purge
    voteBanned
    nullifyVotes
    deleteContent
    banned

    # Name
    username
    displayName
    fullName

    # Location
    mongoLocation
    googleLocation
    location
    
    # Map Location (public)
    mapLocation

    # Admin & Review
    reviewedByUserId

    # Alignment Forum
    reviewForAlignmentForumUserId
    groups
    afApplicationText
    afSubmittedApplication

    # Karma Settings
    karmaChangeLastOpened
    karmaChangeNotifierSettings

    notificationShortformContent
    notificationCommentsOnSubscribedPost
    notificationRepliesToMyComments
    notificationRepliesToSubscribedComments
    notificationSubscribedUserPost
    notificationSubscribedTagPost
    notificationPostsInGroups
    notificationPrivateMessage
    notificationSharedWithMe
    notificationAlignmentSubmissionApproved
    notificationEventInRadius
    notificationRSVPs
    notificationCommentsOnDraft
    notificationPostsNominatedReview
    notificationGroupAdministration

    hideFrontpageMap
    hideTaggingProgressBar
    hideFrontpageBookAd
    hideFrontpageBook2019Ad

    deleted
  }
`)

registerFragment(`
  fragment UsersAdmin on User {
    _id
    username
    createdAt
    isAdmin
    displayName
    email
    slug
    groups
    services
    karma
  }
`);

registerFragment(`
  fragment UsersWithReviewInfo on User {
    ...UsersMinimumInfo
    reviewVoteCount
    email
  }
`)

registerFragment(`
  fragment UsersProfileEdit on User {
    _id
    slug
    jobTitle
    organization
    careerStage
    profileImageId
    biography {
      ...RevisionEdit
    }
    howOthersCanHelpMe {
      ...RevisionEdit
    }
    howICanHelpOthers {
      ...RevisionEdit
    }
    organizerOfGroupIds
    organizerOfGroups {
      ...localGroupsBase
    }
    programParticipation
    mapLocation
    website
    linkedinProfileURL
    facebookProfileURL
    twitterProfileURL
    githubProfileURL
  }
`)
