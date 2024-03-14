import * as React from "react";
import { AcceptIcon, Avatar } from "@fluentui/react-northstar";
import { pictureInfo } from "../../hooks/useTeamsService";
import { teamResponse } from "../../types";

interface ITeamAvatars {
  team: teamResponse;
  pictures: pictureInfo[];
}

const TeamAvatars: React.FC<ITeamAvatars> = ({ team, pictures }) => {
  return (
    <>
      {team.members?.value?.map((member, index) => {
        const picture = pictures.find((p) =>
          p.displayName.toLowerCase() === member.displayName.toLowerCase()
        );

        const presences = team.members!.presences;

        if (!presences || presences?.length === 0 || !presences[index]) {
          if (picture) {
            return (
              <Avatar
                key={member.userId}
                image={picture.image}
                status={{
                  color: "gray",
                  title: "Offline",
                  icon: null,
                }}
                title={member.displayName}
                styles={{ padding: "2px" }}
              />
            );
          }
          return null;
        }

        const { Icon, title, color } = presences[index];

        return picture
          ? (
            <Avatar
              key={member.userId}
              image={picture.image}
              status={{
                color,
                title,
                icon: Icon ? <AcceptIcon /> : null,
              }}
              title={member.displayName}
              styles={{ padding: "2px" }}
            />
          )
          : null;
      })}
    </>
  );
};

export default TeamAvatars;
