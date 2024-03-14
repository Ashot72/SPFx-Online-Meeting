import * as React from "react";
import { useEffect, useState } from "react";
import { Alert, Flex, Loader, Provider, Text } from "@fluentui/react-northstar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import * as strings from "OnlineMeetingWebPartStrings";
import styles from "./OnlineMeeting.module.scss";
import type { IOnlineMeetingProps } from "./IOnlineMeetingProps";
import { useTeamsService } from "../hooks/useTeamsService";
import { useEventsService } from "../hooks/useEventsService"
import EventAddPanel from "./event/EventAddPanel";
import EventViewPanel from "./event/EventViewPanel";
import useRegisterTheme from "../hooks/useRegisterTheme";
import { calendarEvent } from "../types";

const OnlineMeeting: React.FC<IOnlineMeetingProps> = ({ context }) => {
  const theme = useRegisterTheme(context);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const [newEventDate, setNewEventDate] = useState<Date>();
  const [calendarEvent, setCalendarEvent] = useState<calendarEvent>();

  const { teams, pictures, teamsLoading, error: teamsError, getTeams } =
    useTeamsService(
      context,
    );

  const { calendarEvents, eventsLoading, error: eventsError, getEvents } =
    useEventsService(context);

  useEffect(getTeams, [getTeams]);

  useEffect(() => {
    if (!teamsLoading) {
      if (startDate && endDate) {
        getEvents(teams, startDate, endDate);
      }
    }
  }, [teamsLoading, startDate]);

  const onSave = (): void => {
    if (startDate && endDate) {
      getEvents(teams, startDate, endDate);
    }
  };

  const handleEventClick = (clickInfo): void => {
    const event = calendarEvents.find((e) => e.id === clickInfo.event.id);

    if (event) {
      setCalendarEvent(event);
    }
  };

  const renderEventContent = (
    eventInfo: { timeText; event: { title: string } },
  ): JSX.Element => {
    return (
      <div>
        <b>{eventInfo.timeText}</b>
        <i
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {eventInfo.event.title}
        </i>
      </div>
    );
  };

  const handleDateClick = (arg): void => setNewEventDate(arg.date);

  const onEventAddClose = (): void => setNewEventDate(undefined);

  const onEventViewClose = (): void => setCalendarEvent(undefined);

  return (
    <Provider theme={theme} className={styles.onlineMeeting}>
      <div>
        {teamsError &&
          (
            <Alert
              danger
              content={teamsError}
            />
          )}
        {eventsError &&
          (
            <Alert
              danger
              content={eventsError}
            />
          )}
        {!teamsError && !eventsError &&
          (
            <Flex column gap="gap.medium">
              <Flex.Item align="center">
                <Text size="larger">
                  {strings.OnlineMeetings}
                </Text>
              </Flex.Item>
              {(teamsLoading || eventsLoading) &&
                (
                  <Flex.Item align="center">
                    <Loader inline />
                  </Flex.Item>
                )}
            </Flex>
          )}
        {!teamsError && !eventsError &&
          (
            <FullCalendar
              editable={true}
              datesSet={(dateinfo) => {
                setStartDate(dateinfo.start);
                setEndDate(dateinfo.end);
              }}
              selectable={true}
              selectMirror={true}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              dayMaxEvents={true}
              weekends={true}
              headerToolbar={{
                left: "prev,today,next",
                right: "title",
              }}
              events={calendarEvents}
              eventContent={renderEventContent}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
            />
          )}
        {newEventDate && (
          <EventAddPanel
            context={context}
            onClose={onEventAddClose}
            date={newEventDate}
            teams={teams}
            pictures={pictures}
            onSave={onSave}
          />
        )}
        {calendarEvent &&
          (
            <EventViewPanel
              context={context}
              teams={teams}
              calendarEvent={calendarEvent}
              pictures={pictures}
              onClose={onEventViewClose}
              onSave={onSave}
            />
          )}
      </div>
    </Provider>
  );
};

export default OnlineMeeting;
