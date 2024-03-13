export type memberResponseValue = {
  userId: string;
  email: string;
  displayName: string;
};

export type request = {
  id: string;
  method: string;
  url: string;
};

export type teamResponse = {
  id: string;
  method: string;
  url: string;
  displayName: string;
  description: string;
  members?: {
    value: [memberResponseValue];
    presences?: presence[];
  };
};

export type pictureResponse = {
  responses: [
    {
      id: string;
      status: number;
      body: string;
    },
  ];
};

export type presenceResponse = {
  value: [{
    id: string;
    availability: string;
  }];
};

export type presence = {
  id: string;
  color: string;
  Icon?: string;
  title: string;
};

export type calendarEvent = {
  teamId: string;
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  joinUrl: string;
  location: string;
  organizer: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  webLink: string;
  attendees: attendee[];
  content: string;
};

export type attendee = {
  emailAddress: {
    id: string;
    address: string;
    name: string;
  };
  presence: presence;
};
