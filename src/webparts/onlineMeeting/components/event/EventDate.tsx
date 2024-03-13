import * as React from "react";
import { Flex, Text } from "@fluentui/react-northstar";
import * as strings from "OnlineMeetingWebPartStrings";
import { calendarEvent } from "../../interfaces";

interface IEventDate {
  event: calendarEvent;
}

const EventDate: React.FC<IEventDate> = ({ event }) => {
  const startDate = event.start;
  const endDate = event.end;
  const allDay = event.allDay;

  if (allDay) {
    endDate.setDate(endDate.getDate() - 1);
  }

  return (startDate.toLocaleDateString() === endDate.toLocaleDateString() &&
      !allDay)
    ? (
      <Text
        content={`${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()} `}
        size="small"
      />
    )
    : (
      <>
        {allDay
          ? (
            <Flex column hAlign="center">
              <Text
                content={`${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
              />
              <Text
                content={strings.AllDay}
                size="small"
              />
            </Flex>
          )
          : (
            <Text
              content={`${startDate.toLocaleString()} - ${endDate.toLocaleString()}`}
              size="small"
            />
          )}
      </>
    );
};

export default EventDate;
