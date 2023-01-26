import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 650 + (theme.spacing.unit*4),
    [theme.breakpoints.down('md')]: {
      width: "unset"
    }
  },
  answersList: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*5,
    paddingBottom: theme.spacing.unit*2,
  },
  answersSorting:{
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
  },
  loading: {
    opacity: .5,
  },
})

const AnswersList = ({post, answers, classes}: {
  post: PostsList,
  answers: CommentsList[],
  classes: ClassesType,
}) => {
  const location = useLocation();
  const { query } = location;
  const { Answer, SectionTitle, AnswersSorting } = Components

  if (answers && answers.length) {
    return <div className={classes.root}>
      <SectionTitle title={
        <div><span>{ answers.length } Answers </span>
        <span className={classes.answersSorting}>sorted by <AnswersSorting post={post}/></span>
      </div>}/>

      <div className={classes.answersList}>
        { answers.map((comment, i) => {
          return <Answer comment={comment} post={post} key={comment._id} />
          })
        }
      </div>
    </div>
  } else {
    return null
  }
};

const AnswersListComponent = registerComponent('AnswersList', AnswersList, {styles});

declare global {
  interface ComponentTypes {
    AnswersList: typeof AnswersListComponent
  }
}

