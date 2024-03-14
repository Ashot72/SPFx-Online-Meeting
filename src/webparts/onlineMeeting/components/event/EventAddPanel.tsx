import * as React from "react";
import { useState } from "react";
import { MSGraphClientV3 } from "@microsoft/sp-http";
import { sortBy } from "@microsoft/sp-lodash-subset";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { IPersonaProps } from "office-ui-fabric-react/lib/components/Persona/Persona.types";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Datepicker,
  Dropdown,
  Flex,
  FlexItem,
  Input,
  Loader,
  Provider,
  Text,
  TextArea,
} from "@fluentui/react-northstar";
import * as strings from "OnlineMeetingWebPartStrings";
import styles from "./EventPanel.module.scss";
import { setBackgroundColor } from "../../themeColor";
import TimePicker, { hourMinute } from "../TimePicker";
import { teamResponse } from "../../types";
import TeamCard from "../team/TeamCard";
import { pictureInfo } from "../../hooks/useTeams";
import useTheme from "../../hooks/useTheme";

type onlineEventInfo = {
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: {
    emailAddress: {
      address: string | undefined;
      name: string | undefined;
    };
    type: string;
  }[];
  isAllDay: boolean;
  allowNewTimeProposals: boolean;
  isOnlineMeeting: boolean;
  onlineMeetingProvider: string;
  locations?: [{
    displayName: string;
  }];
};

interface IEventPanel {
  context: WebPartContext;
  teams: teamResponse[];
  pictures: pictureInfo[];
  date: Date;
  onClose: () => void;
  onSave: () => void;
}

