import React from 'react';
import { motion } from 'framer-motion';

const methodColors = {
  GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PATCH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function EndpointCard({ 
  method, 
  path, 
  description, 
  children, 
  delay = 0 
}: { 
  method: keyof typeof methodColors; 
  path: string; 
  description: string; 
  children?: React.ReactNode; 
  delay?: number;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay }}
      className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border tracking-wider ${methodColors[method]}`}>
            {method}
          </span>
          <span className="font-mono text-sm text-gray-200 tracking-tight">{path}</span>
        </div>
        <div className="text-sm text-gray-400 sm:ml-auto">
          {description}
        </div>
      </div>
      {children && (
        <div className="p-4 bg-[#0A0A0F]/50">
          {children}
        </div>
      )}
    </motion.div>
  );
}
