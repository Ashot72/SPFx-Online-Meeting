import * as React from "react";
import { useEffect, useState } from "react";
import { Dropdown, Flex, Text } from "@fluentui/react-northstar";
import * as strings from "OnlineMeetingWebPartStrings";

export type hourMinute = { hour: number; minute: number };

interface ITimePicker {
  shift?: boolean;
  onTimeSelected: ({ hour, minute }: hourMinute) => void;
}

const hours = [
  "12 AM",
  "01 AM",
  "02 AM",
  "03 AM",
  "04 AM",
  "05 AM",
  "06 AM",
  "07 AM",
  "08 PM",
  "09 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "01 PM",
  "02 PM",
  "03 PM",
  "04 PM",
  "05 PM",
  "06 PM",
  "07 PM",
  "08 PM",
  "09 PM",
  "10 PM",
  "11 PM",
];

const minutes: string[] = [];

for (let i = 0; i < 60; i++) {
  minutes.push(i < 10 ? `0${i}` : `${i}`);
}

const getHour = (date: Date): string => {
  const n = date.toLocaleString([], {
    hour: "2-digit",
  });

  return n;
};

const getMinute = (date: Date): string => {
  const n = date.toLocaleString([], {
    minute: "2-digit",
  });

  return +n < 10 ? `0${n}` : `${n}`;
};

const TimePicker: React.FC<ITimePicker> = ({ shift, onTimeSelected }) => {
  const date = new Date();

  if (shift) {
    date.setTime(date.getTime() + (30 * 60 * 1000));
  }

  const [hour, setHour] = useState(getHour(date));
  const [minute, setMinute] = useState(getMinute(date));

  const formatTime = (hour: string, minute: string): void => {
    const parts = hour.split(" ");

    const formatted: hourMinute = { hour: 12, minute: 0 };
    formatted.hour = parts[1] === "AM" ? +parts[0] : +parts[0] + 12;
    formatted.minute = +minute;

    onTimeSelected(formatted);
  };

  useEffect(() => {
    formatTime(hour, minute);
  }, [hour, minute]);

  const onHourChange = (e, v): void => setHour(v.value);

  const onMinuteChange = (e, v): void => setMinute(v.value);

  return (
    <Flex gap="gap.medium">
      <Flex gap="gap.small">
        <Text
          size="medium"
          style={{ marginTop: "5px" }}
          content={`${strings.Time}:`}
        />
        <Dropdown
          value={hour}
          inline
          items={hours}
          onChange={onHourChange}
        />
      </Flex>
      <Flex gap="gap.small">
        <Text
          size="medium"
          style={{ marginTop: "5px" }}
          content={":"}
        />
        <Dropdown
          value={minute}
          inline
          items={minutes}
          onChange={onMinuteChange}
        />
      </Flex>
    </Flex>
  );
};

export default TimePicker;
