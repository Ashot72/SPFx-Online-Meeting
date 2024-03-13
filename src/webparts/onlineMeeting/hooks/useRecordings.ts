import { MSGraphClientV3 } from "@microsoft/sp-http";
import { sortBy } from "@microsoft/sp-lodash-subset";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { useState } from "react";
import * as strings from "OnlineMeetingWebPartStrings";
import { calendarEvent } from "../interfaces";

type onlineMeetingResponse = {
  value: [{
    id: string;
  }];
};

type recordingResponse = {
  value: [{
    recordingContentUrl: string;
    createdDateTime: string;
  }];
};

type transcriptResponse = {
  value: [{
    transcriptContentUrl: string;
    createdDateTime: string;
  }];
};

type contentResponse = {
  recordingDate: string;
  recordings: Uint8Array[];
  transcripts: Uint8Array[];
};

type recordingsResponse = {
  videosTranscripts: contentResponse[];
  loading: boolean;
  error: string;
  done: boolean;
  loadVideosTranscripts: () => void;
};

export const useRecordings = (
  context: WebPartContext,
  calendarEvent: calendarEvent,
): recordingsResponse => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [videosTranscripts, setVideosTranscripts] = useState<contentResponse[]>(
    [],
  );

  const handleError = (e: Error): void => {
    setError(e.message);
    setLoading(false);
  };

  const loadVideosTranscripts = (): void => {
    setLoading(true);
    setVideosTranscripts([]);
    setDone(false);
    setError("");

    context.msGraphClientFactory.getClient("3")
      .then((client: MSGraphClientV3) =>
        client.api(
          `/me/onlineMeetings/?$filter=JoinWebUrl eq '${
            encodeURIComponent(calendarEvent.joinUrl)
          }'`,
        ).version("beta")
          .get()
          .then((meetingResponse: onlineMeetingResponse) => {
            if (meetingResponse) {
              const meetingId = meetingResponse.value[0].id;

              const recordings: Promise<recordingResponse> = context
                .msGraphClientFactory.getClient("3")
                .then((client: MSGraphClientV3) =>
                  client.api(
                    `/me/onlineMeetings/${meetingId}/recordings`,
                  ).version("beta")
                    .get()
                ).catch((e) => {
                  console.log("Recorings Error:", e);
                  if (e.statusCode === 404) {
                    const error = Error(strings.NoRecordings);
                    handleError(error);
                  } else {
                    handleError(e);
                  }
                });

              const transcripts: Promise<transcriptResponse> = context
                .msGraphClientFactory.getClient("3")
                .then((client: MSGraphClientV3) =>
                  client.api(
                    `/me/onlineMeetings/${meetingId}/transcripts`,
                  ).version("beta")
                    .get()
                ).catch((e) => {
                  console.log("Transcripts Error:", e);
                  handleError(e);
                });

              Promise.all([recordings, transcripts])
                .then(([r, t]) => {
                  if (r) {
                    const rOrder = sortBy(r.value, (rv) => rv.createdDateTime);
                    const tOrder = sortBy(t.value, (tv) => tv.createdDateTime);

                    for (let i = 0; i < rOrder.length; i++) {
                      const contentResponse: contentResponse = {
                        recordingDate: "",
                        recordings: [],
                        transcripts: [],
                      };

                      const recUrl = rOrder[i].recordingContentUrl;
                      const recCreatedDateTime: string =
                        rOrder[i].createdDateTime;

                      const transUrl = tOrder[i].transcriptContentUrl;
                      const recordingsContent = context.msGraphClientFactory
                        .getClient("3")
                        .then((client: MSGraphClientV3) =>
                          client.api(
                            recUrl,
                          ).version("beta")
                            .get()
                        );

                      const transcriptsContent = context.msGraphClientFactory
                        .getClient(
                          "3",
                        )
                        .then((client: MSGraphClientV3) =>
                          client.api(
                            transUrl + "?$format=text/vtt",
                          ).version("beta")
                            .get()
                        );

                      Promise.all([recordingsContent, transcriptsContent])
                        .then(async ([rc, tc]) => {
                          const recordingsReader = rc.getReader();
                          while (true) {
                            const { done, value } = await recordingsReader
                              .read();
                            if (done) {
                              contentResponse.recordingDate =
                                recCreatedDateTime;
                              break;
                            }

                            contentResponse.recordings.push(value);
                          }

                          const transcriptsReader = tc.getReader();
                          while (true) {
                            const { done, value } = await transcriptsReader
                              .read();
                            if (done) {
                              setVideosTranscripts(
                                (prev) => [...prev, contentResponse],
                              );
                              setLoading(false);
                              setDone(true);
                              break;
                            }

                            contentResponse.transcripts.push(value);
                          }
                        })
                        .catch((e) => {
                          console.log(
                            "Recordings or Transcripts Content Error:",
                            e,
                          );
                          handleError(e);
                        });
                    }
                  }
                }).catch((e) => {
                  console.log("Recordings or Transcripts Error:", e);
                  handleError(e);
                });
            }
          })
          .catch((e) => {
            console.log("Online Meeting Error:", e);
            handleError(e);
          })
      ).catch((e) => {
        console.log("Graph error:", e);
        handleError(e);
      });
  };

  return {
    videosTranscripts,
    loading,
    error,
    done,
    loadVideosTranscripts,
  };
};
