import { MSGraphClientV3 } from "@microsoft/sp-http";
import { chunk, flatten, uniqBy } from "@microsoft/sp-lodash-subset";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { useCallback, useState } from "react";
import { getPresences } from "../presence";
import {
  attendee,
  calendarEvent,
  pictureResponse,
  presence,
  request,
  teamResponse,
} from "../types";
import { b64toBlob, batchLimit, noUserIcon } from "../util";
import { pictureInfo } from "./useTeamsService";

type eventResponse = {
  id: string;
  status: number;
  body: {
    value: [{
      id: string;
      webLink: string;
      attendees: attendee[];
      bodyPreview: string;
      isAllDay: boolean;
      subject: string;
      start: {
        dateTime: string;
        timeZone: string;
      };
      end: {
        dateTime: string;
        timeZone: string;
      };
      onlineMeeting: {
        joinUrl: string;
      };
      location: {
        displayName: string;
      };
      organizer: {
        emailAddress: {
          address: string;
          name: string;
        };
      };
    }];
  };
};

type eventResponses = {
  responses: [
    eventResponse,
  ];
};

type eventUserResponse = {
  responses: [
    {
      id: string;
      status: number;
      body: {
        id: string;
      };
    },
  ];
};

type eventsGrapServiceResponse = {
  calendarEvents: calendarEvent[];
  pictures: pictureInfo[];
  eventsLoading: boolean;
  error: string;
  getEvents: (teams: teamResponse[], startDate: Date, endDate: Date) => void;
};

