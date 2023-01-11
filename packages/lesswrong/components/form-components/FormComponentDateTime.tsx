import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import DateTimePicker from 'react-datetime';
import moment from '../../lib/moment-timezone';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import classNames from 'classnames';

const formComponentDateTimeStyles = (theme: ThemeType): JssStyles => ({
  label: {
    position:"relative",
    transform:"none",
    fontSize: 10,
  },
  timezone: {
    marginLeft: 4
  },
});

const reactDateTimeStyles = (theme: ThemeType): JssStyles => ({
  input: {
    borderBottom: `solid 1px ${theme.palette.grey[550]}`,
    padding: '6px 0 7px 0',
    background: 'transparent',
  },
  
  // Styles from react-datetime (https://github.com/arqex/react-datetime)
  // Originally vulcan-forms datetime.scss, now moved, JSSified, and modified
  // to make use of `theme`.
  wrapper: {
    "& .rdt": {
      position: "relative",
    },
    "& .rdtPicker": {
      display: "none",
      position: "absolute",
      width: 250,
      padding: 4,
      marginTop: 1,
      zIndex: "99999 !important",
      background: theme.palette.panelBackground.default,
      boxShadow: theme.palette.boxShadow.moreFocused,
      border: `1px solid ${theme.palette.grey[55]}`,
    },
    "& .rdtOpen .rdtPicker": {
      display: "block",
    },
    "& .rdtStatic .rdtPicker": {
      boxShadow: "none",
      position: "static",
    },
    
    "& .rdtPicker .rdtTimeToggle": {
      textAlign: "center",
    },
    
    "& .rdtPicker table": {
      width: "100%",
      margin: 0,
    },
    "& .rdtPicker td, & .rdtPicker th": {
      textAlign: "center",
      height: 28,
    },
    "& .rdtPicker td": {
      cursor: "pointer",
    },
    "& .rdtPicker td.rdtToday:hover, & .rdtPicker td.rdtHour:hover, & .rdtPicker td.rdtMinute:hover, & .rdtPicker td.rdtSecond:hover, & .rdtPicker .rdtTimeToggle:hover": {
      background: theme.palette.grey[200],
      cursor: "pointer",
    },
    "& .rdtPicker td.rdtOld, & .rdtPicker td.rdtNew": {
      color: theme.palette.grey[550],
    },
    "& .rdtPicker td.rdtToday": {
      position: "relative",
    },
    "& .rdtPicker td.rdtToday:before": {
      content: '',
      display: "inline-block",
      borderLeft: "7px solid transparent",
      borderBottom: `7px solid ${theme.palette.datePicker.selectedDate}`,
      borderTopColor: theme.palette.greyAlpha(0.2),
      position: "absolute",
      bottom: 4,
      right: 4,
    },
    "& .rdtPicker td.rdtActive, & .rdtPicker td.rdtActive:hover": {
      backgroundColor: theme.palette.datePicker.selectedDate,
      color: theme.palette.text.maxIntensity,
      textShadow: `0 -1px 0 ${theme.palette.greyAlpha(0.25)}`,
    },
    "& .rdtPicker td.rdtActive.rdtToday:before": {
      borderBottomColor: theme.palette.text.maxIntensity,
    },
    "& .rdtPicker td.rdtDisabled, & .rdtPicker td.rdtDisabled:hover": {
      background: "none",
      color: theme.palette.grey[550],
      cursor: "notAllowed",
    },
    
    "& .rdtPicker td span.rdtOld": {
      color: theme.palette.grey[550],
    },
    "& .rdtPicker td span.rdtDisabled, .rdtPicker td span.rdtDisabled:hover": {
      background: "none",
      color: theme.palette.grey[550],
      cursor: "not-allowed",
    },
    "& .rdtPicker th": {
      borderBottom: `1px solid ${theme.palette.grey[55]}`,
    },
    "& .rdtPicker .dow": {
      width: "14.2857%",
      borderBottom: "none",
    },
    "& .rdtPicker th.rdtSwitch": {
      width: 100,
    },
    "& .rdtPicker th.rdtNext, &.rdtPicker th.rdtPrev": {
      fontSize: 21,
      verticalAlign: "top",
    },
    
    "& .rdtPrev span, & .rdtNext span": {
      display: "block",
      "-webkit-touch-callout": "none", /* iOS Safari */
      "-webkit-user-select": "none",   /* Chrome/Safari/Opera */
      "-khtml-user-select": "none",    /* Konqueror */
      "-moz-user-select": "none",      /* Firefox */
      "-ms-user-select": "none",       /* Internet Explorer/Edge */
      userSelect: "none",
    },
    
    "& .rdtPicker th.rdtDisabled, & .rdtPicker th.rdtDisabled:hover": {
      background: "none",
      color: theme.palette.grey[550],
      cursor: "not-allowed",
    },
    "& .rdtPicker thead tr:first-child th": {
      cursor: "pointer",
    },
    "& .rdtPicker thead tr:first-child th:hover": {
      background: theme.palette.grey[200],
    },
    
    "& .rdtPicker tfoot":{
      borderTop: `1px solid ${theme.palette.grey[55]}`,
    },
    
    "& .rdtPicker button": {
      border: "none",
      background: "none",
      cursor: "pointer",
    },
    "& .rdtPicker button:hover": {
      backgroundColor: theme.palette.grey[200],
    },
    
    "& .rdtPicker thead button": {
      width: "100%",
      height: "100%",
    },
    
    "& td.rdtMonth, & td.rdtYear": {
      height: 50,
      width: "25%",
      cursor: "pointer",
    },
    "& td.rdtMonth:hover, & td.rdtYear:hover": {
      background: theme.palette.grey[200],
    },
    
    "& .rdtCounters": {
      display: "inline-block",
    },
    
    "& .rdtCounters > div": {
      float: "left",
    },
    
    "& .rdtCounter": {
      height: 100,
      width: 40,
    },
    
    "& .rdtCounterSeparator": {
      lineHeight: '100px',
    },
    
    "& .rdtCounter .rdtBtn": {
      height: "40%",
      lineHeight: "40px",
      cursor: "pointer",
      display: "block",
    
      "-webkit-touch-callout": "none", /* iOS Safari */
      "-webkit-user-select": "none",   /* Chrome/Safari/Opera */
      "-khtml-user-select": "none",    /* Konqueror */
      "-moz-user-select": "none",      /* Firefox */
      "-ms-user-select": "none",       /* Internet Explorer/Edge */
      userSelect: "none",
    },
    "& .rdtCounter .rdtBtn:hover": {
      background: theme.palette.grey[200],
    },
    "& .rdtCounter .rdtCount": {
      height: "20%",
      fontSize: "1.2em",
    },
    
    "& .rdtMilli": {
      verticalAlign: "middle",
      paddingLeft: 8,
      width: 48,
    },
    
    "& .rdtMilli input": {
      width: "100%",
      fontSize: "1.2em",
      marginTop: 37,
    },
    
    "& .rdtDayPart": {
      marginTop: 43,
    },
  },
  dateFormAbove: {
    bottom: 30,
  },
});


