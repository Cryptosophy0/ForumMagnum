import React, { useState, useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Geosuggest from 'react-geosuggest';
import { isClient } from '../../lib/executionEnvironment';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import FormLabel from '@material-ui/core/FormLabel';

// Recommended styling for React-geosuggest: https://github.com/ubilabs/react-geosuggest/blob/master/src/geosuggest.css
export const geoSuggestStyles = (theme: ThemeType): JssStyles => ({
  "& .geosuggest": {
    fontSize: "1rem",
    position: "relative",
    paddingRight: 3,
    width: "100%",
    textAlign: "left",
  },
  
  "& .geosuggest__input": {
    backgroundColor: 'transparent',
    border: "2px solid transparent",
    borderBottom: "1px solid rgba(0,0,0,.87)",
    padding: ".5em .5em 0.5em 0em !important",
    width: 350,
    fontSize: 13,
    color: theme.palette.primary.main,
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    },
  },
  "& .geosuggest__input:focus": {
    outline: "none",
    borderBottom: "2px solid rgba(0,0,0,.87)",
    borderBottomColor: "#267dc0",
    boxShadow: "0 0 0 transparent",
  },
  
  "& .geosuggest__suggests": {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: "25em",
    padding: 0,
    marginTop: -1,
    background: "#fff",
    borderTopWidth: 0,
    overflowX: "hidden",
    overflowY: "auto",
    listStyle: "none",
    zIndex: 5,
    transition: "max-height 0.2s, border 0.2s",
  },
  "& .geosuggest__suggests--hidden": {
    maxHeight: 0,
    overflow: "hidden",
    borderWidth: 0,
  },
  
  "& .geosuggest__item": {
    fontSize: "1rem",
    padding: ".5em .65em",
    cursor: "pointer",
  },
  "& .geosuggest__item:hover, & .geosuggest__item:focus": {
    background: "#f5f5f5",
  },
  "& .geosuggest__item--active": {
    background: "#267dc0",
    color: "#fff",
  },
  "& .geosuggest__item--active:hover, & .geosuggest__item--active:focus": {
    background: "#ccc",
  },
  "& .geosuggest__item__matched-text": {
    fontWeight: "bold",
  }
})

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...geoSuggestStyles(theme),
    ...theme.typography.commentStyle
  },
  label: {
    fontSize: 10
  }
});

export const mapsAPIKeySetting = new DatabasePublicSetting<string | null>('googleMaps.apiKey', null)

let mapsLoadingState: "unloaded"|"loading"|"loaded" = "unloaded";
let onMapsLoaded: Array<()=>void> = [];

export const useGoogleMaps = (): [boolean, any] => {
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  
  useEffect(() => {
    if (isClient) {
      if (mapsLoadingState === "loaded") {
        setIsMapsLoaded(true);
      } else {
        onMapsLoaded.push(() => {
          setIsMapsLoaded(true);
        });
      }
      
      if (mapsLoadingState === "unloaded") {
        mapsLoadingState = "loading";
        
        var tag = document.createElement('script');
        tag.async = false;
        tag.src = `https://maps.googleapis.com/maps/api/js?key=${mapsAPIKeySetting.get()}&libraries=places&callback=googleMapsFinishedLoading`;
        (window as any).googleMapsFinishedLoading = () => {
          mapsLoadingState = "loaded";
          let callbacks = onMapsLoaded;
          onMapsLoaded = [];
          for (let callback of callbacks) {
            callback();
          }
        }
        document.body.appendChild(tag);
      }
    }
  }, []);
  
  if (!isMapsLoaded) return [false, null];
  return [true, (window as any)?.google?.maps];
}


const LocationFormComponent = ({document, path, label, value, updateCurrentValues, stringVersionFieldName, classes}: {
  document: any,
  path: string,
  label: string,
  value: string,
  updateCurrentValues: any,
  stringVersionFieldName?: string|null,
  classes: ClassesType,
}) => {
  // if this location field has a matching field that just stores the string version of the location,
  // make sure to update the matching field along with this one
  const locationFieldName: string|null = stringVersionFieldName || null;

  const location =
    (locationFieldName && document?.[locationFieldName])
    || document?.[path]?.formatted_address
    || ""
  const [ mapsLoaded ] = useGoogleMaps()
  
  const handleCheckClear = (value) => {
    // clear location fields if the user deletes the input text
    if (value === '') {
      updateCurrentValues({
        ...(locationFieldName ? {[locationFieldName]: null} : {}),
        [path]: null,
      })
    }
  }

  const handleSuggestSelect = (suggestion) => {
    if (suggestion && suggestion.gmaps) {
      updateCurrentValues({
        ...(locationFieldName ? {
          [locationFieldName]: suggestion.label
        } : {}),
        [path]: suggestion.gmaps,
      })
    }
  }


  if (document && mapsLoaded) {
    return <div className={classes.root}>
      {value && <FormLabel className={classes.label}>{label}</FormLabel>}
      <Geosuggest
        placeholder={label}
        onChange={handleCheckClear}
        onSuggestSelect={handleSuggestSelect}
        initialValue={location}
      />
    </div>
  } else {
    return <Components.Loading/>;
  }
}

const LocationFormComponentComponent = registerComponent("LocationFormComponent", LocationFormComponent, {styles});

declare global {
  interface ComponentTypes {
    LocationFormComponent: typeof LocationFormComponentComponent
  }
}
