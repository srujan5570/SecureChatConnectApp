interface VideoConfig {
  API_KEY: string;
  API_SECRET: string;
  API_BASE_URL: string;
  AUTH_TOKEN: string;
}

export const VIDEO_CONFIG: VideoConfig = {
  API_KEY: '61b7334a-c1e1-4743-b493-4c8daf2006e1',
  API_SECRET: '0c1d29c92b4c4836b935f6c31025c093e82b30833a6e36b30e038fef08217124',
  API_BASE_URL: 'https://api.videosdk.live',
  AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MWI3MzM0YS1jMWUxLTQ3NDMtYjQ5My00YzhkYWYyMDA2ZTEiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc0NjEyMjQ3NSwiZXhwIjoxNzQ2NzI3Mjc1fQ.r0ETLpDr-5ywLK8YZbhmdiYdCjKt7YW5E36iCzL98jk'
};

// Generate a unique meeting ID
export const generateMeetingId = () => {
  return `${Math.floor(Math.random() * 10000000000)}`;
}; 