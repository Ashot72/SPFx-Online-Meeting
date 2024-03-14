import * as React from "react";
import { useState } from "react";
import { MSGraphClientV3 } from "@microsoft/sp-http";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Dialog,
  Divider,
  EyeIcon,
  Flex,
  FlexItem,
  Loader,
  LocationIcon,
  Provider,
  Text,
} from "@fluentui/react-northstar";
import * as strings from "OnlineMeetingWebPartStrings";
import styles from "./EventPanel.module.scss";
import { setBackgroundColor, setIconForeColor } from "../../themeColor";
import { String } from "typescript-string-operations";
import EventDate from "./EventDate";
import { calendarEvent, teamResponse } from "../../types";
import TeamCard from "../team/TeamCard";
import { pictureInfo } from "../../hooks/useTeamsService";
import EventCard from "./EventCard";
import useTheme from "../../hooks/useTheme";
import { useRecordings } from "../../hooks/useRecordings";

interface IViewPanel {
  context: WebPartContext;
  teams: teamResponse[];
  calendarEvent: calendarEvent;
  pictures: pictureInfo[];
  onSave: () => void;
  onClose: () => void;
}

const EventViewPanel: React.FC<IViewPanel> = (
  { context, teams, pictures, calendarEvent, onClose, onSave },
) => {
  const theme = useTheme(context);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    videosTranscripts,
    loading: videLoading,
    error: videoError,
    done,
    loadVideosTranscripts,
  } = useRecordings(
    context,
    calendarEvent,
  );

  const team = teams.find((t) => t.id === calendarEvent.teamId);

  const lnToBr = (content: string): string =>
    content.replace(/(?:\r\n|\r|\n)/g, "<br>");

  const onCancelEvent = (): void => {
    setLoading(true);
    context.msGraphClientFactory.getClient("3")
      .then((client: MSGraphClientV3) =>
        client.api(
          `/groups/${team!.id}/events/${calendarEvent.id}/`,
        )
          .version("beta")
          .delete()
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

  const renderControls = (): JSX.Element[] =>
    videosTranscripts.map((vt, index) => {
      const recording = new Blob(vt.recordings, {
        type: "video/mp4",
      });
      const recordingUrl = (window.URL || window.webkitURL).createObjectURL(
        recording,
      );

      const transcription = new Blob(vt.transcripts, {
        type: "text/vtt",
      });

      const transcriptionUrl = (window.URL || window.webkitURL).createObjectURL(
        transcription,
      );

      return (
        <Flex column gap="gap.large" key={index}>
          <Flex column gap="gap.small">
            <Text
              content={new Date(vt.recordingDate).toLocaleString()}
              size="medium"
              align="center"
            />
            <Flex>
              <video controls width="312px">
                <source src={recordingUrl} type="video/mp4" />
                <track
                  default
                  kind="captions"
                  srcLang="en"
                  src={transcriptionUrl}
                />
                {strings.BrowserVideo}
              </video>
            </Flex>
          </Flex>
        </Flex>
      );
    });

  const view = (
    <>
      {!team
        ? (
          <Flex
            className={styles.panel}
          >
            <Flex column fill>
              <Flex hAlign="center">
                <Alert
                  danger
                  content={strings.FindNoTeam}
                />
              </Flex>
            </Flex>
          </Flex>
        )
        : (
          <Flex
            styles={setBackgroundColor}
            className={styles.panel}
          >
            <Flex column fill>
              <Text
                content={strings.MeetingViewEvent}
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
                  <Flex gap="gap.medium" className={styles.fullWidth}>
                    <TeamCard
                      team={team}
                      pictures={pictures}
                    />
                  </Flex>
                  <Flex gap="gap.medium">
                    <Divider
                      content={<EventDate event={calendarEvent} />}
                      className={styles.fullWidth}
                    />
                  </Flex>
                  <Flex gap="gap.medium">
                    <Flex column gap="gap.medium">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: lnToBr(
                            calendarEvent.content.replace(
                              /________________________________________________________________________________/g,
                              "",
                            ),
                          ),
                        }}
                      />
                    </Flex>
                  </Flex>
                  <Flex gap="gap.medium" className={styles.fullWidth}>
                    <EventCard
                      pictures={pictures}
                      calendarEvent={calendarEvent}
                    />
                  </Flex>
                  {calendarEvent.location &&
                    (
                      <Flex column gap="gap.medium">
                        <Flex gap="gap.smaller">
                          <LocationIcon
                            styles={setIconForeColor}
                            title={strings.Location}
                            className={styles.locIcon}
                          />
                          <Text
                            content={calendarEvent.location}
                            size="medium"
                          />
                        </Flex>
                      </Flex>
                    )}
                  <Flex column gap="gap.medium">
                    <Flex hAlign="start">
                      <Button
                        icon={<EyeIcon />}
                        text
                        primary
                        content={strings.ViewOutlook}
                        onClick={() => {
                          window.open(
                            calendarEvent.webLink,
                            "_blank",
                          );
                        }}
                      />
                    </Flex>
                  </Flex>
                  <Flex column gap="gap.medium" hAlign="center">
                    {done &&
                      renderControls()}
                  </Flex>
                  <Flex
                    column
                    gap="gap.medium"
                    hAlign="center"
                  >
                    <Flex hAlign="center">
                      {videoError && (
                        <Alert
                          danger
                          content={videoError}
                        />
                      )}
                    </Flex>
                    <Flex hAlign="center">
                      {videLoading && <Loader inline />}
                    </Flex>
                  </Flex>
                  <Flex
                    column
                    gap="gap.medium"
                    hAlign="center"
                  >
                    <Flex gap="gap.smaller">
                      <Button
                        primary
                        content={strings.ViewMeetings}
                        onClick={loadVideosTranscripts}
                      />
                      <Button
                        primary
                        content={strings.JoinMeeting}
                        onClick={() => {
                          window.open(
                            calendarEvent.joinUrl,
                            "_blank",
                          );
                        }}
                      />
                    </Flex>
                  </Flex>
                </Flex>
              </FlexItem>
              <Flex hAlign="end" className={styles.btnsCntainer}>
                <ButtonGroup>
                  <Flex gap="gap.smaller">
                    <Button content={strings.Close} onClick={onClose} />
                    <Dialog
                      cancelButton={strings.Cancel}
                      confirmButton={strings.Delete}
                      header={strings.Confirmation}
                      trigger={<Button primary content={strings.DeleteEvent} />}
                      onConfirm={onCancelEvent}
                      content={
                        <Text
                          content={String.Format(
                            strings.ConfirmDelete,
                            calendarEvent.title,
                          )}
                          align="center"
                          size="large"
                        />
                      }
                    />
                  </Flex>
                </ButtonGroup>
              </Flex>
            </Flex>
          </Flex>
        )}
    </>
  );

  return (
    <Provider theme={theme}>
      <Flex className={styles.eventPanel}>
        <Box
          className={styles.box}
          content={view}
        />
      </Flex>
    </Provider>
  );
};

export default EventViewPanel;
