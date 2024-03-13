import * as React from "react";
import { AcceptIcon, Avatar } from "@fluentui/react-northstar";
import { pictureInfo } from "../../hooks/useTeamsGraphService";
import { calendarEvent } from "../../interfaces";

interface IEventAvatars {
  pictures: pictureInfo[];
  calendarEvent: calendarEvent;
}

const EventAvatars: React.FC<IEventAvatars> = (
  { pictures, calendarEvent },
) => {
  return (
    <>
      {calendarEvent.attendees.map((attendee) => {
        const picture = pictures.find((p) =>
          (p.email ? p.email.toLowerCase() : p.email) ===
            attendee.emailAddress.address.toLowerCase()
        );

        const presence = attendee.presence;
        if (!presence) {
          if (picture) {
            return (
              <Avatar
                key={attendee.emailAddress.id}
                image={picture.image}
                status={{
                  color: "gray",
                  title: "Offline",
                  icon: null,
                }}
                title={attendee.emailAddress.name}
                styles={{ padding: "2px" }}
              />
            );
          }
          return null;
        }

        const { Icon, title, color } = presence;

        return picture
          ? (
            <Avatar
              key={attendee.emailAddress.id}
              image={picture.image}
              status={{
                color,
                title,
                icon: Icon ? <AcceptIcon /> : null,
              }}
              title={attendee.emailAddress.name}
              styles={{ padding: "2px" }}
            />
          )
          : null;
      })}
    </>
  );
};

export default EventAvatars;