const EventAddPanel: React.FC<IEventPanel> = (
  { context, teams, pictures, date, onClose, onSave },
) => {
  const theme = useTheme(context);

  const [allDay, setAllDay] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [team, setTeam] = useState("");
  const [attendees, setAttendees] = useState<IPersonaProps[]>([]);
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [startTime, setStartTime] = useState<hourMinute>();
  const [endTime, setEndTime] = useState<hourMinute>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTeam: teamResponse | undefined = team
    ? teams.find((t) => t.displayName === team)
    : undefined;

  const teamsName = teams.map((t) => t.displayName);
  const teamsNameSorted = sortBy(teamsName);

  const onSubjectChange = (_, v): void => setSubject(v.value);

  const onDescriptionChange = (_, v): void => setDescription(v.value);

  const onLocationChange = (_, v): void => setLocation(v.value);

  const onTeamChange = (_, v): void => setTeam(v.value);

  const getAttendees = (attendees: IPersonaProps[]): void =>
    setAttendees(attendees);

  const onStartDateChange = (_, v): void => setStartDate(v.value);

  const onEndDateChange = (_, v): void => setEndDate(v.value);

  const onStartTimeSelected = ({ hour, minute }: hourMinute): void =>
    setStartTime({ hour, minute });

  const onEndTimeSelected = ({ hour, minute }: hourMinute): void =>
    setEndTime({ hour, minute });

  const onCreatEvent = (): void => {
    setError("");

    if (subject.trim() === "") {
      setError(strings.SubjectMessage);
      return;
    }

    if (description.trim() === "") {
      setError(strings.DescriptionMessage);
      return;
    }

    if (team.trim() === "") {
      setError(strings.TeamMessage);
      return;
    }

    const selTeam = teams.find((t) => t.displayName === team.trim());
    const groupId = selTeam?.id;

    let meetingStartDate;
    if (allDay) {
      meetingStartDate = (startDate as any).format("yyyy-MM-ddT00:00:00.000Z");
    } else {
      meetingStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startTime?.hour,
        startTime?.minute,
      );
    }

    let meetingEndDate;
    if (allDay) {
      endDate.setDate(endDate.getDate() + 1);
      meetingEndDate = (endDate as any).format("yyyy-MM-ddT00:00:00.000Z");
    } else {
      meetingEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        endTime?.hour,
        endTime?.minute,
      );
    }

    const attendeesInfo = attendees.map((p) => (
      {
        emailAddress: {
          address: p.secondaryText,
          name: p.text,
        },
        type: "required",
      }
    ));

    const onlineEventInfo: onlineEventInfo = ({
      subject: subject.trim(),
      body: {
        contentType: "HTML",
        content: description.trim(),
      },
      start: {
        dateTime: meetingStartDate,
        timeZone: "Greenwich Mean Time",
      },
      end: {
        dateTime: meetingEndDate,
        timeZone: "Greenwich Mean Time",
      },
      attendees: attendeesInfo,
      isAllDay: allDay,
      allowNewTimeProposals: true,
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness",
    });

    if (location.trim() !== "") {
      onlineEventInfo.locations = [
        { displayName: location },
      ];
    }

    setLoading(true);
    context.msGraphClientFactory.getClient("3")
      .then((client: MSGraphClientV3) =>
        //get events
        client.api(`/groups/${groupId}/events`)
          .version("beta")
          .post(onlineEventInfo)
          .then(() => {
            setLoading(false);
            onSave();
            onClose();
          }).catch((e) => {
            setError(e.message);
            setLoading(false);
          })
      ).catch((e) => {
        console.log("Graph error:", e);
        setError(e.message);
      });
  };

  const form = (
    <Flex
      styles={setBackgroundColor}
      className={styles.panel}
    >
      <Flex column fill>
        <Text
          content={strings.MeetingCreateEvent}
          size="large"
          weight="bold"
          className={styles.header}
          align="center"
        />
        <FlexItem grow={1}>
          <Flex column gap="gap.medium">
            <Flex hAlign="center">
              {loading && <Loader inline />}
            </Flex>
            <Flex hAlign="center">
              {error && (
                <Alert
                  danger
                  content={error}
                />
              )}
            </Flex>
            {/*  Subject */}
            <Flex column gap="gap.medium">
              <Flex gap="gap.small">
                <Text
                  size="medium"
                  style={{ marginTop: "5px" }}
                  content={`${strings.Subject}:`}
                />
                <Input
                  fluid
                  required
                  name="subject"
                  value={subject}
                  onChange={onSubjectChange}
                />
              </Flex>
              {/*  Description */}
              <Flex gap="gap.small">
                <Text
                  style={{ marginTop: "13px" }}
                  content={`${strings.Description}:`}
                />
                <TextArea
                  required
                  fluid
                  name="content"
                  value={description}
                  onChange={onDescriptionChange}
                />
              </Flex>
              {/*  Locations */}
              <Flex gap="gap.small">
                <Text
                  style={{ marginTop: "13px" }}
                  content={`Location:`}
                />
                <Input
                  fluid
                  required
                  name="location"
                  value={location}
                  onChange={onLocationChange}
                />
              </Flex>
            </Flex>
            {/*<Teams />*/}
            <Flex column gap="gap.medium">
              <Flex gap="gap.small">
                <Text
                  style={{ marginTop: "6px" }}
                  content={`${strings.Team}:`}
                />
                <Flex.Item grow={1}>
                  <Dropdown
                    fluid
                    placeholder={strings.TeamSelect}
                    value={team}
                    inline
                    items={teamsNameSorted}
                    onChange={onTeamChange}
                  />
                </Flex.Item>
              </Flex>
            </Flex>
            {/*<Team Card />*/}
            <Flex column gap="gap.medium">
              {selectedTeam &&
                (
                  <TeamCard
                    team={selectedTeam}
                    pictures={pictures}
                  />
                )}
            </Flex>
            {/*  Start DateTime */}
            <Flex column gap="gap.medium">
              <Flex.Item align="center">
                <Text
                  weight="semibold"
                  size="medium"
                  content={strings.StartDateTime}
                />
              </Flex.Item>
              <Flex gap="gap.small">
                <Text
                  size="medium"
                  style={{ marginTop: "5px" }}
                  content={`${strings.Date}:`}
                />
                <Datepicker
                  onDateChange={onStartDateChange}
                  selectedDate={date}
                />
              </Flex>
              {!allDay && <TimePicker onTimeSelected={onStartTimeSelected} />}
            </Flex>
            {/*  End DateTime */}
            <Flex column gap="gap.medium">
              <Flex.Item align="center">
                <Text
                  weight="semibold"
                  size="medium"
                  content={strings.EndDateTime}
                />
              </Flex.Item>
              <Flex gap="gap.small">
                <Text
                  size="medium"
                  style={{ marginTop: "5px" }}
                  content={`${strings.Date}:`}
                />
                <Datepicker
                  onDateChange={onEndDateChange}
                  selectedDate={date}
                />
              </Flex>
              {!allDay && (
                <TimePicker shift onTimeSelected={onEndTimeSelected} />
              )}
            </Flex>

            {/*  All day */}
            <Flex column gap="gap.medium">
              <Checkbox
                label={strings.AllDay}
                checked={allDay}
                toggle
                onChange={(_, { ...props }) => setAllDay(props.checked)}
              />
            </Flex>
            <Flex column gap="gap.medium">
              <PeoplePicker
                context={context as any}
                titleText={strings.Attendees}
                personSelectionLimit={25}
                groupName={""}
                showtooltip={true}
                required={false}
                disabled={false}
                ensureUser={true}
                onChange={(items) => getAttendees(items)}
                principalTypes={[PrincipalType.User]}
                resolveDelay={1000}
              />
            </Flex>
          </Flex>
        </FlexItem>
        <Flex hAlign="end" className={styles.btnsCntainer}>
          <ButtonGroup>
            <Flex gap="gap.smaller">
              <Button content={strings.Close} onClick={onClose} />
              <Button
                primary
                content={strings.CreateEvent}
                onClick={onCreatEvent}
              />
            </Flex>
          </ButtonGroup>
        </Flex>
      </Flex>
    </Flex>
  );

  return (
    <Provider theme={theme}>
      <Flex className={styles.eventPanel}>
        <Box
          className={styles.box}
          content={form}
        />
      </Flex>
    </Provider>
  );
};

export default EventAddPanel;
