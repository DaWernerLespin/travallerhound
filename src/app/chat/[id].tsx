import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { useMenuSession } from '@/features/menu-session/session-context';

/**
 * Old per-dish chat link: the staff conversation is now one chat for the whole visit.
 * Puts the dish on the Wunschliste, asks about it next and opens that chat.
 */
export default function DishChatRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToWishlist, setFocus } = useMenuSession();
  useEffect(() => {
    if (id) {
      addToWishlist(id);
      setFocus(id);
    }
    router.replace('/gespraech');
  }, [id, addToWishlist, setFocus]);
  return null;
}
