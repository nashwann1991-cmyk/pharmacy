import React, { useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, X } from 'lucide-react';

interface DrugDosageToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DrugDosageTool: React.FC<DrugDosageToolProps> = ({ isOpen, onClose }) => {
  const [childWeight, setChildWeight] = useState<number>(15);
  const [selectedDrug, setSelectedDrug] = useState<'paracetamol' | 'ibuprofen' | 'amoxicillin'>('paracetamol');

  if (!isOpen) return null;

  // Pediatric dosing logic (Standard clinical guidelines):
  // Paracetamol: 10 - 15 mg/kg per dose every 4-6 hours (max 60 mg/kg/day)
  // Ibuprofen: 5 - 10 mg/kg per dose every 6-8 hours (max 40 mg/kg/day)
  // Amoxicillin: 20 - 40 mg/kg/day divided in 3 doses (or 25-45 mg/kg/day divided in 2)

  let singleDoseMin = 0;
  let singleDoseMax = 0;
  let maxDaily = 0;
  let syrupDoseMl = '';

  if (selectedDrug === 'paracetamol') {
    singleDoseMin = childWeight * 10;
    singleDoseMax = childWeight * 15;
    maxDaily = childWeight * 60;
    // Common syrup: 120mg / 5ml or 250mg / 5ml
    const ml120 = ((singleDoseMin + singleDoseMax) / 2 / (120 / 5)).toFixed(1);
    const ml250 = ((singleDoseMin + singleDoseMax) / 2 / (250 / 5)).toFixed(1);
    syrupDoseMl = `تركيز 120mg/5ml (مثل أدول أو تايلينول): حوالي ${ml120} مل كل 6 ساعات • تركيز 250mg/5ml: حوالي ${ml250} مل`;
  } else if (selectedDrug === 'ibuprofen') {
    singleDoseMin = childWeight * 5;
    singleDoseMax = childWeight * 10;
    maxDaily = childWeight * 40;
    // Common syrup: 100mg / 5ml
    const ml100 = ((singleDoseMin + singleDoseMax) / 2 / (100 / 5)).toFixed(1);
    syrupDoseMl = `تركيز 100mg/5ml (مثل بروفين شراب): حوالي ${ml100} مل كل 8 ساعات بعد الأكل`;
  } else if (selectedDrug === 'amoxicillin') {
    const dailyMin = childWeight * 25;
    const dailyMax = childWeight * 45;
    singleDoseMin = dailyMin / 2;
    singleDoseMax = dailyMax / 2;
    maxDaily = dailyMax;
    // Common syrup: 250mg / 5ml
    const ml250 = ((dailyMin + dailyMax) / 2 / 2 / (250 / 5)).toFixed(1);
    syrupDoseMl = `تركيز 250mg/5ml (أوجمنتين / هايكونيل): حوالي ${ml250} مل مرتين يومياً (كل 12 ساعة) لمدة 7 إلى 10 أيام`;
  }

  const interactions = [
    {
      combo: 'NSAIDs (بروفين/فولتارين) + مميعات الدم (وارفارين/أسبرين)',
      severity: 'خطير',
      advice: 'زيادة خطر النزيف المعدي المعوي الشديد. يجب تجنب التزامن واستشارة الطبيب.',
    },
    {
      combo: 'مضاد أوجمنتين (Augmentin) + أقراص منع الحمل',
      severity: 'متوسط',
      advice: 'قد يقلل المضاد الحيوي من فاعلية حبوب منع الحمل. يُنصح باستخدام وسيلة إضافية خلال فترة العلاج.',
    },
    {
      combo: 'مدرات البول + مسكنات NSAIDs (إيبوبروفين)',
      severity: 'متوسط',
      advice: 'قد تقلل المسكنات من فاعلية خافض الضغط وتزيد من إجهاد الكلى.',
    },
    {
      combo: 'مكملات الحديد / الكالسيوم + مضاد سيبروفلوكساسين',
      severity: 'هام',
      advice: 'المعادن ترتبط بالمضاد وتمنع امتصاصه. يجب الفصل بينهما بساعتين على الأقل.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-teal-800 font-bold">
            <Calculator className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm">حاسبة الجرعات للأطفال والتفاعلات الدوائية</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 font-bold hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Weight Calculator */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>حاسبة جرعة شراب الأطفال بالوزن (mg/kg)</span>
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">اختر الدواء:</label>
              <select
                value={selectedDrug}
                onChange={(e) => setSelectedDrug(e.target.value as any)}
                className="w-full border rounded-lg p-2 bg-white outline-none"
              >
                <option value="paracetamol">باراسيتامول / أدول / تايلينول (Paracetamol)</option>
                <option value="ibuprofen">إيبوبروفين / بروفين (Ibuprofen)</option>
                <option value="amoxicillin">أموكسيسيلين / أوجمنتين (Amoxicillin)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">وزن الطفل بالكيلوغرام:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={childWeight}
                  onChange={(e) => setChildWeight(Math.max(2, parseFloat(e.target.value) || 2))}
                  className="w-full border rounded-lg p-2 bg-white outline-none font-bold text-center"
                />
                <span className="text-slate-500 font-bold">كجم</span>
              </div>
            </div>
          </div>

          {/* Result card */}
          <div className="bg-white p-3 rounded-xl border border-teal-200 space-y-1.5">
            <div className="flex justify-between items-center text-teal-900 font-bold">
              <span>الجرعة الموصى بها في المرة الواحدة:</span>
              <span className="text-sm text-teal-700 font-extrabold">
                {singleDoseMin.toFixed(0)} - {singleDoseMax.toFixed(0)} مجم
              </span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>الحد الأقصى اليومي الآمن:</span>
              <span>{maxDaily.toFixed(0)} مجم / 24 ساعة</span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 text-slate-700 font-medium text-[11px] leading-relaxed">
              💡 <strong>الجرعة التقريبية بالملعقة / السرنجة:</strong>
              <p className="text-teal-800 mt-0.5">{syrupDoseMl}</p>
            </div>
          </div>
        </div>

        {/* Drug Interactions Reference */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>تنبيهات التفاعلات الدوائية الحرجة الشائعة</span>
          </h4>

          <div className="space-y-2">
            {interactions.map((inter, idx) => (
              <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{inter.combo}</span>
                  <span
                    className={`px-2 py-0.2 rounded-full font-bold text-[10px] ${
                      inter.severity === 'خطير'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inter.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{inter.advice}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
