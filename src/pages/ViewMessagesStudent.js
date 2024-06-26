import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarStudent from "../components/SidebarStudent";
import moment from "moment";
import { motion, AnimatePresence } from 'framer-motion';
import ChatDesign from "../components/Chat/ChatDesign";
import UserChatDesign from "../components/Chat/UserChatDesign";
import {
  DocumentMagnifyingGlassIcon
} from "@heroicons/react/24/solid";

function ViewMessagesStudent() {
  const { currentUser } = useAuth();
  const [facultyId, setFacultyId] = useState(null);
  const [subjectInq, setSubjectInq] = useState(null);
  const [inquiryPage, setInquiryPage] = useState(false);
  const [inquiryData, setInquiryData] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  // Update read status function
  const markAsRead = async () => {
    try {
      if (!currentUser || !subjectInq) {
        console.log("Current user or subjectInq is null");
        return;
      }

      const inquiryCollectionRef = collection(db, 'inquiries');
      const q = query(inquiryCollectionRef,
        where('subject', '==', subjectInq),
        where('recipientId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        const docRef = doc.ref;
        await updateDoc(docRef, {
          read: true
        });
      });
    } catch (error) {
      console.error('Error marking inquiries as read:', error);
    }
  };

  //Inbox Collection
  useEffect(() => {
    if (!currentUser) return;

    const inquiryCollectionRef = collection(db, 'inquiries');

    const qRecipient = query(inquiryCollectionRef, where('recipientId', '==', currentUser.uid));
    const qStudent = query(inquiryCollectionRef, where('studentId', '==', currentUser.uid));

    const mergeAndSortInquiries = (recipientDocs, studentDocs) => {
      const recipientInquiries = recipientDocs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.timestamp ? data.timestamp.toDate() : null,
        };
      });

      const studentInquiries = studentDocs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.timestamp ? data.timestamp.toDate() : null,
        };
      });

      const combinedInquiries = [...recipientInquiries, ...studentInquiries];
      combinedInquiries.sort((a, b) => b.date - a.date);

      const uniqueInquiries = Array.from(
        combinedInquiries.reduce((map, inquiry) => {
          if (!map.has(inquiry.subject) || map.get(inquiry.subject).date < inquiry.date) {
            map.set(inquiry.subject, {
              ...inquiry,
              date: inquiry.date ? inquiry.date.toLocaleString() : 'No Date',
            });
          }
          return map;
        }, new Map()).values()
      );

      return uniqueInquiries;
    };

    const unsubscribeRecipient = onSnapshot(qRecipient, async (snapshot) => {
      const recipientDocs = snapshot.docs;
      const studentSnapshot = await getDocs(qStudent);
      const studentDocs = studentSnapshot.docs;

      const mergedInquiries = mergeAndSortInquiries(recipientDocs, studentDocs);
      setInquiries(mergedInquiries);
    });

    const unsubscribeStudent = onSnapshot(qStudent, async (snapshot) => {
      const studentDocs = snapshot.docs;
      const recipientSnapshot = await getDocs(qRecipient);
      const recipientDocs = recipientSnapshot.docs;

      const mergedInquiries = mergeAndSortInquiries(recipientDocs, studentDocs);
      setInquiries(mergedInquiries);
    });

    return () => {
      unsubscribeRecipient();
      unsubscribeStudent();
    };
  }, [currentUser]);

  // Inquiry
  useEffect(() => {
    if (!currentUser) return;

    const inquiryCollectionRef = collection(db, 'inquiries');

    const qRecipient = query(inquiryCollectionRef,
      where('subject', '==', subjectInq),
      where('recipientId', '==', currentUser.uid)
    );

    const qStudent = query(inquiryCollectionRef,
      where('subject', '==', subjectInq),
      where('studentId', '==', currentUser.uid)
    );

    const mergeAndSortInquiries = (recipientDocs, studentDocs) => {
      const recipientInquiries = recipientDocs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.timestamp ? data.timestamp.toDate() : null,
        };
      });

      const studentInquiries = studentDocs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.timestamp ? data.timestamp.toDate() : null,
        };
      });

      const combinedInquiries = [...recipientInquiries, ...studentInquiries];
      combinedInquiries.sort((a, b) => a.date - b.date);

      const uniqueInquiries = combinedInquiries.reduce((acc, inquiry) => {
        if (!acc.find(item => item.id === inquiry.id)) {
          acc.push({
            ...inquiry,
            date: inquiry.date ? inquiry.date.toLocaleString() : 'No Date',
          });
        }
        return acc;
      }, []);

      return uniqueInquiries;
    };

    const unsubscribeRecipient = onSnapshot(qRecipient, async (snapshot) => {
      const recipientDocs = snapshot.docs;
      const studentSnapshot = await getDocs(qStudent);
      const studentDocs = studentSnapshot.docs;

      const mergedInquiries = mergeAndSortInquiries(recipientDocs, studentDocs);
      setInquiryData(mergedInquiries);
    });

    const unsubscribeStudent = onSnapshot(qStudent, async (snapshot) => {
      const studentDocs = snapshot.docs;
      const recipientSnapshot = await getDocs(qRecipient);
      const recipientDocs = recipientSnapshot.docs;

      const mergedInquiries = mergeAndSortInquiries(recipientDocs, studentDocs);
      setInquiryData(mergedInquiries);
    });

    return () => {
      unsubscribeRecipient();
      unsubscribeStudent();
    };
  }, [currentUser, subjectInq]);


  // Inquiry Modal
  const handleOpenModal = (subject, id) => {
    setInquiryPage(true);
    setSubjectInq(subject);
    setFacultyId(id);
    
  }

  const handleCloseModal = () => {
    setInquiryPage(false);
    setSubjectInq(null);
    setFacultyId(null);
    markAsRead();
  }


  return (
    <SidebarStudent>
      <div className="container mx-auto bg-blue-100 rounded pb-10">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Inquiries</h2>
        </div>


        {inquiries.map(inquiry => (
          <div key={inquiry.id} className="px-5">
            <motion.div onClick={() => handleOpenModal(inquiry.subject, inquiry.fixedFacultyId)} className={`p-3 px-6 rounded-md my-3 shadow-md hover:cursor-pointer ${
              inquiry.studentId === currentUser.uid
                ? 'bg-[#fff6d4]'
                : inquiry.read
                  ? 'bg-[#fff6d4]'
                  : 'bg-[#bcc9fb] border-[#6176c0] border-2'
            }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}>
              <div className="flex justify-between items-center">
                <div className="w-[60%]">
                  <span className="break-words font-bold text-lg">
                    {inquiry.subject}
                  </span>
                </div>

                <div>
                  <span className="text-sm">
                    {moment(inquiry.timestamp.toDate()).fromNow()}

                  </span>
                </div>

              </div>

              <div>
                <span className="text-sm text-[#000000b6]">
                  {inquiry.facultyEmail}
                </span>
              </div>

              <div className="">
                <span className="text-lg">
                   {inquiry && inquiry.fileURLs && inquiry.fileURLs.map((url, index) => (
                       <div key={index} className='pb-2'>
                               <a
                                   href={url}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-[#1d1c8b] hover:underline flex items-center"
                               >
                               <DocumentMagnifyingGlassIcon className='w-7 h-7'/>


                                   File {index + 1}
                               </a>
                       </div>
                   ))}
                  {inquiry.studentId === currentUser.uid ? (
                    <>
                      <span>
                        You: {inquiry.message}
                      </span>
                    </>
                  ) : (
                    <>
                      {inquiry.message}
                    </>

                  )}

                </span>
              </div>

              <div className="mt-3 flex justify-end">
                {inquiry.studentId === currentUser.uid ? (
                  <>
                  </>
                ) : (
                  <span className="text-sm text-[#000000b6] font-medium">
                    {inquiry.read ? "Read" : "Unread"}
                  </span>
                )}
              </div>

            </motion.div>
          </div>
        ))}


        <AnimatePresence>

          {inquiryPage && (
            <>
              <ChatDesign handleClose={handleCloseModal}
                subject={subjectInq} facultyUid={facultyId} inquiryData={inquiryData} // Pass inquiryData as a prop
              >
                {inquiryData.map((inquiry) => (
                  <div key={inquiry.id}>
                    <UserChatDesign
                      key={inquiry.id}
                      userType={inquiry.studentId === currentUser.uid ? "student" : "other"}
                      data={inquiry}
                    >
                      {inquiry.message}
                    </UserChatDesign>
                  </div>
                ))}
              </ChatDesign>
            </>
          )}

        </AnimatePresence>


      </div>
    </SidebarStudent>
  );
}

export default ViewMessagesStudent;
