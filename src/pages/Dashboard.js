import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../components/AuthContext";
import { db } from "../firebaseConfig";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { motion } from 'framer-motion';
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import SidebarStudent from "../components/SidebarStudent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import "./pdf.css";
import html2pdf from 'html2pdf.js';

const SPECIAL_SUBJECTS = [
  "Librarian",
  "Finance",
  "Director/Principal",
  "Basic Education Registrar",
  "Class Adviser",
  "Character Renewal Office",
];

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [greetings, setGreetings] = useState(null);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef(null);

  useEffect(() => {
    const updateGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour < 12) {
        setGreetings("Good Morning");
      } else if (currentHour < 18) {
        setGreetings("Good Afternoon");
      } else {
        setGreetings("Good Evening");
      }
    };

    updateGreeting();
  }, []);

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

  const sortedSubjects = studentData?.clearance
    ? Object.keys(studentData.clearance).sort()
    : [];

  const regularSubjects = sortedSubjects.filter(
    (subject) => !SPECIAL_SUBJECTS.includes(subject)
  );

  const specialSubjects = sortedSubjects.filter((subject) =>
    SPECIAL_SUBJECTS.includes(subject)
  );

  const handleDownloadPDF = async () => {
    setLoading(true);
  
    const input = componentRef.current;
  
    try {
      const opt = {
        margin:       0,
        filename:     `${currentUser.uid}_clearance.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: 'avoid-all' },
        html2pdf:     { width: input.offsetWidth, height: input.offsetHeight }
      };
  
      const pdfDataUri = await html2pdf().set(opt).from(input).toPdf().output('datauristring');
  
      const storage = getStorage();
      const storageRef = ref(storage, `generatedPdf/${currentUser.uid}/${currentUser.uid}_clearance.pdf`);
  
      await uploadString(storageRef, pdfDataUri, 'data_url');
  
      const downloadURL = await getDownloadURL(storageRef);

      window.open(downloadURL, '_blank');
    } catch (error) {
      console.error("Error generating or uploading PDF:", error);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <SidebarStudent>
      <div className="container mx-auto">
        <div className="pb-10">
          <div className="flex justify-center">
            <h2 className="text-2xl font-semibold mb-4">{greetings}, {studentData?.fullName}!</h2>
          </div>

          <div className="flex justify-center">
            <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}
              className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={handleDownloadPDF}
              disabled={loading}
            >
              {loading ? "Generating Clearance PDF..." : "Generate Clearance PDF"}
            </motion.button>
          </div>
        </div>

        {/* PDF Generate Page */}
        <div className="print-container p-7" ref={componentRef}>
          <div className="pb-5">
            <div className="flex print-layout justify-between">
              <div className="flex">
                <p className="text-xl font">
                  Name:
                </p>
                <p className="text-xl font pl-1">
                  <strong>{studentData?.fullName}</strong>
                </p>
              </div>

              <div className="flex">
                <p className="text-xl">
                  Section:
                </p>
                <p className="text-xl pl-1">
                  <strong>{studentData?.section}</strong>
                </p>
              </div>
            </div>

            <div className="flex print-layout justify-between">
              {studentData?.department && (
                <div className="flex">
                  <p className="text-xl font">
                    Department:
                  </p>
                  <p className="text-xl font pl-1">
                    <strong>{studentData?.department}</strong>
                  </p>
                </div>
              )}

              <div className="flex">
                <p className="text-xl">
                  Grade Level:
                </p>
                <p className="text-xl pl-1">
                  <strong>{studentData?.gradeLevel}</strong>
                </p>
              </div>
            </div>

            <div className="border-2 border-green-300 mt-6"/>
          </div>

          {/* Regular Subjects Table */}
          <h2 className="text-xl font-semibold mb-4">Student Clearance</h2>
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 border-b border-gray-200">Subject</th>
                <th className="py-2 border-b border-gray-200 text-center">
                  Cleared
                </th>
              </tr>
            </thead>
            <tbody>
              {regularSubjects.map((subject) => (
                <React.Fragment key={subject}>
                  <tr>
                    <td className="border px-4 py-2">
                      {subject}
                    </td>
                    <td className="border px-4 py-2 text-center">
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
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Office Requirements Table */}
          {specialSubjects.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Office Requirements</h3>
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 border-b border-gray-200">
                      Office Names
                    </th>
                    <th className="py-2 border-b border-gray-200 text-center">
                      Cleared
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {specialSubjects.map((office) => (
                    <React.Fragment key={office}>
                      <tr>
                        <td className="border px-4 py-2">
                          {office}
                        </td>
                        <td className="border px-4 py-2 text-center">
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
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SidebarStudent>
  );
};

export default Dashboard;
