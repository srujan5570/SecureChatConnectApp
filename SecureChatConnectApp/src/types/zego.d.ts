import { FC } from 'react';

declare module '@zegocloud/zego-uikit-prebuilt-call-rn' {
  export interface ZegoUIKitPrebuiltCallProps {
    appID: number;
    appSign: string;
    userID: string;
    userName: string;
    callID: string;
    config: any;
  }

  export interface CallInvitationConfig {
    callID: string;
    invitees: Array<{ userID: string }>;
    type: number;
    timeout: number;
  }

  export interface ZegoUIKitPrebuiltCallStatic extends FC<ZegoUIKitPrebuiltCallProps> {
    init(appID: number, appSign: string, userID: string, config: any): Promise<void>;
    uninit(): void;
    useSystemCallingUI(plugins: any[]): void;
    sendCallInvitation(config: CallInvitationConfig): Promise<any>;
    acceptCallInvitation(callID: string): Promise<void>;
    rejectCallInvitation(callID: string): Promise<void>;
  }

  export const ZegoUIKitPrebuiltCall: ZegoUIKitPrebuiltCallStatic;
  export const ONE_ON_ONE_VIDEO_CALL_CONFIG: any;
} 