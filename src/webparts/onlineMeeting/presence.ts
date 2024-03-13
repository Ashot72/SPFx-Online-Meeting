import { MSGraphClientV3 } from "@microsoft/sp-http";
import { presence, presenceResponse } from "./interfaces";

export const getPresences = (
  client: MSGraphClientV3,
  body: string,
  handleError: (e: Error) => void,
): Promise<presence[]> => {
  return new Promise((resolve) => {
    const presences: presence[] = [];

    client.api(`/communications/getPresencesByUserId`).version(
      "beta",
    )
      .post(body)
      .then((usersPresence: presenceResponse) => {
        usersPresence.value.map((userPresence) => {
          switch (userPresence.availability) {
            case "Available":
              presences.push({
                id: userPresence.id,
                color: "green",
                Icon: "AcceptIcon",
                title: "Available",
              });
              break;
            case "AvailableIdle":
              presences.push({
                id: userPresence.id,
                color: "green",
                Icon: "AcceptIcon",
                title: "AvailableIdle",
              });
              break;
            case "Away":
              presences.push({
                id: userPresence.id,
                color: "yellow",
                title: "Away",
              });
              break;
            case "BeRightBack":
              presences.push({
                id: userPresence.id,
                color: "yellow",
                title: "BeRightBack",
              });
              break;
            case "Busy":
              presences.push({
                id: userPresence.id,
                color: "red",
                title: "Busy",
              });
              break;
            case "BusyIdle":
              presences.push({
                id: userPresence.id,
                color: "red",
                title: "BusyIdle",
              });
              break;
            case "DoNotDisturb":
              presences.push({
                id: userPresence.id,
                color: "red",
                title: "DoNotDisturb",
              });
              break;
            case "Offline":
              presences.push({
                id: userPresence.id,
                color: "grey",
                title: "Offline",
              });
              break;
            default:
              break;
          }
        });
        resolve(presences);
      })
      .catch((e) => {
        console.log("User Presence Error: ", e);
        handleError(e);
      });
  });
};
