import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";

export const useAuth = () => {
  const { isLoaded, userId, sessionId, getToken } = useClerkAuth();
  const { user } = useUser();

  return {
    isLoaded,
    isAuthenticated: !!userId,
    userId,
    sessionId,
    user,
    getToken,
  };
};
