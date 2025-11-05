import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function PayrollTracking() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('timesheets');
  const [timesheets, setTimesheets] = useState([]);
  const [complianceDocs, setComplianceDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTimesheetForm, setShowTimesheetForm] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch timesheets
      const timesheetsRes = await fetch(`${BACKEND_URL}/api/payroll/timesheets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const timesheetsData = await timesheetsRes.json();
      setTimesheets(timesheetsData.timesheets || []);

      // Fetch compliance documents
      const docsRes = await fetch(`${BACKEND_URL}/api/compliance/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const docsData = await docsRes.json();
      setComplianceDocs(docsData.documents || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTimesheet = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const timesheetData = {
      contract_id: formData.get('contract_id'),
      period_start: formData.get('period_start'),
      period_end: formData.get('period_end'),
      hours_worked: parseFloat(formData.get('hours_worked')),
      hourly_rate: parseFloat(formData.get('hourly_rate'))
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/payroll/timesheet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(timesheetData)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Timesheet submitted successfully!');
        setShowTimesheetForm(false);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to submit timesheet');
      }
    } catch (error) {
      toast.error('Error submitting timesheet: ' + error.message);
    }
  };

  const handleApproveTimesheet = async (payrollId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/payroll/approve/${payrollId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Timesheet approved!');
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to approve timesheet');
      }
    } catch (error) {
      toast.error('Error approving timesheet: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate(user.role === 'candidate' ? '/candidate-dashboard' : '/employer-dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('timesheets')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'timesheets'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Timesheets
              </button>
              <button
                onClick={() => setActiveTab('compliance')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'compliance'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Compliance Documents
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'timesheets' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Timesheets</h2>
                  {user.role === 'candidate' && (
                    <button
                      onClick={() => setShowTimesheetForm(!showTimesheetForm)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {showTimesheetForm ? 'Cancel' : 'Submit Timesheet'}
                    </button>
                  )}
                </div>

                {showTimesheetForm && user.role === 'candidate' && (
                  <form onSubmit={handleSubmitTimesheet} className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold mb-4">New Timesheet</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Contract ID</label>
                        <input
                          type="text"
                          name="contract_id"
                          required
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Enter contract ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Hours Worked</label>
                        <input
                          type="number"
                          name="hours_worked"
                          step="0.5"
                          required
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Period Start</label>
                        <input
                          type="date"
                          name="period_start"
                          required
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Period End</label>
                        <input
                          type="date"
                          name="period_end"
                          required
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
                        <input
                          type="number"
                          name="hourly_rate"
                          step="0.01"
                          required
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                    >
                      Submit Timesheet
                    </button>
                  </form>
                )}

                {timesheets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No timesheets found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          {user.role === 'employer' && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {timesheets.map((timesheet) => (
                          <tr key={timesheet.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(timesheet.period_start).toLocaleDateString()} - {new Date(timesheet.period_end).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {timesheet.hours_worked}h
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${timesheet.hourly_rate}/hr
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              ${timesheet.total_amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(timesheet.status)}`}>
                                {timesheet.status}
                              </span>
                            </td>
                            {user.role === 'employer' && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {timesheet.status === 'pending' && (
                                  <button
                                    onClick={() => handleApproveTimesheet(timesheet.id)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    Approve
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'compliance' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Compliance Documents</h2>
                  {user.role === 'candidate' && (
                    <button
                      onClick={() => toast.info('Document upload UI coming soon!')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Upload Document
                    </button>
                  )}
                </div>

                {complianceDocs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No compliance documents found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {complianceDocs.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{doc.file_name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{doc.document_type.toUpperCase()}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
