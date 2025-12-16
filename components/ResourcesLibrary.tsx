import React from 'react';
import { Book, ExternalLink, Shield } from 'lucide-react';

const RESOURCES = [
    {
        category: "النظم التعليمية",
        items: [
            { title: "OECD - PISA Results", desc: "تحليل مقارن لأداء النظم التعليمية عالمياً (فنلندا، سنغافورة).", type: "بحثي" },
            { title: "Block vs. Traditional Scheduling", desc: "دراسات حول تأثير طول الحصة الدراسية على الاستيعاب.", type: "أكاديمي" }
        ]
    },
    {
        category: "الصحة والبيولوجيا",
        items: [
            { title: "AAP School Start Times", desc: "توصيات الأكاديمية الأمريكية لطب الأطفال بخصوص النوم.", type: "طبي" },
            { title: "CDC Sleep Guidelines", desc: "تأثير النوم على الأداء المعرفي للمراهقين.", type: "طبي" }
        ]
    },
    {
        category: "تقنيات التعلم",
        items: [
            { title: "Ebbinghaus Forgetting Curve", desc: "الأساس العلمي لنظام التكرار المتباعد.", type: "نظري" },
            { title: "Pomodoro Technique Study", desc: "فعالية فترات الراحة القصيرة في الحفاظ على التركيز.", type: "تجريبي" }
        ]
    }
];

const ResourcesLibrary = () => {
    return (
        <div className="space-y-10 animate-fade-in pb-12">
             <div className="text-center md:text-right">
                <h2 className="text-3xl font-extrabold text-white mb-2">مكتبة المصادر</h2>
                <p className="text-slate-500">المرجعيات العلمية التي يعتمد عليها النظام في التحليل</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {RESOURCES.map((cat, idx) => (
                    <div key={idx} className="space-y-4">
                        <h3 className="text-gold-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Book className="w-4 h-4" /> {cat.category}
                        </h3>
                        <div className="space-y-3">
                            {cat.items.map((item, i) => (
                                <div key={i} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-gold-500/20 transition-all hover:-translate-y-1 group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-200 text-sm group-hover:text-gold-200 transition-colors">{item.title}</h4>
                                        <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">{item.type}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="glass-panel p-8 rounded-[30px] border-t border-t-white/5 mt-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-right">
                <div className="p-4 bg-blue-900/20 rounded-full">
                    <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h4 className="font-bold text-white mb-2 text-lg">معايير الشفافية</h4>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                        يقوم النظام بتحليل مدخلاتك ومقارنتها بهذه المصادر. إذا كانت النتائج "ارتباطية" (Correlational) وليست "سببية" (Causal)، سيتم توضيح ذلك في التقرير اليومي لضمان الدقة العلمية. هدفنا هو تقديم مشورة مبنية على حقائق لا مجرد آراء.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResourcesLibrary;