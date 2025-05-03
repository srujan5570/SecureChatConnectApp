export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ChatList: undefined;
  Chat: {
    receiverId: string;
    receiverName: string;
  };
  VideoCall: {
    meetingId: string;
    userName: string;
  };
}; 