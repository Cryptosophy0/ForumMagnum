import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../withUser';
import { iconWidth } from './TabNavigationItem'

// -- See here for all the tab content --
import menuTabs from './menuTabs'
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { forumSelect } from '../../../lib/forumTypeUtils';
import classNames from 'classnames';

export const TAB_NAVIGATION_MENU_WIDTH = 250

const styles = (theme: ThemeType): JssStyles => {
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-around",
      maxWidth: TAB_NAVIGATION_MENU_WIDTH,
      paddingTop: 15,
    },
    navSidebarTransparent: {
      zIndex: 10,
      background: `${theme.palette.background.default}cf`, // Add alpha to background color, not thrilled about this way of doing it
      backdropFilter: 'blur(6px)'
    },
    divider: {
      width: 50,
      marginLeft: (theme.spacing.unit*2) + (iconWidth + (theme.spacing.unit*2)) - 2,
      marginTop: theme.spacing.unit*1.5,
      marginBottom: theme.spacing.unit*2.5,
      borderBottom: theme.palette.border.normal,
    },
  }
}

const TabNavigationMenu = ({onClickSection, transparentBackground, classes}: {
  onClickSection?: any,
  transparentBackground?: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const { TabNavigationItem, FeaturedResourceBanner } = Components
  const customComponentProps = {currentUser}
  
  const handleClick = (e, tabId) => {
    captureEvent(`${tabId}NavClicked`)
    onClickSection && onClickSection(e)
  }

  return (
      <AnalyticsContext pageSectionContext="navigationMenu">
        <div className={classNames(classes.root, {[classes.navSidebarTransparent]: transparentBackground})}>
          {forumSelect(menuTabs).map(tab => {
            if ('loggedOutOnly' in tab && tab.loggedOutOnly && currentUser) return null
            
            if ('divider' in tab) {
              return <div key={tab.id} className={classes.divider} />
            }
            if ('customComponentName' in tab) {
              const CustomComponent = Components[tab.customComponentName];
              const props = {
                ...customComponentProps,
                ...tab.customComponentProps,
                tab: tab,
              };
              return <CustomComponent
                key={tab.id}
                onClick={(e: MouseEvent) => handleClick(e, tab.id)}
                {...props}
              />
            }

            return <TabNavigationItem
              key={tab.id}
              tab={tab}
              onClick={(e) => handleClick(e, tab.id)}
            />
          })}
          {/* NB: This returns null if you don't have any active resources */}
          <FeaturedResourceBanner terms={{view: "activeResources"}}/>
        </div>
    </AnalyticsContext>  )
};

const TabNavigationMenuComponent = registerComponent(
  'TabNavigationMenu', TabNavigationMenu, {styles}
);

declare global {
  interface ComponentTypes {
    TabNavigationMenu: typeof TabNavigationMenuComponent
  }
}
