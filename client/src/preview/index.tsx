import { useState } from 'react';
import WelcomeEmailDesign from './WelcomeEmailDesign';

export default function PreviewRoot() {
  const [selectedPreview] = useState('welcome-email');

  return (
    <div className="w-full h-full">
      {selectedPreview === 'welcome-email' && <WelcomeEmailDesign />}
    </div>
  );
}
