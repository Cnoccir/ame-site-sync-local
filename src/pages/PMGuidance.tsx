import { useParams } from 'react-router-dom';
import { PMWorkflowGuide } from '@/components/pm-workflow/PMWorkflowGuide';

export const PMGuidance = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  
  return <PMWorkflowGuide sessionId={sessionId} />;
};
