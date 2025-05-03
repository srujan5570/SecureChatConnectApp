import { Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';

class VideoService {
  private _token: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI4ZWFmY2UwMC03ZDUzLTQ4OTYtYTgwMi0yOTg1NmUxMzFkYTkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc0NjEzMjA1MiwiZXhwIjoxNzQ2NzM2ODUyfQ.izvu8WZZ5QqBKFauVdmbKWj_kfjhqidqyuNp1wCzxQM";

  // Public getter for the token
  public get token(): string {
    return this._token;
  }

  async checkPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted';
        const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted';

        return cameraGranted && audioGranted;
      } catch (err) {
        console.warn('Failed to request permissions:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  }

  async createMeeting(): Promise<string | null> {
    try {
      const url = 'https://api.videosdk.live/v2/rooms';
      console.log('Creating meeting at:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this._token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to create meeting: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      return data.roomId || null;
    } catch (error) {
      console.error('Error creating meeting:', error);
      return null;
    }
  }

  async validateMeeting(meetingId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.videosdk.live/v2/rooms/${meetingId}`, {
        method: 'GET',
        headers: {
          'Authorization': this._token,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return !!data.roomId;
    } catch (error) {
      console.error('Error validating meeting:', error);
      return false;
    }
  }
}

export const videoService = new VideoService(); 