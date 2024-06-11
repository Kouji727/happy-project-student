import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

import SidebarStudent from '../components/SidebarStudent';
import NotificationDesign from '../components/NotificationDesign';

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notification, setNotification] = useState([])

  // to be migrated on sidebar
  const [clearanceRequest, setClearanceRequest] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const clearanceCollectionRef = collection(db, 'clearanceRequests');
    const q = query(
      clearanceCollectionRef,
      where('studentId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const requestsData = [];
      const newNotifications = [];

      querySnapshot.forEach((doc) => {
        const requestData = { ...doc.data(), id: doc.id };
        if (requestData.status !== 'pending') {
          requestsData.push(requestData);
          newNotifications.push(requestData);
        }
      });

      setClearanceRequest(requestsData);

      const notificationsCollectionRef = collection(db, 'studentNotification');
      await Promise.all(newNotifications.map(async (item) => {
        
        const existingNotificationQuery = query(
          notificationsCollectionRef,
          where('studentId', '==', currentUser.uid),
          where('subject', '==', item.subject),
          where('timestamp', '==', item.timestamp)
        );

        const existingNotificationSnapshot = await getDocs(existingNotificationQuery);
        if (existingNotificationSnapshot.empty) {
          await addDoc(notificationsCollectionRef, {
            studentId: currentUser.uid,
            subject: item.subject,
            status: item.status,
            isRead: false,
            timestamp: item.timestamp,
            notifTimestamp: serverTimestamp(),
          });
        }
      }));
    });

    return () => unsubscribe();
  }, [currentUser]);
  //to be migrated on sidebar

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
