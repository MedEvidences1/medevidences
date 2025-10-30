import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function CompanyContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    contact_name: '',
    looking_for: '',
    role: '',
    contract_timeframe: '',
    pay_offer: '',
    perks: '',
    requirements: '',
    application_deadline: '',
    process: '',
    incentives: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/company-contact`, formData);
      setSubmitted(true);
      toast.success('Thank you! We will contact you within 24 hours.');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className=\"text-center py-12\">
        <CheckCircle className=\"w-16 h-16 text-green-600 mx-auto mb-4\" />
        <h3 className=\"text-2xl font-bold text-gray-900 mb-2\">Thank You!</h3>
        <p className=\"text-gray-600\">We've received your inquiry and will reach out within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className=\"space-y-6\">
      <div className=\"grid md:grid-cols-2 gap-6\">
        <div className=\"space-y-2\">
          <Label htmlFor=\"company_name\">Company Name *</Label>
          <Input
            id=\"company_name\"
            required
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder=\"Your Company\"
          />
        </div>

        <div className=\"space-y-2\">
          <Label htmlFor=\"contact_email\">Contact Email *</Label>
          <Input
            id=\"contact_email\"
            type=\"email\"
            required
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            placeholder=\"contact@company.com\"
          />
        </div>
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"contact_name\">Contact Name</Label>
        <Input
          id=\"contact_name\"
          value={formData.contact_name}
          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
          placeholder=\"John Doe\"
        />
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"looking_for\">What are you looking for? *</Label>
        <Textarea
          id=\"looking_for\"
          required
          value={formData.looking_for}
          onChange={(e) => setFormData({ ...formData, looking_for: e.target.value })}
          placeholder=\"Describe the type of talent you're seeking...\"
          rows={3}
        />
      </div>

      <div className=\"grid md:grid-cols-2 gap-6\">
        <div className=\"space-y-2\">
          <Label htmlFor=\"role\">Role/Position *</Label>
          <Input
            id=\"role\"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder=\"e.g., Senior Medical Researcher\"
          />
        </div>

        <div className=\"space-y-2\">
          <Label htmlFor=\"contract_timeframe\">Contract Timeframe *</Label>
          <Input
            id=\"contract_timeframe\"
            required
            value={formData.contract_timeframe}
            onChange={(e) => setFormData({ ...formData, contract_timeframe: e.target.value })}
            placeholder=\"e.g., 6 months, 1 year, Permanent\"
          />
        </div>
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"pay_offer\">Pay Offer/Range *</Label>
        <Input
          id=\"pay_offer\"
          required
          value={formData.pay_offer}
          onChange={(e) => setFormData({ ...formData, pay_offer: e.target.value })}
          placeholder=\"e.g., $120,000 - $160,000 per year\"
        />
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"perks\">Benefits & Perks *</Label>
        <Textarea
          id=\"perks\"
          required
          value={formData.perks}
          onChange={(e) => setFormData({ ...formData, perks: e.target.value })}
          placeholder=\"Health insurance, remote work, stock options, etc.\"
          rows={2}
        />
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"requirements\">Requirements *</Label>
        <Textarea
          id=\"requirements\"
          required
          value={formData.requirements}
          onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          placeholder=\"List key requirements and qualifications...\"
          rows={3}
        />
      </div>

      <div className=\"grid md:grid-cols-2 gap-6\">
        <div className=\"space-y-2\">
          <Label htmlFor=\"application_deadline\">Application Deadline</Label>
          <Input
            id=\"application_deadline\"
            type=\"date\"
            value={formData.application_deadline}
            onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
          />
        </div>

        <div className=\"space-y-2\">
          <Label htmlFor=\"process\">Hiring Process *</Label>
          <Input
            id=\"process\"
            required
            value={formData.process}
            onChange={(e) => setFormData({ ...formData, process: e.target.value })}
            placeholder=\"e.g., Interview rounds, timeline\"
          />
        </div>
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"incentives\">Additional Incentives/Bonuses</Label>
        <Textarea
          id=\"incentives\"
          value={formData.incentives}
          onChange={(e) => setFormData({ ...formData, incentives: e.target.value })}
          placeholder=\"Sign-on bonus, performance incentives, relocation assistance...\"
          rows={2}
        />
      </div>

      <Button type=\"submit\" disabled={loading} size=\"lg\" className=\"w-full\">
        {loading ? 'Submitting...' : 'Submit Request'}
      </Button>
    </form>
  );
}

export default CompanyContactForm;
