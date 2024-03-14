import { MSGraphClientV3 } from "@microsoft/sp-http";
import { chunk, uniqBy } from "@microsoft/sp-lodash-subset";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { useCallback, useState } from "react";
import { getPresences } from "../presence";
import {
  memberResponseValue,
  pictureResponse,
  presence,
  request,
  teamResponse,
} from "../types";
import { b64toBlob, batchLimit, noUserIcon } from "../util";

type memberResponse = {
  responses: [
    {
      id: string;
      status: number;
      body: {
        value: [memberResponseValue];
      };
    },
  ];
};

export type pictureInfo = {
  email: string;
  displayName: string;
  image: string;
};

type teamsServiceResponse = {
  teams: teamResponse[];
  pictures: pictureInfo[];
  teamsLoading: boolean;
  error: string;
  getTeams: () => void;
};

export const useTeams = (
  context: WebPartContext,
): teamsServiceResponse => {
  const [teams, setTeams] = useState<teamResponse[]>([]);
  const [pictures, setPictures] = useState<pictureInfo[]>([]);
  const [error, setError] = useState("");
  const [teamsLoading, setTeamsLoading] = useState(true);

  const handleError = (e: Error): void => {
    setError(e.message);
    setTeamsLoading(false);
  };

  const getTeams = useCallback(() => {
    setTeamsLoading(true);

    context.msGraphClientFactory.getClient("3")
      .then((client: MSGraphClientV3) =>
        //get teams
        client.api("/teams").version("beta").get()
          .then((graphTeams) => {
            const chunkTeamsArr = chunk(
              graphTeams.value,
              batchLimit,
            );

            chunkTeamsArr.forEach((teamsResponse: teamResponse[]) => {
              const memberBody: { requests: request[] } = { requests: [] };

              teamsResponse.forEach(({ id }) => {
                const requestUrl: string = `/teams/${id}/members`;
                memberBody.requests.push({
                  id,
                  method: "GET",
                  url: requestUrl,
                });
              });

              //get members
              client
                .api("$batch")
                .version("beta")
                .post(memberBody)
                .then((memResponse: memberResponse) => {
                  const membersData: memberResponseValue[] = [];

                  memResponse.responses.forEach((res) => {
                    if (res.status === 200) {
                      const members = res.body;
                      const team = teamsResponse.find((g) => g.id === res.id);
                      if (team) {
                        team.members = members;
                      }

                      members.value.forEach((member) => {
                        const exists = membersData.find((m) =>
                          m.email === member.email
                        );

                        if (!exists) {
                          membersData.push(member);
                        }
                      });
                    } else {
                      console.log("*** Teams Response", res);
                    }
                  });

                  const membersDataArr = chunk(
                    membersData,
                    batchLimit,
                  );

                  membersDataArr.forEach((membersDataChunk) => {
                    const picBody: { requests: request[] } = {
                      requests: [],
                    };

                    membersDataChunk.forEach(({ userId, email }) => {
                      const requestUrl: string =
                        `/users/${email}/photos/48x48/$value`;
                      picBody.requests.push({
                        id: userId,
                        method: "GET",
                        url: requestUrl,
                      });
                    });

                    //get members' pictures
                    client
                      .api("$batch")
                      .version("beta")
                      .post(picBody)
                      .then((picResponse: pictureResponse) => {
                        const images: pictureInfo[] = [];
                        const contentType = "image/png";

                        picResponse.responses.forEach(
                          ({ status, body, id }) => {
                            const member = membersData.find((m) =>
                              m.userId === id
                            );

                            if (member) {
                              const { email, displayName } = member;

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
                          (prevPictures) => [
                            ...prevPictures,
                            ...images,
                          ],
                        );
                      })
                      .catch((e) => {
                        console.log("Members Photo Error:", e);
                        handleError(e);
                      });

                    const uniqueMemberIds = new Set([
                      membersDataChunk.map((m) => `'${m.userId}'`),
                    ]);

                    const ids = Array.from(uniqueMemberIds).join(",");
                    if (ids) {
                      const body = `{"ids":[${ids}]}`;

                      //get members presence
                      getPresences(client, body, handleError)
                        .then((presences: presence[]) => {
                          teamsResponse.forEach((teamResponse) => {
                            if (teamResponse.members) {
                              const members = teamResponse.members;

                              members.presences = [];
                              members.value.forEach((member) => {
                                const presence = presences.find((p) =>
                                  p.id === member.userId
                                );

                                if (presence) {
                                  members.presences!.push(presence);
                                }
                              });
                            }
                          });
                        })
                        .catch((e) => {
                          console.log("User Presence Error:", e);
                          handleError(e);
                        });
                    }
                  });
                }).catch((e) => {
                  console.log("Team Members Error:", e);
                  handleError(e);
                });
            });
            setTeams(
              (prevTeams) => [...prevTeams, ...graphTeams.value],
            );
            setTeamsLoading(false);
          }).catch((e) => {
            console.log("Teams Error:", e);
            handleError(e);
          })
      ).catch((e) => {
        console.log("Graph error:", e);
        handleError(e);
      });
  }, []);

  return {
    teams,
    pictures: uniqBy(pictures, "email"),
    teamsLoading,
    error,
    getTeams,
  };
};
