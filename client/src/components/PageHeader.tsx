import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
          {title}
        </h1>
        {subtitle && (
          <p className="text-pt-muted font-medium mt-1 tracking-wider text-sm uppercase">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 animate-in fade-in slide-in-from-right duration-500">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
