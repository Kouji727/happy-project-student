import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarStudent from "../components/SidebarStudent";
import moment from "moment";
import { motion } from 'framer-motion';
import Modal from "../components/Modal";

function ViewMessagesStudent() {
  const { currentUser } = useAuth();
  const [replies, setReplies] = useState([]);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [replyIdToDelete, setReplyIdToDelete] = useState(null);

  const [inquiries, setInquiries] = useState([]);

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

  useEffect(() => {
    const fetchReplies = async () => {
      if (!currentUser) return;

      try {
        const repliesRef = collection(db, "inquiries");
        const q = query(
          repliesRef,
          where("recipientId", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );

        const repliesSnapshot = await getDocs(q);

        const repliesData = await Promise.all(
          repliesSnapshot.docs.map(async (doc) => {
            const replyData = doc.data();
            const senderId = replyData.studentId;

            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("uid", "==", senderId));
            const userSnapshot = await getDocs(userQuery);

            let senderEmail = "";
            if (!userSnapshot.empty) {
              senderEmail = userSnapshot.docs[0].data().email;
            }

            return {
              id: doc.id,
              ...replyData,
              senderEmail: senderEmail,
            };
          })
        );

        setReplies(repliesData);
      } catch (error) {
        console.error("Error fetching replies:", error);
      }
    };

    fetchReplies();
  }, [currentUser]);

  const openReplyModal = (reply) => {
    setReplyTo(reply);
    setReplyMessage("");
    setIsReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setIsReplyModalOpen(false);
    setReplyTo(null);
    setReplyMessage("");
  };

  const handleSendReply = async () => {
    if (!replyTo || !replyMessage) return;

    try {
      const inquiriesRef = collection(db, "inquiries");
      await addDoc(inquiriesRef, {
        studentId: currentUser.uid,
        recipientId: replyTo.studentId, 
        subject: `Re: ${replyTo.subject}`,
        message: replyMessage,
        timestamp: serverTimestamp(),
        read: false,
      });

      closeReplyModal();
      alert("Reply sent successfully!");
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Error sending reply. Please try again.");
    }
  };

  const openDeleteModal = (replyId) => {
    setReplyIdToDelete(replyId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setReplyIdToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteReply = async () => {
    if (!replyIdToDelete) return;

    try {
      await deleteDoc(doc(db, "inquiries", replyIdToDelete));

      setReplies((prevReplies) =>
        prevReplies.filter((reply) => reply.id !== replyIdToDelete)
      );

      closeDeleteModal();
      alert("Reply deleted successfully!");
    } catch (error) {
      console.error("Error deleting reply:", error);
      alert("Error deleting reply. Please try again.");
    }
  };

  return (
    <SidebarStudent>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Inquiries
        </h2>

        {inquiries.map(inquiry => (
          <>
            <motion.div className={`p-3 px-6 rounded-md my-3 shadow-md hover:cursor-pointer ${
                          inquiry.studentId === currentUser.uid
                            ? 'bg-[#fff6d4]'
                            : inquiry.read
                            ? 'bg-[#fff6d4]'
                            : 'bg-[#bcc9fb] border-[#6176c0] border-2'
                        }`}
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}>
              <div className="flex justify-between items-center">
                <div className="w-[60%]">
                  <span className="break-words font-bold text-lg">
                    {inquiry.subject}
                  </span>
                </div>

                <div>
                  <span className="text-sm">
                    {moment(inquiry.timestamp.toDate()).startOf('hour').fromNow()}
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
                  {inquiry.studentId === currentUser.uid ?(
                    <>
                      <span>
                        You: {inquiry.message}
                      </span>
                    </>
                  ): (
                    <>
                      {inquiry.message}
                    </>

                  )}
                  
                </span>
              </div>

              <div className="mt-3 flex justify-end">
                  {inquiry.studentId === currentUser.uid ?(
                    <span className="text-sm text-[#000000b6] font-medium">
                    
                    </span>
                ): (
                  <span className="text-sm text-[#000000b6] font-medium">
                    {inquiry.read ? "Read" : "Unread"}
                  </span>
                )}
              </div>

            </motion.div>
          </>
        ))}

        {/* {replies.length === 0 ? (
          <p>You have no replies yet.</p>
        ) : (
          <ul className="space-y-4">
            {replies.map((reply) => (
              <li key={reply.id} className="bg-white p-4 rounded-md shadow">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-medium">
                      Subject: {reply.subject}
                    </span>
                    <p className="text-gray-600 text-sm">
                      From: {reply.senderEmail}
                    </p>
                  </div>

                  <span className="text-gray-500 text-sm">
                    {moment(reply.timestamp.toDate()).startOf('hour').fromNow()}

                  </span>
                </div>
                <p className="mb-4">{reply.message}</p>

                {reply.fileURLs && reply.fileURLs.length > 0 && (
                  <div>
                    <p className="font-medium">Attached Files:</p>
                    <ul className="list-disc list-inside">
                      {reply.fileURLs.map((url, index) => (
                        <li key={index}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            File {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4 flex">
                  <button
                    onClick={() => openReplyModal(reply)}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => openDeleteModal(reply.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Modal isOpen={isReplyModalOpen} onClose={closeReplyModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Reply to Message</h3>
            <p className="mb-2">
              To: <strong>{replyTo?.senderEmail}</strong>
            </p>
            <p className="mb-2">
              Subject: <strong>Re: {replyTo?.subject}</strong>
            </p>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeReplyModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send Reply
              </button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete this reply?</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDeleteModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReply}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal> */}
      </div>
    </SidebarStudent>
  );
}

export default ViewMessagesStudent;