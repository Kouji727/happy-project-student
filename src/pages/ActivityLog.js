import React, { useEffect, useState } from 'react'
import { useAuth } from "../components/AuthContext";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

import SidebarStudent from '../components/SidebarStudent'
import Log from '../components/Log'

const ActivityLog = () => {
  const { currentUser } = useAuth();
  const [logData, setLogData] = useState([])

  // Fetch User Activity Log
  useEffect(() => {
    if (!currentUser) return;

    const logsCollectionRef = collection(db, 'activityLog');
    const q = query(logsCollectionRef, where("studentId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.date.toDate();
        return { id: doc.id, ...data, date };
      });

      logs.sort((a, b) => b.date - a.date);

      const formattedLogs = logs.map((log) => ({
        ...log,
        date: log.date.toLocaleString()
      }));

      setLogData(formattedLogs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <SidebarStudent>
        <div className="container mx-auto p-4"> 
            <h2 className="text-2xl font-semibold mb-4">Activity Log</h2>

            <div className='max-h-[80vh] my-1  overflow-auto'>
              {logData.map((logs) => (
                <Log key={logs.id} type={logs.type} subject={logs.subject} date={logs.date}/>
              ))}

            </div>
        </div>


    </SidebarStudent>
  )
}

export default ActivityLog