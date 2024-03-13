import * as React from "react";
import { motion } from "framer-motion";
import { Box, Card, Flex, Loader, Text } from "@fluentui/react-northstar";
import styles from "../Card.module.scss";
import { backColor, initials } from "../../util";
import { teamResponse } from "../../interfaces";
import { pictureInfo } from "../../hooks/useTeamsGraphService";
import TeamAvatars from "./TeamAvatars";

interface ITeamCard {
  team: teamResponse;
  pictures: pictureInfo[];
}

const TeamCard: React.FC<ITeamCard> = ({ team, pictures }) => {
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
              content={initials(team.displayName)}
              className={styles.box}
              styles={{
                backgroundColor: backColor(),
              }}
            />
            <Text
              className={styles.displayName}
              content={team.displayName}
              title={team.description}
            />
          </Flex>
        </Flex>
        <Flex className={styles.avatar}>
          {pictures.length > 0
            ? <TeamAvatars team={team} pictures={pictures} />
            : <Loader />}
        </Flex>
      </Flex>
    </Card>
  );
};

export default TeamCard;
