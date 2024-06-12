import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore';

import SidebarStudent from '../components/SidebarStudent';
import NotificationDesign from '../components/NotificationDesign';

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notification, setNotification] = useState([])

  useEffect(() => {
    if (!currentUser) return;

    const notifCollectionRef = collection(db, 'studentNotification');
    const q = query(notifCollectionRef, where("studentId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notif = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.notifTimestamp ? data.notifTimestamp.toDate() : null;
        return { id: doc.id, ...data, date };
      });

      notif.sort((a, b) => (b.date || 0) - (a.date || 0));

      const formattedNotif = notif.map((notifs) => ({
        ...notifs,
        date: notifs.date ? notifs.date.toLocaleString() : null,
      }));

      setNotification(formattedNotif);

      // Update documents where isRead is false
      notif.forEach(async (notifItem) => {
        if (!notifItem.isRead) {
          const notifDocRef = doc(db, 'studentNotification', notifItem.id);
          await updateDoc(notifDocRef, { isRead: true });
        }
      });


    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <SidebarStudent>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Notification</h2>

        <div className='max-h-[80vh] overflow-auto my-1'>
          {notification.map((item) => (
            <NotificationDesign key={item.id} type={item.status} subject={item.subject}/>
          ))}
        </div>
      </div>
    </SidebarStudent>
  );
};

export default Notifications;
