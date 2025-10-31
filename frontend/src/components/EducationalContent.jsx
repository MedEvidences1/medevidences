import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import { Microscope, Heart, Atom, AlertTriangle, Apple, XCircle, Activity, Pill } from 'lucide-react';
import { educationalContent } from '../mockData';

const iconMap = {
  'microscope': Microscope,
  'heart': Heart,
  'molecule': Atom,
  'warning': AlertTriangle,
  'apple': Apple,
  'warning-triangle': XCircle,
  'activity': Activity,
  'pill': Pill
};

const EducationalContent = () => {
  return (
    <Card className="shadow-lg border-purple-100">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        <CardTitle className="text-2xl text-purple-900">Understanding Gut Health</CardTitle>
        <CardDescription className="text-purple-700">
          Learn about your gut microbiome and why it matters for your overall health
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Accordion type="single" collapsible className="w-full space-y-3">
          {educationalContent.map((item) => {
            const IconComponent = iconMap[item.icon] || Microscope;
            return (
              <AccordionItem key={item.id} value={`item-${item.id}`} className="border border-purple-100 rounded-lg px-4 bg-gradient-to-r from-purple-50/30 to-pink-50/30 hover:from-purple-50 hover:to-pink-50 transition-all">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="font-semibold text-gray-900">{item.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  <div className="pl-13 space-y-3">
                    <p className="text-gray-700 leading-relaxed">{item.content}</p>
                    {item.expandedContent && (
                      <div className="mt-3 p-4 bg-white rounded-lg border border-purple-100">
                        <p className="text-gray-600 text-sm leading-relaxed">{item.expandedContent}</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Key Takeaways */}
        <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
          <h3 className="text-xl font-bold text-emerald-900 mb-4">Key Takeaways</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Badge className="mt-1 bg-emerald-500">1</Badge>
              <span className="text-gray-700">Your gut microbiome contains trillions of microorganisms that influence your overall health</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="mt-1 bg-emerald-500">2</Badge>
              <span className="text-gray-700">A healthy gut supports immunity, metabolism, mental health, and disease prevention</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="mt-1 bg-emerald-500">3</Badge>
              <span className="text-gray-700">Diet, exercise, sleep, and stress management are key factors in gut health</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="mt-1 bg-emerald-500">4</Badge>
              <span className="text-gray-700">Fiber-rich foods, fermented foods, and omega-3s feed beneficial bacteria</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="mt-1 bg-emerald-500">5</Badge>
              <span className="text-gray-700">Sugar, saturated fats, and processed foods harm your microbiome balance</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default EducationalContent;