// FormComponentDateTime: Wrapper to make ReactDateTime fit in the Vulcan forms
// system.
// TODO: This may not work right in nested contexts.
const FormComponentDateTime = ({ path, value, name, label, classes, position }, context) => {
  const updateDate = (date: Date | undefined) => {
    if (date) context.updateCurrentValues({[path]: date})
  }

  const date = value ? (typeof value === 'string' ? new Date(value) : value) : null;
  // since tz abbrev can depend on the date (i.e. EST vs EDT),
  // we try to use the selected date to determine the tz (and default to now)
  const tzDate = date ? moment(date) : moment();

  return <FormControl>
    <InputLabel className={classes.label}>
      {label}
      <span className={classes.timezone}>({tzDate.tz(moment.tz.guess()).zoneAbbr()})</span>
    </InputLabel>
    <Components.ReactDateTime
      name={name}
      value={date}
      onChange={updateDate}
    />
  </FormControl>
}

(FormComponentDateTime as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};


const ReactDateTime = ({name, value, onChange, position="above", classes}: {
  name: string,
  value: Date|undefined,
  onChange: (newValue: Date|undefined)=>void,
  position?: "above"|"below",
  classes: ClassesType,
}) => {
  return <div className={classes.wrapper}>
    <DateTimePicker
      value={value}
      inputProps={{
        name:name,
        autoComplete:"off",
        className: classNames(classes.input, {
          [classes.dateFormAbove]: position==="above",
        })
      }}
      // newDate argument is a Moment object given by react-datetime
      onChange={(newDate: any) => onChange(newDate._d)}
    />
  </div>
}

const FormComponentDateTimeComponent = registerComponent("FormComponentDateTime", FormComponentDateTime, {styles: formComponentDateTimeStyles});
const ReactDateTimeComponent = registerComponent("ReactDateTime", ReactDateTime, {styles: reactDateTimeStyles});

declare global {
  interface ComponentTypes {
    FormComponentDateTime: typeof FormComponentDateTimeComponent
    ReactDateTime: typeof ReactDateTimeComponent
  }
}

