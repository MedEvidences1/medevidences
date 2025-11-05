import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumeData();
  }, []);

  const fetchResumeData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/resume/data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.data) {
        setResumeData(data.data);
      }
    } catch (error) {
      console.error('Error fetching resume data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (selectedFile.size > 3 * 1024 * 1024) {
        toast.error('File size must be less than 3MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/resume/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Resume parsed successfully!');
        setResumeData({ ...data.data, resume_id: data.resume_id });
        setFile(null);
        // Refresh data
        await fetchResumeData();
      } else {
        toast.error(data.detail || 'Failed to parse resume');
      }
    } catch (error) {
      toast.error('Error uploading resume: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/candidate-dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            AI Resume Screening
          </h1>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload Your Resume</h2>
            <p className="text-gray-600 mb-4">
              Upload your resume in PDF format (max 3MB). Our AI will automatically extract your skills, experience, and qualifications.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer inline-flex flex-col items-center"
              >
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-blue-600 hover:text-blue-800 font-medium">
                  Click to upload
                </span>
                <span className="text-sm text-gray-500 mt-1">PDF up to 3MB</span>
              </label>

              {file && (
                <div className="mt-4 text-sm text-gray-600">
                  Selected: {file.name}
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? 'Parsing Resume...' : 'Upload and Parse'}
            </button>
          </div>

          {resumeData && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">AI-Parsed Resume Data</h2>
              
              <div className="space-y-4">
                {resumeData.ai_summary && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Professional Summary</h3>
                    <p className="text-gray-700">{resumeData.ai_summary}</p>
                  </div>
                )}

                {resumeData.parsed_skills && resumeData.parsed_skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.parsed_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {resumeData.parsed_experience_years && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Experience</h3>
                    <p className="text-gray-700">{resumeData.parsed_experience_years} years</p>
                  </div>
                )}

                {resumeData.parsed_education && resumeData.parsed_education.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Education</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {resumeData.parsed_education.map((edu, idx) => (
                        <li key={idx}>{edu}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resumeData.parsed_certifications && resumeData.parsed_certifications.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Certifications</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {resumeData.parsed_certifications.map((cert, idx) => (
                        <li key={idx}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-sm text-gray-500 mt-4">
                  Last updated: {new Date(resumeData.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