export const useEventsService = (
  context: WebPartContext,
): eventsGrapServiceResponse => {
  const [events, setEvents] = useState<eventResponse[]>([]);
  const [pictures, setPictures] = useState<pictureInfo[]>([]);
  const [error, setError] = useState("");
  const [eventsLoading, setEventsLoading] = useState(true);

  const handleError = (e: Error): void => {
    setError(e.message);
    setEventsLoading(false);
  };

  const getEvents = useCallback(
    (teams: teamResponse[], startDate: Date, endDate: Date) => {
      setEventsLoading(true);
      setEvents([]);
      setPictures([]);
      setError("");

      context.msGraphClientFactory.getClient("3")
        .then((client: MSGraphClientV3) => {
          const chunkTeamsArr = chunk(
            teams,
            batchLimit,
          );

          chunkTeamsArr.forEach((teamsResponse: teamResponse[]) => {
            const eventsBody: { requests: request[] } = {
              requests: [],
            };

            teamsResponse.forEach(({ id }) => {
              const requestUrl: string =
                `groups/${id}/calendar/events?$filter=start/dateTime gt '${
                  startDate.toISOString()
                }' and end/dateTime lt '${endDate.toISOString()}'`;
              eventsBody.requests.push({
                id: id,
                method: "GET",
                url: requestUrl,
              });
            });

            //get teams events
            client
              .api("$batch")
              .version("beta")
              .post(eventsBody)
              .then((eventsResponse: eventResponses) => {
                const eventsRes = eventsResponse.responses.filter((e) =>
                  e.status === 200
                );

                const values = eventsRes.map((r) => r.body.value);

                const allAttendees: attendee[] = [];
                values.forEach((val) => {
                  if (val.length > 0) {
                    const attendees = val.map((v) => v.attendees);
                    allAttendees.push(...flatten(attendees));
                  }
                });

                const uniqueAttendees = flatten(
                  uniqBy(allAttendees, "emailAddress.address"),
                );

                const attendeesArr = chunk(
                  uniqueAttendees,
                  batchLimit,
                );

                attendeesArr.forEach((attendeesChunk) => {
                  const picBody: { requests: request[] } = {
                    requests: [],
                  };

                  attendeesChunk.forEach(
                    ({ emailAddress: { address: email } }) => {
                      const requestUrl: string =
                        `/users/${email}/photos/48x48/$value`;
                      picBody.requests.push({
                        id: email,
                        method: "GET",
                        url: requestUrl,
                      });
                    },
                  );

                  //get attendees' pictures
                  client
                    .api("$batch")
                    .version("beta")
                    .post(picBody)
                    .then((picResponse: pictureResponse) => {
                      const images: pictureInfo[] = [];
                      const contentType = "image/png";

                      picResponse.responses.forEach(
                        ({ status, body, id }) => {
                          const attendee = uniqueAttendees.find((m) =>
                            m.emailAddress.address === id
                          );

                          if (attendee) {
                            const {
                              emailAddress: {
                                name: displayName,
                                address: email,
                              },
                            } = attendee;

                            if (status === 200) {
                              const blob = b64toBlob(body, contentType);
                              const image = URL.createObjectURL(blob);

                              images.push({
                                email,
                                displayName,
                                image,
                              });
                            } else {
                              images.push({
                                email,
                                displayName,
                                image: noUserIcon,
                              });
                            }
                          }
                        },
                      );

                      setPictures(
                        (
                          prevEventPictures,
                        ) => [...prevEventPictures, ...images],
                      );
                    })
                    .catch((e) => {
                      console.log("Attendees Pictures Error:", e);
                      handleError(e);
                    });

                  const userBody: { requests: request[] } = {
                    requests: [],
                  };

                  attendeesChunk.forEach(
                    ({ emailAddress: { address: email } }) => {
                      const requestUrl: string = `users/${email}`;
                      userBody.requests.push({
                        id: email,
                        method: "GET",
                        url: requestUrl,
                      });
                    },
                  );

                  //get attendees ids by email
                  client
                    .api("$batch")
                    .version("beta")
                    .post(userBody)
                    .then((users: eventUserResponse) => {
                      const usersRes = users.responses.filter((u) =>
                        u.status === 200
                      );

                      const userIds = usersRes.map((r) => `'${r.body.id}'`)
                        .join(
                          ",",
                        );
                      const body = `{"ids":[${userIds}]}`;

                      //get attendees presence
                      getPresences(client, body, handleError)
                        .then((presences: presence[]) => {
                          eventsRes.forEach((event) => {
                            event.body.value.forEach((val) => {
                              val.attendees.forEach((attendee) => {              
                                const user = users.responses.find((r) =>
                                  r.id === attendee.emailAddress.address
                                );

                                const presence = presences.find((p) =>
                                  user ? p.id === user.body.id : false
                                );

                                if (user) {
                                  attendee.emailAddress.id = user.body.id;
                                }

                                if (presence) {
                                  attendee.presence = presence;
                                }
                              });
                            });
                          });
                        })
                        .catch((e) => {
                          console.log("Presences Error:", e);
                          handleError(e);
                        });
                    }).catch((e) => {
                      console.log("Events Error:", e);
                      handleError(e);
                    });
                });

                setEvents(
                  (prevEvents) => [...prevEvents, ...eventsRes],
                );
                setEventsLoading(false);
              }).catch((e) => {
                console.log("Events Error:", e);
                handleError(e);
              });
          });
        }).catch((e) => {
          console.log("Graph error:", e);
          handleError(e);
        });
    },
    [],
  );

  const getCalendarEvents = (): calendarEvent[] => {
    const calendarEvents: calendarEvent[] = [];

    events.forEach((event) => {
      const value = event.body.value;
      if (value.length > 0) {
        value.forEach((v) => {
          const calendarEvent: calendarEvent = {
            teamId: event.id,
            id: v.id,
            title: v.subject,
            start: new Date(v.start.dateTime.replace("0000000", "000Z")),
            end: new Date(v.end.dateTime.replace("0000000", "000Z")),
            allDay: v.isAllDay,
            joinUrl: v.onlineMeeting.joinUrl,
            location: v.location.displayName,
            organizer: v.organizer,
            webLink: v.webLink,
            attendees: v.attendees,
            content: v.bodyPreview,
          };

          calendarEvents.push(calendarEvent);
        });
      }
    });

    return calendarEvents;
  };

  return {
    calendarEvents: getCalendarEvents(),
    pictures: uniqBy(pictures, "email"),
    eventsLoading,
    error,
    getEvents,
  };
};
