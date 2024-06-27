import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { db, storage } from "../firebaseConfig";
import { motion, AnimatePresence } from 'framer-motion';
import ModalSubject from "../components/Modal/index";
import ChatDesign from "../components/Chat/ChatDesign"
import UserChatDesign from "../components/Chat/UserChatDesign";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc, 
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import SidebarStudent from "../components/SidebarStudent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle,
  faComments,

} from "@fortawesome/free-solid-svg-icons";
import {
  DocumentMagnifyingGlassIcon
} from "@heroicons/react/24/solid";
import Modal from "../components/Modal";

const SPECIAL_SUBJECTS = [
  "Librarian",
  "Finance",
  "Director/Principal",
  "Basic Education Registrar",
  "Character Renewal Office",
  "College Library",
  "Guidance Office",
  "Office of The Dean",
  "Office of the Finance Director",
  "Office of the Registrar",
  "Property Custodian",
  "Student Council",
];

const StudentClearance = () => {
  const { currentUser } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [classRequirements, setClassRequirements] = useState({});
  const [officeRequirements, setOfficeRequirements] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSubjectOffice, setSelectedSubjectOffice] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [clearanceRequests, setClearanceRequests] = useState({});
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);
  const [subjectToResubmit, setSubjectToResubmit] = useState(null);
  const [submitType, setSubmitType] = useState(null);
  const [ modalSubject, setModalSubject] = useState(null)
  const [ modalSubjectOffice, setModalSubjectOffice] = useState(null)
  const [ forOfficeUIDSubject, setForOfficeUIDSubject] = useState(null)
  const [inquiry, setInquiry] = useState(false);
  const [inquiryData, setInquiryData] = useState([]);
  const [subjbectForInquiry, setsubjbectForInquiry] = useState(null)
  const [teacherUID, setTeacherUID] = useState('');

  const updateTeacherUID = () => {
    const filteredRequirements = officeRequirements.filter(
      (requirement) => requirement.office === forOfficeUIDSubject
    );

    if (filteredRequirements.length > 0) {
      setTeacherUID(filteredRequirements[0].addedBy);
    }

  };
  

  // Fetch Student Data
  useEffect(() => {
    if (!currentUser) return;

    const fetchStudentData = async () => {
      try {
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, where("uid", "==", currentUser.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          querySnapshot.forEach((doc) => {
            setStudentData(doc.data());
          });
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchStudentData();
  }, [currentUser, setStudentData]);
  


  // Fetch Class Requirement based on section
  useEffect(() => {
    const fetchClassRequirements = async () => {
      if (!studentData || !studentData.section) return;

      try {
        const classesRef = collection(db, "classes");
        const classQuery = query(
          classesRef,
          where("sectionName", "==", studentData.section)
        );
        const classSnapshot = await getDocs(classQuery);

        if (!classSnapshot.empty) {
          const classData = classSnapshot.docs[0].data();
          setClassRequirements(classData.requirements || {});
        }
      } catch (error) {
        console.error("Error fetching class requirements:", error);
      }
    };

    fetchClassRequirements();
  }, [studentData]);


  // Fetch Office Requirements
  useEffect(() => {
    const fetchOfficeRequirements = async () => {
      try {
        const officeReqsRef = collection(db, "officeRequirements");
        const officeReqsSnapshot = await getDocs(officeReqsRef);
        setOfficeRequirements(officeReqsSnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching office requirements:", error);
      }
    };

    fetchOfficeRequirements();
  }, []);


  // Clearance Requests by Student
  useEffect(() => {
    const unsubscribe = () => {
      if (!currentUser) return;
  
      try {
        const requestsRef = collection(db, "clearanceRequests");
        const q = query(requestsRef, where("studentId", "==", currentUser.uid));
  
        const unsubscribe = onSnapshot(q, (requestsSnapshot) => {
          const requestsData = {};
          requestsSnapshot.forEach((doc) => {
            const data = doc.data();
            requestsData[data.subject] = {
              status: data.status,
              id: doc.id,
              fileURLs: data.fileURLs,
            };
          });
          setClearanceRequests(requestsData);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching clearance requests:", error);
      }
    };
  
    const unsubscribeFunction = unsubscribe();
  
    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction();
      }
    };
  }, [currentUser]);
  


    const handleSubjectClick = (subject) => {
      setsubjbectForInquiry(subject);
      setSubmitType('submit');
      setModalSubject(subject);
      setSelectedSubject(selectedSubject === subject ? null : subject);
      console.log(selectedSubject)
      };


    const handleSubjectClickOffice = (subject) => {
      setsubjbectForInquiry(subject);
      setSubmitType('submit');
      setModalSubjectOffice(subject);
      setSelectedSubjectOffice(selectedSubject === subject ? null : subject);
      setForOfficeUIDSubject(subject);
      // updateTeacherUID();
      console.log(selectedSubjectOffice);
      };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };


  //adjust this, add custom alert jecho!!!
  const handleRequestClearance = async (subject, type) => {

    if (!studentData || !subject) return;
  
    setIsUploading(true);
  
    try {
      const fileURLs = [];
  
      for (const file of files) {
        const storageRef = ref(
          storage,
          `clearance_requests/${currentUser.uid}/${subject}/${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        fileURLs.push(downloadURL);
      }
  
      const clearanceRequestsRef = collection(db, "clearanceRequests");
  
      if (type === 'class') {
        const subjectRequirements = classRequirements[subject];
        if (subjectRequirements && subjectRequirements.length > 0) {
          await addDoc(clearanceRequestsRef, {
            studentId: currentUser.uid,
            studentName: studentData.fullName,
            section: studentData.section,
            subject: subject,
            teacherUid: subjectRequirements[0].teacherUid,
            timestamp: serverTimestamp(),
            fileURLs: fileURLs,
            status: "pending",
            studentNo: studentData.studentId,
          });
        } else {
          alert(
            "No requirements found for this subject. You do not need to request clearance."
          );
          return;
        }
      } else if (type === 'office') {
        const officeRequirement = officeRequirements.find(req => req.office === subject);
        if (officeRequirement) {
          try {
            await addDoc(clearanceRequestsRef, {
              studentId: currentUser.uid,
              studentName: studentData.fullName,
              section: studentData.section,
              subject: subject,
              officerId: officeRequirement.addedBy,
              timestamp: serverTimestamp(),
              fileURLs: fileURLs,
              status: "pending",
              studentNo: studentData.studentId,
            });
          } catch (error) {
            console.error("Error adding document: ", error);
            // Handle the error here, e.g., show an alert to the user
            alert("Failed to request clearance. Please try again later.");
            return;
          }
        } else {
          alert(
            "No requirements found for this office. You do not need to request clearance."
          );
          return;
        }
      } else {
        alert(
          "Error Clearance Request"
        );
      }

      // Add to activityLog collection
      const activityLogRef = collection(db, "activityLog");
      await addDoc(activityLogRef, {
        date: serverTimestamp(),
        subject: subject,
        type: submitType,
        studentId: currentUser.uid
      });
  
      alert("Clearance requested successfully!");
      setSelectedSubject(null);
      setSelectedSubjectOffice(null);
      setFiles([]);
    } catch (error) {
      console.error("Error requesting clearance:", error);
      alert("Error requesting clearance. Please try again later.");
    } finally {
      setIsUploading(false);
      setSubmitType(null);
      setSubjectType(null);
    }
  };
  
  const [subjectType, setSubjectType] = useState(null)
  const openResubmitModal = (subject, type) => {
    setSubmitType('resubmit');
    setSubjectType(type);
    setSubjectToResubmit(subject);
    setIsResubmitModalOpen(true);
    console.log(subject);
    console.log(type);
  };

  const closeResubmitModal = () => {
    setSubjectToResubmit(null);
    setIsResubmitModalOpen(false);
  };


  const [teacherUid, setTeacherUid] = useState(null)


  const setInquiryModal = (uid) => {
    updateTeacherUID();
    setTeacherUid(uid);
    setInquiry(!inquiry);
  }

  const handleResubmitClearance = async (subject, type) => {
    closeResubmitModal();

  
    try {
      const requestToDelete = clearanceRequests[subject];
      if (requestToDelete) {
        await deleteDoc(doc(db, "clearanceRequests", requestToDelete.id));
      }
  
      await handleRequestClearance(subject, type);
    } catch (error) {
      console.error("Error resubmitting clearance:", error);
      alert("Error resubmitting clearance request. Please try again later.");
    }
  };
  

  const sortedSubjects = studentData?.clearance
  ? Object.keys(studentData.clearance).sort()
  : [];

  const regularSubjects = sortedSubjects.filter(
    (subject) => !SPECIAL_SUBJECTS.includes(subject)
  );

  const specialSubjects = sortedSubjects.filter((subject) =>
    SPECIAL_SUBJECTS.includes(subject)
  );

  useEffect(() => {
    if (!currentUser) return;
  
    const inquiryCollectionRef = collection(db, 'inquiries');
  
    const qRecipient = query(inquiryCollectionRef,
      where('subject', '==', subjbectForInquiry),
      where('recipientId', '==', currentUser.uid)
    );
  
    const qStudent = query(inquiryCollectionRef,
      where('subject', '==', subjbectForInquiry),
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
  }, [currentUser, subjbectForInquiry]);
    
  
  return (
    <SidebarStudent>
            <div className="container mx-auto  rounded pb-10">
        <div className="bg-gray-200 mb-4 p-5 rounded flex justify-center items-center">
          <h2 className="text-xl font-bold text-black">Student Clearance</h2>
        </div>


        {/* Regular Subjects Table */}
        {studentData?.educationLevel !== "college" && (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border border-gray-400 bg-blue-300 text-base sm:text-xl">Subject</th>
              <th className="py-2 border border-gray-400 bg-blue-300 text-base sm:text-xl">
                Cleared
              </th>
              <th className="py-2 border border-gray-400 text-center bg-[#fff2c1] text-base sm:text-xl">Details</th>
            </tr>
          </thead>
          <tbody>
            {regularSubjects.map((subject) => (
              <React.Fragment key={subject}>
                <tr>
                  <td
                    className="border border-gray-400 px-4 py-2 bg-blue-100"
                  >
                    {subject}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 bg-blue-100 text-center">
                    {studentData.clearance[subject] ? (
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-green-500"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-red-500"
                      />
                    )}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-center bg-[#fffcf2]">
                    <motion.button
                      whileHover={{scale: 1.03}}
                      whileTap={{scale: 0.95}}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      View Details
                    </motion.button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}

        {/* Office Requirements Table */}
        {specialSubjects.length > 0 && (
          <div className="mt-8">
                   <div className="bg-gray-200 mb-4 p-5 rounded flex justify-center items-center">
          <h2 className="text-xl font-bold text-black">Office Requirements</h2>
        </div>
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 border border-gray-400 bg-blue-300 text-base sm:text-xl">
                    Office Names
                  </th>
                  <th className="py-2 border border-gray-400 bg-blue-300 text-base sm:text-xl">
                    Cleared
                  </th>
                  <th className="py-2 border border-gray-400 text-center bg-[#fff2c1] text-base sm:text-xl">Details</th>
                </tr>
              </thead>
              <tbody>

                {specialSubjects.map((office) => (
                  <React.Fragment key={office}>
                    <tr>
                      <td
                        className="border border-gray-400 px-4 py-2 bg-blue-100"
                      >
                        {office}
                      </td>
                      <td className="border border-gray-400 px-4 py-2 bg-blue-100 text-center">
                        {studentData.clearance[office] ? (
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="text-green-500"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faTimesCircle}
                            className="text-red-500"
                          />
                        )}
                      </td>
                      <td className="border border-gray-400 px-4 py-2 text-center bg-[#fffcf2]">
                        <motion.button
                          whileHover={{scale: 1.03}}
                          whileTap={{scale: 0.95}}
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => handleSubjectClickOffice(office)}
                        >
                          View Details
                        </motion.button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isResubmitModalOpen} onClose={closeResubmitModal}>
        <motion.div className="p-6"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}>
          <h3 className="text-lg font-semibold mb-4">
            Resubmit Clearance Request
          </h3>
          <p>
            Are you sure you want to resubmit your clearance request for{" "}
            <strong>{subjectToResubmit}</strong>? This will delete your previous
            request.
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeResubmitModal}
              className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => handleResubmitClearance(subjectToResubmit, subjectType)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Resubmit
            </button>
          </div>
        </motion.div>
      </Modal>

      <AnimatePresence
        initial={false}
        mode="wait"
        onExitComplete={() => null}
        >
          {selectedSubject && (
            <ModalSubject text={selectedSubject} modalOpen={selectedSubject} handleClose={() => handleSubjectClick(null)}>
                {/* Expandable Section for Requirements & Request */}
                {selectedSubject === modalSubject &&
                      classRequirements[modalSubject] ? (     
                        <>
                            
                        <table className="w-full">
                          <tbody>
                            <tr className="bg-white">
                              <td colSpan={3} className="border px-4 py-2">
                                {/* Requirements List */}
                                <h4 className="text-md font-semibold">
                              Requirements:
                            </h4>
                                <ul className="list-disc list-inside">
                                  {(classRequirements[modalSubject] || []).map(
                                    (requirement, index) => (
                                      <li key={index}>
                                        <strong>{requirement.name}:</strong>{" "}
                                        {requirement.description}
                                      </li>
                                    )
                                  )}
                                </ul>

                                {/* Request/Resubmit Clearance Section */}
                                <div className="mt-4">
                                  {clearanceRequests[modalSubject] ? (
                                    <div>
                                      
                                      <div
                                         className={`flex justify-center items-center p-2 px-5 rounded-full ${
                                           clearanceRequests[modalSubject].status ===
                                           "approved"
                                             ? "bg-green-100 text-green-800"
                                             : clearanceRequests[modalSubject].status ===
                                               "rejected"
                                             ? "bg-red-100 text-red-800"
                                             : "bg-yellow-100 text-yellow-800"
                                         }`}
                                       >
                                          <FontAwesomeIcon
                                            icon={faExclamationCircle}
                                            className="mr-2"
                                          />
                                          <span>
                                            Your clearance request is currently{" "}
                                            <strong>
                                              {clearanceRequests[modalSubject].status}
                                            </strong>
                                            .
                                          </span>
                                        </div>

                                      {clearanceRequests[modalSubject].status !==
                                        "approved" && (

                                        <div className="items-center justify-center flex flex-col sm:flex-row mt-2 gap-2 pt-2">
                                          <button
                                            onClick={() => openResubmitModal(modalSubject, 'class')}
                                            className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded hover:bg-yellow-600 disabled:opacity-50 w-full"
                                            disabled={isUploading}
                                          >
                                            {isUploading
                                              ? "Resubmitting..."
                                              : "Resubmit Clearance"}
                                          </button>
                                          
                                            <input
                                              type="file"
                                              multiple
                                              onChange={handleFileChange}
                                              className={`p-2 my-2 text-sm rounded-lg cursor-pointer text-black font-semibold w-full
                                                ${clearanceRequests[modalSubject].status ===
                                                "approved"
                                                  ? "bg-green-100 text-green-800"
                                                  : clearanceRequests[modalSubject].status ===
                                                    "rejected"
                                                  ? "bg-red-100 text-red-800"
                                                  : "bg-yellow-100 text-yellow-800"
                                              }`}
                                            />
                                        </div>

                                      )}

                                      {clearanceRequests[modalSubject].fileURLs &&
                                        clearanceRequests[modalSubject].fileURLs.length >
                                        0 ? (

                                        <div className="mt-2 bg-gray-200 rounded-md">
                                          <p className="text-sm font-medium text-black bg-gray-300 text-center p-2 rounded-md">
                                            Submitted Files:
                                          </p>
                                          <ul>
                                            {clearanceRequests[
                                              modalSubject
                                            ].fileURLs.map((url, index) => (
                                              <li key={index}>
                                                <a
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-500 hover:underline flex justify-center p-1"
                                                >
                                                  <DocumentMagnifyingGlassIcon className='w-7 h-7'/>
                                                  File {index + 1}
                                                </a>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>

                                      ) : null}
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Optional: Submit Files (e.g., proof of
                                        payment, documents)
                                      </label>
                                      <div className="items-center justify-center flex flex-col sm:flex-row gap-2">
                                      
                                      <button
                                        onClick={() => handleRequestClearance(selectedSubject, 'class')}
                                        className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 disabled:opacity-50 w-full"
                                        disabled={isUploading}
                                      >
                                        {isUploading
                                          ? "Requesting..."
                                          : "Request Clearance"}
                                      </button>

                                          <input
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="p-2 my-2 text-sm rounded-lg cursor-pointer font-semibold w-full bg-blue-200 text-blue-800"
                                          />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>

                          </tbody>
                        </table>

                        <div className="flex justify-center p-2 w-full mt-3">
                          <motion.div
                           whileHover={{scale: 1.03}}
                           whileTap={{scale: 0.95}}
                           className="bg-white gap-2 flex p-2 px-10 justify-center items-center rounded-full hover:cursor-pointer" onClick={() => setInquiryModal(classRequirements[modalSubject][0].teacherUid)}>
                              <FontAwesomeIcon icon={faComments} className="text-[#5468b2] text-2xl"/>
                              <strong className="text-[#5468b2]">Send Inquiry</strong>
                          </motion.div>

                        </div>

                        
                        </>  
                        
                      ):(
                        <>
                          <div className="flex items-center justify-center">
                            <p className="text-center">
                              Currently, there are no specific requirements for <strong>{selectedSubject}</strong>
                            </p>
                          </div>
                        </>
                      )}
              
            </ModalSubject>
          )}


          {/* For Offices */}

          {selectedSubjectOffice && (
            <ModalSubject text={selectedSubjectOffice} handleClose={() => handleSubjectClickOffice(null)}>
                    {/* Expandable Section for Office Requirements & Request */}
                    {selectedSubjectOffice === modalSubjectOffice &&
                      officeRequirements.some(
                        (requirement) => requirement.office === modalSubjectOffice
                      ) ? (

                        <>
                        <table className="w-full">
                          <tbody>
                            <tr className="bg-white">
                              <td colSpan={3} className="border px-4 py-2">
                                {/* Office Requirements List */}


                                <h4 className="text-md font-semibold">
                                  Requirements: 
                                </h4>
                                <ul className="list-disc list-inside">
                                  {officeRequirements
                                    .filter(
                                      (requirement) => requirement.office === modalSubjectOffice
                                    )
                                    .map((requirement, index) => (
                                      <li key={index}>
                                        <strong>{requirement.name}:</strong>{" "}
                                        {requirement.description}
                                      </li>
                                    ))}
                                </ul>

                                {/* Request/Resubmit Clearance Section */}
                                <div className="mt-4">
                                  {clearanceRequests[modalSubjectOffice] ? (
                                    <div>
                                      <div
                                         className={`flex justify-center items-center p-2 px-5 rounded-full ${
                                           clearanceRequests[modalSubjectOffice].status ===
                                           "approved"
                                             ? "bg-green-100 text-green-800"
                                             : clearanceRequests[modalSubjectOffice].status ===
                                               "rejected"
                                             ? "bg-red-100 text-red-800"
                                             : "bg-yellow-100 text-yellow-800"
                                         }`}
                                       >
                                          <FontAwesomeIcon
                                            icon={faExclamationCircle}
                                            className="mr-2"
                                          />
                                          <span>
                                            Your clearance request is currently{" "}
                                            <strong>
                                              {clearanceRequests[modalSubjectOffice].status}
                                            </strong>
                                            .
                                          </span>
                                        </div>

                                      {clearanceRequests[modalSubjectOffice].status !==
                                        "approved" && (
                                        <div className="items-center justify-center flex flex-col sm:flex-row mt-2 gap-2 pt-2">
                                          <button
                                            onClick={() => openResubmitModal(modalSubjectOffice, 'office')}
                                            className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded hover:bg-yellow-600 disabled:opacity-50 w-full"
                                            disabled={isUploading}
                                          >
                                            {isUploading
                                              ? "Resubmitting..."
                                              : "Resubmit Clearance"}
                                          </button>
                                          
                                            <input
                                              type="file"
                                              multiple
                                              onChange={handleFileChange}
                                              className={`p-2 my-2 text-sm rounded-lg cursor-pointer text-black font-semibold w-full
                                                ${clearanceRequests[modalSubjectOffice].status ===
                                                "approved"
                                                  ? "bg-green-100 text-green-800"
                                                  : clearanceRequests[modalSubjectOffice].status ===
                                                    "rejected"
                                                  ? "bg-red-100 text-red-800"
                                                  : "bg-yellow-100 text-yellow-800"
                                              }`}
                                            />
                                            


                                        </div>
                                      )}
                                      {clearanceRequests[modalSubjectOffice].fileURLs &&
                                      clearanceRequests[modalSubjectOffice].fileURLs.length >
                                        0 ? (
                                          <div className="mt-2 bg-gray-200 rounded-md">
                                          <p className="text-sm font-medium text-black bg-gray-300 text-center p-2 rounded-md">
                                            Submitted Files:
                                          </p>
                                          <ul>
                                            {clearanceRequests[
                                              modalSubjectOffice
                                            ].fileURLs.map((url, index) => (
                                              <li key={index}>
                                                <a
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-500 hover:underline flex justify-center p-1"
                                                >
                                                  <DocumentMagnifyingGlassIcon className='w-7 h-7'/>
                                                  File {index + 1}
                                                </a>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Optional: Submit Files (e.g., proof of
                                        payment, documents)
                                      </label>
                                      <div className="items-center justify-center flex flex-col sm:flex-row gap-2">
                                      
                                      <button
                                        onClick={() => handleRequestClearance(selectedSubjectOffice, 'office')}
                                        className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 disabled:opacity-50 w-full"
                                        disabled={isUploading}
                                      >
                                        {isUploading
                                          ? "Requesting..."
                                          : "Request Clearance"}
                                      </button>

                                          <input
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="p-2 my-2 text-sm rounded-lg cursor-pointer font-semibold w-full bg-blue-200 text-blue-800"
                                          />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>

                          </tbody>
                        </table>

                        <div className="flex justify-center p-2 w-full mt-3">
                        <motion.div
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.95}}
                        className="bg-white gap-2 flex p-2 px-10 justify-center items-center rounded-full hover:cursor-pointer" onClick={() => setInquiryModal(teacherUID)}>
                            <FontAwesomeIcon icon={faComments} className="text-[#5468b2] text-2xl"/>
                            <strong className="text-[#5468b2]">Send Inquiry</strong>
                        </motion.div>

                        </div>
                        
                        </>

                      ):(
                        <div className="flex justify-center">
                          <p>
                            Currently, there are no specific requirements for <strong>{selectedSubjectOffice}</strong>
                          </p>
                        </div>
                      )}
              
            </ModalSubject>
          )}
          

      </AnimatePresence>

    <AnimatePresence>

      {inquiry && (
        <>
          {selectedSubject && (
            <ChatDesign handleClose={() => setInquiryModal(false)} subject={selectedSubject} facultyUid={teacherUid}>
              {inquiryData.map((inquiry) => (
                <UserChatDesign
                  key={inquiry.id}
                  userType={inquiry.studentId === currentUser.uid ? "student" : "other"}
                  data={inquiry}
                >
                  {inquiry.message}
                </UserChatDesign>
              ))}
            </ChatDesign>
          )}
          
          {selectedSubjectOffice && (
            <ChatDesign handleClose={() => setInquiryModal(false)} subject={selectedSubjectOffice} facultyUid={teacherUID}>
              {inquiryData.map((inquiry) => (
                <UserChatDesign
                  key={inquiry.id}
                  userType={inquiry.studentId === currentUser.uid ? "student" : "other"}
                  data={inquiry}
                >
                  {inquiry.message}
                </UserChatDesign>
              ))}
            </ChatDesign>
          )}
        </>
      )}


    </AnimatePresence>

      

      

    </SidebarStudent>
  );
};

export default StudentClearance;