import * as React from "react";
import { motion } from "framer-motion";
import { Box, Card, Flex, Text } from "@fluentui/react-northstar";
import styles from "../Card.module.scss";
import { backColor, initials } from "../../util";
import { pictureInfo } from "../../hooks/useTeamsService";
import EventAvatars from "./EventAvatars";
import { calendarEvent } from "../../types";

interface IEventCard {
  pictures: pictureInfo[];
  calendarEvent: calendarEvent;
}

const EventCard: React.FC<IEventCard> = ({ pictures, calendarEvent }) => {
  return (
    <Card
      className={styles.card}
      as={motion.div}
      expandable
      fluid
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ duration: 0.1 }}
    >
      <Flex column>
        <Flex space="between">
          <Flex gap="gap.small">
            <Box
              content={initials(calendarEvent.title)}
              className={styles.box}
              styles={{
                backgroundColor: backColor(),
              }}
            />
            <Text
              className={styles.displayName}
              content={calendarEvent.title}
              title={calendarEvent.title}
            />
          </Flex>
        </Flex>
        <Flex className={styles.avatar}>
          <EventAvatars pictures={pictures} calendarEvent={calendarEvent} />
        </Flex>
      </Flex>
    </Card>
  );
};

export default EventCard;
