import React from 'react';
import { registerComponent, Components, slugify } from '../../lib/vulcan-lib';
import classNames from 'classnames'

export const sectionTitleStyle = (theme: ThemeType): JssStyles => ({
  margin:0,
  ...theme.typography.postStyle,
  fontSize: "2.2rem"
})

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.unit*3,
    paddingBottom: 8
  },
  noTopMargin: {
    marginTop: 0
  },
  title: {
    ...sectionTitleStyle(theme)
  },
  children: {
    ...theme.typography.commentStyle,
    [theme.breakpoints.down('sm')]: {
      marginRight: 8,
      marginLeft: 16,
    },
  }
})

const getAnchorId = (anchor: string|undefined, title: React.ReactNode) => {
  if (anchor) {
    return anchor;
  }
  if (typeof title === 'string') {
    return slugify(title);
  }
}

const SectionTitle = ({children, classes, className, title, noTopMargin, anchor}: {
  children?: React.ReactNode,
  classes: ClassesType,
  className?: string,
  title: React.ReactNode,
  noTopMargin?: Boolean,
  anchor?: string,
}) => {
  return (
    <div className={noTopMargin ? classNames(classes.root, classes.noTopMargin) : classes.root}>
      <Components.Typography
        id={getAnchorId(anchor, title)}
        variant='display1'
        className={classNames(classes.title, className)}
      >
        {title}
      </Components.Typography>
      <div className={classes.children}>{ children }</div>
    </div>
  )
}

const SectionTitleComponent = registerComponent('SectionTitle', SectionTitle, {styles});

declare global {
  interface ComponentTypes {
    SectionTitle: typeof SectionTitleComponent
  }
}
