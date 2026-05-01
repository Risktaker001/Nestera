'use client';

import React, { useState } from 'react';
import DocsSidebar, { DocSection } from './components/DocsSidebar';
import DocsSections from './components/DocsSections';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>('getting-started');

  return (
    <div className="flex flex-col md:flex-row gap-12 min-h-[600px]">
      <DocsSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <div className="flex-1 max-w-4xl">
        <DocsSections section={activeSection} />
      </div>
    </div>
  );
}
