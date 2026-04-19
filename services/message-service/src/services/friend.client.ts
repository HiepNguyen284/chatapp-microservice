import axios from "axios";

const FRIEND_SERVICE_URL =
  process.env.FRIEND_SERVICE_URL ?? "http://friend-service:5002";

export async function checkFriendship(
  userId1: number,
  userId2: number,
  token: string,
): Promise<boolean> {
  try {
    const response = await axios.get(
      `${FRIEND_SERVICE_URL}/api/friends/check`,
      {
        params: { userId1, userId2 },
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data.isFriend === true;
  } catch (err) {
    console.error("[friend-client] failed to check friendship", err);
    return false;
  }
}
